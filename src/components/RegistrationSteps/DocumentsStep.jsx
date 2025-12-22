import React from 'react';
import { Upload } from 'lucide-react';

const DocumentsStep = ({ formData, handleChange }) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid gap-6">
                {/* Upload KTP */}
                <div className="group relative">
                    <input 
                        type="file" 
                        name="ktpFile" 
                        id="ktp-upload" 
                        onChange={handleChange} 
                        className="hidden" 
                        accept="image/png,image/jpeg,image/jpg"
                    />
                    <label 
                        htmlFor="ktp-upload" 
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer transition-all"
                    >
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
                    <input 
                        type="file" 
                        name="idCardFile" 
                        id="id-upload" 
                        onChange={handleChange} 
                        className="hidden"
                        accept="image/png,image/jpeg,image/jpg"
                    />
                    <label 
                        htmlFor="id-upload" 
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer transition-all"
                    >
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
    );
};

export default DocumentsStep;

