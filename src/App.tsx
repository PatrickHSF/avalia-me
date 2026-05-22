import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { NotificationProvider } from './lib/NotificationContext';
import Home from './pages/Home';
import Search from './pages/Search';
import Reviews from './pages/Reviews';
import Profile from './pages/Profile';
import MyReviews from './pages/MyReviews';
import Favorites from './pages/Favorites';
import BecomeProvider from './pages/BecomeProvider';
import SupportTicket from './pages/SupportTicket';
import PremiumPlans from './pages/PremiumPlans';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import BottomNav from './components/BottomNav';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600">
      <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!user) return <Navigate to="/login" />;

  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen shadow-2xl relative">
        <Router>
          <NotificationProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } />
              <Route path="/search" element={
                <ProtectedRoute>
                  <Search />
                </ProtectedRoute>
              } />
              <Route path="/reviews" element={
                <ProtectedRoute>
                  <Reviews />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/my-reviews" element={
                <ProtectedRoute>
                  <MyReviews />
                </ProtectedRoute>
              } />
              <Route path="/favorites" element={
                <ProtectedRoute>
                  <Favorites />
                </ProtectedRoute>
              } />
              <Route path="/become-provider" element={
                <ProtectedRoute>
                  <BecomeProvider />
                </ProtectedRoute>
              } />
              <Route path="/support" element={
                <ProtectedRoute>
                  <SupportTicket />
                </ProtectedRoute>
              } />
              <Route path="/premium-plans" element={
                <ProtectedRoute>
                  <PremiumPlans />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
            </Routes>
          </NotificationProvider>
        </Router>
      </div>
    </AuthProvider>
  );
}
