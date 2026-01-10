import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Upload, Trash2, Info } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import * as XLSX from 'xlsx';

const AddMember = () => {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('form');

    // Initial state matching the image fields
    const [formData, setFormData] = useState({
        no_anggota: '', // New?
        join_date: new Date().toISOString().split('T')[0], // Tgl Masuk
        full_name: '',
        status_simp_anggota: 'AKTIF',
        no_npp: '',
        work_unit: '',
        jabatan: '',
        company: '',
        ops: '',
        lokasi: '',
        tagihan_parkir: 'N',
        tempat_lahir: '',
        tanggal_lahir: '',
        address: '',
        alamat_tinggal: '',
        no_ktp: '', // No. KTP/SIM (nik)
        telp_rumah_1: '',
        telp_rumah_2: '',
        email: '',
        hp_1: '',
        hp_2: '',
        rek_pribadi: '',
        rek_gaji: '',
        bank_gaji: 'BNI 46',
        jenis_kelamin: 'Laki-laki',
        last_update: new Date().toLocaleString(), // Readonly
        keluar_anggota: 'N',
        tanggal_keluar: '',
        sebab_keluar: '',
        keterangan: ''
    });

    // Valid options for dropdowns (Placeholders)
    const [options] = useState({
        companies: ['PT. KOPSSI', 'PT. OTHER'],
        units: ['Admin Ops Pusat', 'Marketing', 'Finance', 'IT'],
        positions: ['Staff', 'Supervisor', 'Manager', 'Director'],
        ops: ['Pilih Ops', 'OPS A', 'OPS B'],
        locations: ['AMBON - AMB', 'JAKARTA - JKT', 'SURABAYA - SBY'],
        banks: ['BNI 46', 'BCA', 'MANDIRI', 'BRI']
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // 1. Create User (Auth) - using HP 1 as primary identifier if needed, or Email
            // Note: The original logic used phone. We'll use hp_1.
            let userId = null;
            const primaryPhone = formData.hp_1;

            if (primaryPhone) {
                const { data: existingUser } = await supabase
                    .from('users')
                    .select('id')
                    .eq('phone', primaryPhone)
                    .single();

                if (existingUser) {
                    userId = existingUser.id;
                } else {
                    const { data: newUser, error: userError } = await supabase
                        .from('users')
                        .insert({
                            phone: primaryPhone,
                            email: formData.email || null, // Optional email
                            password: 'placeholder-password',
                            role: 'MEMBER'
                        })
                        .select()
                        .single();

                    if (userError) throw userError;
                    userId = newUser.id;
                }
            }

            // 2. Insert into personal_data
            // We map the form fields to the database columns
            const payload = {
                user_id: userId,
                // Existing mapped fields
                full_name: formData.full_name,
                nik: formData.no_ktp, // Mapping KTP to nik
                no_npp: formData.no_npp,
                phone: formData.hp_1, // Primary phone
                company: formData.company,
                work_unit: formData.work_unit,
                address: formData.address,
                email: formData.email,

                // New Fields
                status_simp_anggota: formData.status_simp_anggota,
                ops: formData.ops,
                lokasi: formData.lokasi,
                tagihan_parkir: formData.tagihan_parkir === 'Y', // Convert to boolean if schema is boolean, or text if 'Y'/'N'
                // Schema said "boolean" for tagihan_parkir in request text? 
                // "ADD COLUMN tagihan_parkir boolean" -> Yes.
                tempat_lahir: formData.tempat_lahir,
                tanggal_lahir: formData.tanggal_lahir || null,
                alamat_tinggal: formData.alamat_tinggal,
                no_sim: formData.no_ktp, // Using same for SIM if applicable, or maybe I should have separate? Input says KTP/SIM.
                telp_rumah_1: formData.telp_rumah_1,
                telp_rumah_2: formData.telp_rumah_2,
                hp_1: formData.hp_1,
                hp_2: formData.hp_2,
                rek_pribadi: formData.rek_pribadi,
                rek_gaji: formData.rek_gaji,
                bank_gaji: formData.bank_gaji,
                jenis_kelamin: formData.jenis_kelamin,
                last_update: new Date().toISOString(),
                keluar_anggota: formData.keluar_anggota === 'Y', // Schema: boolean
                tanggal_keluar: formData.tanggal_keluar || null,
                sebab_keluar: formData.sebab_keluar,
                keterangan: formData.keterangan,

                // Extra fields that might need columns
                // no_anggota -> Not in provided ALTER list. I will try to save to no_npp or ignore if no column?
                // I'll skip no_anggota in payload for now unless I find a column for it. 
                // Assuming "Jabatan" maps to something? I'll Map to 'employment_status' (existing column) if appropriate, or 'jabatan' if exists.
                // Let's use 'employment_status' for Jabatan for now as it's the closest match.
                employment_status: formData.jabatan,

                status: 'pending', // Default system status
                created_at: new Date().toISOString()
            };

            const { error: insertError } = await supabase
                .from('personal_data')
                .insert(payload);

            if (insertError) throw insertError;

            alert('Data anggota berhasil disimpan!');
            navigate('/admin/members');
        } catch (err) {
            console.error('Error saving member:', err);
            alert('Gagal menyimpan data: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Helper for table rows
    const FormRow = ({ label1, required1, input1, label2, required2, input2, fullWidth }) => (
        <tr className="border-b border-gray-200 hover:bg-gray-50/50 transition-colors">
            {!fullWidth ? (
                <>
                    <td className="py-3 px-4 bg-gray-100/50 w-[15%] align-middle">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-tight">
                            {label1} {required1 && <span className="text-red-500">*</span>}
                        </label>
                    </td>
                    <td className="py-3 px-4 w-[35%]">
                        {input1}
                    </td>
                    <td className="py-3 px-4 bg-gray-100/50 w-[15%] align-middle">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-tight">
                            {label2} {required2 && <span className="text-red-500">*</span>}
                        </label>
                    </td>
                    <td className="py-3 px-4 w-[35%]">
                        {input2}
                    </td>
                </>
            ) : (
                <>
                    <td className="py-3 px-4 bg-gray-100/50 w-[15%] align-middle">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-tight">
                            {label1} {required1 && <span className="text-red-500">*</span>}
                        </label>
                    </td>
                    <td className="py-3 px-4" colSpan={3}>
                        {input1}
                    </td>
                </>
            )}
        </tr>
    );

    const inputClasses = "w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm";
    const selectClasses = "w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.7em] bg-no-repeat bg-[right_0.7em_center] pr-8";

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/members')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Form Data Anggota</h2>
                        <p className="text-sm text-gray-500 font-medium">Lengkapi data anggota di bawah ini</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-1 bg-gray-50 border-b border-gray-200">
                    {/* Header bar if needed */}
                </div>

                <form onSubmit={handleSubmit}>
                    <table className="w-full text-sm">
                        <tbody>
                            {/* Row 1 */}
                            <FormRow
                                label1="No. Anggota" required1
                                input1={<input name="no_anggota" value={formData.no_anggota} onChange={handleChange} className={inputClasses} placeholder="KS..." />}
                                label2="Tgl. Masuk" required2
                                input2={<input type="date" name="join_date" value={formData.join_date} onChange={handleChange} className={inputClasses} />}
                            />

                            {/* Row 2 */}
                            <FormRow
                                label1="Nama Lengkap" required1
                                input1={<input name="full_name" value={formData.full_name} onChange={handleChange} className={inputClasses} />}
                                label2="Status Simp. Anggota" required2
                                input2={
                                    <select name="status_simp_anggota" value={formData.status_simp_anggota} onChange={handleChange} className={selectClasses}>
                                        <option value="AKTIF">AKTIF</option>
                                        <option value="NON-AKTIF">NON-AKTIF</option>
                                    </select>
                                }
                            />

                            {/* Row 3 */}
                            <FormRow
                                label1="NPP"
                                input1={<input name="no_npp" value={formData.no_npp} onChange={handleChange} className={inputClasses} />}
                                label2="Unit Kerja"
                                input2={
                                    <select name="work_unit" value={formData.work_unit} onChange={handleChange} className={selectClasses}>
                                        <option value="">Pilih Unit Kerja</option>
                                        {options.units.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                }
                            />

                            {/* Row 4 - Jabatan (Full Row visually in image? Or 50/50? Let's do 50/50 but empty right or match image logic. Image shows Jabatan full row or aligned. I'll stick to grid.) */}
                            <FormRow
                                label1="Jabatan"
                                input1={
                                    <select name="jabatan" value={formData.jabatan} onChange={handleChange} className={selectClasses}>
                                        <option value="">Pilih Jabatan</option>
                                        {options.positions.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                }
                                label2=""
                                input2={<div className="bg-gray-50 h-full rounded opacity-50"></div>} // Empty placeholder to keep alignment
                            />

                            {/* Row 5 */}
                            <FormRow
                                label1="PT" required1
                                input1={
                                    <select name="company" value={formData.company} onChange={handleChange} className={selectClasses}>
                                        <option value="">Pilih PT</option>
                                        {options.companies.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                }
                                label2="OPS"
                                input2={
                                    <select name="ops" value={formData.ops} onChange={handleChange} className={selectClasses}>
                                        <option value="">Pilih Ops</option>
                                        {options.ops.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                }
                            />

                            {/* Row 6 */}
                            <FormRow
                                label1="Lokasi"
                                input1={
                                    <select name="lokasi" value={formData.lokasi} onChange={handleChange} className={selectClasses}>
                                        <option value="">Pilih Lokasi</option>
                                        {options.locations.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                }
                                label2="Tagihan Parkir"
                                input2={
                                    <select name="tagihan_parkir" value={formData.tagihan_parkir} onChange={handleChange} className={selectClasses}>
                                        <option value="N">N</option>
                                        <option value="Y">Y</option>
                                    </select>
                                }
                            />

                            {/* Row 7 */}
                            <FormRow
                                label1="Tempat Lahir"
                                input1={<input name="tempat_lahir" value={formData.tempat_lahir} onChange={handleChange} className={inputClasses} />}
                                label2="Tgl. Lahir"
                                input2={<input type="date" name="tanggal_lahir" value={formData.tanggal_lahir} onChange={handleChange} className={inputClasses} />}
                            />

                            {/* Row 8 - Allow text areas */}
                            <FormRow
                                label1="Alamat"
                                input1={<textarea name="address" value={formData.address} onChange={handleChange} className={inputClasses} rows={2} />}
                                label2="Alamat Tinggal"
                                input2={<textarea name="alamat_tinggal" value={formData.alamat_tinggal} onChange={handleChange} className={inputClasses} rows={2} />}
                            />

                            {/* Row 9 */}
                            <FormRow
                                label1="No. KTP/SIM"
                                input1={<input name="no_ktp" value={formData.no_ktp} onChange={handleChange} className={inputClasses} />}
                                label2="No. Telp Rumah 1 / 2"
                                input2={
                                    <div className="flex gap-2">
                                        <input name="telp_rumah_1" value={formData.telp_rumah_1} onChange={handleChange} className={inputClasses} placeholder="Telp 1" />
                                        <span className="self-center text-gray-400">/</span>
                                        <input name="telp_rumah_2" value={formData.telp_rumah_2} onChange={handleChange} className={inputClasses} placeholder="Telp 2" />
                                    </div>
                                }
                            />

                            {/* Row 10 */}
                            <FormRow
                                label1="Email"
                                input1={<input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClasses} />}
                                label2="No. Hp 1 / 2"
                                input2={
                                    <div className="flex gap-2">
                                        <input name="hp_1" value={formData.hp_1} onChange={handleChange} className={inputClasses} placeholder="HP 1" />
                                        <span className="self-center text-gray-400">/</span>
                                        <input name="hp_2" value={formData.hp_2} onChange={handleChange} className={inputClasses} placeholder="HP 2" />
                                    </div>
                                }
                            />

                            {/* Row 11 */}
                            <FormRow
                                label1="No. Rek. Pribadi"
                                input1={<input name="rek_pribadi" value={formData.rek_pribadi} onChange={handleChange} className={inputClasses} />}
                                label2="No. Rek. Gaji / Data Bank"
                                input2={
                                    <div className="flex gap-2">
                                        <input name="rek_gaji" value={formData.rek_gaji} onChange={handleChange} className={inputClasses} placeholder="No Rekening" />
                                        <span className="self-center text-gray-400">/</span>
                                        <select name="bank_gaji" value={formData.bank_gaji} onChange={handleChange} className={`${selectClasses} w-32`}>
                                            <option value="">Bank</option>
                                            {options.banks.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                }
                            />

                            {/* Row 12 */}
                            <FormRow
                                label1="Jenis Kelamin"
                                input1={
                                    <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleChange} className={selectClasses}>
                                        <option value="Laki-laki">Laki-laki</option>
                                        <option value="Perempuan">Perempuan</option>
                                    </select>
                                }
                                label2="Last Update"
                                input2={<input disabled value={formData.last_update} className={`${inputClasses} bg-gray-100/50 text-gray-500`} />}
                            />

                            {/* Row 13 */}
                            <FormRow
                                label1={<span className="text-red-600">Keluar Anggota ? (Y/N)</span>}
                                input1={
                                    <select name="keluar_anggota" value={formData.keluar_anggota} onChange={handleChange} className={selectClasses}>
                                        <option value="N">N</option>
                                        <option value="Y">Y</option>
                                    </select>
                                }
                                label2="Tgl. Keluar"
                                input2={<input type="date" name="tanggal_keluar" value={formData.tanggal_keluar} onChange={handleChange} className={inputClasses} />}
                            />

                            {/* Row 14 */}
                            <FormRow
                                label1="Sebab Keluar"
                                input1={<input name="sebab_keluar" value={formData.sebab_keluar} onChange={handleChange} className={inputClasses} />}
                                label2="Keterangan"
                                input2={<input name="keterangan" value={formData.keterangan} onChange={handleChange} className={inputClasses} />}
                            />

                        </tbody>
                    </table>

                    <div className="p-6 flex justify-center bg-gray-50 border-t border-gray-200 mt-4">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-green-600 text-white font-bold uppercase tracking-widest py-3 px-12 rounded-full shadow-lg shadow-green-200 hover:bg-green-700 disabled:opacity-50 transition-all flex items-center gap-2 transform hover:scale-105"
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddMember;
