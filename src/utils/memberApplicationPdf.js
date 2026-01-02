import jsPDF from 'jspdf';

export const generateMemberApplicationPDF = async (member, isPreview = false) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // Helper for loading images
    const loadImage = (url) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    };

    // Header (Address)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Bellagio Office Park Unit OUG 31-32 Jl. Mega Kuningan Barat Kav.E.4-3', pageWidth - margin, 10, { align: 'right' });
    doc.setLineWidth(1.5);
    doc.line(margin, 15, pageWidth - margin, 15);

    // Date and Intro
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const today = new Date();
    const dateStr = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(`............................., ${dateStr.split(' ')[1]} ${dateStr.split(' ')[2]}`, pageWidth - margin - 60, 25);

    doc.text('Hal : Pendaftaran anggota KOPSSI', margin, 25);
    doc.text('Lamp. : 1 (satu) lembar fotokopi KTP', margin, 30);

    // Recipient
    const recipientY = 40;
    doc.text('Kepada', margin + 40, recipientY);
    doc.setFont('helvetica', 'bold');
    doc.text('Koperasi Simpan Pinjam Swadharma', margin + 40, recipientY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text('Bellagio Office Park Unit OUG 31-32', margin + 40, recipientY + 10);
    doc.text('Setiabudi                                Kuningan - Jakarta Selatan', margin, recipientY + 15);

    // Body text
    const bodyY = 70;
    doc.text('Yang bertanda tangan di bawah ini:', margin + 20, bodyY);

    const fields = [
        ['Nama / NPP', `: ${member.full_name || '-'} / ${member.no_npp || '-'}`],
        ['Perusahaan', `: ${member.company || '-'}`],
        ['Status pegawai', `: ${member.employment_status || '-'}`],
        ['Unit kerja', `: ${member.work_unit || '-'}`]
    ];

    fields.forEach((f, i) => {
        const y = bodyY + 12 + (i * 8);
        doc.text(`- ${f[0]}`, margin + 35, y);
        doc.text(f[1], margin + 70, y);
    });

    const text1 = 'dengan ini mengajukan permohonan menjadi anggota Koperasi Simpan Pinjam Swadharma (KOPSSI) dan bersedia mematuhi ketentuan-ketentuan yang ditetapkan dalam Anggaran Dasar dan Anggaran Rumah Tangga KOPSSI.';
    const text2 = 'Sesuai dengan persyaratan yang telah ditetapkan, kami bersedia membayar:';

    doc.setFont('helvetica', 'normal');
    let currentY = bodyY + 50;
    const splitText1 = doc.splitTextToSize(text1, pageWidth - (margin * 2) - 20);
    doc.text(splitText1, margin + 5, currentY);

    currentY += (splitText1.length * 5) + 5;
    doc.text(text2, margin + 5, currentY);

    currentY += 8;
    doc.text('1. Simpanan Pokok sebesar Rp. 200.000,00 (Dua ratus ribu rupiah) yang diangsur sebanyak 3', margin + 5, currentY);
    currentY += 5;
    doc.text('    (tiga) kali/bulan.', margin + 5, currentY);

    currentY += 8;
    doc.text('2. Simpanan Wajib sebesar Rp. 75.000,00 (tujuh puluh lima ribu rupiah) per bulan.', margin + 5, currentY);

    currentY += 12;
    doc.text('Simpanan Pokok dan Simpanan Wajib tersebut di atas dapat langsung dipotong dari gaji saya', margin + 5, currentY);
    currentY += 5;
    doc.text('setiap bulan, terhitung mulai bulan .................................', margin + 5, currentY);

    currentY += 12;
    doc.text('Bersama ini kami sampaikan 1 (satu) lembar fotokopi identitas atas nama saya.', margin + 5, currentY);

    currentY += 12;
    doc.text('Demikianlah permohonan menjadi anggota KOPSSI ini dibuat dengan sebenarnya.', margin + 5, currentY);

    // Signature Boxes areas
    currentY += 10;
    const boxWidth = 30;
    const boxHeight = 40;
    const boxesY = currentY;

    // Photo Box
    doc.rect(margin + 25, boxesY, boxWidth, boxHeight);
    doc.text('*Pas Foto', margin + 25, boxesY + boxHeight + 5);


    // Member Name Placeholder
    doc.text('(......................................................)', margin + (boxWidth * 2) + 50, boxesY + boxHeight);
    doc.text(member.full_name || '', margin + (boxWidth * 2) + 75, boxesY + boxHeight + 5, { align: 'center' });

    // Dynamic Content: Photo
    if (member.photo_34_file_path) {
        try {
            const img = await loadImage(member.photo_34_file_path);
            doc.addImage(img, 'JPEG', margin + 25 + 2, boxesY + 2, boxWidth - 4, boxHeight - 4);
        } catch (e) {
            console.warn("Failed to load member photo into PDF", e);
        }
    }

    // Dynamic Content: Signature (if exists and fits)
    if (member.signature_image) {
        try {
            const img = await loadImage(member.signature_image);
            // Place it over the (........) placeholder or near it
            doc.addImage(img, 'PNG', margin + (boxWidth * 2) + 55, boxesY + 10, 40, 25);
        } catch (e) {
            console.warn("Failed to load member signature into PDF", e);
        }
    }

    if (isPreview) {
        window.open(doc.output('bloburl'), '_blank');
    } else {
        doc.save(`Pendaftaran_Anggota_${member.nik || 'Data'}.pdf`);
    }
};
