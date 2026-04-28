import React, { useState, useEffect } from 'react';
import {
    Package, Search, Loader2, Image as ImageIcon,
    X, Tag, DollarSign, Layers, ShieldCheck, Info, Archive
} from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { itemApi } from '../../api/itemApi';
import { categoryApi } from '../../api/categoryApi';

export default function StaffItemManagement() {

    // ================= QUẢN LÝ ZOOM ẢNH & CHI TIẾT =================
    const [zoomImageUrl, setZoomImageUrl] = useState(null);
    const [detailModal, setDetailModal] = useState({
        isOpen: false,
        isLoading: false,
        data: null
    });

    // ================= QUẢN LÝ DATA & PHÂN TRANG =================
    const [isLoading, setIsLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const [filters, setFilters] = useState({
        keyword: "",
        categoryId: "",
        isInstock: null,
    });

    const [debouncedKeyword, setDebouncedKeyword] = useState("");

    // Gọi API lấy Danh mục ban đầu
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const catRes = await categoryApi.getAllCategory();
                setCategories(catRes.content || []);
            } catch (error) {
                console.error("Lỗi tải danh mục", error);
            }
        }
        fetchCategories();
    }, []);

    // Xử lý delay tìm kiếm
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedKeyword(filters.keyword), 500);
        return () => clearTimeout(handler);
    }, [filters.keyword]);

    useEffect(() => {
        setCurrentPage(0);
    }, [debouncedKeyword, filters.categoryId, filters.isInstock]);

    // ================= HÀM FETCH DATA =================
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

            const response = await itemApi.getItemForStaff(formPayload);
            const data = response.data || response;

            setItems(data.content || []);
            setTotalPages(data.page?.totalPages || 0);
            setTotalElements(data.page?.totalElements || 0);

        } catch (error) {
            console.error("Lỗi khi tải danh sách:", error);
            toast.error("Không thể tải dữ liệu sản phẩm!");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [currentPage, debouncedKeyword, filters.categoryId, filters.isInstock]);

    // ================= XEM CHI TIẾT SẢN PHẨM =================
    const handleViewDetail = async (id) => {
        setDetailModal({ isOpen: true, isLoading: true, data: null });
        try {
            const response = await itemApi.getItemByID(id);
            const detailData = response.data || response;
            setDetailModal({ isOpen: true, isLoading: false, data: detailData });
        } catch (error) {
            console.error("Lỗi tải chi tiết:", error);
            toast.error("Không thể tải thông tin chi tiết!");
            setDetailModal({ isOpen: false, isLoading: false, data: null });
        }
    };

    return (
        <div className="p-6 sm:p-10 bg-slate-50 min-h-screen">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Package className="text-indigo-600" size={32} /> Tra cứu Phụ tùng
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Tra cứu số lượng tồn kho và thông tin vật tư cho thợ sửa.</p>
                </div>
            </div>

            {/* TOOLBAR LỌC */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                    <Search className="absolute inset-y-0 left-4 my-auto text-slate-400" size={18} />
                    <input type="text" placeholder="Tìm tên vật tư..." value={filters.keyword} onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))} className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 outline-none" />
                </div>
                <select value={filters.categoryId} onChange={(e) => setFilters(prev => ({ ...prev, categoryId: e.target.value }))} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none cursor-pointer">
                    <option value="">Tất cả danh mục</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <select value={filters.isInstock === null ? "ALL" : (filters.isInstock ? "TRUE" : "FALSE")} onChange={(e) => setFilters(prev => ({ ...prev, isInstock: e.target.value === "ALL" ? null : e.target.value === "TRUE" }))} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none cursor-pointer">
                    <option value="ALL">Tất cả kho hàng</option>
                    <option value="TRUE">Còn hàng trong kho </option>
                    <option value="FALSE">Đã hết hàng </option>
                </select>
            </div>

            {/* HIỂN THỊ TỔNG SỐ LƯỢNG */}
            {!isLoading && (
                <div className="mb-4 flex justify-end">
                    <div className="bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm text-sm font-medium text-slate-600">
                        Hệ thống ghi nhận <span className="font-bold text-indigo-600 text-base mx-1">{totalElements}</span> sản phẩm
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
                            <th className="p-4">Giá Bán</th>
                            <th className="p-4 pr-6">Tồn kho</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr><td colSpan="4" className="p-10 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} /></td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan="4" className="p-10 text-center text-slate-500 font-medium">Không tìm thấy vật tư nào phù hợp.</td></tr>
                        ) : (
                            items.map((itemWrapper, index) => {
                                const item = itemWrapper.itemSimpleDTO || itemWrapper;
                                const stock = itemWrapper.stockQuantity !== undefined
                                    ? itemWrapper.stockQuantity
                                    : (item.totalStockQuantity || 0);
                                const itemKey = item?.id || `fallback-key-${index}`;

                                return (
                                    <tr key={itemKey} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all"
                                                    onClick={() => item?.imageUrl && setZoomImageUrl(item.imageUrl)}
                                                    title="Bấm để xem ảnh lớn"
                                                >
                                                    {item?.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="text-slate-400" size={20} /></div>}
                                                </div>
                                                <div>
                                                    <p
                                                        onClick={() => handleViewDetail(item.id)}
                                                        className="font-bold text-slate-900 text-base cursor-pointer hover:text-indigo-600 hover:underline flex items-center gap-1"
                                                        title="Xem thông tin chi tiết"
                                                    >
                                                        {item?.name || 'Không có tên'}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        {item?.brand && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">{item.brand}</span>}
                                                        {item?.dimension && <span className="text-xs text-slate-500 font-mono"><Tag size={12} className="inline mr-1 text-indigo-500" />{item.dimension}</span>}

                                                        {item?.warranty_year > 0 && (
                                                            <span className="text-xs text-indigo-600 font-medium flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                                                <ShieldCheck size={12} /> BH: {item.warranty_year} năm
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium text-sm">
                                                <Layers size={16} className="text-slate-400" /> {item?.categoryDTO?.name || '---'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-bold text-emerald-600 flex items-center gap-1 text-sm">
                                                <DollarSign size={14} /> {new Intl.NumberFormat('vi-VN').format(item?.price || 0)}đ
                                            </span>
                                        </td>
                                        <td className="p-4 pr-6">
                                            <div className="flex flex-col gap-1.5">
                                                <span className={`text-sm font-bold flex items-center gap-1 ${stock > 0 ? 'text-slate-700' : 'text-rose-500'}`}>
                                                    <Archive size={14} /> {stock > 0 ? `Trong kho: ${stock}` : 'Hết hàng'}
                                                </span>
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

            {/* ================= MODAL XEM CHI TIẾT SẢN PHẨM ================= */}
            {detailModal.isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                        {/* Header Modal */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                            <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                                <Info className="text-indigo-600" size={24} /> Thông tin vật tư
                            </h3>
                            <button onClick={() => setDetailModal({ isOpen: false, data: null, isLoading: false })} className="p-2 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-full transition-colors cursor-pointer"><X size={24} /></button>
                        </div>

                        {/* Body Modal */}
                        <div className="p-6 md:p-8 overflow-y-auto min-h-[300px]">
                            {detailModal.isLoading ? (
                                <div className="h-full flex flex-col justify-center items-center text-slate-500 py-10">
                                    <Loader2 className="animate-spin text-indigo-600 mb-2" size={32} />
                                    <p>Đang tải thông tin chi tiết...</p>
                                </div>
                            ) : detailModal.data ? (
                                <div className="flex flex-col md:flex-row gap-8">
                                    {/* Cột Ảnh */}
                                    <div className="w-full md:w-5/12 shrink-0">
                                        <div
                                            className="w-full aspect-square bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden cursor-zoom-in group"
                                            onClick={() => detailModal.data.imageUrl && setZoomImageUrl(detailModal.data.imageUrl)}
                                        >
                                            {detailModal.data.imageUrl ? (
                                                <img src={detailModal.data.imageUrl} alt={detailModal.data.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                                    <ImageIcon size={48} className="mb-2 opacity-50" />
                                                    <span className="text-sm font-medium">Không có ảnh minh họa</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Cột Text Data (Chỉ hiển thị các trường được phép) */}
                                    <div className="w-full md:w-7/12 space-y-6">
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-900 leading-tight">{detailModal.data.name}</h2>
                                            <p className="text-emerald-600 font-black text-xl flex items-center gap-1 mt-2 bg-emerald-50 inline-block px-3 py-1 rounded-lg border border-emerald-100">
                                                Giá bán: {new Intl.NumberFormat('vi-VN').format(detailModal.data.price || 0)} VNĐ
                                            </p>
                                        </div>

                                        {/* Bảng thông số kỹ thuật (Đã bỏ Tiền công, Tồn kho, isLiked) */}
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1 uppercase font-bold tracking-wider">Thương hiệu</p>
                                                <p className="font-bold text-slate-800 text-base">{detailModal.data.brand || '---'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1 uppercase font-bold tracking-wider">Thông số kỹ thuật</p>
                                                <p className="font-bold text-slate-800 text-base">{detailModal.data.dimension || '---'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1 uppercase font-bold tracking-wider">Danh mục</p>
                                                <p className="font-bold text-slate-800 text-base">{detailModal.data.categoryDTO?.name || '---'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1 uppercase font-bold tracking-wider">Thời gian Bảo hành</p>
                                                <p className="font-bold text-indigo-700 text-base flex items-center gap-1">
                                                    <ShieldCheck size={16} />
                                                    {detailModal.data.warranty_year ? `${detailModal.data.warranty_year} năm` : 'Không bảo hành'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Phần Mô tả (Dùng đúng field 'decription' từ DTO) */}
                                        <div>
                                            <p className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Mô tả chi tiết sản phẩm:</p>
                                            <div className="text-base text-slate-600 bg-white p-4 rounded-xl border border-slate-200 whitespace-pre-wrap leading-relaxed shadow-sm">
                                                {detailModal.data.decription || 'Chưa có thông tin mô tả chi tiết cho sản phẩm này.'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-rose-500 py-10 font-bold">Không lấy được dữ liệu sản phẩm.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ================= MODAL PHÓNG TO ẢNH ================= */}
            {zoomImageUrl && (
                <div
                    className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setZoomImageUrl(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] flex items-center justify-center cursor-zoom-out" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setZoomImageUrl(null)}
                            className="absolute -top-12 right-0 md:-right-12 text-white hover:text-rose-400 bg-slate-800/50 hover:bg-slate-800 p-2 rounded-full transition-all cursor-pointer"
                        >
                            <X size={28} />
                        </button>
                        <img
                            src={zoomImageUrl}
                            alt="Phóng to"
                            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
                        />
                    </div>
                </div>
            )}

            <ToastContainer position="top-right" autoClose={3000} theme="colored" />
        </div>
    );
}