import * as XLSX from 'xlsx-js-style';

const formatNum = (num) => {
    if (!num || isNaN(num)) return 0;
    return new Intl.NumberFormat('id-ID').format(num);
};

export const exportMonthlyFinancialExcel = (stats) => {
    const data = [
        ['LAPORAN KEUANGAN BULANAN'],
        [`Periode: ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`],
        [''],
        ['Kategori', 'Keterangan', 'Jumlah'],
        ['PENDAPATAN', 'Total Simpanan Masuk (Setor)', formatNum(stats.simpananSetor)],
        ['PENDAPATAN', 'Total Angsuran Pinjaman (Paid)', formatNum(stats.totalAngsuran)],
        ['', 'TOTAL PENDAPATAN', formatNum(stats.monthlyIncome)],
        [''],
        ['PENGELUARAN', 'Total Penarikan Simpanan (Tarik)', formatNum(stats.simpananTarik)],
        ['PENGELUARAN', 'Total Pencairan Pinjaman Baru', formatNum(stats.totalDisbursed)],
        ['', 'TOTAL PENGELUARAN', formatNum(stats.monthlyExpense)],
        [''],
        ['CASHFLOW', 'Arus Kas Bersih', formatNum(stats.monthlyIncome - stats.monthlyExpense)]
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
    const rows = portfolioData.map(p => [p.full_name, p.nik, formatNum(p.savingsBalance), formatNum(p.loanBalance)]);

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
        new Date(m.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Anggota Baru');

    XLSX.writeFile(wb, `Daftar_Anggota_Baru_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportMonitoringSimpanan = (data, range, mode = 'DATA') => {
    let headers;
    let rows;
    let filename;

    if (mode === 'TEMPLATE') {
        // Template for bulk upload: NIK, Nama, Simpanan Pokok, Simpanan Wajib, Simpanan Sukarela
        headers = [['NIK', 'Nama Lengkap', 'Simpanan Pokok', 'Simpanan Wajib', 'Simpanan Sukarela']];
        rows = data.map(member => [
            member.nik || '-',
            member.full_name || '-',
            0,      // Default Simpanan Pokok
            75000,  // Default Simpanan Wajib
            0       // Default Simpanan Sukarela
        ]);
        filename = `Template_Upload_Simpanan_${new Date().toISOString().slice(0, 10)}.xlsx`;
    } else {
        // Columns synchronized with historical view - MUST keep original format
        headers = [['NIK', 'Nama', 'Referensi', 'Status', 'Bulan Ke', 'Jatuh Tempo', 'Simp. Pokok', 'Simp. Wajib', 'Simp. Sukarela', 'Total']];
        rows = data.map(bill => {
            const total = parseFloat(bill.amount_pokok || 0) + parseFloat(bill.amount_wajib || 0) + parseFloat(bill.amount_sukarela || 0);
            return [
                bill.personal_data?.nik || '-',
                bill.personal_data?.full_name || '-',
                bill.id,
                bill.status,
                bill.bulan_ke,
                bill.jatuh_tempo ? new Date(bill.jatuh_tempo).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-',
                bill.amount_pokok || 0,
                bill.amount_wajib || 0,
                bill.amount_sukarela || 0,
                total
            ];
        });
        filename = `Monitoring_Simpanan_${range.startDate}_${range.endDate}.xlsx`;
    }

    const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Simpanan');

    XLSX.writeFile(wb, filename);
};

export const exportMonitoringPinjaman = (data, range) => {
    const headers = [['NIK', 'Nama', 'No Pinjaman', 'Plafon', 'Tenor', 'Tgl Pengajuan', 'Status']];
    const rows = data.map(loan => [
        loan.personal_data?.nik || '-',
        loan.personal_data?.full_name || '-',
        loan.no_pinjaman,
        formatNum(loan.jumlah_pinjaman),
        loan.tenor_bulan,
        new Date(loan.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
        loan.status
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pinjaman');

    XLSX.writeFile(wb, `Monitoring_Pinjaman_${range.startDate}_${range.endDate}.xlsx`);
};

export const exportMonitoringAngsuran = (data, range) => {
    // Columns synchronized with UploadPinjaman.jsx: NIK, Nama, No Pinjaman, Angsuran Ke, Status
    const headers = [['NIK', 'Nama', 'No Pinjaman', 'Angsuran Ke', 'Status', 'Nominal', 'Tgl Bayar']];
    const rows = data.map(inst => [
        inst.pinjaman?.personal_data?.nik || '-',
        inst.pinjaman?.personal_data?.full_name || '-',
        inst.pinjaman?.no_pinjaman || '-',
        inst.bulan_ke,
        inst.status,
        formatNum(inst.amount),
        inst.tanggal_bayar ? new Date(inst.tanggal_bayar).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Angsuran');

    XLSX.writeFile(wb, `Monitoring_Angsuran_${range.startDate}_${range.endDate}.xlsx`);
};

export const exportDisbursementDelivery = (data) => {
    // 1. STYLES
    const borderStyle = {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
    };

    const headerStyle = {
        font: { bold: true, sz: 11 },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: borderStyle,
        fill: { fgColor: { rgb: "E0E0E0" } } // Light gray background
    };

    const dataStyle = {
        font: { sz: 10 },
        alignment: { vertical: "center" },
        border: borderStyle
    };

    const moneyStyle = {
        ...dataStyle,
        alignment: { horizontal: "right", vertical: "center" }
        // numFmt removed to support string inputs
    };

    const centerStyle = {
        ...dataStyle,
        alignment: { horizontal: "center", vertical: "center" }
    };

    // 2. HEADERS
    const headers = [
        'No', 'No Pinjaman', 'Nama', 'NPP', 'No Anggota', 'Lokasi', 'Tgl Pinjam', 'Tgl Setuju',
        'Tenor', 'Jml. Pengajuan', 'Jumlah Pinjam', 'Bunga', 'Outs. Pokok', 'Outs. Bunga',
        'Biaya', 'Diterima', 'NoRek', 'NoHP', 'Keperluan', 'Bank', 'Tgl Realisasi'
    ];

    // 3. PROCESS DATA & TOTALS
    // We calculate totals first using raw numbers, then map to strings for display
    let rawTotals = {
        jmlPengajuan: 0,
        jumlahPinjam: 0,
        bunga: 0,
        outsPokok: 0,
        outsBunga: 0,
        biaya: 0,
        diterima: 0
    };

    const processedRows = data.map((loan, index) => {
        const principal = parseFloat(loan.jumlah_pinjaman || 0);
        const tenor = loan.tenor_bulan || 1;
        let totalBunga = 0;

        if (loan.tipe_bunga === 'PERSENAN') {
            totalBunga = principal * (parseFloat(loan.nilai_bunga || 0) / 100) * (tenor / 12);
        } else if (loan.tipe_bunga === 'NOMINAL') {
            totalBunga = parseFloat(loan.nilai_bunga || 0);
        }

        const outsPokok = parseFloat(loan.calculated_outs_pokok || 0);
        const outsBunga = parseFloat(loan.calculated_outs_bunga || 0);
        const adminFee = 5000;
        const netDisbursement = principal - outsPokok - outsBunga - adminFee;
        const jmlPengajuan = parseFloat(loan.jumlah_pengajuan || loan.jumlah_pinjaman || 0);
        const bungaRounded = Math.round(totalBunga);

        // Accumulate Totals
        rawTotals.jmlPengajuan += jmlPengajuan;
        rawTotals.jumlahPinjam += principal;
        rawTotals.bunga += bungaRounded;
        rawTotals.outsPokok += outsPokok;
        rawTotals.outsBunga += outsBunga;
        rawTotals.biaya += adminFee;
        rawTotals.diterima += netDisbursement;

        // Return STRING formatted values for display
        return {
            no: index + 1,
            noPinjaman: loan.no_pinjaman || '-',
            nama: loan.personal_data?.full_name || '-',
            npp: loan.personal_data?.no_npp || '-',
            noAnggota: loan.personal_data?.no_anggota || '-',
            lokasi: loan.personal_data?.lokasi || '-',
            tglPinjam: loan.created_at ? new Date(loan.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'numeric', year: 'numeric' }) : '-',
            tglSetuju: (loan.approved_at || loan.created_at) ? new Date(loan.approved_at || loan.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'numeric', year: 'numeric' }) : '-',
            tenor: tenor,
            jmlPengajuan: formatNum(jmlPengajuan),
            jumlahPinjam: formatNum(principal),
            bunga: formatNum(bungaRounded),
            outsPokok: formatNum(outsPokok),
            outsBunga: formatNum(outsBunga),
            biaya: formatNum(adminFee),
            diterima: formatNum(netDisbursement),
            noRek: loan.personal_data?.rek_gaji || '-',
            noHp: loan.personal_data?.phone || '-',
            keperluan: loan.keperluan || '-',
            bank: loan.personal_data?.bank_gaji || '-',
            tglReal: loan.delivery_date ? new Date(loan.delivery_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'numeric', year: 'numeric' }) : '-'
        };
    });

    // 4. BUILD WORKSHEET WITH STYLED CELLS
    const wsData = [];

    // Row 1: Date Header
    const dateStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
    wsData.push([
        { v: '', s: {} },
        { v: '', s: {} },
        { v: dateStr, s: { font: { bold: true, sz: 12 }, alignment: { horizontal: "center" }, fill: { fgColor: { rgb: "FFCC80" } }, border: borderStyle } }
    ]);
    // Merge date cell if desired, but kept simple for now

    // Row 2: Headers
    const headerRow = headers.map(h => ({ v: h, s: headerStyle }));
    wsData.push(headerRow);

    // Row 3+: Data
    processedRows.forEach(row => {
        wsData.push([
            { v: row.no, s: centerStyle },
            { v: row.noPinjaman, s: centerStyle },
            { v: row.nama, s: dataStyle },
            { v: row.npp, s: centerStyle },
            { v: row.noAnggota, s: centerStyle },
            { v: row.lokasi, s: centerStyle },
            { v: row.tglPinjam, s: centerStyle },
            { v: row.tglSetuju, s: centerStyle },
            { v: row.tenor, s: centerStyle },
            { v: row.jmlPengajuan, s: moneyStyle, t: 's' },
            { v: row.jumlahPinjam, s: moneyStyle, t: 's' },
            { v: row.bunga, s: moneyStyle, t: 's' },
            { v: row.outsPokok, s: moneyStyle, t: 's' },
            { v: row.outsBunga, s: moneyStyle, t: 's' },
            { v: row.biaya, s: moneyStyle, t: 's' },
            { v: row.diterima, s: moneyStyle, t: 's' },
            { v: row.noRek, s: centerStyle },
            { v: row.noHp, s: centerStyle },
            { v: row.keperluan, s: dataStyle },
            { v: row.bank, s: centerStyle },
            { v: row.tglReal, s: centerStyle }
        ]);
    });

    // Row Last: TOTALS
    const totalLabelStyle = { font: { bold: true }, alignment: { horizontal: "right" }, border: borderStyle };
    const totalMoneyStyle = { font: { bold: true }, alignment: { horizontal: "right" }, border: borderStyle };

    // Fill empty cells with borders for the total row
    const emptyBorder = { v: '', s: { border: borderStyle } };

    const totalRow = [
        emptyBorder, emptyBorder, emptyBorder, emptyBorder, emptyBorder, emptyBorder, emptyBorder, emptyBorder,
        { v: 'TOTAL', s: totalLabelStyle },
        { v: formatNum(rawTotals.jmlPengajuan), s: totalMoneyStyle, t: 's' },
        { v: formatNum(rawTotals.jumlahPinjam), s: totalMoneyStyle, t: 's' },
        { v: formatNum(rawTotals.bunga), s: totalMoneyStyle, t: 's' },
        { v: formatNum(rawTotals.outsPokok), s: totalMoneyStyle, t: 's' },
        { v: formatNum(rawTotals.outsBunga), s: totalMoneyStyle, t: 's' },
        { v: formatNum(rawTotals.biaya), s: totalMoneyStyle, t: 's' },
        { v: formatNum(rawTotals.diterima), s: totalMoneyStyle, t: 's' },
        emptyBorder, emptyBorder, emptyBorder, emptyBorder, emptyBorder
    ];
    wsData.push(totalRow);

    // Create Sheet
    const ws = XLSX.utils.aoa_to_sheet([]);

    // Check if aoa_to_sheet supports cell objects directly in the lib version, 
    // if not we map to grid. But xlsx-js-style documentation says we can assign !data or just add cells.
    // The most reliable way with style libs is creating a sheet and adding generic data, then updating cells, OR using aoa_to_sheet with objects if supported.
    // xlsx-js-style SUPPORTS cell objects in aoa_to_sheet.

    // However, safest bet is to assign specific cells

    // Convert logic:
    // Generate range
    const range = { s: { c: 0, r: 0 }, e: { c: headers.length - 1, r: wsData.length - 1 } };
    ws['!ref'] = XLSX.utils.encode_range(range);

    // Populate cells
    for (let R = 0; R < wsData.length; ++R) {
        for (let C = 0; C < wsData[R].length; ++C) {
            const cell = wsData[R][C];
            const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
            if (cell) ws[cellRef] = cell;
        }
    }

    // Set Column Widths
    ws['!cols'] = [
        { wch: 4 },  // No
        { wch: 12 }, // No Pin
        { wch: 20 }, // Nama
        { wch: 8 },  // NPP
        { wch: 10 }, // No Anggota
        { wch: 10 }, // Lokasi
        { wch: 10 }, // Tgl
        { wch: 10 }, // Tgl
        { wch: 6 },  // Tenor
        { wch: 12 }, // Jml Pengajuan
        { wch: 12 }, // Jml Pinjam
        { wch: 12 }, // Bunga
        { wch: 12 }, // Outs
        { wch: 12 }, // Outs
        { wch: 10 }, // Biaya
        { wch: 12 }, // Diterima
        { wch: 12 }, // NoRek
        { wch: 12 }, // NoHP
        { wch: 15 }, // Keperluan
        { wch: 8 },  // Bank
        { wch: 10 }  // Tgl Real
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Realisasi Pinjaman');

    XLSX.writeFile(wb, `Realisasi_Pinjaman_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportExitRealisasi = (data) => {
    // 1. STYLES
    const borderStyle = {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
    };

    const titleStyle = {
        font: { bold: true, sz: 12 },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "D99694" } }, // Reddish color like in user image
        border: borderStyle
    };

    const headerStyle = {
        font: { bold: true, sz: 10 },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: borderStyle,
        fill: { fgColor: { rgb: "FFFFFF" } } // White background for headers
    };

    const dataStyle = {
        font: { sz: 10 },
        alignment: { vertical: "center" },
        border: borderStyle
    };

    const moneyStyle = {
        ...dataStyle,
        alignment: { horizontal: "right", vertical: "center" }
    };

    const centerStyle = {
        ...dataStyle,
        alignment: { horizontal: "center", vertical: "center" }
    };

    // 2. HEADERS
    const headers = [
        'No.', 'Nama', 'NPP', 'Uraian', 'Unit Kerja',
        'Masuk', 'Keluar', 'S.P', 'S.W', 'SWK',
        'JUMLAH', 'Outs', 'Out bunga',
        'By TF', 'dikembalikan', 'No Rek'
    ];

    // 3. PROCESS DATA & TOTALS
    let rawTotals = {
        masuk: 0,
        keluar: 0,
        pokok: 0,
        wajib: 0,
        sukarela: 0,
        jumlah: 0,
        outsP: 0,
        outsB: 0,
        admin: 0,
        diterima: 0
    };

    const processedRows = data.map((item, index) => {
        const netBack = (item.jumlah || 0) - (item.outs_pokok || 0) - (item.outs_bunga || 0) - (item.admin || 0);

        // Update totals
        rawTotals.masuk += (item.masuk || 0);
        rawTotals.keluar += (item.keluar || 0);
        rawTotals.pokok += (item.simp_pokok || 0);
        rawTotals.wajib += (item.simp_wajib || 0);
        rawTotals.sukarela += (item.simp_sukarela || 0);
        rawTotals.jumlah += (item.jumlah || 0);
        rawTotals.outsP += (item.outs_pokok || 0);
        rawTotals.outsB += (item.outs_bunga || 0);
        rawTotals.admin += (item.admin || 0);
        rawTotals.diterima += netBack;

        return {
            no: index + 1,
            nama: item.nama || '-',
            npp: item.npp || '-',
            uraian: item.uraian || '-',
            unit_kerja: item.unit_kerja || '-',
            // Masuk/Keluar are currently 0 in source, treating as strings for now or 0
            // Image shows dates "Jan-17", but currently data is numeric 0.
            // Using '-' or formatNum(0)
            masuk: item.masuk ? formatNum(item.masuk) : '-',
            keluar: item.keluar ? formatNum(item.keluar) : '-',
            sp: formatNum(item.simp_pokok),
            sw: formatNum(item.simp_wajib),
            swk: formatNum(item.simp_sukarela),
            jumlah: formatNum(item.jumlah),
            outs: item.outs_pokok ? formatNum(item.outs_pokok) : '', // Empty if 0 in image potentially, but using value
            outBunga: item.outs_bunga ? formatNum(item.outs_bunga) : '',
            byTf: formatNum(item.admin),
            dikembalikan: formatNum(netBack),
            noRek: item.no_rek || '-'
        };
    });

    // 4. BUILD WORKSHEET
    const wsData = [];

    // Row 1: Title "Undur diri" merged roughly over first few cols? 
    // Image shows "Undur diri" in a reddish box.
    wsData.push([
        { v: '', s: {} },
        { v: 'Undur diri', s: titleStyle },
        { v: '', s: {} }, // Will merge later
        { v: '', s: {} }
    ]);

    // Row 2: Headers
    const headerRow = headers.map(h => ({ v: h, s: headerStyle }));
    wsData.push(headerRow);

    // Row 3+: Data
    processedRows.forEach(row => {
        wsData.push([
            { v: row.no, s: centerStyle },
            { v: row.nama, s: dataStyle },
            { v: row.npp, s: centerStyle },
            { v: row.uraian, s: centerStyle },
            { v: row.unit_kerja, s: centerStyle },
            { v: row.masuk, s: centerStyle },
            { v: row.keluar, s: centerStyle },
            { v: row.sp, s: moneyStyle, t: 's' },
            { v: row.sw, s: moneyStyle, t: 's' },
            { v: row.swk, s: moneyStyle, t: 's' },
            { v: row.jumlah, s: moneyStyle, t: 's' },
            { v: row.outs, s: moneyStyle, t: 's' },
            { v: row.outBunga, s: moneyStyle, t: 's' },
            { v: row.byTf, s: moneyStyle, t: 's' },
            { v: row.dikembalikan, s: moneyStyle, t: 's' },
            { v: row.noRek, s: centerStyle }
        ]);
    });

    // Row Last: Totals
    // Image shows totals under relevant columns.
    // Boxed S.P ... dikembalikan?
    // Image shows totals at bottom.
    // Total row style: Bold, Borders
    const totalStyle = { font: { bold: true }, alignment: { horizontal: "right" }, border: borderStyle };
    const emptyBorder = { v: '', s: { border: borderStyle } };

    // Need to align totals with columns.
    // Cols indices: 0:No, 1:Nama, 2:NPP, 3:Uraian, 4:Unit, 5:Masuk, 6:Keluar, 7:SP, 8:SW, 9:SWK, 10:JML, 11:Outs, 12:OutB, 13:ByTF, 14:Dikembalikan, 15:NoRek

    // In image, Totals seem to start from S.P (Col 7) 
    const totalRow = [
        emptyBorder, emptyBorder, emptyBorder, emptyBorder, emptyBorder, emptyBorder, emptyBorder,
        { v: formatNum(rawTotals.pokok), s: totalStyle, t: 's' },
        { v: formatNum(rawTotals.wajib), s: totalStyle, t: 's' },
        { v: formatNum(rawTotals.sukarela), s: totalStyle, t: 's' },
        { v: formatNum(rawTotals.jumlah), s: totalStyle, t: 's' },
        { v: formatNum(rawTotals.outsP), s: totalStyle, t: 's' },
        { v: formatNum(rawTotals.outsB), s: totalStyle, t: 's' },
        { v: formatNum(rawTotals.admin), s: totalStyle, t: 's' },
        { v: formatNum(rawTotals.diterima), s: totalStyle, t: 's' },
        emptyBorder
    ];
    wsData.push(totalRow);

    // Grand Total Row (optional, image shows separate grand total lower down? "33,597,926" in pink box)
    // It seems to be under "dikembalikan"
    const grandTotalRow = [
        { v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} },
        { v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} },
        { v: formatNum(rawTotals.diterima), s: { ...totalStyle, fill: { fgColor: { rgb: "FBD4B4" } } }, t: 's' }, // Pinkish bg
        { v: '', s: {} }
    ];
    wsData.push(grandTotalRow);

    const ws = XLSX.utils.aoa_to_sheet([]);
    const range = { s: { c: 0, r: 0 }, e: { c: headers.length - 1, r: wsData.length - 1 } };
    ws['!ref'] = XLSX.utils.encode_range(range);

    // Merge title cell
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 1 }, e: { r: 0, c: 3 } }); // Merging "Undur diri" over Nama, NPP, Uraian

    for (let R = 0; R < wsData.length; ++R) {
        for (let C = 0; C < wsData[R].length; ++C) {
            const cell = wsData[R][C];
            const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
            if (cell) ws[cellRef] = cell;
        }
    }

    // Column widths
    ws['!cols'] = [
        { wch: 4 },  // No
        { wch: 25 }, // Nama
        { wch: 10 }, // NPP
        { wch: 12 }, // Uraian
        { wch: 15 }, // Unit
        { wch: 10 }, // Masuk
        { wch: 10 }, // Keluar
        { wch: 12 }, // SP
        { wch: 12 }, // SW
        { wch: 12 }, // SWK
        { wch: 15 }, // JML
        { wch: 12 }, // Outs
        { wch: 12 }, // OutB
        { wch: 10 }, // ByTF
        { wch: 15 }, // Dikembalikan
        { wch: 15 }  // NoRek
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Realisasi Karyawan');

    XLSX.writeFile(wb, `Realisasi_Karyawan_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
