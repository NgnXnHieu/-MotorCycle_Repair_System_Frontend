import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Save, X, Camera, ArrowLeft, Building2, Map } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import { branchApi } from '../../api/branchApi';
import 'react-toastify/dist/ReactToastify.css';

export default function BranchCreate() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [formData, setFormData] = useState({
        name: '', address: '', hotline: '', status: true,
        mapUrl: '', latitude: '', longitude: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        const required = ['name', 'address', 'hotline', 'mapUrl', 'latitude', 'longitude'];
        for (let field of required) {
            if (!formData[field]) {
                toast.error(`Vui lòng điền: ${field.toUpperCase()}`);
                return false;
            }
        }
        if (!imageFile) { toast.error("Vui lòng chọn ảnh đại diện!"); return false; }
        return true;
    };

    const handleSaveClick = (e) => {
        e.preventDefault();
        if (validate()) setShowConfirm(true);
    };

    const executeCreate = async () => {
        setShowConfirm(false);
        setIsSubmitting(true);
        try {
            const payload = new FormData();
            Object.keys(formData).forEach(key => payload.append(key, formData[key]));
            if (imageFile) payload.append('file', imageFile);

            await branchApi.createBranch(payload);
            toast.success("Tạo mới chi nhánh thành công!");
            setTimeout(() => navigate('/generalManager/branchManagement'), 1500);
        } catch (err) {
            toast.error(err?.response?.data?.message || "Lỗi khi tạo mới!");
        } finally { setIsSubmitting(false); }
    };

    return (
        <div className="p-6 sm:p-10 bg-slate-50 min-h-screen">
            <div className="max-w-5xl mx-auto">
                <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold"><ArrowLeft size={20} /> Quay lại</button>

                <h1 className="text-3xl font-black mb-8 flex items-center gap-3"><Building2 className="text-indigo-600" /> Thêm Chi Nhánh Hệ Thống</h1>

                <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">
                    {/* UPLOAD IMAGE */}
                    <div className="h-64 bg-slate-100 flex flex-col items-center justify-center relative border-b border-dashed">
                        {imagePreview ? (
                            <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                        ) : (
                            <div className="text-slate-400 flex flex-col items-center">
                                <Camera size={48} className="mb-2" />
                                <p className="font-bold">Chưa có ảnh đại diện</p>
                            </div>
                        )}
                        <label className="absolute bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold cursor-pointer shadow-lg hover:bg-indigo-700 transition-all">
                            Tải ảnh lên
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
                            }} />
                        </label>
                    </div>

                    <form onSubmit={handleSaveClick} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="text-sm font-bold text-slate-700">Tên chi nhánh <span className="text-rose-500">*</span></label>
                                <input name="name" required placeholder="VD: Chi nhánh Quận 1" onChange={handleInputChange} className="w-full mt-2 p-3 border rounded-xl outline-none focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-700">Địa chỉ cụ thể <span className="text-rose-500">*</span></label>
                                <textarea name="address" rows="3" required placeholder="Số nhà, tên đường, phường..." onChange={handleInputChange} className="w-full mt-2 p-3 border rounded-xl outline-none focus:border-indigo-500 resize-none" />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-700">Hotline liên hệ <span className="text-rose-500">*</span></label>
                                <input name="hotline" type="tel" required placeholder="09xxxxxxx" onChange={handleInputChange} className="w-full mt-2 p-3 border rounded-xl outline-none focus:border-indigo-500" />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-bold text-slate-700">Kinh độ <span className="text-rose-500">*</span></label>
                                    <input name="latitude" type="number" step="any" required placeholder="10.xxxx" onChange={handleInputChange} className="w-full mt-2 p-3 border rounded-xl outline-none focus:border-indigo-500 font-mono" />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-700">Vĩ độ <span className="text-rose-500">*</span></label>
                                    <input name="longitude" type="number" step="any" required placeholder="106.xxxx" onChange={handleInputChange} className="w-full mt-2 p-3 border rounded-xl outline-none focus:border-indigo-500 font-mono" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-700">Link Iframe Bản đồ <span className="text-rose-500">*</span></label>
                                <input name="mapUrl" type="url" required placeholder="https://google.com/maps/..." onChange={handleInputChange} className="w-full mt-2 p-3 border rounded-xl outline-none focus:border-indigo-500 text-xs" />
                            </div>
                            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                                    <b>Lưu ý:</b> Hãy đảm bảo các thông số tọa độ chính xác để khách hàng có thể tìm thấy cửa hàng trên ứng dụng di động.
                                </p>
                            </div>
                        </div>

                        <div className="md:col-span-2 mt-4 flex justify-end gap-4">
                            <button type="button" onClick={() => navigate(-1)} className="px-8 py-3 font-bold text-slate-500">Hủy</button>
                            <button type="submit" className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2">
                                <Save size={20} /> Lưu chi nhánh
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* CONFIRM CREATE MODAL */}
            {showConfirm && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
                        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4"><Building2 size={40} /></div>
                        <h3 className="text-2xl font-black mb-2">Xác nhận tạo mới?</h3>
                        <p className="text-slate-500 mb-6">Chi nhánh <b>{formData.name}</b> sẽ được thêm vào hệ thống ngay lập tức.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Hủy</button>
                            <button onClick={executeCreate} disabled={isSubmitting} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">Xác nhận</button>
                        </div>
                    </div>
                </div>
            )}
            <ToastContainer position="top-right" theme="colored" />
        </div>
    );
}