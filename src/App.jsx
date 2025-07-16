import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword'; //  NEW: Import the forgot password page
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import Review from './pages/Review';
import Matching from './pages/Matching';
import PrivateRoute from './components/PrivateRoute';

export default function App() {
  return (
    <Routes>
      {/*  Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} /> {/*  NEW */}

      {/*  Protected Routes */}
      <Route path="/dashboard" element={
        <PrivateRoute><Dashboard /></PrivateRoute>
      } />
      <Route path="/chat" element={
        <PrivateRoute><Chat /></PrivateRoute>
      } />
      <Route path="/profile" element={
        <PrivateRoute><Profile /></PrivateRoute>
      } />
      <Route path="/review" element={
        <PrivateRoute><Review /></PrivateRoute>
      } />
      <Route path="/matching" element={
        <PrivateRoute><Matching /></PrivateRoute>
      } />
    </Routes>
  );
}
