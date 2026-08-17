import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { OnboardingGate } from '@/components/onboarding-gate';
import { RootRoute } from '@/components/root-route';
import { AppShell } from '@/components/layout/app-shell';

import { PricingPage } from '@/pages/marketing/pricing-page';
import { LoginPage } from '@/pages/auth/login-page';
import { RegisterPage } from '@/pages/auth/register-page';
import { ForgotPasswordPage } from '@/pages/auth/forgot-password-page';
import { OnboardingPage } from '@/pages/onboarding/onboarding-page';
import { DashboardPage } from '@/pages/dashboard/dashboard-page';
import { LogsListPage } from '@/pages/logs/logs-list-page';
import { LogCreatePage } from '@/pages/logs/log-create-page';
import { LogDetailPage } from '@/pages/logs/log-detail-page';
import { CategoriesPage } from '@/pages/categories/categories-page';
import { ReportsListPage } from '@/pages/reports/reports-list-page';
import { ReportDetailPage } from '@/pages/reports/report-detail-page';
import { OrganizationsPage } from '@/pages/organizations/organizations-page';
import { TeamMembersPage } from '@/pages/organizations/team-members-page';
import { NotificationsPage } from '@/pages/notifications/notifications-page';
import { SettingsPage } from '@/pages/settings/settings-page';

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<OnboardingGate />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/logs" element={<LogsListPage />} />
              <Route path="/logs/new" element={<LogCreatePage />} />
              <Route path="/logs/:id" element={<LogDetailPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/reports" element={<ReportsListPage />} />
              <Route path="/reports/:id" element={<ReportDetailPage />} />
              <Route path="/organizations" element={<OrganizationsPage />} />
              <Route path="/organizations/:organizationId" element={<TeamMembersPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
