import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider, useData } from './hooks/useData';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Books from './components/Books';
import Members from './components/Members';
import Borrows from './components/Borrows';
import BookingsAdmin from './components/BookingsAdmin';
import Reports from './components/Reports';
import UserPortal from './components/UserPortal';
import UserBookings from './components/UserBookings';

// Protected Route Wrapper
const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser } = useData();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && currentUser.role !== requiredRole) {
    return <Navigate to={currentUser.role === 'admin' ? '/' : '/user-portal'} replace />;
  }

  return <Layout>{children}</Layout>;
};

// Main App Routes
function AppRoutes() {
  const { currentUser } = useData();

  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to={currentUser.role === 'admin' ? '/' : '/user-portal'} replace /> : <Login />} />

      {/* Admin Routes */}
      <Route path="/" element={<ProtectedRoute requiredRole="admin"><Dashboard /></ProtectedRoute>} />
      <Route path="/books" element={<ProtectedRoute requiredRole="admin"><Books /></ProtectedRoute>} />
      <Route path="/members" element={<ProtectedRoute requiredRole="admin"><Members /></ProtectedRoute>} />
      <Route path="/borrows" element={<ProtectedRoute requiredRole="admin"><Borrows /></ProtectedRoute>} />
      <Route path="/admin-bookings" element={<ProtectedRoute requiredRole="admin"><BookingsAdmin /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute requiredRole="admin"><Reports /></ProtectedRoute>} />

      {/* User Routes */}
      <Route path="/user-portal" element={<ProtectedRoute requiredRole="user"><UserPortal /></ProtectedRoute>} />
      <Route path="/my-bookings" element={<ProtectedRoute requiredRole="user"><UserBookings /></ProtectedRoute>} />

      {/* Fallback Catch-all */}
      <Route
        path="*"
        element={
          currentUser
            ? <Navigate to={currentUser.role === 'admin' ? '/' : '/user-portal'} replace />
            : <Navigate to="/login" replace />
        }
      />
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
