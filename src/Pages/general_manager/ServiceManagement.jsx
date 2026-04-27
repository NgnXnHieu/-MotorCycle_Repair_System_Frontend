import React, { useState, useEffect } from 'react';
import {
    Settings, Plus, Edit, Trash2, Search, Loader2, Image as ImageIcon,
    X, DollarSign, Activity, AlignLeft
} from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { serviceApi } from '../../api/serviceApi';

export default function ServiceManagement() {

    // ================= QUẢN LÝ MODAL XÁC NHẬN =================
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false, title: '', message: '', onConfirm: null, isDanger: false
    });

    // ================= QUẢN LÝ FORM =================
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // State lưu dữ liệu text
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        status: true
    });

    // State mới dành riêng cho quản lý file và preview ảnh
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    // ================= QUẢN LÝ DATA & PHÂN TRANG =================
    const [isLoading, setIsLoading] = useState(true);
    const [services, setServices] = useState([]);

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [filters, setFilters] = useState({
        keyword: "",
        status: null
    });

    const [debouncedKeyword, setDebouncedKeyword] = useState("");

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedKeyword(filters.keyword), 500);
        return () => clearTimeout(handler);
    }, [filters.keyword]);

    useEffect(() => {
        setCurrentPage(0);
    }, [debouncedKeyword, filters.status]);

    // HÀM FETCH DATA CHÍNH
    const fetchServices = async () => {
        setIsLoading(true);
        try {
            const params = {
                searchName: debouncedKeyword.trim(),
                status: filters.status,
                page: currentPage,
                size: 10
            };

            const response = await serviceApi.getServicePage(params);
            const data = response.data || response;

            if (data.content) {
                setServices(data.content);
                setTotalPages(data.page?.totalPages || data.totalPages || 0);
            } else {
                setServices(data);
                setTotalPages(1);
            }

        } catch (error) {
            console.error("Lỗi khi tải danh sách dịch vụ:", error.response);
            toast.error("Không thể tải dữ liệu dịch vụ!");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, [currentPage, debouncedKeyword, filters.status]);

    // ================= XỬ LÝ SỰ KIỆN =================
    const handleAddNew = () => {
        setFormData({ name: '', description: '', price: '', status: true });
        setImageFile(null);
        setImagePreview('');
        setEditingId(null);
        setIsAddModalOpen(true);
    };

    const handleEdit = (service) => {
        setFormData({
            name: service.name || '',
            description: service.decription || '',
            price: service.price || '',
            status: service.status !== undefined ? service.status : true
        });
        setImageFile(null); // Reset file chọn mới
        setImagePreview(service.imageUrl || ''); // Load ảnh hiện tại trên DB để preview
        setEditingId(service.id);
        setIsAddModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Xóa dịch vụ?',
            message: 'Bạn có chắc chắn muốn xóa dịch vụ này? Dữ liệu không thể khôi phục.',
            isDanger: true,
            onConfirm: () => executeDelete(id)
        });
    };

    const executeDelete = async (id) => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
            await serviceApi.delete(id);
            toast.success("Đã xóa dịch vụ thành công!");
            fetchServices();
        } catch (error) {
            console.error("Lỗi xóa:", error);
            toast.error(error.response?.data?.message || "Có lỗi xảy ra khi xóa dịch vụ!");
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleStatusChange = (e) => {
        const booleanValue = e.target.value === 'true';
        setFormData(prev => ({ ...prev, status: booleanValue }));
    };

    // Hàm mới xử lý khi người dùng chọn file ảnh
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            // Tạo một URL tạm thời trên trình duyệt để preview ảnh ngay lập tức
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleFormSubmitClick = (e) => {
        e.preventDefault();

        // Validation nhỏ ở Frontend: Thêm mới thì bắt buộc phải chọn ảnh
        if (!editingId && !imageFile) {
            toast.warning("Vui lòng chọn ảnh cho dịch vụ mới!");
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: editingId ? 'Cập nhật dịch vụ?' : 'Thêm dịch vụ mới?',
            message: 'Hệ thống sẽ lưu lại các thông tin bạn vừa nhập.',
            isDanger: false,
            onConfirm: () => executeSubmit()
        });
    };

    const executeSubmit = async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setIsSubmitting(true);

        try {
            // 1. Tạo đối tượng FormData
            const payload = new FormData();

            // 2. Gom dữ liệu text thành DTO
            const dto = {
                name: formData.name,
                decription: formData.description,
                price: formData.price ? Number(formData.price) : 0.0,
                status: formData.status
            };

            // 3. Chú ý Backend: Thêm mới dùng @RequestPart("serviceForm"), Cập nhật dùng @RequestPart("serviceUpdateForm")
            const partName = editingId ? "serviceUpdateForm" : "serviceForm";
            payload.append(partName, new Blob([JSON.stringify(dto)], { type: 'application/json' }));

            // 4. Gắn file ảnh nếu người dùng có chọn
            if (imageFile) {
                payload.append("file", imageFile);
            }

            // 5. Gửi request
            if (editingId) {
                await serviceApi.update(editingId, payload);
                toast.success("Cập nhật dịch vụ thành công!");
            } else {
                await serviceApi.create(payload);
                toast.success("Thêm mới dịch vụ thành công!");
            }

            setIsAddModalOpen(false);
            fetchServices();

        } catch (error) {
            console.error("Lỗi khi submit:", error.response);
            const errorMsg = error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!";
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 sm:p-10 bg-slate-50 min-h-screen">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Settings className="text-indigo-600" size={32} /> Quản lý Dịch vụ
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Danh sách các dịch vụ sửa chữa và bảo dưỡng xe.</p>
                </div>
                <button onClick={handleAddNew} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/20">
                    <Plus size={20} /> Thêm dịch vụ
                </button>
            </div>

            {/* TOOLBAR LỌC */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 w-full ">
                <div className="relative md:col-span-2">
                    <Search className="absolute inset-y-0 left-4 my-auto text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm tên dịch vụ..."
                        value={filters.keyword}
                        onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    />
                </div>
                <select
                    value={filters.status === null ? "ALL" : (filters.status ? "TRUE" : "FALSE")}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value === "ALL" ? null : e.target.value === "TRUE" }))}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none transition-all"
                >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="TRUE">🟢 Đang hoạt động</option>
                    <option value="FALSE">🔴 Tạm ngừng</option>
                </select>
            </div>

            {/* DATA TABLE */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                            <th className="p-4 pl-6 w-2/5">Thông tin Dịch vụ</th>
                            <th className="p-4">Giá Dịch vụ</th>
                            <th className="p-4">Trạng thái</th>
                            <th className="p-4 pr-6 text-right w-32">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr><td colSpan="4" className="p-10 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} /></td></tr>
                        ) : services.length === 0 ? (
                            <tr><td colSpan="4" className="p-10 text-center text-slate-500 font-medium">Chưa có dịch vụ nào.</td></tr>
                        ) : (
                            services.map((service) => (
                                <tr key={service.id} className="hover:bg-slate-50/80 transition-colors group">
                                    {/* Cột Thông tin */}
                                    <td className="p-4 pl-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 mt-1">
                                                {service.imageUrl ? (
                                                    <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center"><ImageIcon className="text-slate-400" size={20} /></div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-base mb-1">{service.name}</p>
                                                <div className="flex items-start gap-1.5 text-slate-500 text-sm">
                                                    <AlignLeft size={14} className="mt-0.5 flex-shrink-0" />
                                                    <span className="line-clamp-2">{service.decription}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    {/* Cột Giá */}
                                    <td className="p-4">
                                        <span className="font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg w-max border border-emerald-100">
                                            <DollarSign size={16} /> {new Intl.NumberFormat('vi-VN').format(service.price || 0)} đ
                                        </span>
                                    </td>
                                    {/* Cột Trạng thái */}
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${service.status
                                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                            : 'bg-rose-100 text-rose-700 border border-rose-200'
                                            }`}>
                                            <Activity size={14} />
                                            {service.status ? 'Đang hoạt động' : 'Tạm ngừng'}
                                        </span>
                                    </td>
                                    {/* Hành động */}
                                    <td className="p-4 pr-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(service)} className="p-2 bg-white text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg border border-slate-200"><Edit size={16} /></button>
                                            <button onClick={() => handleDeleteClick(service.id)} className="p-2 bg-white text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg border border-slate-200"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {!isLoading && totalPages > 1 && <div className="p-4 border-t border-slate-200 bg-slate-50"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /></div>}
            </div>

            {/* MODAL THÊM / SỬA */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl my-auto animate-in zoom-in-95 duration-300">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
                            <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                                <Settings className="text-indigo-600 bg-indigo-100 p-1.5 rounded-lg" size={32} />
                                {editingId ? 'Cập nhật Dịch vụ' : 'Thêm mới Dịch vụ'}
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-rose-50 text-slate-400 rounded-full"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleFormSubmitClick} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                {/* Cột Trái: Cấu hình cơ bản */}
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Tên dịch vụ <span className="text-rose-500">*</span></label>
                                        <input required type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="VD: Bảo dưỡng toàn bộ xe tay ga..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Mô tả dịch vụ <span className="text-rose-500">*</span></label>
                                        <textarea required name="description" value={formData.description} onChange={handleInputChange} rows="5" placeholder="Mô tả chi tiết các bước, lợi ích của dịch vụ..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 resize-none"></textarea>
                                    </div>
                                </div>

                                {/* Cột Phải: Giá & Hình ảnh */}
                                <div className="space-y-5 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                    <div>
                                        <label className="block text-sm font-bold text-emerald-700 mb-1">Mức giá (VNĐ) <span className="text-rose-500">*</span></label>
                                        <input required type="number" min="0" step="1000" name="price" value={formData.price} onChange={handleInputChange} placeholder="VD: 150000" className="w-full px-4 py-2.5 bg-white border border-emerald-200 rounded-xl outline-none focus:border-emerald-500 font-mono font-bold text-emerald-700" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Trạng thái <span className="text-rose-500">*</span></label>
                                        <select name="status" value={formData?.status?.toString()} onChange={handleStatusChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-slate-700">
                                            <option value="true">🟢 Đang hoạt động</option>
                                            <option value="false">🔴 Tạm ngừng</option>
                                        </select>
                                    </div>

                                    {/* --- VÙNG UPLOAD VÀ PREVIEW ẢNH --- */}
                                    <div className="border-t border-slate-200 pt-4">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Ảnh đại diện Dịch vụ</label>
                                        <div className="flex gap-4 items-start">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="flex-1 text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer outline-none"
                                            />

                                            {/* Khung Preview Ảnh */}
                                            <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden flex-shrink-0">
                                                {imagePreview ? (
                                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                                                ) : null}
                                                <ImageIcon size={24} className={`text-slate-300 ${imagePreview ? 'hidden' : 'block'}`} />
                                            </div>
                                        </div>
                                        {editingId && !imageFile && (
                                            <p className="text-xs text-slate-400 mt-2 italic">* Giữ trống nếu không muốn thay đổi ảnh hiện tại.</p>
                                        )}
                                    </div>

                                </div>
                            </div>

                            <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Hủy</button>
                                <button type="submit" disabled={isSubmitting} className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:bg-indigo-400 shadow-md">
                                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Lưu dữ liệu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= COMPONENT THÔNG BÁO ================= */}
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={true}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
            />

            {/* ================= MODAL XÁC NHẬN ================= */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="text-center">
                            <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 ${confirmModal.isDanger ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                {confirmModal.isDanger ? <Trash2 size={32} /> : <Edit size={32} />}
                            </div>

                            <h3 className="text-xl font-black text-slate-800 mb-2">
                                {confirmModal.title}
                            </h3>
                            <p className="text-slate-500 font-medium">
                                {confirmModal.message}
                            </p>
                        </div>

                        <div className="mt-8 flex gap-3 w-full">
                            <button
                                type="button"
                                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                onClick={confirmModal.onConfirm}
                                className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-white transition-all active:scale-95 shadow-md ${confirmModal.isDanger
                                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                                    }`}
                            >
                                Đồng ý
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}