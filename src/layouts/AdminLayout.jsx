import DashboardLayout from './DashboardLayout';
import { adminNav } from '@/config/navigation';

export default function AdminLayout() {
  return <DashboardLayout sidebarItems={adminNav} title="Admin Portal" />;
}
