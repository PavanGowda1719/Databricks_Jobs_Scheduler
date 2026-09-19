const cron = require('node-cron');
const db = require('../db/database');
const databricksService = require('./databricksService');
const holidayService = require('./holidayService');
const dependencyService = require('./dependencyService');
const alertService = require('./alertService');
const auditService = require('./auditService');
const pipelineConfig = require('../config/pipelines.json');

class SchedulerService {
  constructor() {
    this.cronJobs = new Map();
  }

  start() {
    console.log('⏰ Starting scheduler service...');
    const schedules = db.getAll('schedules').filter(s => s.enabled);

    for (const schedule of schedules) {
      this._registerSchedule(schedule);
    }
    console.log(`⏰ Loaded ${schedules.length} active schedule(s)`);

    // Check time-based schedules every minute
    cron.schedule('* * * * *', () => this._checkTimeBasedSchedules());

    // Poll active runs every 5 seconds to sync Databricks completion status
    cron.schedule('*/5 * * * * *', () => this.syncActiveRuns());
  }

  async syncActiveRuns() {
    const activeRuns = db.getAll('run_history').filter(
      r => r.databricks_run_id && (r.status === 'RUNNING' || r.status === 'PENDING')
    );

    for (const run of activeRuns) {
      const pipeline = pipelineConfig.pipelines.find(p => p.id === run.pipeline_id);
      if (!pipeline) continue;

      try {
        const status = await databricksService.getRunStatus(pipeline.workspace, run.databricks_run_id);
        const resultState = status.resultState || status.state;
        if (resultState && resultState !== run.status) {
          db.update('run_history', run.id, {
            status: resultState,
            completed_at: status.endTime,
            duration_seconds: status.runDuration,
          });

          // Send webhook alert on failure
          if (resultState === 'FAILED' || resultState === 'ERROR') {
            await alertService.sendAlert({
              pipelineName: pipeline.name,
              runId: run.databricks_run_id,
              status: resultState,
              errorMessage: status.stateMessage || 'Job failed in Databricks execution',
              duration: status.runDuration,
              workspace: pipeline.workspace,
              url: status.runPageUrl,
            });

            auditService.log({
              action: 'PIPELINE_FAILED',
              entityType: 'PIPELINE',
              entityId: pipeline.id,
              user: 'System Reconciler',
              details: `Pipeline run #${run.databricks_run_id} failed: ${status.stateMessage || ''}`,
              status: 'FAILED',
            });
          }

          // Check if this completion unblocks or triggers any downstream pipelines
          if (resultState !== 'RUNNING' && resultState !== 'PENDING') {
            await dependencyService.processDependencyChain(pipeline.id, resultState, databricksService);
          }
        }
      } catch (e) {
        // ignore network error
      }
    }
  }

  _registerSchedule(schedule) {
    if (schedule.schedule_type === 'cron' && schedule.cron_expression) {
      if (cron.validate(schedule.cron_expression)) {
        const job = cron.schedule(schedule.cron_expression, () => {
          this._executeSchedule(schedule);
        });
        this.cronJobs.set(schedule.id, job);
        console.log(`  📌 Cron #${schedule.id} for ${schedule.pipeline_id}: ${schedule.cron_expression}`);
      }
    }
  }

  _checkTimeBasedSchedules() {
    const now = new Date();
    const nowStr = now.toISOString().slice(0, 16);

    const schedules = db.getAll('schedules').filter(
      s => s.enabled && (s.schedule_type === 'nth_business_day' || s.schedule_type === 'one_time')
    );

    for (const schedule of schedules) {
      if (schedule.next_run_at && schedule.next_run_at.slice(0, 16) <= nowStr) {
        this._executeSchedule(schedule);

        if (schedule.schedule_type === 'nth_business_day') {
          const nextRun = holidayService.getNextNthBusinessDay(
            schedule.business_day_number,
            new Date(now.getTime() + 86400000)
          );
          if (nextRun) {
            const time = schedule.time_of_day || '09:00';
            const nextRunAt = `${nextRun.toISOString().split('T')[0]}T${time}:00`;
            db.update('schedules', schedule.id, { next_run_at: nextRunAt });
          }
        } else if (schedule.schedule_type === 'one_time') {
          db.update('schedules', schedule.id, { enabled: false });
        }
      }
    }
  }

  async _executeSchedule(schedule) {
    const pipeline = pipelineConfig.pipelines.find(p => p.id === schedule.pipeline_id);
    if (!pipeline) {
      console.error(`❌ Pipeline "${schedule.pipeline_id}" not found`);
      return;
    }

    console.log(`🚀 Checking scheduled trigger for "${pipeline.name}"`);

    // Check upstream dependency status
    const depCheck = dependencyService.checkUpstreamStatus(pipeline.id);

    if (depCheck.status === 'WAITING') {
      console.log(`⏳ Pipeline "${pipeline.name}" has unfulfilled upstream dependencies. Moving to WAITING_FOR_UPSTREAM: ${depCheck.message}`);
      db.insert('run_history', {
        pipeline_id: pipeline.id,
        databricks_run_id: null,
        status: 'WAITING_FOR_UPSTREAM',
        trigger_type: 'scheduled',
        started_at: new Date().toISOString(),
        completed_at: null,
        duration_seconds: null,
        error_message: depCheck.message,
        triggered_by: 'scheduler',
      });
      return;
    }

    if (depCheck.status === 'BLOCKED') {
      console.log(`🚫 Pipeline "${pipeline.name}" upstream dependencies failed. Moving to BLOCKED: ${depCheck.message}`);
      db.insert('run_history', {
        pipeline_id: pipeline.id,
        databricks_run_id: null,
        status: 'BLOCKED',
        trigger_type: 'scheduled',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        duration_seconds: null,
        error_message: depCheck.message,
        triggered_by: 'scheduler',
      });
      return;
    }

    // Upstreams are CLEAR (or no dependencies configured)
    const historyRecord = db.insert('run_history', {
      pipeline_id: pipeline.id,
      databricks_run_id: null,
      status: 'PENDING',
      trigger_type: 'scheduled',
      started_at: new Date().toISOString(),
      completed_at: null,
      duration_seconds: null,
      error_message: null,
      triggered_by: 'scheduler',
    });

    try {
      const runData = await databricksService.triggerJob(
        pipeline.workspace, pipeline.databricksJobId, pipeline.defaultParams
      );
      db.update('run_history', historyRecord.id, {
        databricks_run_id: runData.run_id,
        status: 'RUNNING',
      });
      console.log(`✅ Triggered run ${runData.run_id} for "${pipeline.name}"`);
    } catch (err) {
      db.update('run_history', historyRecord.id, {
        status: 'FAILED',
        error_message: err.message,
      });
      console.error(`❌ Failed to trigger "${pipeline.name}": ${err.message}`);
    }
  }

  createSchedule(data) {
    const { pipelineId, scheduleType, cronExpression, businessDayNumber, timeOfDay, skipHolidays, runAt } = data;

    let nextRunAt = null;
    if (scheduleType === 'nth_business_day' && businessDayNumber) {
      const nextRun = holidayService.getNextNthBusinessDay(businessDayNumber);
      if (nextRun) {
        const time = timeOfDay || '09:00';
        nextRunAt = `${nextRun.toISOString().split('T')[0]}T${time}:00`;
      }
    } else if (scheduleType === 'one_time' && runAt) {
      nextRunAt = runAt;
    }

    const schedule = db.insert('schedules', {
      pipeline_id: pipelineId,
      schedule_type: scheduleType,
      cron_expression: cronExpression || null,
      business_day_number: businessDayNumber || null,
      time_of_day: timeOfDay || '09:00',
      skip_holidays: skipHolidays !== false,
      enabled: true,
      next_run_at: nextRunAt,
      created_at: new Date().toISOString(),
    });

    if (scheduleType === 'cron') this._registerSchedule(schedule);
    return schedule;
  }

  getSchedules() {
    return db.query('schedules', { sort: 'created_at', order: 'desc' });
  }

  getSchedulesByPipeline(pipelineId) {
    return db.getAll('schedules', { pipeline_id: pipelineId });
  }

  updateSchedule(id, data) {
    if (this.cronJobs.has(id)) {
      this.cronJobs.get(id).stop();
      this.cronJobs.delete(id);
    }

    const updates = {};
    if (data.enabled !== undefined) updates.enabled = data.enabled;
    if (data.cronExpression !== undefined) updates.cron_expression = data.cronExpression;
    if (data.businessDayNumber !== undefined) updates.business_day_number = data.businessDayNumber;
    if (data.timeOfDay !== undefined) updates.time_of_day = data.timeOfDay;
    if (data.skipHolidays !== undefined) updates.skip_holidays = data.skipHolidays;

    const schedule = db.update('schedules', id, updates);
    if (schedule && schedule.enabled) this._registerSchedule(schedule);
    return schedule;
  }

  deleteSchedule(id) {
    if (this.cronJobs.has(id)) {
      this.cronJobs.get(id).stop();
      this.cronJobs.delete(id);
    }
    return db.delete('schedules', id);
  }
}

module.exports = new SchedulerService();

