import jsPDF from 'jspdf';
import { supabase } from '../lib/supabaseClient';

export const numberToWords = (num) => {
    const units = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    if (num < 12) return units[num];
    if (num < 20) return numberToWords(num - 10) + ' Belas';
    if (num < 100) return numberToWords(Math.floor(num / 10)) + ' Puluh ' + numberToWords(num % 10);
    if (num < 200) return 'Seratus ' + numberToWords(num - 100);
    if (num < 1000) return numberToWords(Math.floor(num / 100)) + ' Ratus ' + numberToWords(num % 100);
    if (num < 2000) return 'Seribu ' + numberToWords(num - 1000);
    if (num < 1000000) return numberToWords(Math.floor(num / 1000)) + ' Ribu ' + numberToWords(num % 1000);
    if (num < 1000000000) return numberToWords(Math.floor(num / 1000000)) + ' Juta ' + numberToWords(num % 1000000);
    return num.toString();
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

export const generateLoanAgreementPDF = async (loan, outputType = 'save') => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = 20;

    // Header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('KOPERASI JASA PEGAWAI SWADHARMA SARANA INFORMATIKA', pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;

    doc.setFontSize(11);
    doc.text('PERJANJIAN PINJAMAN ANGGOTA KOPERASI JASA', pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    doc.text('PEGAWAI SWADHARMA SARANA INFORMATIKA', pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    doc.setFontSize(10);
    doc.text(`Nomor : ${loan.no_pinjaman}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;

    doc.setFont('helvetica', 'normal');
    const introText = "Yang bertanda tangan dibawah ini :";
    doc.text(introText, margin, currentY);
    currentY += 7;

    // Parties
    const indent = 10;
    doc.text('I.  R. LIZA SARASWATI selaku Pengurus KOPERASI JASA PEGAWAI SWADHARMA SARANA INFORMATIKA,', margin + indent, currentY);
    currentY += 5;
    doc.text('oleh karena demikian berwenang bertindak untuk dan atas nama KOPERASI JASA PEGAWAI', margin + indent + 5, currentY);
    currentY += 5;
    doc.text('SWADHARMA SARANA INFORMATIKA. Untuk selanjutnya disebut -------- KOPSSI --------', margin + indent + 5, currentY);
    currentY += 10;

    doc.text('II. NAMA :', margin + indent, currentY);
    doc.text(loan.personal_data?.full_name || '-', margin + indent + 30, currentY);
    currentY += 5;
    doc.text('NPP :', margin + indent, currentY);
    doc.text(loan.personal_data?.no_npp || '-', margin + indent + 30, currentY);
    currentY += 5;
    doc.text('UNIT :', margin + indent, currentY);
    doc.text(loan.personal_data?.work_unit || '-', margin + indent + 30, currentY);
    currentY += 5;
    doc.text('No. Anggota :', margin + indent, currentY);
    doc.text(loan.personal_data?.no_anggota || '-', margin + indent + 30, currentY);
    currentY += 5;
    doc.text('NIK :', margin + indent, currentY);
    doc.text(loan.personal_data?.nik || '-', margin + indent + 30, currentY);
    currentY += 5;
    doc.text('untuk selanjutnya disebut :', margin + indent, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('----------------------------------- PEMINJAM -----------------------------------', margin + indent, currentY);
    doc.setFont('helvetica', 'normal');
    currentY += 10;

    const agreementText = "Kedua belah pihak setuju dan sepakat menandatangani Perjanjian Pinjaman dengan syarat-syarat serta ketentuan-ketentuan sebagai berikut :";
    const splitAgreementText = doc.splitTextToSize(agreementText, contentWidth);
    doc.text(splitAgreementText, margin, currentY);
    currentY += (splitAgreementText.length * 5) + 5;

    // Pasal 1
    doc.setFont('helvetica', 'bold');
    doc.text('Pasal 1', pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    doc.text('MAKSIMUM & TUJUAN PINJAMAN', pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;
    doc.setFont('helvetica', 'normal');
    const principal = parseFloat(loan.jumlah_pinjaman);
    const p1Text = `1. Maksimum Pinjaman sebesar Rp. ${principal.toLocaleString('id-ID')} (${numberToWords(principal).toUpperCase()} RUPIAH). Maksimum Pinjaman adalah fasilitas pinjaman tertinggi yang dapat ditarik oleh PEMINJAM setelah memenuhi semua syarat yang ditetapkan oleh KOPERASI JASA PEGAWAI SWADHARMA SARANA INFORMATIKA.`;
    const splitP1Text = doc.splitTextToSize(p1Text, contentWidth);
    doc.text(splitP1Text, margin, currentY);
    currentY += (splitP1Text.length * 5);
    doc.text(`2. Tujuan Pinjaman untuk : ${loan.keperluan || '-'}`, margin, currentY);
    currentY += 10;

    // Pasal 2
    doc.setFont('helvetica', 'bold');
    doc.text('Pasal 2', pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    doc.text('JANGKA WAKTU PINJAMAN', pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Jangka waktu pinjaman adalah ${loan.tenor_bulan}, (${numberToWords(loan.tenor_bulan)}) bulan terhitung sejak ditandatangani perjanjian pinjaman.`, margin, currentY);
    currentY += 10;

    // Pasal 3
    doc.setFont('helvetica', 'bold');
    doc.text('Pasal 3', pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    doc.text('SUKU BUNGA PINJAMAN & PROVISI', pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;
    doc.setFont('helvetica', 'normal');
    let bungaText = '';
    if (loan.tipe_bunga === 'PERSENAN') {
        const monthlyRate = (parseFloat(loan.nilai_bunga) / 12).toFixed(2);
        bungaText = `1. PEMINJAM wajib membayar bunga Pinjaman kepada KOPSSI sebesar ${monthlyRate}% per bulan.`;
    } else {
        bungaText = `1. PEMINJAM wajib membayar bunga Pinjaman sesuai kesepakatan nominal yang ditetapkan sistem.`;
    }
    doc.text(bungaText, margin, currentY);
    currentY += 10;

    // Pasal 4
    doc.setFont('helvetica', 'bold');
    doc.text('Pasal 4', pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    doc.text('CARA PEMBAYARAN ANGSURAN', pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;
    doc.setFont('helvetica', 'normal');
    doc.text('Terhadap Fasilitas Pinjaman ini, PEMINJAM diwajibkan melakukan pembayaran dalam bentuk :', margin, currentY);
    currentY += 5;
    doc.text('1. Diangsur melalui potong gaji Pegawai ALIH DAYA JST tanggal 25 setiap bulannya.', margin + 5, currentY);
    currentY += 15;

    // New Page for rest and signatures
    doc.addPage();
    currentY = 20;

    // Pasal 5
    doc.setFont('helvetica', 'bold');
    doc.text('Pasal 5', pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    doc.text('JAMINAN', pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;
    doc.setFont('helvetica', 'normal');
    const p5Text = "Peminjam wajib menyerahkan jaminan pembayaran atas Pinjaman kepada KOPSSI dalam bentuk :\n1. Jaminan Pokok Pinjaman berupa Gaji dan pensiunan atau pendapatan lain yang akan diperoleh Peminjam, termasuk Simpanan Pokok, Simpanan Wajib yang ada pada KOPSSI.\n2. Jaminan Tambahan akan diserahkan ke KOPSSI, (apabila diperlukan).";
    const splitP5Text = doc.splitTextToSize(p5Text, contentWidth);
    doc.text(splitP5Text, margin, currentY);
    currentY += (splitP5Text.length * 5) + 5;

    // Pasal 6
    doc.setFont('helvetica', 'bold');
    doc.text('Pasal 6', pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    doc.text('PELUNASAN', pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;
    doc.setFont('helvetica', 'normal');
    const p6Text = "1. Jika PEMINJAM berhenti bekerja dari unit kerjanya atau berhenti dari keanggotaan KOPSSI sebelum pinjaman lunas, maka PEMINJAM wajib melunasi pinjamannya.\n2. Segala penerimaan yang masih akan diperoleh baik dari unit kerja yang bersangkutan maupun simpanan-simpanan yang ada di KOPSSI akan dikompensasikan dengan sisa jumlah pinjaman yang masih terhutang, namun apabila setelah dikompensasikan belum lunas, maka PEMINJAM atau ahli warisnya harus segera melunasinya sekaligus.";
    const splitP6Text = doc.splitTextToSize(p6Text, contentWidth);
    doc.text(splitP6Text, margin, currentY);
    currentY += (splitP6Text.length * 5) + 5;

    // Pasal 7
    doc.setFont('helvetica', 'bold');
    doc.text('Pasal 7', pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    doc.text('PASAL TAMBAHAN', pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;
    doc.setFont('helvetica', 'normal');
    doc.text('1. PEMINJAM wajib segera memberitahukan kepada KOPSSI dalam hal PEMINJAM pindah alamat atau pindah pekerjaan an atau dimutasikan ketempat lain.', margin, currentY);
    currentY += 10;

    // Pasal 8
    doc.setFont('helvetica', 'bold');
    doc.text('Pasal 8', pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    doc.text('PENYELESAIAN PERSELISIHAN', pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;
    doc.setFont('helvetica', 'normal');
    const p8Text = "1. Dalam hal terjadi perselisihan tentang pelaksanaan perjanjian ini, Para Pihak sepakat untuk menyelesaikannya secara musyawarah dan apabila musyawarah tidak tercapai, maka akan diselesaikan melalui Pengadilan Negeri Jakarta Selatan.";
    const splitP8Text = doc.splitTextToSize(p8Text, contentWidth);
    doc.text(splitP8Text, margin, currentY);
    currentY += (splitP8Text.length * 5) + 15;

    doc.text(`Perjanjian ini dibuat di Jakarta pada hari ${new Date().toLocaleDateString('id-ID', { weekday: 'long' })}, ${formatDate(new Date())}`, margin, currentY);
    currentY += 15;

    const colWidth = pageWidth / 2;
    doc.setFont('helvetica', 'bold');
    doc.text('KOPERASI JASA PEGAWAI', margin, currentY);
    doc.text('PEMINJAM', pageWidth - margin - 30, currentY);
    currentY += 5;
    doc.text('SWADHARMA SARANA', margin, currentY);
    currentY += 5;
    doc.text('INFORMATIKA', margin, currentY);
    currentY += 30;

    doc.text('R. LIZA SARASWATI', margin, currentY);
    doc.text(loan.personal_data?.full_name?.toUpperCase() || 'USER', pageWidth - margin - 50, currentY);

    if (outputType === 'blob') {
        const blob = doc.output('blob');
        return URL.createObjectURL(blob);
    } else if (outputType === 'preview') {
        window.open(doc.output('bloburl'), '_blank');
    } else {
        doc.save(`SPK_Pinjaman_${loan.no_pinjaman}.pdf`);
    }
};
