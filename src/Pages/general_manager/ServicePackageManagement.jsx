import React, { useState, useEffect } from 'react';
import {
    Briefcase, Plus, Edit, Trash2, Search, Loader2, Image as ImageIcon,
    X, CheckCircle, CalendarDays, Repeat, DollarSign
} from 'lucide-react';
import { servicePackageApi } from '../../api/servicePackageApi';
import Pagination from '../../components/common/Pagination';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ServicePackageManagement() {

    // ================= QUẢN LÝ MODAL XÁC NHẬN =================
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false, title: '', message: '', onConfirm: null, isDanger: false
    });

    // ================= QUẢN LÝ FORM =================
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        durationUnit: 'MONTHS', // Mặc định là Tháng
        durationValue: '',
        usageTimes: '',
        isActive: true
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    // Enum cho Thời gian
    const durationUnits = [
        { value: 'DAYS', label: 'Ngày' },
        { value: 'MONTHS', label: 'Tháng' },
        { value: 'YEARS', label: 'Năm' }
    ];

    // ================= QUẢN LÝ DATA & PHÂN TRANG =================
    const [isLoading, setIsLoading] = useState(true);
    const [packages, setPackages] = useState([]);

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [filters, setFilters] = useState({
        keyword: "",
        isActive: null
    });

    const [debouncedKeyword, setDebouncedKeyword] = useState("");

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedKeyword(filters.keyword), 500);
        return () => clearTimeout(handler);
    }, [filters.keyword]);

    useEffect(() => {
        setCurrentPage(0);
    }, [debouncedKeyword, filters.isActive]);

    // HÀM FETCH DATA 
    const fetchPackages = async () => {
        setIsLoading(true);
        try {
            const formPayload = {
                searchName: debouncedKeyword.trim(),
                isActive: filters.isActive,
                page: currentPage,
                size: 10
            };

            // GIẢ LẬP GỌI API THỰC TẾ
            const response = await servicePackageApi.getFiltedAll(formPayload);
            const data = response.data || response;
            console.log(response)

            // const data = {
            //     content: [
            //         { id: 1, name: "Gói Bảo Dưỡng Cơ Bản", description: "Thay nhớt, kiểm tra phanh, tăng sên", price: "250000", durationUnit: "MONTHS", durationValue: 3, usageTimes: 2, isActive: true, imageUrl: null },
            //         { id: 2, name: "Gói Chăm Sóc Toàn Diện", description: "Bảo dưỡng nồi, thay nước mát, vệ sinh kim phun", price: "1500000", durationUnit: "YEARS", durationValue: 1, usageTimes: 4, isActive: true, imageUrl: null },
            //     ],
            //     page: { totalPages: 1 }
            // };

            setPackages(data.content);
            setTotalPages(data.page?.totalPages || 0);

        } catch (error) {
            toast.error("Không thể tải dữ liệu gói dịch vụ!");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, [currentPage, debouncedKeyword, filters.isActive]);

    // ================= XỬ LÝ SỰ KIỆN =================
    const handleAddNew = () => {
        setFormData({
            name: '', description: '', price: '', durationUnit: 'MONTHS',
            durationValue: '', usageTimes: '', isActive: true
        });
        setImageFile(null);
        setImagePreview('');
        setEditingId(null);
        setIsAddModalOpen(true);
    };

    const handleEdit = (pkg) => {
        setFormData({
            name: pkg.name || '',
            description: pkg.description || '',
            price: pkg.price || '',
            durationUnit: pkg.durationUnit || 'MONTHS',
            durationValue: pkg.durationValue || '',
            usageTimes: pkg.usageTimes || '',
            isActive: pkg.isActive ?? true
        });
        setImageFile(null);
        setImagePreview(pkg.imageUrl || '');
        setEditingId(pkg.id);
        setIsAddModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setConfirmModal({
            isOpen: true, title: 'Xóa gói dịch vụ?',
            message: 'Bạn có chắc chắn muốn xóa gói dịch vụ này? Dữ liệu không thể khôi phục.',
            isDanger: true, onConfirm: () => executeDelete(id)
        });
    };

    const executeDelete = async (id) => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
            await servicePackageApi.delete(id);
            toast.success("Đã xóa gói dịch vụ thành công!");
            fetchPackages();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi xóa gói dịch vụ!");
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        // Xử lý riêng cho toggle isActive
        if (name === 'isActive') {
            setFormData(prev => ({ ...prev, isActive: value === 'true' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleFormSubmitClick = (e) => {
        e.preventDefault();
        setConfirmModal({
            isOpen: true,
            title: editingId ? 'Cập nhật gói dịch vụ?' : 'Thêm gói mới?',
            message: 'Hệ thống sẽ lưu lại các thông tin bạn vừa nhập.',
            isDanger: false,
            onConfirm: () => executeSubmit()
        });
    };

    const executeSubmit = async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setIsSubmitting(true);

        try {
            const payload = new FormData();

            const formDTO = {
                name: formData.name,
                description: formData.description,
                price: formData.price.toString(), // DB nhận String
                durationUnit: formData.durationUnit,
                durationValue: Number(formData.durationValue),
                usageTimes: Number(formData.usageTimes),
                isActive: formData.isActive
            };

            console.log(formDTO)

            // 1. Nếu là THÊM MỚI, tên part phải khớp với backend create ("servicePackageForm")
            // 2. Nếu là CẬP NHẬT, tên part phải khớp với backend update ("servicePackageUpdateForm")
            const partName = editingId ? 'servicePackageUpdateForm' : 'servicePackageForm';

            // Đóng gói JSON vào Blob
            payload.append(partName, new Blob([JSON.stringify(formDTO)], { type: 'application/json' }));

            // Thêm File ảnh nếu có
            if (imageFile) {
                payload.append('file', imageFile); // Khớp với @RequestPart("file")
            }

            // Gọi API
            if (editingId) {
                await servicePackageApi.update(editingId, payload);
                toast.success("Cập nhật thành công!");
            } else {
                await servicePackageApi.create(payload);
                toast.success("Thêm mới thành công!");
            }

            setIsAddModalOpen(false);
            fetchPackages();

        } catch (error) {
            console.error("Lỗi Submit:", error);
            toast.error(error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper dịch chữ Unit
    const getUnitLabel = (unit) => {
        switch (unit) {
            case 'DAYS': return 'Ngày';
            case 'MONTHS': return 'Tháng';
            case 'YEARS': return 'Năm';
            default: return unit;
        }
    };

    return (
        <div className="p-6 sm:p-10 bg-slate-50 min-h-screen">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Briefcase className="text-indigo-600" size={32} /> Gói Dịch Vụ
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Cấu hình giá, thời hạn và số lần sử dụng của các gói bảo dưỡng.</p>
                </div>
                <button onClick={handleAddNew} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/20">
                    <Plus size={20} /> Thêm Gói Mới
                </button>
            </div>

            {/* TOOLBAR LỌC */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute inset-y-0 left-4 my-auto text-slate-400" size={18} />
                    <input type="text" placeholder="Tìm tên gói dịch vụ..." value={filters.keyword} onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))} className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 outline-none" />
                </div>
                <select value={filters.isActive === null ? "TRUE" : (filters.isActive ? "TRUE" : "FALSE")} onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value === "ALL" ? null : e.target.value === "TRUE" }))} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none w-full sm:w-64">
                    {/* <option value="ALL">Tất cả trạng thái</option> */}
                    <option value="TRUE">Đang mở bán</option>
                    <option value="FALSE">Đã khóa</option>
                </select>
            </div>

            {/* DATA TABLE */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                <th className="p-4 pl-6">Tên gói dịch vụ</th>
                                <th className="p-4">Giá bán</th>
                                <th className="p-4">Thời hạn & Số lần</th>
                                <th className="p-4">Trạng thái</th>
                                <th className="p-4 pr-6 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan="5" className="p-10 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} /></td></tr>
                            ) : packages.length === 0 ? (
                                <tr><td colSpan="5" className="p-10 text-center text-slate-500 font-medium">Chưa có gói dịch vụ nào.</td></tr>
                            ) : (
                                packages.map((pkg) => (
                                    <tr key={pkg.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                                                    {pkg.image ? <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="text-slate-400" size={20} /></div>}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-base">{pkg.name}</p>
                                                    <p className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-[250px]">{pkg.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-bold text-emerald-600 flex items-center gap-1 text-sm bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 inline-flex">
                                                <DollarSign size={14} /> {new Intl.NumberFormat('vi-VN').format(pkg.price || 0)}đ
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                                    <CalendarDays size={14} className="text-indigo-500" /> Hạn: {pkg.durationValue} {getUnitLabel(pkg.durationUnit)}
                                                </span>
                                                <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                                    <Repeat size={14} className="text-amber-500" /> Dùng: {pkg.usageTimes} lần
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${pkg.isActive ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                                {pkg.isActive ? <CheckCircle size={14} /> : <X size={14} />}
                                                {pkg.isActive ? 'Đang mở' : 'Đã khóa'}
                                            </span>
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(pkg)} className="p-2 bg-white text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg border border-slate-200"><Edit size={16} /></button>
                                                <button onClick={() => handleDeleteClick(pkg.id)} className="p-2 bg-white text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg border border-slate-200"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {!isLoading && totalPages > 1 && <div className="p-4 border-t border-slate-200 bg-slate-50"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /></div>}
            </div>

            {/* MODAL THÊM / SỬA */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl my-auto animate-in zoom-in-95 duration-300">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
                            <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                                <Briefcase className="text-indigo-600 bg-indigo-100 p-1.5 rounded-lg" size={32} />
                                {editingId ? 'Cập nhật Gói Dịch Vụ' : 'Thêm mới Gói Dịch Vụ'}
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-rose-50 text-slate-400 rounded-full"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleFormSubmitClick} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Cột Trái */}
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Tên gói <span className="text-rose-500">*</span></label>
                                        <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Giá bán (VNĐ) <span className="text-rose-500">*</span></label>
                                        <input required type="number" min="0" name="price" value={formData.price} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-mono" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Ảnh mô tả (File)</label>
                                        <div className="flex items-center gap-4">
                                            <input type="file" accept="image/*" onChange={handleFileChange} className="flex-1 text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
                                            {imagePreview && <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-sm" />}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Trạng thái kinh doanh</label>
                                        <select name="isActive" value={formData.isActive.toString()} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500">
                                            <option value="true">Đang kinh doanh (Active)</option>
                                            <option value="false">Tạm ngừng bán (Inactive)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Cột Phải */}
                                <div className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Giá trị thời hạn <span className="text-rose-500">*</span></label>
                                            <input required type="number" min="1" name="durationValue" value={formData.durationValue} onChange={handleInputChange} placeholder="VD: 3" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Đơn vị thời gian <span className="text-rose-500">*</span></label>
                                            <select required name="durationUnit" value={formData.durationUnit} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500">
                                                {durationUnits.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Số lần sử dụng dịch vụ <span className="text-rose-500">*</span></label>
                                        <input required type="number" min="1" name="usageTimes" value={formData.usageTimes} onChange={handleInputChange} placeholder="VD: Mua 1 gói dùng được 5 lần..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Mô tả chi tiết <span className="text-rose-500">*</span></label>
                                        <textarea required name="description" value={formData.description} onChange={handleInputChange} rows="4" placeholder="Nhập mô tả các dịch vụ đi kèm trong gói này..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 resize-none"></textarea>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Hủy</button>
                                <button type="submit" disabled={isSubmitting} className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:bg-indigo-400">
                                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Lưu dữ liệu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= MODAL & TOAST ================= */}
            <ToastContainer position="top-right" autoClose={3000} theme="colored" />

            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="text-center">
                            <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 ${confirmModal.isDanger ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                {confirmModal.isDanger ? <Trash2 size={32} /> : <Edit size={32} />}
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">{confirmModal.title}</h3>
                            <p className="text-slate-500 font-medium">{confirmModal.message}</p>
                        </div>
                        <div className="mt-8 flex gap-3 w-full">
                            <button type="button" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">Hủy bỏ</button>
                            <button type="button" onClick={confirmModal.onConfirm} className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-white shadow-md ${confirmModal.isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>Đồng ý</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}