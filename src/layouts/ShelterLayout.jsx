import DashboardLayout from './DashboardLayout';
import { shelterNav } from '@/config/navigation';

export default function ShelterLayout() {
  return <DashboardLayout sidebarItems={shelterNav} title="Shelter Portal" />;
}
