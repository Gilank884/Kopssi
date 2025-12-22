import React, { useRef, useLayoutEffect } from 'react';
import { Upload } from 'lucide-react';

const SignatureStep = ({ formData, handleChange, canvasRef, onSignatureChange }) => {
    const isDrawing = useRef(false);
    const lastPositionRef = useRef({ x: 0, y: 0 });

    useLayoutEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            // Set canvas size
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = 180;
            
            // Set default styles
            ctx.strokeStyle = '#059669';
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
        }
    }, [canvasRef]);

    const getCanvasPosition = (event) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        
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

        ctx.strokeStyle = '#059669';
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

        // Simpan tanda tangan sebagai data URL
        const dataUrl = canvas.toDataURL('image/png');
        if (onSignatureChange) {
            onSignatureChange(dataUrl);
        }
    };

    const clearSignature = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (onSignatureChange) {
            onSignatureChange(null);
        }
    };

    return (
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
                    accept="image/png,image/jpeg,image/jpg"
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
                />
                Saya menyatakan bahwa data yang saya isi benar dan dapat dipertanggungjawabkan *
            </label>
        </div>
    );
};

export default SignatureStep;

