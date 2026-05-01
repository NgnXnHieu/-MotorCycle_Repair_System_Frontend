import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Save, Camera, ArrowLeft, Car,
    Info, Hash, ShieldCheck, Loader2, AlertCircle, Trash2, ImagePlus, Gauge
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import { vehicleApi } from '../../api/vehicleApi';
import 'react-toastify/dist/ReactToastify.css';

export default function EditVehiclePage() {
    const { id } = useParams(); // Lấy ID xe từ URL
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // State cho Form
    const [formData, setFormData] = useState({
        platePart1: '',
        platePart2: '',
        brand: '',
        model: '',
        manufacture_year: '',
        kilometters: ''
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    // Regex: Chỉ cho phép chữ cái và số
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;

    // 1. Tải dữ liệu xe cũ khi vào trang
    useEffect(() => {
        const fetchVehicleDetail = async () => {
            try {
                setIsLoading(true);
                // Giả sử em có hàm getVehicleById trong vehicleApi
                const data = await vehicleApi.getById(id);

                // Tách biển số "29A1-12345" thành 2 phần để đưa vào input
                const plateParts = (data.licensePlate || "").split('-');

                setFormData({
                    platePart1: plateParts[0] || '',
                    platePart2: plateParts[1] || '',
                    brand: data.brand || '',
                    model: data.model || '',
                    manufacture_year: data.manufacture_year || '',
                    kilometters: data.kilometters || 0
                });
                console.log(data)
                setImagePreview(data.image || data.iamge || null);
            } catch (err) {
                toast.error("Không thể tải thông tin xe!");
                console.log(error?.response)
                setTimeout(() => navigate('/vehicleManagement'), 2000);
            } finally {
                setIsLoading(false);
            }
        };
        fetchVehicleDetail();
    }, [id, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if ((name === 'platePart1' || name === 'platePart2') && value !== '' && !alphanumericRegex.test(value)) return;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const validate = () => {
        if (!formData.platePart1 || !formData.platePart2) {
            toast.error("Biển số xe không được để trống!");
            return false;
        }
        if (!formData.brand) { toast.error("Vui lòng chọn hãng xe!"); return false; }
        if (!formData.model) { toast.error("Vui lòng nhập tên dòng xe!"); return false; }
        if (!formData.manufacture_year) { toast.error("Vui lòng nhập năm sản xuất!"); return false; }
        return true;
    };

    const executeUpdate = async () => {
        setShowConfirm(false);
        setIsSubmitting(true);
        try {
            const payload = new FormData();
            // Gộp biển số lại để gửi lên Spring Boot
            const fullPlate = `${formData.platePart1}-${formData.platePart2}`.toUpperCase();

            payload.append('brand', formData.brand);
            payload.append('model', formData.model);
            payload.append('manufacture_year', formData.manufacture_year);
            // Thường API update không cho đổi biển số, nhưng nếu có thì append vào:
            // payload.append('licensePlate', fullPlate);
            payload.append('kilometters', formData.kilometters ? parseInt(formData.kilometters) : 0);
            if (imageFile) payload.append('image', imageFile);
            console.log(Object.fromEntries(payload.entries()))
            await vehicleApi.updateVehicle(id, payload);
            toast.success("Cập nhật thông tin thành công!");
            setTimeout(() => navigate('/vehicleManagement'), 1500);
        } catch (err) {
            toast.error(err?.response?.data?.message || "Lỗi khi cập nhật!");
            console.log(err.response)
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="animate-spin text-indigo-600" size={48} />
        </div>
    );

    return (
        <div className="p-6 sm:p-10 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-5xl mx-auto">
                <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors">
                    <ArrowLeft size={20} /> Quay lại danh sách
                </button>

                <h1 className="text-3xl font-black mb-8 flex items-center gap-3 text-slate-900">
                    <Save className="text-indigo-600" size={36} /> Cập Nhật Thông Tin Xe
                </h1>

                <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden relative">
                    {isSubmitting && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex items-center justify-center">
                            <Loader2 className="animate-spin text-indigo-600" size={40} />
                        </div>
                    )}

                    {/* KHU VỰC ẢNH */}
                    <div className="h-72 bg-slate-100 flex flex-col items-center justify-center relative border-b border-dashed border-slate-300 group">
                        {imagePreview ? (
                            <img src={imagePreview} className="w-full h-full object-cover" alt="Vehicle" />
                        ) : (
                            <div className="text-slate-400 flex flex-col items-center">
                                <ImagePlus size={48} className="mb-2" />
                                <p className="text-xs font-bold uppercase">Chưa có ảnh xe</p>
                            </div>
                        )}
                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <div className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl">
                                <Camera size={20} /> Thay đổi ảnh
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </label>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); if (validate()) setShowConfirm(true); }} className="p-8 lg:p-12 grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* CỘT 1 */}
                        <div className="space-y-8">
                            <div>
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
                                    <Hash size={16} className="text-indigo-500" /> Biển số xe (Cố định)
                                </label>
                                <div className="flex items-start gap-4">
                                    <div className="flex-1">
                                        <input name="platePart1" value={formData.platePart1} readOnly className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-100 text-slate-400 font-black text-center uppercase tracking-widest text-lg cursor-not-allowed" />
                                    </div>
                                    <div className="mt-4 font-black text-slate-300 text-2xl">-</div>
                                    <div className="flex-[1.5]">
                                        <input name="platePart2" value={formData.platePart2} readOnly className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-100 text-slate-400 font-black text-center uppercase tracking-widest text-lg cursor-not-allowed" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-slate-700 mb-2 block">Hãng xe <span className="text-rose-500">*</span></label>
                                <select name="brand" value={formData.brand} onChange={handleInputChange} className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 bg-slate-50 font-bold">
                                    <option value="Honda">Honda</option>
                                    <option value="Yamaha">Yamaha</option>
                                    <option value="Suzuki">Suzuki</option>
                                    <option value="Piaggio">Piaggio</option>
                                    <option value="Other">Khác</option>
                                </select>
                            </div>
                        </div>

                        {/* CỘT 2 */}
                        <div className="space-y-8">
                            <div>
                                <label className="text-sm font-bold text-slate-700 mb-2 block">Dòng xe (Model) <span className="text-rose-500">*</span></label>
                                <input name="model" value={formData.model} placeholder="VD: Exciter, Vision..." onChange={handleInputChange} className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 bg-slate-50 font-bold" />
                            </div>

                            <div>
                                <label className="text-sm font-bold text-slate-700 mb-2 block">Năm sản xuất <span className="text-rose-500">*</span></label>
                                <input name="manufacture_year" type="number" value={formData.manufacture_year} onChange={handleInputChange} className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 bg-slate-50 font-mono font-bold" />
                            </div>

                            <div>
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                                    <Gauge size={16} className="text-indigo-500" /> Số Kilomet (ODO) hiện tại
                                </label>
                                <div className="relative">
                                    <input
                                        name="kilometters"
                                        type="number"
                                        min="0"
                                        max="100000000"
                                        onWheel={(e) => e.target.blur()}
                                        value={formData.kilometters}
                                        onChange={handleInputChange}
                                        className="w-full p-4 pr-12 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 bg-slate-50 font-mono font-bold transition-all"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                                        Km
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 mt-6 flex justify-end gap-5 border-t border-slate-100 pt-8">
                            <button type="button" onClick={() => navigate(-1)} className="px-8 py-4 font-bold text-slate-400 hover:text-rose-500 transition-colors">Hủy bỏ</button>
                            <button type="submit" className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-3">
                                <Save size={20} /> Lưu thay đổi
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* MODAL XÁC NHẬN */}
            {showConfirm && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
                    <div className="bg-white p-10 rounded-[2.5rem] max-w-md w-full text-center shadow-2xl">
                        <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle size={40} />
                        </div>
                        <h3 className="text-2xl font-black mb-3 text-slate-900">Xác nhận cập nhật?</h3>
                        <p className="text-slate-500 mb-8 leading-relaxed">Các thông tin mới của xe <span className="font-bold text-indigo-600">{formData.platePart1}-{formData.platePart2}</span> sẽ được ghi đè vào hệ thống.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">Hủy</button>
                            <button onClick={executeUpdate} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200">Xác nhận</button>
                        </div>
                    </div>
                </div>
            )}
            <ToastContainer position="top-right" theme="colored" autoClose={3000} />
        </div>
    );
}