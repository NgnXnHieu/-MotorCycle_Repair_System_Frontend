import React, { useState, useEffect } from 'react';
import {
    MapPin, Phone, Edit, Save, X, Image as ImageIcon,
    AlertCircle, Map, Camera, Loader2, ShieldAlert
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { branchApi } from '../../api/branchApi';

export default function BranchProfile() {
    // State quản lý chế độ: Xem (false) hay Sửa (true)
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State lưu dữ liệu GỐC (để đối chiếu xem có thay đổi không và để Hủy)
    const [originalData, setOriginalData] = useState(null);

    // State lưu dữ liệu đang chỉnh sửa trên Form
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        hotline: '',
        status: true,
        mapUrl: '',
        latitude: '',
        longitude: '',
        imageUrl: ''
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    // Modal Xác nhận
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });

    // 1. FETCH DATA: Lấy thông tin chi nhánh của Quản lý này
    const fetchMyBranchInfo = async () => {
        setIsLoading(true);
        try {
            const response = await branchApi.getMyBranch();
            const data = response.data || response;
            setOriginalData(data);
            setFormData(data);
            console.log(data)
            console.log(data.mapUrl)
            setImagePreview(data.imageUrl || '');
        } catch (error) {
            console.error("Lỗi lấy thông tin:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMyBranchInfo();
    }, []);

    // 2. XỬ LÝ NHẬP LIỆU
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    // 3. XỬ LÝ NÚT BẤM (Hủy, Lưu)
    const handleCancelClick = () => {
        // Trả lại dữ liệu gốc, tắt chế độ sửa
        setFormData(originalData);
        setImageFile(null);
        setImagePreview(originalData.imageUrl || '');
        setIsEditing(false);
    };

    const handleSaveClick = () => {
        setConfirmModal({ isOpen: true });
    };

    const executeSubmit = async () => {
        setConfirmModal({ isOpen: false });
        setIsSubmitting(true);

        try {
            const payload = new FormData();
            // Chỉ gửi những trường được phép sửa
            payload.append('address', formData.address);
            payload.append('hotline', formData.hotline);
            payload.append('mapUrl', formData.mapUrl);
            payload.append('latitude', formData.latitude);
            payload.append('longitude', formData.longitude);
            if (imageFile) payload.append('file', imageFile);

            // Gọi API Update (truyền ID chi nhánh)
            await branchApi.updateBranch(originalData.id, payload);
            toast.success("Cập nhật thông tin thành công!");

            // Cập nhật lại dữ liệu gốc
            setIsEditing(false);
            fetchMyBranchInfo();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Có lỗi xảy ra khi lưu!");
        } finally {
            setIsSubmitting(false);
        }
    };

    // HÀM KIỂM TRA SỰ THAY ĐỔI: So sánh formData vs originalData
    const isChanged = (fieldName) => {
        if (!originalData) return false;
        return formData[fieldName] !== originalData[fieldName];
    };
    const isImageChanged = imageFile !== null;

    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

    return (
        <div className="p-6 sm:p-10 bg-slate-50 min-h-screen">
            <div className="max-w-4xl mx-auto">

                {/* TIÊU ĐỀ */}
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hồ sơ Cửa hàng</h1>
                        <p className="text-slate-500 font-medium mt-1">Quản lý thông tin chi tiết cơ sở của bạn</p>
                    </div>
                    {isEditing && (
                        <span className="bg-amber-100 text-amber-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 animate-pulse">
                            <Edit size={16} /> Đang trong chế độ chỉnh sửa
                        </span>
                    )}
                </div>

                {/* KHUNG THÔNG TIN CHÍNH */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden transition-all">

                    {/* 1. KHU VỰC ẢNH ĐẠI DIỆN BẢN TO */}
                    <div className="relative w-full h-64 sm:h-80 bg-slate-200 group">
                        {imagePreview ? (
                            <img src={imagePreview} alt="Cửa hàng" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                <ImageIcon size={64} className="opacity-50 mb-2" />
                                <span>Chưa có hình ảnh</span>
                            </div>
                        )}

                        {/* Nút đổi ảnh (Chỉ hiện khi isEditing = true) */}
                        {isEditing && (
                            <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-sm">
                                <label className="cursor-pointer flex flex-col items-center gap-2 text-white bg-indigo-600/90 px-6 py-4 rounded-2xl hover:bg-indigo-600 transition-colors shadow-xl">
                                    <Camera size={32} />
                                    <span className="font-bold text-sm">Tải ảnh mới lên</span>
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                </label>
                            </div>
                        )}

                        {/* Cảnh báo ảnh thay đổi */}
                        {isEditing && isImageChanged && (
                            <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg">
                                <AlertCircle size={14} /> Ảnh đã thay đổi
                            </div>
                        )}
                    </div>

                    {/* 2. KHU VỰC FORM THÔNG TIN */}
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                            {/* ----- CỘT TRÁI ----- */}
                            <div className="space-y-6">
                                {/* KHÔNG ĐƯỢC SỬA: Tên cửa hàng */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        <ShieldAlert size={16} className="text-rose-500" /> Tên chi nhánh (Không thể sửa)
                                    </label>
                                    <input
                                        type="text" value={formData.name} disabled
                                        className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-bold cursor-not-allowed opacity-80"
                                    />
                                </div>

                                {/* ĐƯỢC SỬA: Hotline */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center justify-between">
                                        <span className="flex items-center gap-2"><Phone size={16} className="text-indigo-500" /> Số Hotline</span>
                                        {isEditing && isChanged('hotline') && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Đã thay đổi</span>}
                                    </label>
                                    <input
                                        type="text" name="hotline" value={formData.hotline} onChange={handleInputChange} disabled={!isEditing}
                                        className={`w-full px-4 py-3 border rounded-xl outline-none transition-all ${!isEditing ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white border-indigo-200 focus:ring-2 focus:ring-indigo-500/50 shadow-sm'}`}
                                    />
                                </div>

                                {/* KHÔNG ĐƯỢC SỬA: Trạng thái */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        <ShieldAlert size={16} className="text-rose-500" /> Trạng thái (Không thể sửa)
                                    </label>
                                    <div className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl cursor-not-allowed flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${formData.status ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                        <span className="text-slate-600 font-bold">{formData.status ? 'Đang hoạt động' : 'Tạm khóa'}</span>
                                    </div>
                                </div>

                                {/* KHU VỰC HIỂN THỊ BẢN ĐỒ ĐÃ ĐƯỢC SỬA */}
                                <div className="mt-4">
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        <Map size={16} className="text-indigo-500" /> Xem trước Bản đồ
                                    </label>

                                    {/* Thẻ div bọc ngoài PHẢI CÓ chiều cao cụ thể (VD: h-64, aspect-video) */}
                                    <div className="w-full h-64 bg-slate-200 rounded-xl overflow-hidden border border-slate-200 shadow-inner relative">
                                        {formData.mapUrl ? (
                                            <iframe
                                                src={formData.mapUrl}
                                                width="100%"
                                                height="100%"
                                                style={{ border: 0 }}
                                                allowFullScreen=""
                                                loading="lazy"
                                                referrerPolicy="no-referrer-when-downgrade"
                                                className="w-full h-full object-cover"
                                                title="Bản đồ cơ sở"
                                            ></iframe>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                                <Map size={32} className="opacity-30 mb-2" />
                                                <span className="text-sm">Chưa có link bản đồ hợp lệ</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ----- CỘT PHẢI ----- */}
                            <div className="space-y-6">
                                {/* ĐƯỢC SỬA: Địa chỉ */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center justify-between">
                                        <span className="flex items-center gap-2"><MapPin size={16} className="text-indigo-500" /> Địa chỉ cụ thể</span>
                                        {isEditing && isChanged('address') && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Đã thay đổi</span>}
                                    </label>
                                    <textarea
                                        name="address" rows="2" value={formData.address} onChange={handleInputChange} disabled={!isEditing}
                                        className={`w-full px-4 py-3 border rounded-xl outline-none transition-all resize-none ${!isEditing ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white border-indigo-200 focus:ring-2 focus:ring-indigo-500/50 shadow-sm'}`}
                                    />
                                </div>

                                {/* ĐƯỢC SỬA: Tọa độ */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between">
                                            Kinh độ
                                            {isEditing && isChanged('longitude') && <span className="text-[10px] text-amber-600">Sửa đổi</span>}
                                        </label>
                                        <input
                                            type="text" name="longitude" value={formData.longitude} onChange={handleInputChange} disabled={!isEditing}
                                            className={`w-full px-4 py-3 border rounded-xl outline-none transition-all font-mono text-sm ${!isEditing ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white border-indigo-200 focus:ring-2 focus:ring-indigo-500/50 shadow-sm'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between">
                                            Vĩ độ
                                            {isEditing && isChanged('latitude') && <span className="text-[10px] text-amber-600">Sửa đổi</span>}
                                        </label>
                                        <input
                                            type="text" name="latitude" value={formData.latitude} onChange={handleInputChange} disabled={!isEditing}
                                            className={`w-full px-4 py-3 border rounded-xl outline-none transition-all font-mono text-sm ${!isEditing ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white border-indigo-200 focus:ring-2 focus:ring-indigo-500/50 shadow-sm'}`}
                                        />
                                    </div>
                                </div>

                                {/* ĐƯỢC SỬA: Map Iframe */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center justify-between">
                                        <span className="flex items-center gap-2"><Map size={16} className="text-indigo-500" /> Link nhúng bản đồ</span>
                                        {isEditing && isChanged('mapUrl') && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Đã thay đổi</span>}
                                    </label>
                                    <input
                                        type="url" name="mapUrl" value={formData.mapUrl} onChange={handleInputChange} disabled={!isEditing}
                                        className={`w-full px-4 py-3 border rounded-xl outline-none transition-all text-sm ${!isEditing ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white border-indigo-200 focus:ring-2 focus:ring-indigo-500/50 shadow-sm'}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. KHU VỰC BUTTON ACTION */}
                        <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end gap-3">
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-600/20"
                                >
                                    <Edit size={20} /> Cập nhật thông tin
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleCancelClick}
                                        className="flex items-center gap-2 px-8 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 active:scale-95 transition-all"
                                    >
                                        <X size={20} /> Hủy bỏ
                                    </button>
                                    <button
                                        onClick={handleSaveClick}
                                        className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-600/20"
                                    >
                                        <Save size={20} /> Lưu thay đổi
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ToastContainer position="top-right" autoClose={3000} theme="colored" />

            {/* MODAL XÁC NHẬN LƯU */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-in zoom-in-95 duration-200">
                        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-emerald-100 text-emerald-600 mb-6">
                            <Save size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">Xác nhận lưu?</h3>
                        <p className="text-slate-500 font-medium mb-8">
                            Thông tin mới của chi nhánh sẽ được cập nhật lên hệ thống. Bạn có chắc chắn với các thay đổi này?
                        </p>
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setConfirmModal({ isOpen: false })}
                                className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={executeSubmit}
                                disabled={isSubmitting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-70"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Đồng ý'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}