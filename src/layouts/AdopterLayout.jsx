import DashboardLayout from './DashboardLayout';
import { adopterNav } from '@/config/navigation';

export default function AdopterLayout() {
  return <DashboardLayout sidebarItems={adopterNav} title="Adopter Portal" />;
}
