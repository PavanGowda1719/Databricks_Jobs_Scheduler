import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import PipelinesPage from './pages/PipelinesPage';
import PipelineDetailPage from './pages/PipelineDetailPage';
import SchedulesPage from './pages/SchedulesPage';
import HolidaysPage from './pages/HolidaysPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="pipelines" element={<PipelinesPage />} />
          <Route path="pipelines/:id" element={<PipelineDetailPage />} />
          <Route path="schedules" element={<SchedulesPage />} />
          <Route path="holidays" element={<HolidaysPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
