import React, { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import {
    User,
    MapPin,
    FileText,
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
    const canvasRef = useRef(null);
    const isDrawing = useRef(false);
    const lastPositionRef = useRef({ x: 0, y: 0 });
    const [currentStep, setCurrentStep] = useState(1);

    // Form state
    const [formData, setFormData] = useState({
        fullName: '',
        nik: '',
        phone: '',
        nip: '',

        company: '',
        otherCompany: '',
        workUnit: '',
        otherWorkUnit: '',
        employmentStatus: '',

        address: '',
        postalCode: '',
        emergencyPhone: '',

        ktpFile: null,
        idCardFile: null,

        signature: null,
        photo34File: null,
        agreement: false,
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
        const { name, value, files, type, checked } = e.target;

        if (type === 'checkbox') {
            setFormData((prev) => ({ ...prev, [name]: checked }));
            return;
        }

        if (type === 'radio') {
            setFormData((prev) => ({ ...prev, [name]: value }));
            return;
        }

        if (files) {
            setFormData((prev) => ({ ...prev, [name]: files[0] }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const getCanvasPosition = (event) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        if (event.touches && event.touches[0]) {
            return {
                x: event.touches[0].clientX - rect.left,
                y: event.touches[0].clientY - rect.top,
            };
        }

        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    };

    const startDraw = (event) => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        const pos = getCanvasPosition(event);

        isDrawing.current = true;
        lastPositionRef.current = pos;

        ctx.strokeStyle = '#059669'; // emerald-600
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        event.preventDefault();
    };

    const draw = (event) => {
        if (!isDrawing.current || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        const pos = getCanvasPosition(event);

        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastPositionRef.current = pos;
        event.preventDefault();
    };

    const endDraw = (event) => {
        if (!isDrawing.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        ctx.closePath();
        isDrawing.current = false;
        event && event.preventDefault();

        // Simpan tanda tangan sebagai data URL di state
        const dataUrl = canvas.toDataURL('image/png');
        setFormData((prev) => ({ ...prev, signature: dataUrl }));
    };

    const clearSignature = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setFormData((prev) => ({ ...prev, signature: null }));
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
        { id: 4, title: 'Tanda Tangan', icon: <FileText size={18} /> },
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

                                {/* Bio Perusahaan */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Perusahaan *</label>
                                        <select
                                            name="company"
                                            value={formData.company}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                            required
                                        >
                                            <option value="">Pilih Perusahaan</option>
                                            <option value="PT Swadharma Sarana Informatika">PT Swadharma Sarana Informatika</option>
                                            <option value="Lainnya">Lainnya</option>
                                        </select>
                                        {formData.company === 'Lainnya' && (
                                            <input
                                                type="text"
                                                name="otherCompany"
                                                value={formData.otherCompany}
                                                onChange={handleChange}
                                                placeholder="Tuliskan nama perusahaan"
                                                className="mt-2 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                                required
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Unit Kerja *</label>
                                        <select
                                            name="workUnit"
                                            value={formData.workUnit}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                            required
                                        >
                                            <option value="">Pilih Unit Kerja</option>
                                            <option value="Centra">Centra</option>
                                            <option value="Lainnya">Lainnya</option>
                                        </select>
                                        {formData.workUnit === 'Lainnya' && (
                                            <input
                                                type="text"
                                                name="otherWorkUnit"
                                                value={formData.otherWorkUnit}
                                                onChange={handleChange}
                                                placeholder="Tuliskan unit kerja"
                                                className="mt-2 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                                required
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Status Pegawai */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status Pegawai *</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer text-sm font-medium transition-all ${formData.employmentStatus === 'Pegawai Tetap'
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                            : 'border-gray-200 bg-gray-50 text-gray-700'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="employmentStatus"
                                                value="Pegawai Tetap"
                                                checked={formData.employmentStatus === 'Pegawai Tetap'}
                                                onChange={handleChange}
                                                className="text-emerald-600 focus:ring-emerald-500"
                                                required
                                            />
                                            <span>Pegawai Tetap</span>
                                        </label>
                                        <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer text-sm font-medium transition-all ${formData.employmentStatus === 'Pegawai Kontrak'
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                            : 'border-gray-200 bg-gray-50 text-gray-700'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="employmentStatus"
                                                value="Pegawai Kontrak"
                                                checked={formData.employmentStatus === 'Pegawai Kontrak'}
                                                onChange={handleChange}
                                                className="text-emerald-600 focus:ring-emerald-500"
                                                required
                                            />
                                            <span>Pegawai Kontrak</span>
                                        </label>
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
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Pegawai</label>
                                    <input
                                        type="text"
                                        name="nip"
                                        value={formData.nip}
                                        onChange={handleChange}
                                        placeholder="Contoh: Pegawai@gmail.com"
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

                        {/* Step 4: Tanda Tangan */}
                        {currentStep === 4 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

                                {/* Tanda Tangan */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Tanda Tangan Digital *
                                    </label>

                                    <div className="border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 p-3">
                                        <canvas
                                            ref={canvasRef}
                                            width={500}
                                            height={180}
                                            className="w-full bg-white rounded-xl"
                                            onMouseDown={startDraw}
                                            onMouseMove={draw}
                                            onMouseUp={endDraw}
                                            onMouseLeave={endDraw}
                                            onTouchStart={startDraw}
                                            onTouchMove={draw}
                                            onTouchEnd={endDraw}
                                        />

                                        <button
                                            type="button"
                                            onClick={clearSignature}
                                            className="mt-3 text-sm font-bold text-red-600 hover:underline"
                                        >
                                            Hapus Tanda Tangan
                                        </button>
                                    </div>
                                </div>

                                {/* Upload Foto 3x4 */}
                                <div>
                                    <input
                                        type="file"
                                        name="photo34File"
                                        id="photo34-upload"
                                        onChange={handleChange}
                                        className="hidden"
                                        required
                                    />
                                    <label
                                        htmlFor="photo34-upload"
                                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer transition-all"
                                    >
                                        <Upload className="w-8 h-8 mb-3 text-gray-400" />
                                        <p className="text-sm font-semibold text-gray-600">
                                            {formData.photo34File ? formData.photo34File.name : 'Upload Foto 3x4 *'}
                                        </p>
                                        <p className="text-xs text-gray-400">PNG / JPG</p>
                                    </label>
                                </div>

                                {/* Persetujuan */}
                                <label className="flex items-start gap-3 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        name="agreement"
                                        checked={formData.agreement}
                                        onChange={handleChange}
                                        required
                                    />
                                    Saya menyatakan bahwa data yang saya isi benar dan dapat dipertanggungjawabkan
                                </label>
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
