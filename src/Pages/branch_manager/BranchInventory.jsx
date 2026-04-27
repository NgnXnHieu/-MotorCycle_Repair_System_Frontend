import React, { useState, useEffect } from 'react';
import {
    Package, History, Search, Loader2, Image as ImageIcon,
    Filter, ArrowDownCircle, ArrowUpCircle, X, CheckCircle2,
    Calendar, Layers, Archive, PlusCircle, AlertTriangle
} from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// TODO: Đảm bảo bạn đã import đúng đường dẫn API của bạn
import { itemApi } from '../../api/itemApi';
import { categoryApi } from '../../api/categoryApi';

export default function BranchInventory() {
    const [activeTab, setActiveTab] = useState('INVENTORY');

    // ================= STATE TAB 1: KHO =================
    const [inventory, setInventory] = useState([]);
    const [categories, setCategories] = useState([]);
    const [invPage, setInvPage] = useState(0);
    const [invTotalPages, setInvTotalPages] = useState(0);
    const [invTotalElements, setInvTotalElements] = useState(0);

    // Đã đổi 'keyword' thành 'searchName' cho khớp DTO backend
    const [invFilters, setInvFilters] = useState({ searchName: "", categoryId: "", isInstock: null });
    const [debouncedSearchName, setDebouncedSearchName] = useState("");

    // State Modal Nhập kho
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [importQuantity, setImportQuantity] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    //Modal xác nhận nhập kho   
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // ================= STATE TAB 2: LỊCH SỬ (Giữ nguyên cấu trúc) =================
    const [histories, setHistories] = useState([]);
    const [histPage, setHistPage] = useState(0);
    const [histTotalPages, setHistTotalPages] = useState(0);

    // === HÀM HELPER TẠO NGÀY MẶC ĐỊNH (CHUẨN yyyy-MM-dd) ===
    const getFormattedDate = (daysAgo = 0) => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const [histFilters, setHistFilters] = useState({
        type: "",
        startDate: getFormattedDate(7), // Tự động lùi về 7 ngày trước
        endDate: getFormattedDate(0)    // Tự động là ngày hôm nay
    });

    const [isLoading, setIsLoading] = useState(false);



    // ================= EFFECTS =================
    useEffect(() => {
        // Tích hợp API lấy danh mục thực tế
        const fetchCategories = async () => {
            try {
                const res = await categoryApi.getAllCategory();
                // Giả định backend trả về cục json có content
                const data = res.data?.content || res.content || res.data || res;
                setCategories(data);
            } catch (error) {
                console.error("Lỗi tải danh mục:", error);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearchName(invFilters.searchName), 500);
        return () => clearTimeout(handler);
    }, [invFilters.searchName]);

    // Gọi API kho khi đổi filter
    useEffect(() => {
        if (activeTab === 'INVENTORY') fetchInventory();
    }, [invPage, debouncedSearchName, invFilters.categoryId, invFilters.isInstock, activeTab]);

    useEffect(() => {
        if (activeTab === 'HISTORY') {
            fetchHistory();
        }
    }, [histPage, histFilters.type, histFilters.startDate, histFilters.endDate, activeTab]);


    // ================= HÀM FETCH KHO HÀNG (TÍCH HỢP API THẬT) =================
    const fetchInventory = async () => {
        setIsLoading(true);
        try {
            // Chuẩn bị payload khớp với ModelAttribute của Backend
            const params = {
                searchName: debouncedSearchName.trim() || null,
                categoryId: invFilters.categoryId || null,
                isInstock: invFilters.isInstock,
                page: invPage,
                size: 20 // Khớp với size backend trả về
            };

            const response = await itemApi.getItemForBranch(params);
            // Dữ liệu axios thường bọc trong res.data
            const data = response.data || response;

            setInventory(data.content || []);
            setInvTotalPages(data.page?.totalPages || 0);
            setInvTotalElements(data.page?.totalElements || 0);

        } catch (error) {
            console.error("Lỗi lấy danh sách kho:", error);
            toast.error("Lỗi tải danh sách kho chi nhánh!");
        } finally {
            setIsLoading(false);
        }
    };

    // ================= HANDLERS =================
    const openImportModal = (item) => {
        setSelectedItem(item);
        setImportQuantity('');
        setIsImportModalOpen(true);
    };

    // Hàm này bây giờ chỉ làm nhiệm vụ Validate và Mở Modal Xác Nhận
    const handleImportSubmit = (e) => {
        e.preventDefault();

        // Validate cơ bản ở Frontend
        if (!importQuantity || Number(importQuantity) <= 0) {
            toast.warning("Vui lòng nhập số lượng hợp lệ (lớn hơn 0)!");
            return;
        }

        // Thay vì gọi API, bây giờ mở Modal Xác nhận
        setIsConfirmModalOpen(true);
    };

    // THÊM HÀM NÀY: Hàm này sẽ thực hiện gọi API khi người dùng đã click "Đồng ý"
    const executeImport = async () => {
        setIsSubmitting(true);
        try {
            const payload = {
                quantity: Number(importQuantity),
                inventory_id: selectedItem.id
            };

            await itemApi.importStock(payload);

            toast.success(`Đã nhập thêm ${importQuantity} ${selectedItem.itemDTO?.name} vào kho!`);

            // Thành công thì đóng CẢ 2 modal
            setIsConfirmModalOpen(false);
            setIsImportModalOpen(false);

            fetchInventory();

        } catch (error) {
            console.error("Lỗi nhập kho:", error);
            const errorMsg = error.response?.data?.message || "Nhập kho thất bại, vui lòng kiểm tra lại!";
            toast.error(errorMsg);

            // Nếu lỗi, đóng modal xác nhận để user có thể sửa lại số lượng nếu muốn
            setIsConfirmModalOpen(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Hàm format ngày giờ từ Backend
    const formatDateTime = (isoString) => {
        if (!isoString) return '---';
        const date = new Date(isoString);
        return date.toLocaleString('vi-VN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    };




    // ... (các state của Tab 1 giữ nguyên)

    // ================= HÀM FETCH LỊCH SỬ KHO =================
    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            // Map parameters khớp với InventoryHistoryFilterForm backend
            const params = {
                page: histPage,
                size: 20,
                type: histFilters.type || null,
                startTime: histFilters.startDate || null,
                endTime: histFilters.endDate || null
            };

            // Gọi API thực tế
            const response = await itemApi.getStockHistories(params);
            const data = response.data || response;

            setHistories(data.content || []);
            setHistTotalPages(data.page?.totalPages || 0);
        } catch (error) {
            console.error("Lỗi tải lịch sử kho:", error?.response);
            toast.error("Lỗi tải danh sách lịch sử!");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 sm:p-10 bg-slate-50 min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 mb-6">
                    <Archive className="text-indigo-600" size={32} /> Quản lý Kho Chi nhánh
                </h1>

                <div className="flex p-1 bg-slate-200/50 rounded-xl w-max">
                    <button onClick={() => setActiveTab('INVENTORY')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'INVENTORY' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <Package size={18} /> Kho hiện tại
                    </button>
                    <button onClick={() => setActiveTab('HISTORY')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'HISTORY' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <History size={18} /> Lịch sử xuất/nhập
                    </button>
                </div>
            </div>

            {/* ================= TAB 1: KHO HIỆN TẠI ================= */}
            {activeTab === 'INVENTORY' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Toolbar Lọc */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute inset-y-0 left-4 my-auto text-slate-400" size={18} />
                            <input type="text" placeholder="Tìm tên/mã sản phẩm..." value={invFilters.searchName} onChange={(e) => setInvFilters(prev => ({ ...prev, searchName: e.target.value }))} className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 outline-none" />
                        </div>
                        <select value={invFilters.categoryId} onChange={(e) => setInvFilters(prev => ({ ...prev, categoryId: e.target.value }))} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none">
                            <option value="">Tất cả danh mục</option>
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                        <select value={invFilters.isInstock === null ? "ALL" : (invFilters.isInstock ? "TRUE" : "FALSE")} onChange={(e) => {
                            const val = e.target.value;
                            setInvFilters(prev => ({ ...prev, isInstock: val === "ALL" ? null : val === "TRUE" }));
                            setInvPage(0);
                        }} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none">
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="TRUE">Còn hàng trong kho</option>
                            <option value="FALSE">Đã hết hàng</option>
                        </select>
                    </div>

                    <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-600 bg-slate-200/50 px-4 py-2 rounded-lg border border-slate-200">
                            Tổng tìm thấy: <span className="text-indigo-600">{invTotalElements}</span> sản phẩm
                        </span>
                    </div>

                    {/* Bảng dữ liệu Kho - Map theo dữ liệu JSON API */}
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                    <th className="p-4 pl-6">Sản phẩm</th>
                                    <th className="p-4">Danh mục</th>
                                    <th className="p-4">Giá bán</th>
                                    <th className="p-4">Tồn kho hiện tại</th>
                                    <th className="p-4 pr-6 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr><td colSpan="4" className="p-10 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} /></td></tr>
                                ) : inventory.length === 0 ? (
                                    <tr><td colSpan="4" className="p-10 text-center text-slate-500 font-medium">Không tìm thấy sản phẩm.</td></tr>
                                ) : (
                                    inventory.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                                                        {item.itemDTO?.imageUrl ? <img src={item.itemDTO.imageUrl} alt={item.itemDTO.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="text-slate-400" size={16} /></div>}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm">{item.itemDTO?.name}</p>
                                                        <span className="text-xs text-slate-500 font-mono">ID Vật tư: #{item.itemDTO?.id}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium text-sm">
                                                    <Layers size={14} className="text-slate-400" /> {item.itemDTO?.categoryDTO?.name || 'Chưa có'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-bold text-emerald-600 text-sm">
                                                    {new Intl.NumberFormat('vi-VN').format(item.itemDTO?.price || 0)}đ
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.stockQuantity > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                    {item.stockQuantity > 0 ? `${item.stockQuantity} sản phẩm` : 'Hết hàng'}
                                                </span>
                                            </td>
                                            <td className="p-4 pr-6 text-right">
                                                <button onClick={() => openImportModal(item)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-lg font-bold text-sm border border-indigo-200 hover:border-indigo-600 transition-all cursor-pointer">
                                                    <PlusCircle size={16} /> Nhập kho
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        {!isLoading && invTotalPages > 1 && <div className="p-4 border-t border-slate-200 bg-slate-50"><Pagination currentPage={invPage} totalPages={invTotalPages} onPageChange={setInvPage} /></div>}
                    </div>
                </div>
            )}

            {/* ================= TAB 2: LỊCH SỬ KHO ================= */}
            {activeTab === 'HISTORY' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Toolbar Lọc Lịch sử */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Loại giao dịch</label>
                            <select
                                value={histFilters.type}
                                onChange={(e) => { setHistFilters(prev => ({ ...prev, type: e.target.value })); setHistPage(0); }}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none"
                            >
                                <option value="">Tất cả</option>
                                {/* Sửa value cho khớp với Enum dưới DB của bạn */}
                                <option value="IN">Nhập kho (+)</option>
                                <option value="OUT">Xuất kho (-)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Từ ngày</label>
                            <input
                                type="date"
                                value={histFilters.startDate}
                                onChange={(e) => setHistFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none text-slate-700"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Đến ngày</label>
                            <input
                                type="date"
                                value={histFilters.endDate}
                                onChange={(e) => setHistFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none text-slate-700"
                            />
                        </div>
                        {/* <button
                            onClick={() => { setHistPage(0); fetchHistory(); }}
                            className="h-max px-4 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Filter size={16} /> Lọc dữ liệu
                        </button> */}
                    </div>

                    {/* Bảng dữ liệu Lịch sử */}
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                    <th className="p-4 pl-6">Thời gian</th>
                                    <th className="p-4">Sản phẩm</th>
                                    <th className="p-4">Nhân viên thực hiện</th>
                                    <th className="p-4 text-center">Biến động</th>
                                    <th className="p-4 pr-6 text-right">Tồn kho sau đó</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr><td colSpan="5" className="p-10 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} /></td></tr>
                                ) : histories.length === 0 ? (
                                    <tr><td colSpan="5" className="p-10 text-center text-slate-500 font-medium">Không có lịch sử nào.</td></tr>
                                ) : (
                                    histories.map((hist) => (
                                        <tr key={hist.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Calendar size={14} className="text-slate-400" />
                                                    {formatDateTime(hist.date)}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    {hist.imageUrlItem && (
                                                        <img src={hist.imageUrlItem} alt={hist.nameItem} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                                                    )}
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm">{hist.nameItem}</p>
                                                        <span className="text-xs text-slate-500 font-mono">ID Vật tư: #{hist.itemId}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <p className="font-medium text-slate-800 text-sm">{hist.employeeName}</p>
                                                <span className="text-xs text-slate-500 font-mono">ID NV: #{hist.employeeId}</span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {/* Dùng điều kiện quantity > 0 để check Nhập kho hay Trừ kho */}
                                                <span className={`inline-flex items-center gap-1 font-black text-sm ${hist.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {hist.quantity > 0 ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                                                    {hist.quantity > 0 ? '+' : ''}{hist.quantity}
                                                </span>
                                            </td>
                                            <td className="p-4 pr-6 text-right">
                                                <span className="font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                                                    {/* Nếu dữ liệu cũ bị null, in ra --- */}
                                                    {hist.currentQuantity !== null ? hist.currentQuantity : '---'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        {!isLoading && histTotalPages > 1 && (
                            <div className="p-4 border-t border-slate-200 bg-slate-50">
                                <Pagination currentPage={histPage} totalPages={histTotalPages} onPageChange={setHistPage} />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ================= MODAL NHẬP KHO ================= */}
            {isImportModalOpen && selectedItem && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                                <PlusCircle className="text-indigo-600" /> Nhập thêm hàng
                            </h3>
                            <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleImportSubmit} className="p-6">
                            <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Đang nhập cho sản phẩm</p>
                                <p className="font-black text-indigo-900">{selectedItem.itemDTO?.name}</p>
                                <p className="text-sm text-indigo-700 mt-1">Tồn kho tại chi nhánh: <span className="font-bold">{selectedItem.stockQuantity}</span></p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Số lượng cần nhập <span className="text-rose-500">*</span></label>
                                <input
                                    type="number" min="1" required autoFocus
                                    value={importQuantity}
                                    onChange={(e) => setImportQuantity(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-lg font-bold text-center"
                                    placeholder="Ví dụ: 10"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button type="button" onClick={() => setIsImportModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer">Hủy</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-70 transition-all cursor-pointer">
                                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle2 size={18} /> Xác nhận nhập</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= MODAL XÁC NHẬN NHẬP KHO ================= */}
            {isConfirmModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200 overflow-hidden p-6 text-center">
                        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="font-black text-xl text-slate-800 mb-2">Xác nhận nhập kho</h3>
                        <p className="text-slate-600 mb-6 text-sm">
                            Bạn chắc chắn muốn nhập <span className="font-black text-indigo-600 text-lg mx-1">{importQuantity}</span> sản phẩm <br />
                            <span className="font-bold text-slate-800">{selectedItem?.itemDTO?.name}</span> vào kho?
                        </p>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsConfirmModalOpen(false)}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
                            >
                                Xem lại
                            </button>
                            <button
                                type="button"
                                onClick={executeImport}
                                disabled={isSubmitting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-70 transition-all cursor-pointer"
                            >
                                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Chắc chắn nhập'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer position="top-right" autoClose={3000} theme="colored" />
        </div>
    );
}