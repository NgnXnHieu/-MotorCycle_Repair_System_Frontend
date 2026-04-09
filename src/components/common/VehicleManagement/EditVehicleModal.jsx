import React, { useState, useEffect, useRef } from 'react';
import { X, Hash, ShieldCheck, Wrench, Calendar, AlertTriangle, Loader2, AlertCircle, Trash2, Save, ImagePlus } from 'lucide-react';

export default function EditVehicleModal({ isOpen, onClose, onUpdate, onDelete, initialData, isSubmitting }) {
    const [vehicleData, setVehicleData] = useState({
        id: '',
        licensePlate: '',
        brand: '',
        model: '',
        manufacture_year: ''
    });

    // --- STATE CHO ẢNH ---
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    const [errors, setErrors] = useState({});
    const [confirmAction, setConfirmAction] = useState('none');

    useEffect(() => {
        if (isOpen && initialData) {
            setVehicleData({
                id: initialData.id,
                licensePlate: initialData.licensePlate || '',
                brand: initialData.brand || '',
                model: initialData.model || '',
                manufacture_year: initialData.manufacture_year || ''
            });

            // Viết như thế này để bắt được link ảnh dù key từ Backend trả về là 'image' hay bị lỗi typo là 'iamge'
            const currentImageUrl = initialData.image || initialData.iamge || null;
            setImagePreview(currentImageUrl);

            setImageFile(null);
            setErrors({});
            setConfirmAction('none');
        }
    }, [isOpen, initialData]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setVehicleData(prev => ({ ...prev, [id]: value }));

        if (errors[id]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[id];
                return newErrors;
            });
        }
    };

    // --- HÀM XỬ LÝ ẢNH ---
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

    const validateForm = () => {
        let newErrors = {};
        if (!vehicleData.brand.trim()) newErrors.brand = "Hãng xe không được để trống";
        if (!vehicleData.model.trim()) newErrors.model = "Tên xe không được để trống";
        if (!vehicleData.manufacture_year) newErrors.manufacture_year = "Năm sản xuất không được để trống";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveClick = () => {
        if (!validateForm()) return;
        setConfirmAction('edit');
    };

    const handleDeleteClick = () => {
        setConfirmAction('delete');
    };

    const executeAction = () => {
        if (confirmAction === 'edit') {
            // Truyền CẢ data text VÀ file ảnh ra ngoài
            onUpdate(vehicleData, imageFile);
        } else if (confirmAction === 'delete') {
            onDelete(vehicleData.id);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 relative flex flex-col max-h-[90vh] animate-fade-in-up">

                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-2xl">
                    <h1 className="text-2xl font-extrabold text-gray-900">Sửa thông tin xe</h1>
                    <button onClick={onClose} disabled={isSubmitting} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar flex-grow space-y-5 relative">

                    {isSubmitting && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-b-2xl">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-2" />
                            <span className="text-blue-700 font-semibold">Đang xử lý...</span>
                        </div>
                    )}

                    {/* --- KHU VỰC CẬP NHẬT ẢNH --- */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2 ml-1">Hình ảnh xe</label>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/png, image/jpeg, image/jpg" className="hidden" disabled={confirmAction !== 'none' || isSubmitting} />

                        {imagePreview ? (
                            <div className="relative w-full h-44 rounded-xl overflow-hidden border border-gray-200 group">
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />

                                {/* Lớp phủ khi di chuột vào (Có 2 nút: Đổi ảnh và Xóa ảnh) */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                    {/* Nút Đổi ảnh */}
                                    <button
                                        onClick={() => { if (confirmAction === 'none' && !isSubmitting) fileInputRef.current.click() }}
                                        disabled={confirmAction !== 'none' || isSubmitting}
                                        className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transform hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Thay đổi ảnh khác"
                                    >
                                        <ImagePlus size={20} />
                                    </button>

                                    {/* Nút Xóa ảnh */}
                                    <button
                                        onClick={handleRemoveImage}
                                        disabled={confirmAction !== 'none' || isSubmitting}
                                        className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transform hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Xóa ảnh này"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => { if (confirmAction === 'none' && !isSubmitting) fileInputRef.current.click() }}
                                className={`w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center transition-colors text-gray-400 group
                                    ${confirmAction !== 'none' || isSubmitting ? 'cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:bg-blue-50 hover:border-blue-400'}`}
                            >
                                <ImagePlus size={32} className={`mb-2 ${confirmAction !== 'none' || isSubmitting ? '' : 'group-hover:text-blue-500 transition-colors'}`} />
                                <span className="text-sm font-medium group-hover:text-blue-600 transition-colors">Nhấn để chọn ảnh mới</span>
                            </div>
                        )}
                    </div>

                    {/* Form Inputs */}
                    <div className="space-y-4">
                        {/* BIỂN SỐ XE (READ-ONLY) */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-1 ml-1">Biển số (Không thể sửa)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Hash size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={vehicleData.licensePlate}
                                    disabled
                                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 font-medium cursor-not-allowed select-none"
                                />
                            </div>
                        </div>

                        {/* CÁC TRƯỜNG CÒN LẠI */}
                        {[
                            { icon: Wrench, label: 'Tên xe', id: 'model' },
                            { icon: ShieldCheck, label: 'Hãng sản xuất', id: 'brand' },
                            { icon: Calendar, label: 'Năm sản xuất', id: 'manufacture_year', type: 'number' },
                        ].map((input) => (
                            <div key={input.id}>
                                <label htmlFor={input.id} className="block text-sm font-semibold text-gray-800 mb-1 ml-1">{input.label} <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${errors[input.id] ? 'text-red-400' : 'text-gray-400'}`}>
                                        <input.icon size={18} />
                                    </div>
                                    <input
                                        type={input.type || 'text'} id={input.id} value={vehicleData[input.id]} onChange={handleInputChange}
                                        className={`w-full pl-10 pr-3 py-2.5 border rounded-lg outline-none text-sm transition-all text-gray-800 font-medium
                                            ${errors[input.id] ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}
                                            disabled:bg-gray-100`}
                                        disabled={confirmAction !== 'none' || isSubmitting}
                                    />
                                </div>
                                {errors[input.id] && (
                                    <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5 ml-1 animate-fade-in"><AlertCircle size={12} />{errors[input.id]}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50/80 rounded-b-2xl">
                    {confirmAction === 'edit' && (
                        <div className="space-y-3 animate-fade-in-up">
                            <div className="flex items-center justify-center gap-2 text-amber-700 bg-amber-100 py-2.5 rounded-lg border border-amber-200">
                                <AlertTriangle size={18} />
                                <span className="text-sm font-bold">Lưu các thay đổi này?</span>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={executeAction} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-md transition-all">Xác nhận Lưu</button>
                                <button onClick={() => setConfirmAction('none')} className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-2.5 rounded-lg hover:bg-gray-100 transition-all">Quay lại</button>
                            </div>
                        </div>
                    )}

                    {confirmAction === 'delete' && (
                        <div className="space-y-3 animate-fade-in-up">
                            <div className="flex items-center justify-center gap-2 text-red-700 bg-red-100 py-2.5 rounded-lg border border-red-200">
                                <AlertTriangle size={18} />
                                <span className="text-sm font-bold">Xóa vĩnh viễn xe này?</span>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={executeAction} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg shadow-md transition-all">Xác nhận Xóa</button>
                                <button onClick={() => setConfirmAction('none')} className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-2.5 rounded-lg hover:bg-gray-100 transition-all">Quay lại</button>
                            </div>
                        </div>
                    )}

                    {confirmAction === 'none' && (
                        <div className="flex gap-3">
                            <button onClick={handleSaveClick} className="flex-[2] bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all">
                                <Save size={18} /> Lưu
                            </button>
                            <button onClick={handleDeleteClick} className="flex-1 bg-red-50 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2">
                                <Trash2 size={18} /> Xóa
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}