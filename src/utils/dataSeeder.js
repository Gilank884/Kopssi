import { supabase } from '../lib/supabaseClient';

export const seedSynchronizedData = async () => {
    try {
        console.log("🚀 Starting Comprehensive Seeding Process...");

        const companies = ['PT KOPSSI UTAMA', 'PT PRIMA SEJAHTERA', 'PT BERKAH JAYA', 'PT SEJAHTERA ABADI'];
        const loanCategories = ['ELEKTRONIK', 'MOTOR', 'MOBIL', 'KPR', 'USAHA'];

        // 1. Ensure Master Data
        console.log("📦 Ensuring Master Data...");
        for (const company of companies) {
            await supabase.from('master_data').upsert({ category: 'company', value: company }, { onConflict: 'category,value' });
        }
        for (const cat of loanCategories) {
            await supabase.from('master_data').upsert({ category: 'loan_category', value: cat }, { onConflict: 'category,value' });
        }

        // 2. Clear existing data to avoid conflicts for a clean demo (Optional, but safer for "Sync" request)
        // We won't delete, we'll upsert where possible.

        // 3. Define 10 Synchronized Members
        const mockMembers = [
            { full_name: 'AHMAD FAUZI', no_npp: '10001', nik: '3275010101850001', no_anggota: 'AG-24001', company: companies[0], work_unit: 'HO', role: 'ADMIN', status: 'ACTIVE', phone: '081234567891', rek_gaji: '12345678', bank_gaji: 'BCA', joined_at: '2024-01-01' },
            { full_name: 'SITI AMINAH', no_npp: '10002', nik: '3275010101850002', no_anggota: 'AG-24002', company: companies[0], work_unit: 'HO', role: 'MEMBER', status: 'ACTIVE', phone: '081234567892', rek_gaji: '12345679', bank_gaji: 'MANDIRI', joined_at: '2024-01-01' },
            { full_name: 'BUDI SANTOSO', no_npp: '10003', nik: '3275010101850003', no_anggota: 'AG-24003', company: companies[1], work_unit: 'BRANCH A', role: 'MEMBER', status: 'ACTIVE', phone: '081234567893', rek_gaji: '12345680', bank_gaji: 'BNI', joined_at: '2024-01-01' },
            { full_name: 'DIANA LESTARI', no_npp: '10004', nik: '3275010101850004', no_anggota: 'AG-24004', company: companies[1], work_unit: 'BRANCH A', role: 'MEMBER', status: 'ACTIVE', phone: '081234567894', rek_gaji: '12345681', bank_gaji: 'BRI', joined_at: '2024-01-01' },
            { full_name: 'EKO PRASETYO', no_npp: '10005', nik: '3275010101850005', no_anggota: 'AG-24005', company: companies[1], work_unit: 'BRANCH B', role: 'MEMBER', status: 'ACTIVE', phone: '081234567895', rek_gaji: '12345682', bank_gaji: 'BSI', joined_at: '2024-01-01' },
            { full_name: 'FITRIANI', no_npp: '10006', nik: '3275010101850006', no_anggota: 'AG-24006', company: companies[2], work_unit: 'BRANCH C', role: 'MEMBER', status: 'ACTIVE', phone: '081234567896', rek_gaji: '12345683', bank_gaji: 'DANAMON', joined_at: '2024-01-01' },
            { full_name: 'GIVAN ALFARIDZI', no_npp: '10007', nik: '3275010101850007', no_anggota: 'AG-24007', company: companies[2], work_unit: 'BRANCH C', role: 'MEMBER', status: 'NON_ACTIVE', phone: '081234567897', rek_gaji: '12345684', bank_gaji: 'CIMB', joined_at: '2023-01-01', tanggal_keluar: '2024-03-31', exit_realisasi_status: 'PENDING' },
            { full_name: 'HANI RAHMAWATI', no_npp: '10008', nik: '3275010101850008', no_anggota: 'AG-24008', company: companies[2], work_unit: 'BRANCH D', role: 'MEMBER', status: 'ACTIVE', phone: '081234567898', rek_gaji: '12345685', bank_gaji: 'PERMATA', joined_at: '2024-01-01' },
            { full_name: 'INDRA WIJAYA', no_npp: '10009', nik: '3275010101850009', no_anggota: 'AG-24009', company: companies[3], work_unit: 'BRANCH E', role: 'MEMBER', status: 'ACTIVE', phone: '081234567899', rek_gaji: '12345686', bank_gaji: 'OCBC', joined_at: '2024-01-01' },
            { full_name: 'JULIA KARTIKA', no_npp: '10010', nik: '3275010101850010', no_anggota: 'AG-24010', company: companies[3], work_unit: 'BRANCH E', role: 'MEMBER', status: 'ACTIVE', phone: '081234567800', rek_gaji: '12345687', bank_gaji: 'MEGA', joined_at: '2024-01-01' },
        ];

        console.log("👥 Inserting Members...");
        const { data: insertedMembers, error: memberError } = await supabase
            .from('personal_data')
            .upsert(mockMembers.map(m => ({ ...m, is_approved: true })), { onConflict: 'nik' })
            .select();
        
        if (memberError) throw memberError;

        // 4. Savings (POKOK + WAJIB for all members for last 3 months)
        console.log("💰 Inserting Savings...");
        const savingsToInsert = [];
        const months = ['2024-01-10', '2024-02-10', '2024-03-10'];

        insertedMembers.forEach(member => {
            // Pokok
            savingsToInsert.push({
                personal_data_id: member.id,
                type: 'POKOK',
                amount: 1000000,
                status: 'PAID',
                transaction_type: 'SETOR',
                created_at: '2024-01-01'
            });

            // Wajib
            months.forEach(m => {
                savingsToInsert.push({
                    personal_data_id: member.id,
                    type: 'WAJIB',
                    amount: 100000,
                    status: 'PAID',
                    transaction_type: 'SETOR',
                    created_at: m
                });
            });

            // Sukarela (Random)
            if (Math.random() > 0.5) {
                savingsToInsert.push({
                    personal_data_id: member.id,
                    type: 'SUKARELA',
                    amount: 250000,
                    status: 'PAID',
                    transaction_type: 'SETOR',
                    created_at: '2024-02-15'
                });
            }
        });

        await supabase.from('simpanan').insert(savingsToInsert);

        // 5. Loans (Various Statuses)
        console.log("🏦 Inserting Loans...");
        const mockLoans = [
            { personal_data_id: insertedMembers[0].id, no_pinjaman: 'LP-24001', jumlah_pengajuan: 10000000, jumlah_pinjaman: 10000000, tenor_bulan: 12, tipe_bunga: 'PERSENAN', nilai_bunga: 12, status: 'DICAIRKAN', disbursed_at: '2024-01-15T10:00:00Z', delivery_status: 'SENT', delivery_date: '2024-01-16T10:00:00Z' },
            { personal_data_id: insertedMembers[1].id, no_pinjaman: 'LP-24002', jumlah_pengajuan: 5000000, jumlah_pinjaman: 5000000, tenor_bulan: 6, tipe_bunga: 'NOMINAL', nilai_bunga: 300000, status: 'DICAIRKAN', disbursed_at: '2024-02-01T10:00:00Z', delivery_status: 'PENDING' },
            { personal_data_id: insertedMembers[2].id, no_pinjaman: 'LP-24003', jumlah_pengajuan: 20000000, jumlah_pinjaman: 20000000, tenor_bulan: 24, tipe_bunga: 'PERSENAN', nilai_bunga: 10, status: 'PENDING' },
            { personal_data_id: insertedMembers[3].id, no_pinjaman: 'LP-24004', jumlah_pengajuan: 15000000, jumlah_pinjaman: 15000000, tenor_bulan: 18, tipe_bunga: 'PERSENAN', nilai_bunga: 11, status: 'DISETUJUI', approved_at: '2024-03-05T10:00:00Z' },
            { personal_data_id: insertedMembers[4].id, no_pinjaman: 'LP-24005', jumlah_pengajuan: 2500000, jumlah_pinjaman: 2500000, tenor_bulan: 5, tipe_bunga: 'NOMINAL', nilai_bunga: 150000, status: 'DICAIRKAN', disbursed_at: '2024-03-10T10:00:00Z', delivery_status: 'SENT', delivery_date: '2024-03-11T10:00:00Z' },
        ];

        const { data: insertedLoans, error: loanError } = await supabase
            .from('pinjaman')
            .upsert(mockLoans, { onConflict: 'no_pinjaman' })
            .select();
        
        if (loanError) throw loanError;

        // 6. Installments (For Realized Loans)
        console.log("📅 Inserting Installments...");
        const installmentsToInsert = [];

        insertedLoans.forEach(loan => {
            if (loan.status === 'DICAIRKAN') {
                const principalPerMonth = loan.jumlah_pinjaman / loan.tenor_bulan;
                let bungaPerMonth = 0;
                if (loan.tipe_bunga === 'PERSENAN') {
                    bungaPerMonth = (loan.jumlah_pinjaman * (loan.nilai_bunga / 100)) / 12;
                } else {
                    bungaPerMonth = loan.nilai_bunga / loan.tenor_bulan;
                }

                const startDate = new Date(loan.disbursed_at);
                for (let i = 1; i <= loan.tenor_bulan; i++) {
                    const dueDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 15);
                    const isPaid = dueDate < new Date(); 

                    installmentsToInsert.push({
                        pinjaman_id: loan.id,
                        personal_data_id: loan.personal_data_id,
                        angsuran_ke: i,
                        tanggal_jatuh_tempo: dueDate.toISOString(),
                        jumlah_pokok: Math.round(principalPerMonth),
                        jumlah_bunga: Math.round(bungaPerMonth),
                        jumlah_bayar: Math.round(principalPerMonth + bungaPerMonth),
                        status: isPaid ? 'PAID' : 'UNPAID',
                        metode_bayar: isPaid ? 'POTONG_GAJI' : null
                    });
                }
            }
        });

        await supabase.from('angsuran').insert(installmentsToInsert);

        console.log("✅ Seeding Completed Successfully!");
        return { success: true, message: "Comprehensive sync seeder ran successfully" };
    } catch (err) {
        console.error("❌ Seeding Failed:", err);
        return { success: false, error: err.message };
    }
};
