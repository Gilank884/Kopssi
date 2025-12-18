import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import DashboardLayout from './layouts/DashboardLayout';
import Overview from './pages/Dashboard/Overview';
import Simpanan from './pages/Dashboard/Simpanan';
import Pinjaman from './pages/Dashboard/Pinjaman';
import Angsuran from './pages/Dashboard/Angsuran';
import SHU from './pages/Dashboard/SHU';
import Profil from './pages/Dashboard/Profil';
import AdminLayout from './layouts/AdminLayout';
import AdminOverview from './pages/Admin/Dashboard';
import MemberList from './pages/Admin/Members';
import AdminReports from './pages/Admin/Reports';
import AdminSettings from './pages/Admin/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* User Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="simpanan" element={<Simpanan />} />
          <Route path="pinjaman" element={<Pinjaman />} />
          <Route path="angsuran" element={<Angsuran />} />
          <Route path="shu" element={<SHU />} />
          <Route path="profil" element={<Profil />} />
        </Route>

        {/* Admin Dashboard Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="members" element={<MemberList />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
