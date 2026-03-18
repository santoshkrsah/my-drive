import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserDashboard from './pages/UserDashboard';
import Trash from './pages/Trash';
import SharedFiles from './pages/SharedFiles';
import RecentFiles from './pages/RecentFiles';
import StarredFiles from './pages/StarredFiles';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import ActivityLogs from './pages/ActivityLogs';
import ActivityPage from './pages/ActivityPage';
import PublicDownload from './pages/PublicDownload';
import Tags from './pages/Tags';
import RecoverableFiles from './pages/RecoverableFiles';
import DuplicateFiles from './pages/DuplicateFiles';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="spinner mb-3" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, impersonatedBy } = useAuth();

  if (user?.role !== 'SYSADMIN' || impersonatedBy) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="spinner mb-3" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<UserDashboard />} />
          <Route path="/files" element={<Dashboard />} />
          <Route path="/recent" element={<RecentFiles />} />
          <Route path="/starred" element={<StarredFiles />} />
          <Route path="/shared" element={<SharedFiles />} />
          <Route path="/trash" element={<Trash />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <UserManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/logs"
            element={
              <AdminRoute>
                <ActivityLogs />
              </AdminRoute>
            }
          />
          <Route path="/tags" element={<Tags />} />
          <Route path="/duplicates" element={<DuplicateFiles />} />
          <Route
            path="/admin/recoverable-files"
            element={
              <AdminRoute>
                <RecoverableFiles />
              </AdminRoute>
            }
          />
        </Route>

        <Route path="/public/:token" element={<PublicDownload />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
