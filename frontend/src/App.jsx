import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import MainLayout from './layouts/MainLayout';
import HRDashboard from './pages/hr/Dashboard';
import HRJobs from './pages/hr/Jobs';
import AdminDashboard from './pages/admin/Dashboard';
import EmployeeDashboard from './pages/employee/Dashboard';
import EmployeeJobs from './pages/employee/Jobs';
import CandidateDashboard from './pages/candidate/Dashboard';
import HRReferrals from './pages/hr/Referrals';
import EmployeeReferrals from './pages/employee/Referrals';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import EmployeeDirectory from './pages/admin/EmployeeDirectory';
import AdminHRDirectory from './pages/admin/HRDirectory';
import AdminCandidateDirectory from './pages/admin/CandidateDirectory';
import AdminJobManagement from './pages/admin/JobManagement';
import AdminReferralManagement from './pages/admin/ReferralManagement';
import AdminActivityLogs from './pages/admin/ActivityLogs';
import AdminEmailHistory from './pages/admin/EmailHistory';
import Profile from './pages/profile/Profile';

// Mock simple placeholder components for other routes
const Placeholder = ({ title }) => (
  <div className="bg-white rounded-xl shadow-soft p-8 text-center">
    <h2 className="text-2xl font-bold text-navy mb-2">{title}</h2>
    <p className="text-slate-500">This page is under construction.</p>
  </div>
);

// Protected Route wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If logged in but wrong role, send them to their own dashboard
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return children;
};

// Root component that handles the initial redirect for authenticated users
const RootRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  if (user) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }
  
  return <Navigate to="/login" replace />;
};

// Public route that redirects to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  if (user) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }
  
  return children;
};

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />
            
            {/* Public Candidate Email Verification Route */}
            <Route path="/verify-email" element={<VerifyEmail />} />
            
            {/* Main Application Layout Wrapper - all routes inside must be protected */}
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              
              <Route index element={<RootRedirect />} />

              {/* Admin Routes */}
              <Route path="admin/*" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="employees" element={<EmployeeDirectory />} />
                    <Route path="users" element={<EmployeeDirectory />} />
                    <Route path="hr" element={<AdminHRDirectory />} />
                    <Route path="candidates" element={<AdminCandidateDirectory />} />
                    <Route path="jobs" element={<AdminJobManagement />} />
                    <Route path="referrals" element={<AdminReferralManagement />} />
                    <Route path="activity-logs" element={<AdminActivityLogs />} />
                    <Route path="activity" element={<AdminActivityLogs />} />
                    <Route path="logs" element={<AdminActivityLogs />} />
                    <Route path="email-history" element={<AdminEmailHistory />} />
                    <Route path="emails" element={<AdminEmailHistory />} />
                    <Route path="email" element={<AdminEmailHistory />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                  </Routes>
                </ProtectedRoute>
              } />

              {/* HR Routes */}
              <Route path="hr/*" element={
                <ProtectedRoute allowedRoles={['hr']}>
                  <Routes>
                    <Route path="dashboard" element={<HRDashboard />} />
                    <Route path="jobs" element={<HRJobs />} />
                    <Route path="referrals" element={<HRReferrals />} />
                    <Route path="employees" element={<Navigate to="/hr/dashboard" replace />} />
                    <Route path="profile" element={<Profile />} />
                  </Routes>
                </ProtectedRoute>
              } />

              {/* Employee Routes */}
              <Route path="employee/*" element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <Routes>
                    <Route path="dashboard" element={<EmployeeDashboard />} />
                    <Route path="jobs" element={<EmployeeJobs />} />
                    <Route path="referrals" element={<EmployeeReferrals />} />
                    <Route path="profile" element={<Profile />} />
                  </Routes>
                </ProtectedRoute>
              } />

              {/* Candidate Routes */}
              <Route path="candidate/*" element={
                <ProtectedRoute allowedRoles={['candidate']}>
                  <Routes>
                    <Route path="dashboard" element={<CandidateDashboard />} />
                    <Route path="profile" element={<Profile />} />
                  </Routes>
                </ProtectedRoute>
              } />
              
              {/* Catch all inside layout */}
              <Route path="*" element={<Placeholder title="404 - Page Not Found" />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
