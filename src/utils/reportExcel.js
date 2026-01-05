import * as XLSX from 'xlsx';

export const exportMonthlyFinancialExcel = (stats) => {
    const data = [
        ['LAPORAN KEUANGAN BULANAN'],
        [`Periode: ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`],
        [''],
        ['Kategori', 'Keterangan', 'Jumlah'],
        ['PENDAPATAN', 'Total Simpanan Masuk (Setor)', stats.simpananSetor],
        ['PENDAPATAN', 'Total Angsuran Pinjaman (Paid)', stats.totalAngsuran],
        ['', 'TOTAL PENDAPATAN', stats.monthlyIncome],
        [''],
        ['PENGELUARAN', 'Total Penarikan Simpanan (Tarik)', stats.simpananTarik],
        ['PENGELUARAN', 'Total Pencairan Pinjaman Baru', stats.totalDisbursed],
        ['', 'TOTAL PENGELUARAN', stats.monthlyExpense],
        [''],
        ['CASHFLOW', 'Arus Kas Bersih', stats.monthlyIncome - stats.monthlyExpense]
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Financials');

    // Auto-size columns
    const max_width = data.reduce((w, r) => Math.max(w, r[1] ? r[1].toString().length : 0), 10);
    ws['!cols'] = [{ wch: 15 }, { wch: max_width + 5 }, { wch: 15 }];

    XLSX.writeFile(wb, `Laporan_Keuangan_${new Date().toISOString().slice(0, 7)}.xlsx`);
};

export const exportActivePortfolioExcel = (portfolioData) => {
    const headers = [['Nama Anggota', 'NIK', 'Saldo Simpanan', 'Hutang Berjalan']];
    const rows = portfolioData.map(p => [p.full_name, p.nik, p.savingsBalance, p.loanBalance]);

    const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Portfolio');

    XLSX.writeFile(wb, `Laporan_Portofolio_Aktif_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportNewMembersExcel = (members) => {
    const headers = [['Nama Lengkap', 'NIK', 'Unit Kerja', 'Tanggal Daftar']];
    const rows = members.map(m => [
        m.full_name,
        m.nik,
        m.work_unit || '-',
        new Date(m.created_at).toLocaleDateString('id-ID')
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Anggota Baru');

    XLSX.writeFile(wb, `Daftar_Anggota_Baru_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
