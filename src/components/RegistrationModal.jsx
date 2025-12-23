import React, { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import {
    User,
    MapPin,
    FileText,
    ChevronRight,
    ChevronLeft,
    Check,
    X,
    Loader2,
    Info
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import BioStep from './RegistrationSteps/BioStep';
import AddressStep from './RegistrationSteps/AddressStep';
import DocumentsStep from './RegistrationSteps/DocumentsStep';
import SignatureStep from './RegistrationSteps/SignatureStep';

const RegistrationModal = ({ isOpen, onClose, onSubmit }) => {
    const modalRef = useRef(null);
    const contentRef = useRef(null);
    const canvasRef = useRef(null);
    const [currentStep, setCurrentStep] = useState(1);

    // Form state
    const [formData, setFormData] = useState({
        fullName: '',
        nik: '',
        phone: '',
        nip: '',
        email: '',
        password: '',
        confirmPassword: '',

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

    const [passwordError, setPasswordError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState(false);


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
            setFormData((prev) => {
                const updated = { ...prev, [name]: value };

                // Validasi password saat mengetik
                if (name === 'password' || name === 'confirmPassword') {
                    if (name === 'password') {
                        if (updated.confirmPassword && updated.confirmPassword !== value) {
                            setPasswordError('Password tidak sama');
                        } else if (updated.confirmPassword && updated.confirmPassword === value) {
                            setPasswordError('');
                        }
                    } else if (name === 'confirmPassword') {
                        if (updated.password && updated.password !== value) {
                            setPasswordError('Password tidak sama');
                        } else if (updated.password && updated.password === value) {
                            setPasswordError('');
                        }
                    }
                }

                return updated;
            });
        }
    };

    const handleSignatureChange = (signatureDataUrl) => {
        setFormData((prev) => ({ ...prev, signature: signatureDataUrl }));
    };

    const nextStep = () => {
        if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    // Fungsi untuk upload file ke Supabase Storage
    const uploadFile = async (file, folder, fileName) => {
        if (!file) return null;

        const fileExt = file.name.split('.').pop();
        const filePath = `${folder}/${fileName}_${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from('documents')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            throw new Error(`Gagal upload ${folder}: ${error.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);

        return urlData.publicUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');
        setSubmitSuccess(false);

        // Validasi password sebelum submit
        if (formData.password !== formData.confirmPassword) {
            setPasswordError('Password tidak sama');
            return;
        }

        if (formData.password.length < 6) {
            setPasswordError('Password minimal 6 karakter');
            return;
        }

        // Validasi KTP file
        if (!formData.ktpFile) {
            setSubmitError('File KTP wajib diupload');
            setCurrentStep(3); // Kembali ke step 3
            return;
        }

        // Validasi foto 3x4
        if (!formData.photo34File) {
            setSubmitError('Foto 3x4 wajib diupload');
            setCurrentStep(4); // Kembali ke step 4
            return;
        }

        // Validasi tanda tangan
        if (!formData.signature) {
            setSubmitError('Tanda tangan digital wajib diisi');
            setCurrentStep(4); // Kembali ke step 4
            return;
        }

        // Validasi persetujuan
        if (!formData.agreement) {
            setSubmitError('Anda harus menyetujui pernyataan');
            setCurrentStep(4); // Kembali ke step 4
            return;
        }

        setPasswordError('');
        setIsSubmitting(true);

        try {
            // 1. Upload files ke Supabase Storage
            let ktpFilePath = null;
            let idCardFilePath = null;
            let photo34FilePath = null;

            if (formData.ktpFile) {
                ktpFilePath = await uploadFile(formData.ktpFile, 'ktp', formData.nik);
            }

            if (formData.idCardFile) {
                idCardFilePath = await uploadFile(formData.idCardFile, 'id-card', formData.nik);
            }

            if (formData.photo34File) {
                photo34FilePath = await uploadFile(formData.photo34File, 'photo-34', formData.nik);
            }

            // 2. Insert ke tabel users
            const { data: userData, error: userError } = await supabase
                .from('users')
                .insert({
                    phone: formData.phone,
                    password: formData.password, // Note: Sebaiknya di-hash dulu di production
                    role: 'MEMBER'
                })
                .select()
                .single();

            if (userError) {
                throw new Error(`Gagal membuat akun: ${userError.message}`);
            }

            const userId = userData.id;

            // 3. Siapkan data untuk personal_data
            const companyValue = formData.company === 'Lainnya'
                ? formData.otherCompany
                : formData.company;

            const workUnitValue = formData.workUnit === 'Lainnya'
                ? formData.otherWorkUnit
                : formData.workUnit;

            // 4. Insert ke tabel personal_data
            const { error: personalDataError } = await supabase
                .from('personal_data')
                .insert({
                    full_name: formData.fullName,
                    nik: formData.nik,
                    phone: formData.phone,
                    company: companyValue || null,
                    work_unit: workUnitValue || null,
                    employment_status: formData.employmentStatus || null,
                    address: formData.address,
                    postal_code: formData.postalCode,
                    emergency_phone: formData.emergencyPhone,
                    ktp_file_path: ktpFilePath,
                    id_card_file_path: idCardFilePath,
                    photo_34_file_path: photo34FilePath,
                    signature_image: formData.signature, // Base64 string
                    status: 'pending',
                    user_id: userId
                });

            if (personalDataError) {
                // Jika personal_data gagal, hapus user yang sudah dibuat
                await supabase.from('users').delete().eq('id', userId);
                throw new Error(`Gagal menyimpan data personal: ${personalDataError.message}`);
            }

            // 5. Success
            setSubmitSuccess(true);
            console.log('Registration successful:', { userId, userData });

            // Callback jika ada
            if (onSubmit) {
                onSubmit({
                    ...formData,
                    userId,
                    ktpFilePath,
                    idCardFilePath,
                    photo34FilePath
                });
            }

            // Reset form dan close modal setelah 2 detik
            setTimeout(() => {
                setFormData({
                    fullName: '',
                    nik: '',
                    phone: '',
                    nip: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
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
                setCurrentStep(1);
                setPasswordError('');
                setSubmitSuccess(false);
        onClose();
            }, 2000);

        } catch (error) {
            console.error('Registration error:', error);
            setSubmitError(error.message || 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
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
                        {currentStep === 1 && (
                            <BioStep
                                formData={formData}
                                handleChange={handleChange}
                                passwordError={passwordError}
                            />
                        )}

                        {currentStep === 2 && (
                            <AddressStep
                                formData={formData}
                                handleChange={handleChange}
                            />
                        )}

                        {currentStep === 3 && (
                            <DocumentsStep
                                formData={formData}
                                handleChange={handleChange}
                            />
                        )}

                        {currentStep === 4 && (
                            <SignatureStep
                                formData={formData}
                                handleChange={handleChange}
                                canvasRef={canvasRef}
                                onSignatureChange={handleSignatureChange}
                            />
                        )}

                    </form>
                </div>

                {/* Error/Success Messages */}
                {(submitError || submitSuccess) && (
                    <div className="px-6 md:px-8 pb-4">
                        {submitError && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                                <Info className="text-red-600 shrink-0 mt-0.5" size={20} />
                                <p className="text-sm text-red-800 font-medium">{submitError}</p>
                            </div>
                        )}
                        {submitSuccess && (
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                                <Check className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="text-sm text-emerald-800 font-bold">Pendaftaran Berhasil!</p>
                                    <p className="text-xs text-emerald-700 mt-1">Data Anda sedang diproses. Modal akan tertutup otomatis...</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Controls */}
                <div className="p-6 md:p-8 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={currentStep === 1 ? onClose : prevStep}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={20} />
                        {currentStep === 1 ? 'Batalkan' : 'Kembali'}
                    </button>

                    {currentStep < totalSteps ? (
                        <button
                            type="button"
                            onClick={nextStep}
                            disabled={isSubmitting}
                            className="bg-emerald-600 text-white flex items-center gap-2 px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95 translate-z-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Lanjutkan
                            <ChevronRight size={20} />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            form="registration-form"
                            disabled={isSubmitting}
                            className="bg-emerald-600 text-white flex items-center gap-2 px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95 translate-z-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Mengirim...
                                </>
                            ) : (
                                <>
                            Kirim Pendaftaran
                            <Check size={20} />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RegistrationModal;
