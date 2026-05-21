import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CustomerDashboard from './pages/customer/Dashboard';
import PostJob from './pages/customer/PostJob';
import TrackJob from './pages/TrackJob';
import WorkerDashboard from './pages/worker/Dashboard';
import WorkerJobs from './pages/worker/Jobs';
import AdminPanel from './pages/admin/Panel';
import Maps from './pages/Maps';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/maps" element={<Maps />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        path="/customer/dashboard"
        element={
          <ProtectedRoute roles={['customer']}>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/post-job"
        element={
          <ProtectedRoute roles={['customer']}>
            <PostJob />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/track/:jobId"
        element={
          <ProtectedRoute roles={['customer', 'worker']}>
            <TrackJob />
          </ProtectedRoute>
        }
      />

      <Route
        path="/worker/dashboard"
        element={
          <ProtectedRoute roles={['worker']}>
            <WorkerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/jobs"
        element={
          <ProtectedRoute roles={['worker']}>
            <WorkerJobs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/panel"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminPanel />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function purgeLegacyGoogleMaps() {
  document.querySelectorAll('script[src*="maps.googleapis.com"]').forEach((s) => {
    s.parentElement?.removeChild(s);
  });
  document.querySelectorAll('script[src*="maps.gstatic.com"]').forEach((s) => {
    s.parentElement?.removeChild(s);
  });
  if (typeof window !== 'undefined') {
    delete window.google;
  }
}

export default function App() {
  useEffect(() => {
    purgeLegacyGoogleMaps();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
