import React, { useState, useEffect } from 'react';
import {
    Layers, Plus, Edit, Trash2, Search, Loader2, X, Tag, Activity
} from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { categoryApi } from '../../api/categoryApi';

export default function CategoryManagement() {

    // ================= QUẢN LÝ MODAL XÁC NHẬN =================
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false, title: '', message: '', onConfirm: null, isDanger: false
    });

    // ================= QUẢN LÝ FORM =================
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // State cập nhật theo Backend DTO: chỉ có name và status (Boolean)
    const [formData, setFormData] = useState({
        name: '',
        status: true // Mặc định khi thêm mới là true (Đang hoạt động)
    });

    // ================= QUẢN LÝ DATA & PHÂN TRANG =================
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState([]);

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Filter params
    const [filters, setFilters] = useState({
        keyword: "",
        status: true
    });

    const [debouncedKeyword, setDebouncedKeyword] = useState("");

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedKeyword(filters.keyword), 500);
        return () => clearTimeout(handler);
    }, [filters.keyword]);

    useEffect(() => {
        setCurrentPage(0);
    }, [debouncedKeyword]);

    // HÀM FETCH DATA CHÍNH
    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const params = {
                searchName: debouncedKeyword.trim(),
                page: currentPage,
                size: 10
            };

            const response = await categoryApi.getAllCategory(params);
            const data = response.data || response;

            if (data.content) {
                setCategories(data.content);
                setTotalPages(data.page?.totalPages || data.totalPages || 0);
            } else {
                setCategories(data);
                setTotalPages(1);
            }

        } catch (error) {
            console.error("Lỗi khi tải danh mục:", error);
            toast.error("Không thể tải dữ liệu danh mục!");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [currentPage, debouncedKeyword]);

    // ================= XỬ LÝ SỰ KIỆN =================
    const handleAddNew = () => {
        setFormData({ name: '', status: true });
        setEditingId(null);
        setIsAddModalOpen(true);
    };

    const handleEdit = (category) => {
        setFormData({
            name: category.name || '',
            // Đảm bảo status là boolean, nếu undefined thì mặc định là true
            status: category.status !== undefined ? category.status : true
        });
        setEditingId(category.id);
        setIsAddModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Xóa danh mục?',
            message: 'Bạn có chắc chắn muốn xóa danh mục này? Các vật tư thuộc danh mục này có thể bị ảnh hưởng.',
            isDanger: true,
            onConfirm: () => executeDelete(id)
        });
    };

    const executeDelete = async (id) => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
            await categoryApi.delete(id);
            toast.success("Đã xóa danh mục thành công!");
            fetchCategories();
        } catch (error) {
            console.error("Lỗi xóa:", error);
            if (error.response?.status === 409) {
                toast.error("Không thể xóa danh mục đang có chứa vật tư!");
            } else {
                toast.error(error.response?.data?.message || "Có lỗi xảy ra khi xóa danh mục!");
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleStatusChange = (e) => {
        // Chuyển chuỗi 'true'/'false' từ thẻ select thành kiểu Boolean
        const booleanValue = e.target.value === 'true';
        setFormData(prev => ({ ...prev, status: booleanValue }));
    };

    const handleFormSubmitClick = (e) => {
        e.preventDefault();
        setConfirmModal({
            isOpen: true,
            title: editingId ? 'Cập nhật danh mục?' : 'Thêm danh mục mới?',
            message: 'Hệ thống sẽ lưu lại các thông tin bạn vừa nhập.',
            isDanger: false,
            onConfirm: () => executeSubmit()
        });
    };

    const executeSubmit = async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setIsSubmitting(true);

        try {
            // Gửi dữ liệu khớp với DTO (name: String, status: Boolean)
            const payload = {
                name: formData.name,
                status: formData.status
            };

            if (editingId) {
                await categoryApi.update(editingId, payload);
                toast.success("Cập nhật danh mục thành công!");
            } else {
                await categoryApi.create(payload);
                toast.success("Thêm mới danh mục thành công!");
            }

            setIsAddModalOpen(false);
            fetchCategories();

        } catch (error) {
            console.error("Lỗi khi submit:", error);
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
                        <Layers className="text-indigo-600" size={32} /> Quản lý Danh mục
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Phân loại các linh kiện và dịch vụ sửa chữa.</p>
                </div>
                <button onClick={handleAddNew} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/20">
                    <Plus size={20} /> Thêm danh mục
                </button>
            </div>

            {/* TOOLBAR LỌC (Dành cho Quản lý Vật tư) */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">

                {/* Thanh tìm kiếm: Chiếm 2/4 (tức 1/2) */}
                <div className="relative md:col-span-2">
                    <Search className="absolute inset-y-0 left-4 my-auto text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm tên vật tư..."
                        value={filters.keyword}
                        onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 outline-none transition-all"
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
                            <th className="p-4 pl-6 w-1/2">Tên Danh Mục</th>
                            <th className="p-4 w-1/3">Trạng Thái</th>
                            <th className="p-4 pr-6 text-right w-32">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr><td colSpan="3" className="p-10 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} /></td></tr>
                        ) : categories.length === 0 ? (
                            <tr><td colSpan="3" className="p-10 text-center text-slate-500 font-medium">Chưa có danh mục nào.</td></tr>
                        ) : (
                            categories.map((cat) => (
                                <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors group">
                                    {/* Cột Tên */}
                                    <td className="p-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600">
                                                <Tag size={18} />
                                            </div>
                                            <p className="font-bold text-slate-900 text-base">{cat.name}</p>
                                        </div>
                                    </td>
                                    {/* Cột Trạng thái */}
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cat.status
                                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                : 'bg-rose-100 text-rose-700 border border-rose-200'
                                                }`}>
                                                <Activity size={14} />
                                                {cat.status ? 'Đang hoạt động' : 'Tạm khóa'}
                                            </span>
                                        </div>
                                    </td>
                                    {/* Hành động */}
                                    <td className="p-4 pr-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(cat)} className="p-2 bg-white text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg border border-slate-200"><Edit size={16} /></button>
                                            <button onClick={() => handleDeleteClick(cat.id)} className="p-2 bg-white text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg border border-slate-200"><Trash2 size={16} /></button>
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
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl my-auto animate-in zoom-in-95 duration-300">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
                            <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                                <Layers className="text-indigo-600 bg-indigo-100 p-1.5 rounded-lg" size={32} />
                                {editingId ? 'Cập nhật Danh mục' : 'Thêm Danh mục mới'}
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-rose-50 text-slate-400 rounded-full"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleFormSubmitClick} className="p-6">
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Tên danh mục <span className="text-rose-500">*</span></label>
                                    <input
                                        required
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="VD: Dầu nhớt, Phụ tùng Honda..."
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Trạng thái <span className="text-rose-500">*</span></label>
                                    <select
                                        name="status"
                                        value={formData.status.toString()} // Ép kiểu về string để select nhận diện được 'true' / 'false'
                                        onChange={handleStatusChange}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white font-medium text-slate-700 transition-colors"
                                    >
                                        <option value="true">🟢 Đang hoạt động</option>
                                        <option value="false">🔴 Tạm khóa</option>
                                    </select>
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