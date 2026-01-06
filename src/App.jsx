import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import DashboardLayout from './layouts/DashboardLayout';
import Overview from './pages/Member/Overview';
import Simpanan from './pages/Member/Simpanan';
import Pinjaman from './pages/Member/Pinjaman';
import Angsuran from './pages/Member/Angsuran';
import Profil from './pages/Member/Profil';
import PengajuanPinjaman from './pages/Member/PengajuanPinjaman';
import AdminLayout from './layouts/AdminLayout';
import AdminOverview from './pages/Admin/Dashboard';
import PengajuanAnggota from './pages/Admin/PengajuanAnggota';
import AssesmentPinjaman from './pages/Admin/AssesmentPinjaman';
import PencairanPinjaman from './pages/Admin/PencairanPinjaman';
import MemberList from './pages/Admin/Members';
import AdminReports from './pages/Admin/Reports';
import MonitorSimpanan from './pages/Admin/MonitorSimpanan';
import TransactionPage from './pages/Admin/Transaksi';
import AssesmentDetail from './pages/Admin/AssesmentDetail';
import UploadSimpanan from './pages/Admin/UploadSimpanan';
import UploadPinjaman from './pages/Admin/UploadPinjaman';
import MonitorPinjaman from './pages/Admin/MonitorPinjaman';

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

          <Route path="pengajuan-pinjaman" element={<PengajuanPinjaman />} />
          <Route path="profil" element={<Profil />} />
        </Route>

        {/* Admin Dashboard Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="pengajuan-anggota" element={<PengajuanAnggota />} />
          <Route path="assesment-pinjaman" element={<AssesmentPinjaman />} />
          <Route path="assesment-pinjaman/:id" element={<AssesmentDetail />} />
          <Route path="pencairan-pinjaman" element={<PencairanPinjaman />} />
          <Route path="members" element={<MemberList />} />
          <Route path="monitor-simpanan" element={<MonitorSimpanan />} />
          <Route path="monitor-pinjaman" element={<MonitorPinjaman />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="transaksi" element={<TransactionPage />} />
          <Route path="upload-simpanan" element={<UploadSimpanan />} />
          <Route path="upload-pinjaman" element={<UploadPinjaman />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
