import DashboardLayout from './DashboardLayout';
import { vetNav } from '@/config/navigation';

export default function VetLayout() {
  return <DashboardLayout sidebarItems={vetNav} title="Vet Portal" />;
}
