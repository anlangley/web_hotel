import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import { MainLayout } from '../components/layout/MainLayout';
import { AdminLayout } from '../components/layout/AdminLayout';

// Route Guards
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';

// Pages
import { Home } from '../pages/home/Home';
import { RoomList } from '../pages/rooms/RoomList';
import { RoomDetail } from '../pages/rooms/RoomDetail';
import { Booking } from '../pages/booking/Booking';
import { Payment } from '../pages/booking/Payment';
import { History } from '../pages/booking/History';

// Auth Pages
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { ResetPassword } from '../pages/auth/ResetPassword';
import { ChangePassword } from '../pages/auth/ChangePassword';

// Profile Pages
import { Profile } from '../pages/profile/Profile';
import { EditProfile } from '../pages/profile/EditProfile';
import { Favorites } from '../pages/profile/Favorites';
import { NotificationCenter } from '../pages/profile/NotificationCenter';
import { PaymentMethods } from '../pages/profile/PaymentMethods';
import { Help } from '../pages/profile/Help';
import { About } from '../pages/profile/About';

// Admin Pages
import { Dashboard } from '../pages/admin/Dashboard';
import { AdminRooms } from '../pages/admin/AdminRooms';
import { AddRoom } from '../pages/admin/AddRoom';
import { AdminBookings } from '../pages/admin/AdminBookings';
import { AdminUsers } from '../pages/admin/AdminUsers';
import { AdminVouchers } from '../pages/admin/AdminVouchers';

// Not Found
import { NotFound } from '../pages/NotFound';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* ── USER & PUBLIC ROUTES ── */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/rooms" element={<RoomList />} />
        <Route path="/rooms/:id" element={<RoomDetail />} />

        {/* Protected User Booking Flows */}
        <Route
          path="/booking"
          element={
            <ProtectedRoute>
              <Booking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking/payment"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />

        {/* Protected Profile Pages */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/favorites"
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/notifications"
          element={
            <ProtectedRoute>
              <NotificationCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        {/* Public Informational */}
        <Route path="/profile/payment-methods" element={<PaymentMethods />} />
        <Route path="/profile/help" element={<Help />} />
        <Route path="/profile/about" element={<About />} />

        {/* 404 Inside Layout */}
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* ── AUTH STANDALONE ROUTES ── */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* ── ADMIN PROTECTED ROUTES ── */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="rooms" element={<AdminRooms />} />
        <Route path="rooms/add" element={<AddRoom />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="vouchers" element={<AdminVouchers />} />
      </Route>
    </Routes>
  );
};
