import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    MapPin, Phone, Edit, Save, X, Image as ImageIcon,
    AlertCircle, Map, Camera, Loader2, ShieldAlert, ArrowLeft, ToggleRight, ToggleLeft
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import { branchApi } from '../../api/branchApi';
import 'react-toastify/dist/ReactToastify.css';

export default function BranchDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [originalData, setOriginalData] = useState(null);
    const [formData, setFormData] = useState({});
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [confirmModal, setConfirmModal] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await branchApi.getById(id);
                const data = res.data || res;
                setOriginalData(data);
                setFormData(data);
                setImagePreview(data.imageUrl || '');
            } catch (err) { toast.error("Không thể tải dữ liệu!"); } finally { setIsLoading(false); }
        };
        fetchDetail();
    }, [id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const executeUpdate = async () => {
        setConfirmModal(false);
        setIsSubmitting(true);
        try {
            const payload = new FormData();
            // Gửi các thuộc tính được phép sửa theo yêu cầu của bạn
            payload.append('hotline', formData.hotline);
            payload.append('status', formData.status);
            payload.append('mapUrl', formData.mapUrl);
            payload.append('latitude', formData.latitude);
            payload.append('longitude', formData.longitude);
            if (imageFile) payload.append('file', imageFile);

            await branchApi.updateBranch(id, payload);
            toast.success("Cập nhật chi nhánh thành công!");
            setTimeout(() => navigate('/generalManager/branchManagement'), 1500);
        } catch (err) { toast.error("Có lỗi xảy ra!"); } finally { setIsSubmitting(false); }
    };

    const isChanged = (field) => originalData && formData[field] !== originalData[field];

    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

    return (
        <div className="p-6 sm:p-10 bg-slate-50 min-h-screen">
            <div className="max-w-5xl mx-auto">
                <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors"><ArrowLeft size={20} /> Quay lại</button>

                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                    {/* IMAGE HEADER */}
                    <div className="relative h-72 bg-slate-200 group">
                        <img src={imagePreview} className="w-full h-full object-cover" alt="Branch" />
                        {isEditing && (
                            <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                                <Camera className="text-white" size={48} />
                                <input type="file" className="hidden" onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
                                }} />
                            </label>
                        )}
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* CỘT 1: THÔNG TIN CỐ ĐỊNH (KHÔNG CHO SỬA) */}
                            <div className="space-y-6">
                                <div>
                                    <label className="text-sm font-bold text-slate-400 flex items-center gap-2"><ShieldAlert size={16} /> Tên Chi Nhánh (Cố định)</label>
                                    <input type="text" value={formData.name} disabled className="w-full mt-2 p-3 bg-slate-50 border rounded-xl text-slate-500 font-bold cursor-not-allowed" />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-400 flex items-center gap-2"><ShieldAlert size={16} /> Địa chỉ (Cố định)</label>
                                    <textarea rows="3" value={formData.address} disabled className="w-full mt-2 p-3 bg-slate-50 border rounded-xl text-slate-500 font-bold cursor-not-allowed resize-none" />
                                </div>
                            </div>

                            {/* CỘT 2: THÔNG TIN ĐƯỢC PHÉP SỬA (THEO DANH SÁCH BẠN CUNG CẤP) */}
                            <div className="space-y-6">
                                <div>
                                    <label className="text-sm font-bold text-slate-700 flex justify-between">Hotline {isEditing && isChanged('hotline') && <span className="text-amber-600 text-xs animate-pulse">Thay đổi...</span>}</label>
                                    <input name="hotline" type="text" value={formData.hotline} onChange={handleInputChange} disabled={!isEditing} className={`w-full mt-2 p-3 border rounded-xl outline-none ${isEditing ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'bg-slate-50'}`} />
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-slate-700 mb-2 block">Trạng thái hệ thống</label>
                                    <button
                                        disabled={!isEditing}
                                        onClick={() => setFormData({ ...formData, status: !formData.status })}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${formData.status ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'} ${!isEditing && 'opacity-70 cursor-not-allowed'}`}
                                    >
                                        {formData.status ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                        {formData.status ? 'Đang hoạt động' : 'Tạm khóa'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 flex justify-between">Kinh độ (Lat) {isEditing && isChanged('latitude') && <span className="text-amber-50 text-[10px] bg-amber-500 px-1 rounded">Mới</span>}</label>
                                        <input name="latitude" type="number" step="any" value={formData.latitude} onChange={handleInputChange} disabled={!isEditing} className={`w-full mt-2 p-3 border rounded-xl font-mono ${isEditing ? 'border-indigo-500' : 'bg-slate-50'}`} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 flex justify-between">Vĩ độ (Lng) {isEditing && isChanged('longitude') && <span className="text-amber-50 text-[10px] bg-amber-500 px-1 rounded">Mới</span>}</label>
                                        <input name="longitude" type="number" step="any" value={formData.longitude} onChange={handleInputChange} disabled={!isEditing} className={`w-full mt-2 p-3 border rounded-xl font-mono ${isEditing ? 'border-indigo-500' : 'bg-slate-50'}`} />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-slate-700 flex justify-between">Link nhúng bản đồ {isEditing && isChanged('mapUrl') && <span className="text-amber-600 text-xs">Link mới</span>}</label>
                                    <input name="mapUrl" type="url" value={formData.mapUrl} onChange={handleInputChange} disabled={!isEditing} className={`w-full mt-2 p-3 border rounded-xl text-xs ${isEditing ? 'border-indigo-500' : 'bg-slate-50'}`} />
                                </div>
                            </div>
                        </div>

                        {/* PREVIEW MAP */}
                        <div className="mt-8 pt-8 border-t">
                            <iframe src={formData.mapUrl} className="w-full h-64 rounded-2xl border shadow-inner" allowFullScreen="" loading="lazy"></iframe>
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="mt-10 flex justify-end gap-4">
                            {!isEditing ? (
                                <button onClick={() => setIsEditing(true)} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"><Edit size={20} /> Mở khóa chỉnh sửa</button>
                            ) : (
                                <>
                                    <button onClick={() => { setIsEditing(false); setFormData(originalData); }} className="px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">Hủy bỏ</button>
                                    <button onClick={() => setConfirmModal(true)} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2"><Save size={20} /> Cập nhật hệ thống</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* CONFIRM MODAL */}
            {confirmModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle size={48} /></div>
                        <h3 className="text-2xl font-black mb-2">Xác nhận thay đổi?</h3>
                        <p className="text-slate-500 mb-6">Bạn đang thay đổi các thông số kỹ thuật quan trọng của chi nhánh <b>{formData.name}</b>.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Hủy</button>
                            <button onClick={executeUpdate} disabled={isSubmitting} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">{isSubmitting ? 'Đang lưu...' : 'Đồng ý'}</button>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer position="top-right" autoClose={3000} theme="colored" />
        </div>
    );
}