import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider, useData } from './hooks/useData';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Books from './components/Books';
import Members from './components/Members';
import Borrows from './components/Borrows';
import Reports from './components/Reports';
import Login from './components/Login';
import UserPortal from './components/UserPortal';
import UserBookings from './components/UserBookings';
import Reservations from './components/Reservations';
import Settings from './components/Settings';

function ProtectedRoute({ children, requiredRole }) {
  const { currentUser } = useData();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (requiredRole && currentUser.role !== requiredRole) {
    return <Navigate to={currentUser.role === 'admin' ? '/admin' : '/portal'} replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/books" element={<ProtectedRoute requiredRole="admin"><Layout><Books /></Layout></ProtectedRoute>} />
      <Route path="/members" element={<ProtectedRoute requiredRole="admin"><Layout><Members /></Layout></ProtectedRoute>} />
      <Route path="/borrows" element={<ProtectedRoute requiredRole="admin"><Layout><Borrows /></Layout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute requiredRole="admin"><Layout><Reports /></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute requiredRole="admin"><Layout><Settings /></Layout></ProtectedRoute>} />
      <Route path="/reservations" element={<ProtectedRoute><Layout><Reservations /></Layout></ProtectedRoute>} />
      <Route path="/portal" element={<ProtectedRoute><Layout><UserPortal /></Layout></ProtectedRoute>} />
      <Route path="/portal/bookings" element={<ProtectedRoute><Layout><UserBookings /></Layout></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </DataProvider>
  );
}
