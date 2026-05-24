import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Layout        from './components/Layout';
import Login         from './pages/Login';
import Register      from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword  from './pages/ResetPassword';
import Dashboard     from './pages/Dashboard';
import Bookmarks     from './pages/Bookmarks';
import Graph         from './pages/Graph';
import Spaces        from './pages/Spaces';
import SpaceDetail   from './pages/SpaceDetail';
import AcceptInvite  from './pages/AcceptInvite';

function Guard({ children }) {
  const token = useSelector(s => s.auth.token);
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Invitation accept — accessible without login */}
        <Route path="/invite/accept" element={<AcceptInvite />} />

        {/* Protected app routes */}
        <Route path="/" element={<Guard><Layout /></Guard>}>
          <Route index           element={<Dashboard />} />
          <Route path="bookmarks" element={<Bookmarks />} />
          <Route path="graph"    element={<Graph />} />
          <Route path="spaces"   element={<Spaces />} />
          <Route path="spaces/:id" element={<SpaceDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
