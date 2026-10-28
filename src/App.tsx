import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layout/AppLayout';
import AiPage from './pages/AiPage';
import AiTestPage from './pages/AiTestPage';
import ArchivePage from './pages/ArchivePage';
import CockpitPage from './pages/CockpitPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import CustomerListPage from './pages/CustomerListPage';
import ExposurePage from './pages/ExposurePage';
import ImplementationPage from './pages/ImplementationPage';
import KnowledgePage from './pages/KnowledgePage';
import LogPage from './pages/LogPage';
import OwnershipPage from './pages/OwnershipPage';
import ParamsPage from './pages/ParamsPage';
import SettingsPage from './pages/SettingsPage';
import TicketDetailPage from './pages/TicketDetailPage';
import TicketFormPage from './pages/TicketFormPage';
import TicketListPage from './pages/TicketListPage';
import TicketTypePage from './pages/TicketTypePage';
import WorkbenchPage from './pages/WorkbenchPage';

const Router = typeof window !== 'undefined' && (window as Window & { __YC_HASH__?: boolean }).__YC_HASH__
  ? HashRouter
  : BrowserRouter;

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/workbench" replace />} />
          <Route path="/workbench" element={<WorkbenchPage />} />
          <Route path="/customers" element={<CustomerListPage />} />
          <Route path="/customers/new" element={<ArchivePage />} />
          <Route path="/customers/key" element={<CustomerListPage keyOnly />} />
          <Route path="/customers/ownership" element={<OwnershipPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/services/tickets" element={<TicketListPage />} />
          <Route path="/services/tickets/new" element={<TicketFormPage />} />
          <Route path="/services/tickets/:id" element={<TicketDetailPage />} />
          <Route path="/services/types" element={<TicketTypePage />} />
          <Route path="/services/exposure" element={<ExposurePage />} />
          <Route path="/services/implementation" element={<ImplementationPage />} />
          <Route path="/services/implementation/:id" element={<ImplementationPage />} />
          <Route path="/services/ai" element={<AiPage />} />
          <Route path="/services/ai-test" element={<AiTestPage />} />
          <Route path="/services/logs" element={<LogPage />} />
          <Route path="/services/logs/new" element={<LogPage creating />} />
          <Route path="/services/direct" element={<ParamsPage kind="direct" />} />
          <Route path="/services/biz" element={<ParamsPage kind="biz" />} />
          <Route path="/cockpit" element={<CockpitPage />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
          <Route path="/knowledge/:id" element={<KnowledgePage />} />
          <Route path="/settings/users" element={<SettingsPage tab="users" />} />
          <Route path="/settings/roles" element={<SettingsPage tab="roles" />} />
          <Route path="/settings/branches" element={<SettingsPage tab="branches" />} />
          <Route path="/settings/dicts" element={<SettingsPage tab="dicts" />} />
          <Route path="*" element={<Navigate to="/workbench" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
