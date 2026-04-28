import React, { useState, useEffect } from 'react';
import {
    MapPin, Phone, Plus, Search, Loader2, Image as ImageIcon,
    Building2, ToggleLeft, ToggleRight, X, Eye
} from 'lucide-react';
import { branchApi } from '../../api/branchApi';
import Pagination from '../../components/common/Pagination';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';

export default function BranchManagement() {
    const navigate = useNavigate();
    const [imageZoom, setImageZoom] = useState({ isOpen: false, url: '', alt: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [branches, setBranches] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [filters, setFilters] = useState({ searchName: "", status: null });
    const [debouncedSearchName, setDebouncedSearchName] = useState("");

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearchName(filters.searchName), 500);
        return () => clearTimeout(handler);
    }, [filters.searchName]);

    const fetchBranches = async () => {
        setIsLoading(true);
        try {
            const formPayload = { searchName: debouncedSearchName.trim(), status: filters.status, page: currentPage, size: 10 };
            const response = await branchApi.getFiltedBranches(formPayload);
            const data = response.data || response;
            if (data && data.content) {
                setBranches(data.content);
                setTotalPages(data.page.totalPages);
                const total = data.page?.totalElements || data.totalElements || 0;
                setTotalElements(total);
            } else { setBranches([]); }
        } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchBranches(); }, [currentPage, debouncedSearchName, filters.status]);

    return (
        <div className="p-6 sm:p-10 bg-slate-50 min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Building2 className="text-indigo-600" size={32} /> Quản lý Hệ thống Chi nhánh
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Quyền hạn cao nhất: Quản lý thông số kỹ thuật toàn hệ thống.</p>
                </div>
                {/* NHẢY SANG TRANG CREATE */}
                <button
                    onClick={() => navigate('/generalManager/branchManagement/create')}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                >
                    <Plus size={20} /> Thêm chi nhánh mới
                </button>
            </div>

            {/* SEARCH & FILTER (Giữ nguyên logic cũ) */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Search size={18} /></div>
                    <input
                        type="text" placeholder="Tìm tên chi nhánh..." value={filters.searchName}
                        onChange={(e) => setFilters(prev => ({ ...prev, searchName: e.target.value }))}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                </div>
                <select
                    value={filters.status === null ? "ALL" : (filters.status ? "TRUE" : "FALSE")}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value === "ALL" ? null : e.target.value === "TRUE" }))}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none cursor-pointer"
                >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="TRUE">Đang hoạt động</option>
                    <option value="FALSE">Đã tạm dừng</option>
                </select>
            </div>

            <div className="flex justify-between items-center mb-4 px-1">
                <span className="text-sm font-semibold text-slate-500">
                    Danh sách hiển thị
                </span>
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                    Tổng số: {totalElements} chi nhánh
                </span>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                            <th className="p-4 pl-6">Chi nhánh</th>
                            <th className="p-4">Liên hệ</th>
                            <th className="p-4 text-center">Trạng thái</th>
                            <th className="p-4 pr-6 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr><td colSpan="4" className="p-10 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} /></td></tr>
                        ) : branches.map((branch) => (
                            <tr key={branch.id} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 cursor-zoom-in"
                                            onClick={() => branch.imageUrl && setImageZoom({ isOpen: true, url: branch.imageUrl, alt: branch.name })}
                                        >
                                            <img src={branch.imageUrl || 'https://via.placeholder.com/150'} alt={branch.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-base">{branch.name}</p>
                                            <p className="text-xs text-slate-500 flex items-start gap-1"><MapPin size={12} /> {branch.address}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                                        <Phone size={12} className="text-indigo-600" /> {branch.hotline}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${branch.status ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                        {branch.status ? 'Đang hoạt động' : 'Tạm khóa'}
                                    </span>
                                </td>
                                <td className="p-4 pr-6 text-right">
                                    <button
                                        onClick={() => navigate(`/generalManager/branchManagement/${branch.id}`)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl font-bold transition-all shadow-sm"
                                    >
                                        <Eye size={18} /> Chi tiết
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!isLoading && totalPages > 1 && <div className="p-4 border-t bg-slate-50"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /></div>}
            </div>

            {/* ZOOM MODAL (Giữ nguyên như yêu cầu) */}
            {imageZoom.isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out" onClick={() => setImageZoom({ ...imageZoom, isOpen: false })}>
                    <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
                        <img src={imageZoom.url} alt={imageZoom.alt} className="w-full h-auto max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" />
                        <button className="absolute -top-10 right-0 text-white hover:text-rose-400 transition-colors" onClick={() => setImageZoom({ ...imageZoom, isOpen: false })}><X size={32} /></button>
                    </div>
                </div>
            )}
            <ToastContainer position="top-right" autoClose={3000} theme="colored" />
        </div>
    );
}