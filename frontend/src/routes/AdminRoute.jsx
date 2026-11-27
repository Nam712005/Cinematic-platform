import { Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

export default function AdminRoute() {
  const { isAuthenticated, isAdmin, initializing } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const warnedRef = useRef(false);

  useEffect(() => {
    if (!initializing && isAuthenticated && !isAdmin && !warnedRef.current) {
      warnedRef.current = true;
      toast.warning('Bạn không có quyền truy cập khu vực quản trị.');
    }
  }, [initializing, isAuthenticated, isAdmin, toast]);

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cinema-bg">
        <Loader2 className="h-8 w-8 animate-spin text-cinema-red" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
