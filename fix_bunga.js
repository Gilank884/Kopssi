const fs = require('fs');
const glob = require('glob');

const replacements = [
    { file: 'src/sections/About.jsx', from: /Bunga & Bagi Hasil/g, to: 'Bagi Hasil' },
    { file: 'src/sections/About.jsx', from: /bunga pinjaman/g, to: 'bagi hasil pinjaman' },
    { file: 'src/pages/Admin/Reports.jsx', from: /Laporan Pendapatan Bunga/g, to: 'Laporan Pendapatan Bagi Hasil' },
    { file: 'src/pages/Admin/Reports/InterestReport.jsx', from: /Laporan Porsi Bunga/g, to: 'Laporan Porsi Bagi Hasil' },
    { file: 'src/pages/Admin/Reports/InterestReport.jsx', from: />Porsi Bunga</g, to: '>Porsi Bagi Hasil<' },
    { file: 'src/pages/Admin/Reports/OutstandingLoanReport.jsx', from: />Sisa Bunga</g, to: '>Sisa Bagi Hasil<' },
    { file: 'src/pages/Admin/Settings.jsx', from: /Parameter bunga dan biaya/g, to: 'Parameter bagi hasil dan biaya' },
    { file: 'src/pages/Member/Angsuran.jsx', from: />Margin \/ Bunga</g, to: '>Bagi Hasil<' },
    { file: 'src/pages/Member/Simpanan.jsx', from: /Informasi Bunga/g, to: 'Informasi Bagi Hasil' },
    { file: 'src/pages/Member/Simpanan.jsx', from: /bunga simpanan/g, to: 'bagi hasil simpanan' },
    { file: 'src/pages/Member/Simpanan.jsx', from: /Bunga dihitung/g, to: 'Bagi hasil dihitung' },
    { file: 'src/pages/Member/Pinjaman.jsx', from: />Suku Bunga</g, to: '>Suku Bagi Hasil<' },
    { file: 'src/pages/Member/Pinjaman.jsx', from: />Total Bunga</g, to: '>Total Bagi Hasil<' },
    { file: 'src/pages/Member/Pinjaman.jsx', from: />Bunga Terbayar</g, to: '>Bagi Hasil Terbayar<' },
    { file: 'src/utils/loanAgreementPdf.js', from: /BUNGA PINJAMAN/g, to: 'BAGI HASIL PINJAMAN' },
    { file: 'src/utils/loanAgreementPdf.js', from: /bunga Pinjaman/g, to: 'bagi hasil Pinjaman' },
    { file: 'src/utils/loanAnalysisPdf.js', from: /Bunga Outstanding/g, to: 'Bagi Hasil Outstanding' },
    { file: 'src/utils/reportExcel.js', from: /'Bunga'/g, to: "'Bagi Hasil'" },
    { file: 'src/utils/reportExcel.js', from: /'Outs. Bunga'/g, to: "'Outs. Bagi Hasil'" },
    { file: 'src/utils/reportExcel.js', from: /'Out bunga'/g, to: "'Out bagi hasil'" },
    { file: 'src/utils/reportExcel.js', from: /Pendapatan Bunga/g, to: 'Pendapatan Bagi Hasil' },
    { file: 'src/utils/reportExcel.js', from: /'Sisa Bunga'/g, to: "'Sisa Bagi Hasil'" },
];

replacements.forEach(({ file, from, to }) => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(from, to);
        fs.writeFileSync(file, content);
    }
});
console.log("Done");
