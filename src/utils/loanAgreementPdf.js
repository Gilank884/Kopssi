import jsPDF from 'jspdf';

/* =========================
   HELPER
========================= */

const numberToWords = (num) => {
    const units = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    if (num < 12) return units[num];
    if (num < 20) return numberToWords(num - 10) + ' Belas';
    if (num < 100) return numberToWords(Math.floor(num / 10)) + ' Puluh ' + numberToWords(num % 10);
    if (num < 200) return 'Seratus ' + numberToWords(num - 100);
    if (num < 1000) return numberToWords(Math.floor(num / 100)) + ' Ratus ' + numberToWords(num % 100);
    if (num < 2000) return 'Seribu ' + numberToWords(num - 1000);
    if (num < 1000000) return numberToWords(Math.floor(num / 1000)) + ' Ribu ' + numberToWords(num % 1000);
    if (num < 1000000000) return numberToWords(Math.floor(num / 1000000)) + ' Juta ' + numberToWords(num % 1000000);
    if (num < 1000000000000) return numberToWords(Math.floor(num / 1000000000)) + ' Milyar ' + numberToWords(num % 1000000000);
    return num.toString();
};

const formatDate = (date) =>
    new Date(date).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

/* =========================
   MAIN FUNCTION
========================= */

export const generateLoanAgreementPDF = async (loan) => {
    const doc = new jsPDF('p', 'mm', 'a4');

    const margin = 15;
    const leftX = margin;
    const rightX = 115;
    const colWidth = 85;

    let yLeft = 35;
    let yRight = 35;

    /* =========================
       LOGO
    ========================= */
    const logo = new Image();
    logo.src = '/Logo.png';
    await new Promise((res) => (logo.onload = res));
    doc.addImage(logo, 'PNG', margin, 12, 16, 12);

    /* =========================
       STYLE DASAR
    ========================= */
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);     // diperkecil lagi
    const lineHeight = 3;   // spasi sangat rapat

    const writeLeft = (text, gap = 2) => {
        const lines = doc.splitTextToSize(text, colWidth);
        doc.text(lines, leftX, yLeft);
        yLeft += lines.length * lineHeight + gap;
    };

    const writeRight = (text, gap = 4) => {
        const lines = doc.splitTextToSize(text, colWidth);
        doc.text(lines, rightX, yRight);
        yRight += lines.length * lineHeight + gap;
    };

    /* =========================
       HEADER
    ========================= */
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    writeLeft('Koperasi Jasa Pegawai Swadharma Sarana Informatika', 3);

    doc.setFontSize(9); // Size 9 for Title (was 11)
    const titleText = 'PERJANJIAN PINJAMAN ANGGOTA KOPERASI JASA PEGAWAI SWADHARMA SARANA INFORMATIKA';
    const titleLines = doc.splitTextToSize(titleText, colWidth);
    titleLines.forEach(line => {
        const w = doc.getTextWidth(line);
        doc.text(line, leftX + (colWidth - w) / 2, yLeft);
        yLeft += lineHeight;
    });

    yLeft += 1; // Small gap

    const nomorText = `Nomor : ${loan.no_pinjaman}`;
    const nomorW = doc.getTextWidth(nomorText);
    doc.text(nomorText, leftX + (colWidth - nomorW) / 2, yLeft);
    yLeft += lineHeight + 4; // Gap before next section

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);

    /* =========================
       BLOK IDENTITAS
    ========================= */

    writeLeft('Yang bertanda tangan dibawah ini :', 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    writeLeft('I. R. LIZA SARASWATI', 1);

    doc.setFont('helvetica', 'normal');
    writeLeft(
        'selaku Pengurus KOPERASI JASA PEGAWAI SWADHARMA SARANA INFORMATIKA, oleh karena demikian berwenang bertindak untuk dan atas nama KOPERASI JASA PEGAWAI SWADHARMA SARANA INFORMATIKA. Untuk selanjutnya disebut ---- KOPSSI ----',
        5
    );

    const safe = (v) => v ?? '-';

    writeLeft(
        `II. NAMA : ${safe(loan.personal_data?.full_name)}
NPP  : ${safe(loan.personal_data?.no_npp)}
UNIT : ${safe(loan.personal_data?.work_unit)}
No. Anggota : ${safe(loan.personal_data?.no_anggota)}
KTP  : ${safe(loan.personal_data?.nik)}
untuk selanjutnya disebut :
---------------- PEMINJAM ----------------`,
        5
    );

    writeLeft(
        'Kedua belah pihak setuju dan sepakat menandatangani Perjanjian Pinjaman dengan syarat-syarat serta ketentuan-ketentuan sebagai berikut :',
        4
    );

    /* =========================
       PASAL KIRI
    ========================= */
    const renderPasalContent = (text, startX, startY, width, gap = 2, indent = 4) => {
        let currentY = startY;
        // Split by newline to preserve paragraph structure
        const paragraphs = text.split('\n');

        paragraphs.forEach(para => {
            const hasNumber = para.match(/^(\d+\.)\s+(.*)/);
            if (hasNumber) {
                // It is a numbered line: "1. Text..."
                const numberStr = hasNumber[1];
                const contentStr = hasNumber[2];

                // Draw Number
                doc.text(numberStr, startX, currentY);

                // Draw Content with indent
                const contentLines = doc.splitTextToSize(contentStr, width - indent);
                doc.text(contentLines, startX + indent, currentY);

                currentY += contentLines.length * lineHeight;
            } else {
                // Normal paragraph
                const lines = doc.splitTextToSize(para, width);
                doc.text(lines, startX, currentY);
                currentY += lines.length * lineHeight;
            }
        });

        return currentY + gap;
    };

    const pasalLeft = (title, text) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);

        // Center Title
        const titleLines = doc.splitTextToSize(title, colWidth);
        titleLines.forEach(line => {
            const lineWidth = doc.getTextWidth(line);
            const xOffset = leftX + (colWidth - lineWidth) / 2;
            doc.text(line, xOffset, yLeft);
            yLeft += lineHeight;
        });

        yLeft += 1;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);

        // Render aligned text
        yLeft = renderPasalContent(text, leftX, yLeft, colWidth);
    };

    pasalLeft(
        'Pasal 1\nMAKSIMUM & TUJUAN PINJAMAN',
        `1. Maksimum Pinjaman sebesar Rp ${Number(loan.jumlah_pinjaman).toLocaleString('id-ID')} (${numberToWords(loan.jumlah_pinjaman)}). Maksimum Pinjaman adalah fasilitas pinjaman tertinggi yang dapat ditarik oleh PEMINJAM setelah memenuhi semua syarat yang ditetapkan oleh KOPERASI JASA PEGAWAI SWADHARMA SARANA INFORMATIKA.\n2. Tujuan Pinjaman untuk : ${loan.keperluan}`
    );

    pasalLeft(
        'Pasal 2\nJANGKA WAKTU PINJAMAN',
        `Jangka waktu pinjaman adalah ${loan.tenor_bulan}, (${numberToWords(loan.tenor_bulan)}) bulan terhitung sejak ditandatangani perjanjian pinjaman.`
    );

    pasalLeft(
        'Pasal 3\nSUKU BUNGA PINJAMAN & PROVISI',
        `1. PEMINJAM wajib membayar bunga Pinjaman kepada KOPSSI sebesar 0.83 % per bulan.`
    );

    pasalLeft(
        'Pasal 4\nCARA PEMBAYARAN ANGSURAN',
        `Terhadap Fasilitas Pinjaman ini, PEMINJAM diwajibkan melakukan pembayaran dalam bentuk :\n1. Diangsur melalui potong gaji Pegawai ALIH DAYA JST tanggal 25 setiap bulannya.`
    );

    pasalLeft(
        'Pasal 5\nJAMINAN',
        `Peminjam wajib menyerahkan jaminan pembayaran atas Pinjaman kepada KOPSSI dalam bentuk:\n1. Jaminan Pokok Pinjaman berupa Gaji dan pensiunan atau pendapatan lain yang akan diperoleh Peminjam, termasuk Simpanan Pokok, Simpanan Wajib yang ada pada KOPSSI\n2. Jaminan Tambahan akan diserahkan ke KOPSSI, (apabila diperlukan).`
    );

    pasalLeft(
        'Pasal 6\nPELUNASAN',
        `1. Jika PEMINJAM berhenti bekerja dari unit kerjanya atau berhenti dari keanggotaan KOPSSI sebelum pinjaman lunas, maka PEMINJAM wajib melunasi pinjamannya.\n2. Segala penerimaan yang masih akan diperoleh baik dari unit kerja yang bersangkutan maupun simpanan-simpanan yang ada di KOPSSI akan dikompensasikan dengan sisa jumlah pinjaman yang masih terhutang, namun apabila setelah dikompensasikan belum lunas, maka PEMINJAM atau ahli warisnya harus segera melunasinya sekaligus.`
    );

    pasalLeft(
        'Pasal 7\nPASAL TAMBAHAN',
        `1. PEMINJAM wajib segera memberitahukan kepada KOPSSI dalam hal PEMINJAM pindah alamat atau pindah pekerjaan an atau dimutasikan ketempat lain.`
    );

    /* =========================
       KOLOM KANAN
    ========================= */
    const pasalRight = (title, text) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);

        const titleLines = doc.splitTextToSize(title, colWidth);
        titleLines.forEach(line => {
            const lineWidth = doc.getTextWidth(line);
            const xOffset = rightX + (colWidth - lineWidth) / 2;
            doc.text(line, xOffset, yRight);
            yRight += lineHeight;
        });

        yRight += 2;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);

        // Reuse the helper for right column with rightX
        yRight = renderPasalContent(text, rightX, yRight, colWidth);
    };

    pasalRight(
        'Pasal 8\nPENYELESAIAN PERSELISIHAN',
        '1. Dalam hal terjadi perselisihan tentang pelaksanaan perjanjian ini, Para Pihak sepakat untuk menyelesaikan secara musyawarah dan apabila musyawarah tidak tercapai, maka akan diselesaikan melalui Pengadilan Negeri Jakarta Selatan.'
    );

    writeRight(`Perjanjian ini dibuat di Jakarta pada hari ${formatDate(new Date())}`, 10);

    /* =========================
       SIGNATURE BLOCK (Side-by-Side)
    ========================= */
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);

    // Grid calculation
    const sigStartY = yRight;
    const halfWidth = colWidth / 2;
    const leftSubColCenter = rightX + (halfWidth / 2);
    const rightSubColCenter = rightX + halfWidth + (halfWidth / 2);

    // Left Side: Koperasi
    const kopText = 'KOPERASI JASA PEGAWAI\nSWADHARMA SARANA\nINFORMATIKA';
    const kopLines = doc.splitTextToSize(kopText, halfWidth);
    let kopY = sigStartY;
    kopLines.forEach((line) => {
        const w = doc.getTextWidth(line);
        doc.text(line, leftSubColCenter - w / 2, kopY);
        kopY += lineHeight;
    });

    // Right Side: Peminjam
    const peminjamText = 'PEMINJAM';
    const peminjamW = doc.getTextWidth(peminjamText);
    doc.text(peminjamText, rightSubColCenter - peminjamW / 2, sigStartY);

    // Names below (Gap)
    const signatureGap = 15;
    const nameY = sigStartY + signatureGap + 5; // Adjust based on Koperasi title height ~9-10mm

    // Name 1 (Left)
    const signer1 = 'R. LIZA SARASWATI';
    const signer1W = doc.getTextWidth(signer1);
    doc.text(signer1, leftSubColCenter - signer1W / 2, nameY);

    // Name 2 (Right)
    const signer2 = (loan.personal_data?.full_name || '').toUpperCase();
    const signer2W = doc.getTextWidth(signer2);
    doc.text(signer2, rightSubColCenter - signer2W / 2, nameY);

    /* =========================
       SAVE
    ========================= */
    doc.save(`SPK_Pinjaman_${loan.no_pinjaman}.pdf`);
};
