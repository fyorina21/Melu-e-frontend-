import { Outlet, Navigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';

export function RootLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  if (!isAuthenticated && location.pathname !== '/') {
    return <Navigate to="/" replace />;
  }

  if (isAuthenticated && location.pathname === '/') {
    if (user?.role === 'institutional_admin' || user?.role === 'sysadmin') {
      return <Navigate to="/admin" replace />;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Welcome, {user?.name}</h1>
          <p className="text-sm text-gray-600 mb-6 capitalize">
            {user?.role.replace(/_/g, ' ')} screens are not part of this prototype.
          </p>
          <button
            type="button"
            onClick={logout}
            className="w-full bg-[#FCD34D] hover:bg-[#FBBF24] text-gray-900 font-medium py-2.5 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (
    isAuthenticated &&
    location.pathname.startsWith('/admin') &&
    user?.role !== 'institutional_admin' &&
    user?.role !== 'sysadmin'
  ) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <Outlet />
    </main>
  );
}
