// Load env from root .env file
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server) or matching allowed list or Vercel previews
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for POC demo
  },
  credentials: true
}));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/pipelines', require('./routes/pipelines'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/holidays', require('./routes/holidays'));
app.use('/api/audit-logs', require('./routes/auditLogs'));
app.use('/api/alerts', require('./routes/alerts'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   🚀 Pipeline Dashboard Backend             ║');
  console.log(`║   🌐 Server running on port ${PORT}             ║`);
  console.log('║   📋 API: http://localhost:' + PORT + '/api       ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  // Start the scheduler
  const schedulerService = require('./services/schedulerService');
  schedulerService.start();
});

