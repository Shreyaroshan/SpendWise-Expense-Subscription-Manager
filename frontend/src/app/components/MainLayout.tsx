import { Navigate, Outlet } from 'react-router';
import Sidebar from './Sidebar';
import { useAuth } from '../hooks/useAuth';

export default function MainLayout() {
  const { token, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-[#0B1120]" />;
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="sw-main min-h-screen bg-[#0B1120] md:flex md:flex-row">
      <Sidebar />
      <div className="w-full md:ml-60">
        <Outlet />
      </div>
    </div>
  );
}
