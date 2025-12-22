import React, { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import {
    User,
    MapPin,
    FileText,
    Wallet,
    ChevronRight,
    ChevronLeft,
    Check,
    Upload,
    X,
    Info
} from 'lucide-react';

const RegistrationModal = ({ isOpen, onClose, onSubmit }) => {
    const modalRef = useRef(null);
    const contentRef = useRef(null);
    const [currentStep, setCurrentStep] = useState(1);

    // Form state
    const [formData, setFormData] = useState({
        fullName: '',
        nik: '',
        phone: '',
        nip: '',
        address: '',
        postalCode: '',
        emergencyPhone: '',
        mandatoryDeposit: '',
        principalDeposit: '',
        ktpFile: null,
        idCardFile: null,
        transferProofFile: null,
    });

    const totalSteps = 4;

    useLayoutEffect(() => {
        if (isOpen) {
            gsap.to(modalRef.current, { duration: 0.2, pointerEvents: 'auto', opacity: 1 });
            gsap.fromTo(
                contentRef.current,
                { scale: 0.9, opacity: 0, y: 30 },
                { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
            );
        } else {
            gsap.to(contentRef.current, {
                scale: 0.9,
                opacity: 0,
                y: 20,
                duration: 0.3,
                onComplete: () => {
                    gsap.to(modalRef.current, { opacity: 0, duration: 0.2, pointerEvents: 'none' });
                    setCurrentStep(1); // Reset step on close
                },
            });
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (files) {
            setFormData((prev) => ({ ...prev, [name]: files[0] }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const nextStep = () => {
        if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Registration data:', formData);
        if (onSubmit) onSubmit(formData);
        onClose();
    };

    const steps = [
        { id: 1, title: 'Bio', icon: <User size={18} /> },
        { id: 2, title: 'Alamat', icon: <MapPin size={18} /> },
        { id: 3, title: 'Berkas', icon: <FileText size={18} /> },
        { id: 4, title: 'Bayar', icon: <Wallet size={18} /> },
    ];

    if (!isOpen) return null;

    return (
        <div
            ref={modalRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
            <div
                ref={contentRef}
                className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="bg-emerald-600 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-emerald-100 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <h2 className="text-xl md:text-2xl font-bold">Pendaftaran Anggota Baru</h2>
                    <p className="text-emerald-100 text-xs md:text-sm mt-1">Lengkapi data untuk bergabung dengan Koperasi Syariah Pembangunan</p>
                </div>

                {/* Progress Bar */}
                <div className="px-8 py-6 bg-gray-50 border-b border-gray-100">
                    <div className="flex justify-between items-center relative">
                        <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0"></div>
                        <div
                            className="absolute top-5 left-0 h-0.5 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
                            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                        ></div>

                        {steps.map((step) => (
                            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${currentStep >= step.id
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                                        : 'bg-white text-gray-400 border-2 border-gray-200'
                                    }`}>
                                    {currentStep > step.id ? <Check size={18} strokeWidth={3} /> : step.icon}
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${currentStep >= step.id ? 'text-emerald-700' : 'text-gray-400'
                                    }`}>
                                    {step.title}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Content Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <form onSubmit={handleSubmit} id="registration-form" className="space-y-6">

                        {/* Step 1: Data Pribadi */}
                        {currentStep === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex gap-3 mb-6">
                                    <Info className="text-emerald-600 shrink-0" size={20} />
                                    <p className="text-xs text-emerald-800 leading-relaxed">
                                        Pastikan data yang diinput sesuai dengan identitas resmi (KTP/Passport) untuk mempermudah proses validasi.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Lengkap (Sesuai KTP) *</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="Contoh: Ahmad Subagja"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">NIK (16 Digit) *</label>
                                        <input
                                            type="text"
                                            name="nik"
                                            value={formData.nik}
                                            onChange={handleChange}
                                            placeholder="3201xxxxxxxxxxxx"
                                            maxLength={16}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nomor Handphone *</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="08xxxxxxxxxx"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nomor Induk Pegawai (NIP)</label>
                                    <input
                                        type="text"
                                        name="nip"
                                        value={formData.nip}
                                        onChange={handleChange}
                                        placeholder="Masukkan NIP (Opsional)"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 2: Lokasi */}
                        {currentStep === 2 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alamat Lengkap Sesuai KTP *</label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Jl. Hanglekir Raya No. 30, Kel. Gunung..."
                                        rows={4}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kode Pos *</label>
                                        <input
                                            type="text"
                                            name="postalCode"
                                            value={formData.postalCode}
                                            onChange={handleChange}
                                            placeholder="12120"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">No. Telp Darurat *</label>
                                        <input
                                            type="tel"
                                            name="emergencyPhone"
                                            value={formData.emergencyPhone}
                                            onChange={handleChange}
                                            placeholder="08xxxxxxxxxx"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Berkas */}
                        {currentStep === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="grid gap-6">
                                    {/* Upload KTP */}
                                    <div className="group relative">
                                        <input type="file" name="ktpFile" id="ktp-upload" onChange={handleChange} className="hidden" required />
                                        <label htmlFor="ktp-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer transition-all">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className={`w-8 h-8 mb-3 ${formData.ktpFile ? 'text-emerald-600' : 'text-gray-400'}`} />
                                                <p className="mb-2 text-sm text-gray-600 font-semibold">
                                                    {formData.ktpFile ? formData.ktpFile.name : 'Klik untuk Upload KTP *'}
                                                </p>
                                                <p className="text-xs text-gray-400 font-medium">PNG, JPG up to 2MB</p>
                                            </div>
                                        </label>
                                    </div>

                                    {/* Upload ID Card */}
                                    <div className="group relative">
                                        <input type="file" name="idCardFile" id="id-upload" onChange={handleChange} className="hidden" />
                                        <label htmlFor="id-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer transition-all">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className={`w-8 h-8 mb-3 ${formData.idCardFile ? 'text-emerald-600' : 'text-gray-400'}`} />
                                                <p className="mb-2 text-sm text-gray-600 font-semibold">
                                                    {formData.idCardFile ? formData.idCardFile.name : 'Upload ID Card Pegawai'}
                                                </p>
                                                <p className="text-xs text-gray-400 font-medium">Optional (PNG, JPG)</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Finansial */}
                        {currentStep === 4 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Simpanan Pokok (Rp) *</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
                                            <input
                                                type="number"
                                                name="principalDeposit"
                                                value={formData.principalDeposit}
                                                onChange={handleChange}
                                                placeholder="0"
                                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-semibold"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Simpanan Wajib (Rp) *</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
                                            <input
                                                type="number"
                                                name="mandatoryDeposit"
                                                value={formData.mandatoryDeposit}
                                                onChange={handleChange}
                                                placeholder="0"
                                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-semibold"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-emerald-50 rounded-2xl border-2 border-dashed border-emerald-200">
                                    <div className="flex flex-col md:flex-row items-center gap-6">
                                        <div className="flex-1 text-center md:text-left">
                                            <h4 className="text-sm font-bold text-emerald-900 mb-1">Bukti Transfer Pembayaran *</h4>
                                            <p className="text-xs text-emerald-600 font-medium">BSI: 7788990011 a.n KOPSSI SARANA</p>
                                        </div>
                                        <div>
                                            <input type="file" name="transferProofFile" id="transfer-upload" onChange={handleChange} className="hidden" required />
                                            <label htmlFor="transfer-upload" className="px-6 py-2.5 bg-white border-2 border-emerald-500 text-emerald-600 text-sm font-bold rounded-xl hover:bg-emerald-50 cursor-pointer shadow-sm transition-all whitespace-nowrap block">
                                                {formData.transferProofFile ? 'Bukti Terpilih' : 'Upload Bukti'}
                                            </label>
                                        </div>
                                    </div>
                                    {formData.transferProofFile && (
                                        <p className="mt-3 text-[10px] text-emerald-700 font-bold bg-white/50 py-1 px-3 rounded-full text-center truncate">
                                            {formData.transferProofFile.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer Controls */}
                <div className="p-6 md:p-8 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={currentStep === 1 ? onClose : prevStep}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 transition-all"
                    >
                        <ChevronLeft size={20} />
                        {currentStep === 1 ? 'Batalkan' : 'Kembali'}
                    </button>

                    {currentStep < totalSteps ? (
                        <button
                            type="button"
                            onClick={nextStep}
                            className="bg-emerald-600 text-white flex items-center gap-2 px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95 translate-z-0"
                        >
                            Lanjutkan
                            <ChevronRight size={20} />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            form="registration-form"
                            className="bg-emerald-600 text-white flex items-center gap-2 px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95 translate-z-0"
                        >
                            Kirim Pendaftaran
                            <Check size={20} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RegistrationModal;
