import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Save, Camera, ArrowLeft, Car,
    Info, Hash, ShieldCheck, Loader2, Gauge
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import { vehicleApi } from '../../api/vehicleApi';
import 'react-toastify/dist/ReactToastify.css';

export default function AddVehiclePage() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // 1. Thêm 'customBrand' vào state để quản lý input nhập tay
    const [formData, setFormData] = useState({
        platePart1: '',
        platePart2: '',
        brand: '',
        customBrand: '', // <-- Thêm trường này
        model: '',
        manufacture_year: new Date().getFullYear(),
        kilometters: ''
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    const alphanumericRegex = /^[a-zA-Z0-9]+$/;

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'platePart1' || name === 'platePart2') {
            if (value !== '' && !alphanumericRegex.test(value)) return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        if (!formData.platePart1 || !formData.platePart2) {
            toast.error("Vui lòng nhập đầy đủ 2 phần của biển số!");
            return false;
        }
        if (!formData.brand) {
            toast.error("Vui lòng chọn hãng xe!");
            return false;
        }
        // 2. Validate thêm trường hợp chọn "Khác" nhưng để trống ô nhập
        if (formData.brand === 'Other' && !formData.customBrand.trim()) {
            toast.error("Vui lòng nhập tên hãng xe khác!");
            return false;
        }
        if (!formData.model) {
            toast.error("Vui lòng nhập tên dòng xe!");
            return false;
        }
        if (!formData.manufacture_year) {
            toast.error("Vui lòng nhập năm sản xuất!");
            return false;
        }
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
            const fullPlate = `${formData.platePart1}-${formData.platePart2}`.toUpperCase();

            payload.append('licensePlate', fullPlate);

            // 3. Xử lý logic chọn brand trước khi gửi xuống Spring Boot
            const finalBrand = formData.brand === 'Other' ? formData.customBrand.trim() : formData.brand;
            payload.append('brand', finalBrand);

            payload.append('model', formData.model);
            payload.append('manufacture_year', formData.manufacture_year);
            payload.append('kilometters', formData.kilometters ? parseInt(formData.kilometters) : 0);

            if (imageFile) payload.append('image', imageFile);
            console.log(payload)
            await vehicleApi.createVehicle(payload);
            toast.success("Thêm phương tiện thành công!");
            setTimeout(() => navigate('/vehicleManagement'), 1500);
        } catch (err) {
            toast.error(err?.response?.data?.message || "Lỗi khi lưu thông tin xe!");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 sm:p-10 bg-slate-50 min-h-screen font-sans selection:bg-indigo-100">
            <div className="max-w-5xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors"
                >
                    <ArrowLeft size={20} /> Quay lại
                </button>

                <h1 className="text-3xl font-black mb-8 flex items-center gap-3 text-slate-900">
                    <Car className="text-indigo-600" size={36} /> Thêm Phương Tiện Mới
                </h1>

                <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
                    {/* Khu vực tải ảnh giữ nguyên */}
                    <div className="h-72 bg-slate-100 flex flex-col items-center justify-center relative border-b border-dashed border-slate-300">
                        {imagePreview ? (
                            <img src={imagePreview} className="w-full h-full object-cover" alt="Vehicle Preview" />
                        ) : (
                            <div className="text-slate-400 flex flex-col items-center">
                                <div className="p-5 bg-white rounded-full shadow-inner mb-3">
                                    <Camera size={48} className="text-slate-300" />
                                </div>
                                <p className="font-bold uppercase tracking-widest text-xs">Ảnh minh họa xe</p>
                            </div>
                        )}
                        <label className="absolute bottom-6 right-6 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold cursor-pointer shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
                            <Camera size={18} /> Tải ảnh lên
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    setImageFile(file);
                                    setImagePreview(URL.createObjectURL(file));
                                }
                            }} />
                        </label>
                    </div>

                    <form onSubmit={handleSaveClick} className="p-8 lg:p-12 grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-8">
                            <div>
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
                                    <Hash size={16} className="text-indigo-500" /> Biển số xe <span className="text-rose-500">*</span>
                                </label>
                                <div className="flex items-start gap-4">
                                    <div className="flex-1">
                                        <input
                                            name="platePart1"
                                            value={formData.platePart1}
                                            required
                                            maxLength={5}
                                            placeholder="29A1"
                                            onChange={handleInputChange}
                                            className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white bg-slate-50 transition-all font-black text-center uppercase tracking-widest text-lg"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">Dãy trên (Vùng/Loại)</p>
                                    </div>
                                    <div className="mt-4 font-black text-slate-300 text-2xl">-</div>
                                    <div className="flex-[1.5]">
                                        <input
                                            name="platePart2"
                                            value={formData.platePart2}
                                            required
                                            maxLength={6}
                                            placeholder="12345"
                                            onChange={handleInputChange}
                                            className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white bg-slate-50 transition-all font-black text-center uppercase tracking-widest text-lg"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">Dãy dưới (Số seri)</p>
                                    </div>
                                </div>
                                <p className="mt-3 text-[11px] text-indigo-500 italic font-medium flex items-center gap-1">
                                    <Info size={12} /> Chỉ nhập chữ cái và số, không bao gồm ký tự đặc biệt.
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-slate-700 mb-2 block">Hãng xe <span className="text-rose-500">*</span></label>
                                <select
                                    name="brand"
                                    value={formData.brand} // Thêm value để control select box
                                    required
                                    onChange={handleInputChange}
                                    className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 bg-slate-50 font-bold transition-all"
                                >
                                    <option value="">-- Chọn hãng xe --</option>
                                    <option value="Honda">Honda</option>
                                    <option value="Yamaha">Yamaha</option>
                                    <option value="Suzuki">Suzuki</option>
                                    <option value="Piaggio">Piaggio</option>
                                    <option value="Other">Khác</option>
                                </select>
                            </div>

                            {/* 4. Khối input hiển thị có điều kiện khi chọn "Khác" */}
                            {formData.brand === 'Other' && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="text-sm font-bold text-slate-700 mb-2 block">Nhập tên hãng xe <span className="text-rose-500">*</span></label>
                                    <input
                                        name="customBrand"
                                        value={formData.customBrand}
                                        required
                                        placeholder="VD: Sym, Kawasaki, Ducati..."
                                        onChange={handleInputChange}
                                        className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 bg-white font-bold transition-all"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-8">
                            <div>
                                <label className="text-sm font-bold text-slate-700 mb-2 block">Dòng xe (Model) <span className="text-rose-500">*</span></label>
                                <input
                                    name="model"
                                    required
                                    placeholder="VD: SH 150i, Exciter 155..."
                                    onChange={handleInputChange}
                                    className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 bg-slate-50 font-bold"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-bold text-slate-700 mb-2 block">Năm sản xuất <span className="text-rose-500">*</span></label>
                                <input
                                    name="manufacture_year"
                                    type="number"
                                    min="1990"
                                    max={new Date().getFullYear()}
                                    value={formData.manufacture_year}
                                    required
                                    onChange={handleInputChange}
                                    className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 bg-slate-50 font-mono font-bold"
                                />
                            </div>

                            {/* ... (Code Năm sản xuất cũ) ... */}
                            <div>
                                <label className="text-sm font-bold text-slate-700 mb-2 block">Năm sản xuất <span className="text-rose-500">*</span></label>
                                <input
                                    name="manufacture_year"
                                    type="number"
                                    min="1990"
                                    max={new Date().getFullYear()}
                                    value={formData.manufacture_year}
                                    required
                                    onChange={handleInputChange}
                                    className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 bg-slate-50 font-mono font-bold"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                                    <Gauge size={16} className="text-indigo-500" /> Số Kilomet (ODO)
                                </label>
                                <div className="relative">
                                    <input
                                        name="kilometters"
                                        type="number"
                                        min="0"
                                        placeholder="VD: 15000"
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

                            <div className="bg-blue-50 p-5 rounded-[1.5rem] border border-blue-100 flex gap-3">
                                <ShieldCheck className="text-blue-600 shrink-0" size={24} />
                                <p className="text-xs text-blue-700 font-medium leading-relaxed">
                                    <b>Thông tin:</b> Việc cung cấp chính xác đời xe và hãng xe giúp chúng tôi tư vấn các gói bảo dưỡng và phụ tùng phù hợp nhất cho bạn.
                                </p>
                            </div>
                        </div>

                        <div className="md:col-span-2 mt-6 flex justify-end gap-5 border-t border-slate-100 pt-8">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="cursor-pointer px-8 py-4 font-bold text-white bg-orange-400 hover:bg-red-600 rounded-2xl transition-colors shadow-md"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="cursor-pointer px-12 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-green-600 transition-all flex items-center gap-3 active:scale-95 disabled:bg-slate-400"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                Lưu Phương Tiện
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Modal Xác Nhận */}
            {showConfirm && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-white p-10 rounded-[2.5rem] max-w-md w-full text-center shadow-2xl border border-slate-100">
                        <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Car size={48} />
                        </div>
                        <h3 className="text-2xl font-black mb-3 text-slate-900">Xác nhận thêm xe?</h3>
                        <p className="text-slate-500 mb-8 leading-relaxed">
                            Xe biển số <span className="font-black text-indigo-600">{formData.platePart1}-{formData.platePart2}</span> sẽ được thêm vào hồ sơ.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-colors"
                            >
                                Quay lại
                            </button>
                            <button
                                onClick={executeCreate}
                                disabled={isSubmitting}
                                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all flex justify-center items-center"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" /> : "Xác nhận lưu"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer position="top-right" theme="colored" autoClose={3000} />
        </div>
    );
}