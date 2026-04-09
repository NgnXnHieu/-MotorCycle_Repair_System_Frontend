import React, { useState, useRef, useEffect } from 'react';
import { X, Hash, ShieldCheck, Wrench, Calendar, ImagePlus, Trash2, AlertTriangle, Loader2, AlertCircle } from 'lucide-react';

export default function AddVehicleModal({ isOpen, onClose, onSave, isSubmitting }) {
    const [vehicleData, setVehicleData] = useState({
        licensePlate: '',
        brand: '',
        model: '',
        manufacture_year: ''
    });

    // 1. STATE QUẢN LÝ LỖI CHO TỪNG Ô INPUT
    const [errors, setErrors] = useState({});

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isConfirming, setIsConfirming] = useState(false);

    const fileInputRef = useRef(null);

    // Dọn dẹp form khi đóng
    useEffect(() => {
        if (!isOpen) {
            setVehicleData({ licensePlate: '', brand: '', model: '', manufacture_year: '' });
            setErrors({}); // Reset lỗi
            setImageFile(null);
            setImagePreview(null);
            setIsConfirming(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [isOpen]);

    // Hàm xử lý nhập và xóa lỗi khi người dùng bắt đầu gõ
    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setVehicleData(prev => ({ ...prev, [id]: value }));

        // Nếu đang có lỗi ở ô này, thì xóa lỗi đi khi người dùng gõ
        if (errors[id]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[id];
                return newErrors;
            });
        }
    };

    // 2. HÀM KIỂM TRA VALIDATION
    const validateForm = () => {
        let newErrors = {};
        if (!vehicleData.licensePlate.trim()) newErrors.licensePlate = "Biển số xe không được để trống";
        if (!vehicleData.brand.trim()) newErrors.brand = "Hãng xe không được để trống";
        if (!vehicleData.model.trim()) newErrors.model = "Model xe không được để trống";
        if (!vehicleData.manufacture_year) newErrors.manufacture_year = "Năm sản xuất không được để trống";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0; // Trả về true nếu không có lỗi
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = (e) => {
        e.stopPropagation();
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSave = () => {
        if (!isConfirming) {
            // Chạy validate trước khi cho phép hiện nút xác nhận
            if (!validateForm()) return;

            setIsConfirming(true);
            return;
        }

        onSave(vehicleData, imageFile);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-100 relative flex flex-col max-h-[90vh]">
                {/* 3. max-h-[90vh] để Modal không bao giờ cao quá màn hình */}

                {/* Header cố định */}
                <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-white rounded-t-2xl">
                    <h1 className="text-2xl font-extrabold text-gray-900">Thêm xe mới</h1>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                        <X size={20} />
                    </button>
                </div>

                {/* THÂN MODAL CÓ THANH CUỘN */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-grow space-y-6">
                    {/* Block màn hình khi loading */}
                    {isSubmitting && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center">
                            <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-2" />
                            <span className="text-emerald-700 font-semibold">Đang xử lý...</span>
                        </div>
                    )}

                    {/* KHU VỰC TẢI ẢNH */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2 ml-1">Hình ảnh xe (Tùy chọn)</label>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                        {imagePreview ? (
                            <div className="relative w-full h-44 rounded-xl overflow-hidden border border-gray-200 group">
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button onClick={handleRemoveImage} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div onClick={() => fileInputRef.current.click()} className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-colors text-gray-400 group">
                                <ImagePlus size={32} className="mb-1 group-hover:text-blue-500" />
                                <span className="text-sm font-medium">Nhấn để chọn ảnh xe</span>
                            </div>
                        )}
                    </div>

                    {/* KHU VỰC INPUT VỚI CẢNH BÁO LỖI */}
                    <div className="space-y-4">
                        {[
                            { icon: Hash, label: 'Biển số xe', id: 'licensePlate', placeholder: 'VD: 29A1-123.45' },
                            { icon: ShieldCheck, label: 'Hãng xe', id: 'brand', placeholder: 'VD: Honda' },
                            { icon: Wrench, label: 'Model', id: 'model', placeholder: 'VD: SH 150i ABS' },
                            { icon: Calendar, label: 'Năm sản xuất', id: 'manufacture_year', placeholder: 'VD: 2023', type: 'number' },
                        ].map((input) => (
                            <div key={input.id}>
                                <label htmlFor={input.id} className="block text-sm font-semibold text-gray-800 mb-1 ml-1">{input.label} <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${errors[input.id] ? 'text-red-400' : 'text-gray-400'}`}>
                                        <input.icon size={18} />
                                    </div>
                                    <input
                                        type={input.type || 'text'} id={input.id} value={vehicleData[input.id]} onChange={handleInputChange} placeholder={input.placeholder}
                                        className={`w-full pl-10 pr-3 py-2.5 border rounded-lg outline-none text-sm transition-all
                                            ${errors[input.id]
                                                ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-100'
                                                : 'border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50'
                                            }
                                            disabled:bg-gray-100`}
                                        disabled={isConfirming || isSubmitting}
                                    />
                                </div>
                                {/* DÒNG BÁO LỖI DƯỚI INPUT */}
                                {errors[input.id] && (
                                    <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5 ml-1 animate-fade-in">
                                        <AlertCircle size={12} />
                                        {errors[input.id]}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer cố định chứa nút bấm */}
                <div className="p-6 border-t border-gray-50 bg-gray-50/50 rounded-b-2xl">
                    {isConfirming ? (
                        <div className="space-y-3 animate-fade-in-up">
                            <div className="flex items-center justify-center gap-2 text-amber-700 bg-amber-100 py-2.5 rounded-lg border border-amber-200">
                                <AlertTriangle size={18} />
                                <span className="text-sm font-bold">Xác nhận thông tin chính xác?</span>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={handleSave} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg shadow-md transition-all">Xác nhận</button>
                                <button onClick={() => setIsConfirming(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-2.5 rounded-lg hover:bg-gray-50">Quay lại</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-md transition-all">Lưu xe mới</button>
                            <button onClick={onClose} className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-2.5 rounded-lg hover:bg-gray-50">Hủy</button>
                        </div>
                    )}
                </div>
            </div>

            {/* CSS inline cho thanh cuộn đẹp hơn */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
                .animate-fade-in { animation: fadeIn 0.2s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
            `}} />
        </div>
    );
}