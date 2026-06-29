import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { ROLES } from '@/constants/roles';
import ErrorBoundary from '@/components/common/ErrorBoundary';

import PublicLayout from '@/layouts/PublicLayout';
import AuthLayout from '@/layouts/AuthLayout';
import SharedLayout from '@/layouts/SharedLayout';
import AdopterLayout from '@/layouts/AdopterLayout';
import ShelterLayout from '@/layouts/ShelterLayout';
import VetLayout from '@/layouts/VetLayout';
import AdminLayout from '@/layouts/AdminLayout';

import HomePage from '@/pages/public/HomePage';
import AboutPage from '@/pages/public/AboutPage';
import ContactPage from '@/pages/public/ContactPage';
import FAQPage from '@/pages/public/FAQPage';
import StoriesPage from '@/pages/public/StoriesPage';
import PetDetailsPage from '@/pages/public/PetDetailsPage';
import DonatePage from '@/pages/public/DonatePage';
import NotFoundPage from '@/pages/public/NotFoundPage';
import VerifyEmailPage from '@/pages/public/VerifyEmailPage';

import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import VerifyOTPPage from '@/pages/auth/VerifyOTPPage';
import PendingApprovalPage from '@/pages/auth/PendingApprovalPage';

import SettingsPage from '@/pages/shared/SettingsPage';
import ProfilePage from '@/pages/shared/ProfilePage';
import NotificationsPage from '@/pages/shared/NotificationsPage';

import AdopterDashboard from '@/pages/adopter/AdopterDashboard';
import BrowsePetsPage from '@/pages/adopter/BrowsePetsPage';
import AdoptionApplicationPage from '@/pages/adopter/AdoptionApplicationPage';
import ApplicationsPage from '@/pages/adopter/ApplicationsPage';
import VetBookingPage from '@/pages/adopter/VetBookingPage';
import AdopterVetAppointmentsPage from '@/pages/adopter/VetAppointmentsPage';
import HealthRecordsPage from '@/pages/adopter/HealthRecordsPage';
import AdopterDonationsPage from '@/pages/adopter/AdopterDonationsPage';
import RaiseComplaintPage from '@/pages/adopter/RaiseComplaintPage';
import MyComplaintsPage from '@/pages/adopter/MyComplaintsPage';
import ComplaintDetailsPage from '@/pages/adopter/ComplaintDetailsPage';
import BadgesPage from '@/pages/adopter/BadgesPage';

import ShelterDashboard from '@/pages/shelter/ShelterDashboard';
import ManagePetsPage from '@/pages/shelter/ManagePetsPage';
import AddPetPage from '@/pages/shelter/AddPetPage';
import EditPetPage from '@/pages/shelter/EditPetPage';
import ShelterApplicationsPage from '@/pages/shelter/ShelterApplicationsPage';
import ShelterAnalyticsPage from '@/pages/shelter/ShelterAnalyticsPage';
import ShelterComplaintsPage from '@/pages/shelter/ShelterComplaintsPage';

import VetDashboard from '@/pages/veterinarian/VetDashboard';
import VetCalendarPage from '@/pages/veterinarian/VetCalendarPage';
import VetAppointmentsPage from '@/pages/veterinarian/VetAppointmentsPage';
import VetMedicalPage from '@/pages/veterinarian/VetMedicalPage';
import VetVaccinationsPage from '@/pages/veterinarian/VetVaccinationsPage';
import VetComplaintsPage from '@/pages/veterinarian/VetComplaintsPage';
import VetFeedbackPage from '@/pages/veterinarian/VetFeedbackPage';

import AdminDashboard from '@/pages/admin/AdminDashboard';
import UserManagementPage from '@/pages/admin/UserManagementPage';
import ShelterMonitoringPage from '@/pages/admin/ShelterMonitoringPage';
import VetMonitoringPage from '@/pages/admin/VetMonitoringPage';
import AdminComplaintsPage from '@/pages/admin/AdminComplaintsPage';
import AdminAnalyticsPage from '@/pages/admin/AdminAnalyticsPage';
import ReportsPage from '@/pages/admin/ReportsPage';
import RulesPage from '@/pages/admin/RulesPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="faq" element={<FAQPage />} />
          <Route path="stories" element={<StoriesPage />} />
          <Route path="pets/:id" element={<PetDetailsPage />} />
          <Route path="donate" element={<DonatePage />} />
          <Route path="browse" element={<BrowsePetsPage />} />
          <Route path="verify-email/:token" element={<VerifyEmailPage />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="verify-otp" element={<VerifyOTPPage />} />
          <Route path="pending-approval" element={<PendingApprovalPage />} />
        </Route>

        <Route element={<ProtectedRoute><SharedLayout /></ProtectedRoute>}>
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

          <Route path="adopter" element={<ProtectedRoute allowedRoles={[ROLES.ADOPTER]}><ErrorBoundary><AdopterLayout /></ErrorBoundary></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdopterDashboard />} />
            <Route path="pets" element={<BrowsePetsPage />} />
            <Route path="apply/:petId" element={<AdoptionApplicationPage />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="vet-booking" element={<VetBookingPage />} />
            <Route path="vet-appointments" element={<AdopterVetAppointmentsPage />} />
            <Route path="health" element={<HealthRecordsPage />} />
            <Route path="donations" element={<AdopterDonationsPage />} />
            <Route path="raise-complaint" element={<RaiseComplaintPage />} />
            <Route path="complaints" element={<MyComplaintsPage />} />
            <Route path="complaints/:id" element={<ComplaintDetailsPage />} />
            <Route path="badges" element={<BadgesPage />} />
          </Route>

        <Route path="shelter" element={<ProtectedRoute allowedRoles={[ROLES.SHELTER]}><ErrorBoundary><ShelterLayout /></ErrorBoundary></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ShelterDashboard />} />
          <Route path="pets" element={<ManagePetsPage />} />
          <Route path="add-pet" element={<AddPetPage />} />
          <Route path="edit-pet/:id" element={<EditPetPage />} />
          <Route path="applications" element={<ShelterApplicationsPage />} />
          <Route path="analytics" element={<ShelterAnalyticsPage />} />
          <Route path="complaints" element={<ShelterComplaintsPage />} />
        </Route>

        <Route path="vet" element={<ProtectedRoute allowedRoles={[ROLES.VET, ROLES.VETERINARIAN]}><ErrorBoundary><VetLayout /></ErrorBoundary></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<VetDashboard />} />
          <Route path="calendar" element={<VetCalendarPage />} />
          <Route path="appointments" element={<VetAppointmentsPage />} />
          <Route path="medical" element={<VetMedicalPage />} />
          <Route path="vaccinations" element={<VetVaccinationsPage />} />
          <Route path="complaints" element={<VetComplaintsPage />} />
          <Route path="feedback" element={<VetFeedbackPage />} />
        </Route>

        <Route path="admin" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><ErrorBoundary><AdminLayout /></ErrorBoundary></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="shelters" element={<ShelterMonitoringPage />} />
          <Route path="vets" element={<VetMonitoringPage />} />
          <Route path="complaints" element={<AdminComplaintsPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="rules" element={<RulesPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
