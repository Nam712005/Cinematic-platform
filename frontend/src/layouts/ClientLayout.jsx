import { Outlet, useLocation } from 'react-router-dom';
import ChatbotWidget from '../components/chatbot/ChatbotWidget.jsx';
import Footer from '../components/common/Footer.jsx';
import Header from '../components/common/Header.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useSettings } from '../contexts/SettingsContext.jsx';
import MaintenancePage from '../pages/client/MaintenancePage.jsx';

export default function ClientLayout() {
  const { isAdmin } = useAuth();
  const { settings, maintenance } = useSettings();
  const location = useLocation();

  if (maintenance.enabled && !isAdmin) {
    return <MaintenancePage />;
  }

  const isHomePage = location.pathname === '/';

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900 transition-colors dark:bg-[#09090D] dark:text-slate-100">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer variant={isHomePage ? 'full' : 'compact'} />
      {settings.chatbot.chatbot_enabled && <ChatbotWidget />}
    </div>
  );
}
