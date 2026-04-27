import React, { useState, useEffect } from 'react';
import {
    Package, Plus, Edit, Trash2, Search, Loader2, Image as ImageIcon,
    X, Tag, DollarSign, Layers, Archive, Wrench, ShieldCheck, UploadCloud
} from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { itemApi } from '../../api/itemApi';
import { categoryApi } from '../../api/categoryApi';
// TODO: Đảm bảo bạn đã import branchApi đúng đường dẫn
import { branchApi } from '../../api/branchApi';

export default function ItemManagement() {

    // ================= QUẢN LÝ MODAL XÁC NHẬN & ZOOM ẢNH =================
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false, title: '', message: '', onConfirm: null, isDanger: false
    });
    const [zoomImageUrl, setZoomImageUrl] = useState(null); // State quản lý ảnh phóng to

    // ================= QUẢN LÝ FORM =================
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        brand: '',
        dimension: '',
        price: '',
        default_labor_fee: '',
        totalStockQuantity: '',
        warranty_year: '',
        categoryId: '',
        description: ''
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    // ================= QUẢN LÝ DATA & PHÂN TRANG =================
    const [isLoading, setIsLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [branches, setBranches] = useState([]);

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Filter params
    const [filters, setFilters] = useState({
        keyword: "",
        categoryId: "",
        isInstock: null,
        branchId: ""
    });

    const [debouncedKeyword, setDebouncedKeyword] = useState("");

    // Gọi API lấy Danh mục & Chi nhánh ban đầu
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [catRes, branchRes] = await Promise.all([
                    categoryApi.getAllCategory(),
                    branchApi.getBranchList()
                ]);

                setCategories(catRes.content || []);
                const branchData = Array.isArray(branchRes) ? branchRes : (branchRes?.data || branchRes?.content || []);
                setBranches(branchData);
            } catch (error) {
                console.error("Lỗi tải dữ liệu ban đầu", error);
            }
        }
        fetchInitialData();
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedKeyword(filters.keyword), 500);
        return () => clearTimeout(handler);
    }, [filters.keyword]);

    useEffect(() => {
        setCurrentPage(0);
    }, [debouncedKeyword, filters.categoryId, filters.isInstock, filters.branchId]);

    // HÀM FETCH DATA CHÍNH DÙNG 2 API
    const fetchItems = async () => {
        setIsLoading(true);
        try {
            const formPayload = {
                searchName: debouncedKeyword.trim(),
                categoryId: filters.categoryId || null,
                isInstock: filters.isInstock,
                page: currentPage,
                size: 10
            };

            let response;
            if (filters.branchId) {
                formPayload.branchId = filters.branchId;
                response = await itemApi.getItemForStaff(formPayload);
            } else {
                response = await itemApi.getItem4GBM(formPayload);
            }

            const data = response.data || response;
            setItems(data.content || []);
            setTotalPages(data.page?.totalPages || 0);
            setTotalElements(data.page?.totalElements || 0);

        } catch (error) {
            console.error("Lỗi khi tải danh sách:", error);
            toast.error("Không thể tải dữ liệu!");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [currentPage, debouncedKeyword, filters.categoryId, filters.isInstock, filters.branchId]);

    // ================= XỬ LÝ SỰ KIỆN =================
    const handleAddNew = () => {
        setFormData({
            name: '', brand: '', dimension: '', price: '', default_labor_fee: '',
            totalStockQuantity: '', warranty_year: '', categoryId: '', description: ''
        });
        setImageFile(null);
        setImagePreview('');
        setEditingId(null);
        setIsAddModalOpen(true);
    };

    const handleEdit = async (itemWrapper) => {
        const itemId = itemWrapper.itemSimpleDTO ? itemWrapper.itemSimpleDTO.id : itemWrapper.id;
        try {
            const response = await itemApi.getItemByID(itemId);
            const detailData = response.data || response;

            setFormData({
                name: detailData.name || '',
                brand: detailData.brand || '',
                dimension: detailData.dimension || '',
                price: detailData.price || '',
                default_labor_fee: detailData.default_labor_fee || '',
                totalStockQuantity: detailData.totalStockQuantity || 0,
                warranty_year: detailData.warranty_year || '',
                categoryId: detailData.categoryDTO?.id || '',
                description: detailData.decription || ''
            });
            setImageFile(null);
            setImagePreview(detailData.imageUrl || '');
            setEditingId(detailData.id);
            setIsAddModalOpen(true);
        } catch (error) {
            console.error("Lỗi khi tải thông tin chi tiết:", error);
            toast.error("Không thể tải dữ liệu chi tiết của vật tư này!");
        }
    };

    const handleDeleteClick = (itemWrapper) => {
        const itemId = itemWrapper.itemSimpleDTO ? itemWrapper.itemSimpleDTO.id : itemWrapper.id;
        setConfirmModal({
            isOpen: true, title: 'Xóa vật tư?',
            message: 'Bạn có chắc chắn muốn xóa vật tư này? Dữ liệu không thể khôi phục.',
            isDanger: true, onConfirm: () => executeDelete(itemId)
        });
    };

    const executeDelete = async (id) => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
            await itemApi.deleta(id);
            toast.success("Đã xóa vật tư thành công!");
            fetchItems();
        } catch (error) {
            console.error("Lỗi xóa:", error);
            toast.error(error.response?.data?.message || "Có lỗi xảy ra khi xóa vật tư!");
        }
    };

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

    // KIỂM TRA VALIDATE ĐẦY ĐỦ TRƯỚC KHI SUBMIT
    const handleFormSubmitClick = (e) => {
        e.preventDefault();

        // 1. Kiểm tra các trường dữ liệu text/number
        const { name, brand, dimension, price, default_labor_fee, totalStockQuantity, warranty_year, categoryId, description } = formData;

        if (!name || !brand || !dimension || !price || !default_labor_fee || totalStockQuantity === '' || !warranty_year || !categoryId || !description) {
            toast.warn("Vui lòng nhập đầy đủ tất cả các trường thông tin!");
            return;
        }

        // 2. Kiểm tra ảnh (Phải có file chọn mới hoặc đã có preview từ trước khi edit)
        if (!imageFile && !imagePreview) {
            toast.warn("Vui lòng chọn ảnh cho vật tư!");
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: editingId ? 'Cập nhật vật tư?' : 'Thêm vật tư mới?',
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

            const itemFormDTO = {
                name: formData.name,
                dimension: formData.dimension || null,
                warranty_year: formData.warranty_year ? Number(formData.warranty_year) : null,
                price: formData.price ? Number(formData.price) : null,
                decription: formData.description,
                default_labor_fee: formData.default_labor_fee ? Number(formData.default_labor_fee) : null,
                brand: formData.brand,
                category_id: formData.categoryId ? Number(formData.categoryId) : null
            };

            payload.append(
                'itemForm',
                new Blob([JSON.stringify(itemFormDTO)], { type: 'application/json' })
            );

            if (imageFile) {
                payload.append('image', imageFile);
            }

            if (editingId) {
                await itemApi.update(editingId, payload);
                toast.success("Cập nhật vật tư thành công!");
            } else {
                await itemApi.create(payload);
                toast.success("Thêm mới vật tư thành công!");
            }

            setIsAddModalOpen(false);
            fetchItems();

        } catch (error) {
            console.error("Lỗi khi submit:", error.response);
            const errorMsg = error?.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!";
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
                        <Package className="text-indigo-600" size={32} /> Quản lý Vật tư & Phụ tùng
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Danh sách linh kiện, phụ tùng và công thợ sửa chữa.</p>
                </div>
                <button onClick={handleAddNew} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/20">
                    <Plus size={20} /> Thêm vật tư
                </button>
            </div>

            {/* TOOLBAR LỌC */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                    <Search className="absolute inset-y-0 left-4 my-auto text-slate-400" size={18} />
                    <input type="text" placeholder="Tìm tên vật tư..." value={filters.keyword} onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))} className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 outline-none" />
                </div>
                <select value={filters.categoryId} onChange={(e) => setFilters(prev => ({ ...prev, categoryId: e.target.value }))} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none">
                    <option value="">Tất cả danh mục</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <select value={filters.isInstock === null ? "ALL" : (filters.isInstock ? "TRUE" : "FALSE")} onChange={(e) => setFilters(prev => ({ ...prev, isInstock: e.target.value === "ALL" ? null : e.target.value === "TRUE" }))} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none">
                    <option value="ALL">Tất cả kho hàng</option>
                    <option value="TRUE">Còn hàng trong kho </option>
                    <option value="FALSE">Đã hết hàng </option>
                </select>
                <select value={filters.branchId} onChange={(e) => setFilters(prev => ({ ...prev, branchId: e.target.value }))} className="px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-sm font-bold text-indigo-700 outline-none">
                    <option value="">Tất cả chi nhánh</option>
                    {branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                </select>
            </div>

            {/* HIỂN THỊ TỔNG SỐ LƯỢNG */}
            {!isLoading && (
                <div className="mb-4 flex justify-end">
                    <div className="bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm text-sm font-medium text-slate-600">
                        Có tất cả <span className="font-bold text-indigo-600 text-base mx-1">{totalElements}</span> sản phẩm
                    </div>
                </div>
            )}

            {/* DATA TABLE */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                            <th className="p-4 pl-6">Thông tin chi tiết</th>
                            <th className="p-4">Danh mục</th>
                            <th className="p-4">Bảng Giá</th>
                            <th className="p-4">Tồn kho</th>
                            <th className="p-4 pr-6 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr><td colSpan="5" className="p-10 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} /></td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan="5" className="p-10 text-center text-slate-500 font-medium">Chưa có vật tư nào.</td></tr>
                        ) : (
                            items.map((itemWrapper, index) => {
                                const item = itemWrapper.itemSimpleDTO || itemWrapper;
                                const stock = itemWrapper.stockQuantity !== undefined
                                    ? itemWrapper.stockQuantity
                                    : (item.totalStockQuantity || 0);

                                const itemKey = item?.id || `fallback-key-${index}`;

                                return (
                                    <tr key={itemKey} className="hover:bg-slate-50/80 transition-colors group">
                                        {/* Cột Thông tin */}
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-4">
                                                {/* GẮN SỰ KIỆN ZOOM ẢNH TẠI ĐÂY */}
                                                <div
                                                    className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all"
                                                    onClick={() => item?.imageUrl && setZoomImageUrl(item.imageUrl)}
                                                    title="Bấm để xem ảnh lớn"
                                                >
                                                    {item?.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="text-slate-400" size={20} /></div>}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-base">{item?.name || 'Không có tên'}</p>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        {item?.brand && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">{item.brand}</span>}
                                                        {item?.dimension && <span className="text-xs text-slate-500 font-mono"><Tag size={12} className="inline mr-1 text-indigo-500" />{item.dimension}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Danh mục */}
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium text-sm">
                                                <Layers size={16} className="text-slate-400" /> {item?.categoryDTO?.name || '---'}
                                            </span>
                                        </td>
                                        {/* Giá & Công */}
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="font-bold text-emerald-600 flex items-center gap-1 text-sm">
                                                    <DollarSign size={14} /> Bán: {new Intl.NumberFormat('vi-VN').format(item?.price || 0)}đ
                                                </span>
                                                <span className="font-bold text-amber-600 flex items-center gap-1 text-sm">
                                                    <Wrench size={14} /> Công: {new Intl.NumberFormat('vi-VN').format(item?.default_labor_fee || 0)}đ
                                                </span>
                                            </div>
                                        </td>
                                        {/* Tồn kho & BH */}
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1.5">
                                                <span className={`text-sm font-bold flex items-center gap-1 ${stock > 0 ? 'text-slate-700' : 'text-rose-500'}`}>
                                                    <Archive size={14} /> Kho: {stock}
                                                </span>
                                                {item?.warranty_year > 0 && (
                                                    <span className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                                                        <ShieldCheck size={14} /> BH: {item.warranty_year} năm
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        {/* Hành động */}
                                        <td className="p-4 pr-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(itemWrapper)} className="p-2 bg-white text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg border border-slate-200"><Edit size={16} /></button>
                                                <button onClick={() => handleDeleteClick(itemWrapper)} className="p-2 bg-white text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg border border-slate-200"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
                {!isLoading && totalPages > 1 && <div className="p-4 border-t border-slate-200 bg-slate-50"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /></div>}
            </div>

            {/* MODAL THÊM / SỬA */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl my-auto animate-in zoom-in-95 duration-300">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
                            <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                                <Package className="text-indigo-600 bg-indigo-100 p-1.5 rounded-lg" size={32} />
                                {editingId ? 'Cập nhật Vật tư' : 'Thêm mới Vật tư'}
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-rose-50 text-slate-400 rounded-full"><X size={24} /></button>
                        </div>

                        {/* LOẠI BỎ 'required' Ở INPUT HTML ĐỂ CUSTOM TOAST HOẠT ĐỘNG */}
                        <form onSubmit={handleFormSubmitClick} className="p-6 flex flex-col gap-8">

                            {/* PHẦN ẢNH ĐƯỢC ĐƯA LÊN ĐẦU VÀ LÀM TO HƠN GẤP 3 (w-48 h-48) */}
                            <div className="flex flex-col items-center justify-center w-full">
                                <label className="block text-sm font-bold text-slate-700 mb-3 text-center">Ảnh sản phẩm <span className="text-rose-500">*</span></label>
                                <div className="relative group cursor-pointer w-48 h-48 rounded-2xl overflow-hidden border-2 border-dashed border-indigo-300 bg-indigo-50 hover:bg-indigo-100 transition-colors flex items-center justify-center shadow-inner">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center text-indigo-400">
                                            <UploadCloud size={40} className="mb-2" />
                                            <span className="text-xs font-semibold px-4 text-center">Nhấn để tải ảnh lên</span>
                                        </div>
                                    )}
                                    {/* Lớp phủ khi hover */}
                                    {imagePreview && (
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-0">
                                            <span className="text-white font-semibold text-sm flex items-center gap-2"><Edit size={16} /> Đổi ảnh</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* CÁC THÔNG TIN KHÁC */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 border-t border-slate-100 pt-6">
                                {/* Cột Trái: Cấu hình cơ bản */}
                                <div className="md:col-span-7 space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Tên vật tư <span className="text-rose-500">*</span></label>
                                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Thương hiệu <span className="text-rose-500">*</span></label>
                                            <input type="text" name="brand" value={formData.brand} onChange={handleInputChange} placeholder="VD: NGK, Michelin" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Thông số / Kích thước <span className="text-rose-500">*</span></label>
                                            <input type="text" name="dimension" value={formData.dimension} onChange={handleInputChange} placeholder="VD: 90/90-14" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-mono" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Danh mục <span className="text-rose-500">*</span></label>
                                            <select name="categoryId" value={formData.categoryId} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500">
                                                <option value="" disabled>Chọn...</option>
                                                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Thời gian BH (Năm) <span className="text-rose-500">*</span></label>
                                            <input type="number" min="0" step="1" name="warranty_year" value={formData.warranty_year} onChange={handleInputChange} placeholder="VD: 1" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* Cột Phải: Giá cả & Kho */}
                                <div className="md:col-span-5 space-y-5 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                    <div>
                                        <label className="block text-sm font-bold text-emerald-700 mb-1">Giá bán vật tư (VNĐ) <span className="text-rose-500">*</span></label>
                                        <input type="number" min="0" name="price" value={formData.price} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-emerald-200 rounded-xl outline-none focus:border-emerald-500 font-mono font-bold text-emerald-700" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-amber-700 mb-1">Phí công thợ (VNĐ) <span className="text-rose-500">*</span></label>
                                        <input type="number" min="0" name="default_labor_fee" value={formData.default_labor_fee} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl outline-none focus:border-amber-500 font-mono font-bold text-amber-700" />
                                    </div>
                                    <div className="border-t border-slate-200 pt-4">
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Tồn kho ban đầu <span className="text-rose-500">*</span></label>
                                        <input type="number" min="0" name="totalStockQuantity" value={formData.totalStockQuantity} onChange={handleInputChange} disabled={!!editingId} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none disabled:bg-slate-200 disabled:text-slate-500" />
                                        {!!editingId && <p className="text-xs text-rose-500 mt-1">* Không thể sửa tồn kho tại đây, hãy dùng chức năng Nhập kho.</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Mô tả <span className="text-rose-500">*</span></label>
                                        <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none resize-none"></textarea>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-2 pt-5 border-t border-slate-100 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Hủy</button>
                                <button type="submit" disabled={isSubmitting} className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:bg-indigo-400">
                                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Lưu dữ liệu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= MODAL PHÓNG TO ẢNH (ZOOM IMAGE) ================= */}
            {zoomImageUrl && (
                <div
                    className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setZoomImageUrl(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setZoomImageUrl(null)}
                            className="absolute -top-12 right-0 md:-right-12 text-white hover:text-rose-400 bg-slate-800/50 hover:bg-slate-800 p-2 rounded-full transition-all"
                        >
                            <X size={28} />
                        </button>
                        <img
                            src={zoomImageUrl}
                            alt="Phóng to sản phẩm"
                            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
                        />
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

            {/* ================= MODAL XÁC NHẬN (CONFIRM DIALOG) ================= */}
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