import React, { useState, useEffect } from 'react';
import {
    MapPin, Phone, Plus, Edit, Trash2,
    Search, Loader2, Image as ImageIcon, Building2, ToggleLeft, ToggleRight, X
} from 'lucide-react';
import { branchApi } from '../../api/branchApi';
import Pagination from '../../components/common/Pagination';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function BranchManagement() {

    // ================= QUẢN LÝ HỘP THOẠI XÁC NHẬN (CONFIRM MODAL) =================
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null, // Hàm sẽ chạy khi người dùng bấm "Đồng ý"
        isDanger: false  // true nếu là hành động Xóa (để đổi nút thành màu đỏ)
    });

    // ================= QUẢN LÝ FORM THÊM MỚI =================
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Thêm state này để biết đang sửa chi nhánh nào (null nghĩa là đang thêm mới)
    const [editingId, setEditingId] = useState(null);

    // State chứa dữ liệu text/number
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        hotline: '',
        status: true, // Mặc định là true (Hoạt động)
        mapUrl: '',
        latitude: '',
        longitude: ''
    });

    // State riêng để chứa file ảnh thật và URL để preview (xem trước)
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    // State quản lý xem bản đồ
    const [mapPreview, setMapPreview] = useState({ isOpen: false, url: '', name: '' });

    const [isLoading, setIsLoading] = useState(true);
    const [branches, setBranches] = useState([]);

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // QUẢN LÝ FILTER CHUẨN FORM BACKEND
    const [filters, setFilters] = useState({
        searchName: "",
        status: null // null: Tất cả, true: Đang hoạt động, false: Tạm khóa
    });

    // State phụ dùng để Debounce (chống spam API khi gõ chữ)
    const [debouncedSearchName, setDebouncedSearchName] = useState("");

    // Effect xử lý Debounce cho ô tìm kiếm (chờ 500ms sau khi ngừng gõ mới update)
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchName(filters.searchName);
        }, 500);
        return () => clearTimeout(handler);
    }, [filters.searchName]);

    // HÀM FETCH DATA
    const fetchBranches = async () => {
        setIsLoading(true);
        try {
            // Tạo form payload theo đúng chuẩn backend yêu cầu
            const formPayload = {
                searchName: debouncedSearchName.trim(),
                status: filters.status,
                page: currentPage,
                size: 10
            };

            // Truyền formPayload vào API
            const response = await branchApi.getFiltedBranches(formPayload);
            const data = response.data || response;
            console.log(response)
            if (data && data.content) {
                setBranches(data.content);
                setTotalPages(data.page.totalPages); // Đảm bảo backend trả về data.page.totalPages
            } else {
                setBranches([]);
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách cơ sở:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Gọi lại API mỗi khi Page, Debounce Search, hoặc Status thay đổi
    useEffect(() => {
        fetchBranches();
    }, [currentPage, debouncedSearchName, filters.status]);

    // Reset về trang 0 mỗi khi người dùng thay đổi bộ lọc tìm kiếm hoặc trạng thái
    useEffect(() => {
        setCurrentPage(0);
    }, [debouncedSearchName, filters.status]);

    useEffect(() => {
        fetchBranches();
    }, [currentPage]);


    const handleEdit = (branch) => {
        setFormData({
            name: branch.name,
            address: branch.address,
            hotline: branch.hotline,
            status: branch.status,
            mapUrl: branch.mapUrl,
            latitude: branch.latitude || '',
            longitude: branch.longitude || ''
        });
        setImageFile(null); // Chưa chọn file mới
        setImagePreview(branch.imageUrl || ''); // Hiển thị ảnh cũ từ DB
        setEditingId(branch.id); // Gắn ID vào -> Chế độ Cập nhật
        setIsAddModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Xóa chi nhánh?',
            message: 'Bạn có chắc chắn muốn xóa vĩnh viễn chi nhánh này không? Dữ liệu sẽ không thể khôi phục.',
            isDanger: true, // Hành động nguy hiểm -> Nút màu đỏ
            onConfirm: () => executeDelete(id)
        });
    };

    // Hàm này thực sự gọi API Xóa
    const executeDelete = async (id) => {
        setConfirmModal(prev => ({ ...prev, isOpen: false })); // Đóng modal hỏi
        try {
            await branchApi.deleteBranch(id);
            toast.success("Đã xóa chi nhánh thành công!");
            fetchBranches();
        } catch (error) {
            toast.error("Có lỗi xảy ra khi xóa chi nhánh!");
        }
    };

    const handleToggleStatus = (id, currentStatus) => {
        console.log("Đổi trạng thái chi nhánh:", id, !currentStatus);
        // TODO: Gọi API đổi trạng thái (Khóa/Mở khóa)
    };

    // Xử lý mở modal và reset form
    const handleAddNew = () => {
        setFormData({
            name: '', address: '', hotline: '', status: true,
            mapUrl: '', latitude: '', longitude: ''
        });
        setImageFile(null);
        setImagePreview('');
        setEditingId(null); // Reset ID về null -> Chế độ Thêm mới
        setIsAddModalOpen(true);
    };

    // Xử lý khi gõ vào các ô input text/number trong form thêm mới
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'status' ? (value === 'true') : value // Xử lý riêng cho combobox boolean
        }));
    };

    // Xử lý khi chọn file ảnh trong form thêm mới
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            // Tạo một URL tạm thời trên trình duyệt để user xem trước ảnh vừa chọn
            setImagePreview(URL.createObjectURL(file));
        }
    };

    //  Xử lý Lưu Form (Dùng chung cho cả Thêm và Sửa)
    const handleFormSubmitClick = (e) => {
        e.preventDefault();
        setConfirmModal({
            isOpen: true,
            title: editingId ? 'Cập nhật thông tin?' : 'Thêm chi nhánh mới?',
            message: editingId
                ? 'Bạn có chắc chắn muốn thay đổi thông tin của chi nhánh này?'
                : 'Hệ thống sẽ tạo mới một chi nhánh với các thông tin bạn vừa nhập.',
            isDanger: false, // Hành động an toàn -> Nút màu xanh
            onConfirm: () => executeSubmit()
        });
    };

    //  Hàm này thực sự gọi API Lưu
    const executeSubmit = async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false })); // Đóng modal hỏi
        setIsSubmitting(true);

        try {
            const payload = new FormData();
            payload.append('name', formData.name);
            payload.append('address', formData.address);
            payload.append('hotline', formData.hotline);
            payload.append('status', formData.status);
            payload.append('mapUrl', formData.mapUrl);
            payload.append('latitude', formData.latitude);
            payload.append('longitude', formData.longitude);
            if (imageFile) payload.append('file', imageFile);

            if (editingId) {
                await branchApi.updateBranch(editingId, payload);
                toast.success("Cập nhật thông tin chi nhánh thành công!");
            } else {
                await branchApi.createBranch(payload);
                toast.success("Thêm mới chi nhánh thành công!");
            }

            setIsAddModalOpen(false); // Đóng luôn Modal form
            fetchBranches();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!");
        } finally {
            setIsSubmitting(false);
        }
    };



    return (
        <div className="p-6 sm:p-10 bg-slate-50 min-h-screen">

            {/* --- HEADER --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Building2 className="text-indigo-600" size={32} />
                        Quản lý Chi nhánh
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Xem, thêm mới và cập nhật thông tin các cơ sở dịch vụ.</p>
                </div>

                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                >
                    <Plus size={20} /> Thêm chi nhánh mới
                </button>
            </div>

            {/* --- TOOLBAR (TÌM KIẾM & LỌC) --- */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên chi nhánh..."
                        value={filters.searchName}
                        onChange={(e) => setFilters(prev => ({ ...prev, searchName: e.target.value }))}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                </div>
                <select
                    value={filters.status === null ? "ALL" : (filters.status ? "TRUE" : "FALSE")}
                    onChange={(e) => {
                        let newStatus = null;
                        if (e.target.value === "TRUE") newStatus = true;
                        if (e.target.value === "FALSE") newStatus = false;

                        setFilters(prev => ({ ...prev, status: newStatus }));
                    }}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 outline-none cursor-pointer"
                >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="TRUE">Đang hoạt động</option>
                    <option value="FALSE">Đã tạm dừng</option>
                </select>
            </div>

            {/* --- BẢNG DỮ LIỆU (DATA TABLE) --- */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                <th className="p-4 pl-6">Chi nhánh</th>
                                <th className="p-4">Liên hệ</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 pr-6 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className="p-10 text-center">
                                        <Loader2 className="animate-spin text-indigo-600 mx-auto mb-2" size={32} />
                                        <p className="text-slate-500 font-medium">Đang tải dữ liệu...</p>
                                    </td>
                                </tr>
                            ) : branches.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-10 text-center text-slate-500 font-medium">
                                        Không có dữ liệu chi nhánh nào.
                                    </td>
                                </tr>
                            ) : (
                                branches.map((branch) => (
                                    <tr key={branch.id} className="hover:bg-slate-50/80 transition-colors group">
                                        {/* Cột 1: Ảnh & Tên & Địa chỉ */}
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                                                    {branch.imageUrl ? (
                                                        <img src={branch.imageUrl} alt={branch.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center"><ImageIcon className="text-slate-400" size={20} /></div>
                                                    )}
                                                </div>
                                                {/* Trong phần map các branch */}
                                                <div>
                                                    <p
                                                        onClick={() => setMapPreview({ isOpen: true, url: branch.mapUrl, name: branch.name })}
                                                        className="font-bold text-slate-900 text-base hover:text-indigo-600 hover:underline cursor-pointer transition-colors flex items-center gap-2 group/name"
                                                    >
                                                        {branch.name}
                                                        {/* <ExternalLink size={14} className="opacity-0 group-hover/name:opacity-100 transition-opacity" /> */}
                                                    </p>
                                                    <p className="text-xs text-slate-500 flex items-start gap-1 mt-1 max-w-sm">
                                                        <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                                                        <span className="line-clamp-2">{branch.address}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Cột 2: Hotline */}
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                                                <Phone size={12} className="text-indigo-600" /> {branch.hotline}
                                            </span>
                                        </td>

                                        {/* Cột 3: Trạng thái (Hoạt động / Khóa) */}
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => handleToggleStatus(branch.id, branch.status)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${branch.status
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                                    }`}
                                                title="Nhấn để đổi trạng thái"
                                            >
                                                {branch.status ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                                {branch.status ? 'Đang hoạt động' : 'Tạm khóa'}
                                            </button>
                                        </td>

                                        {/* Cột 4: Hành động */}
                                        <td className="p-4 pr-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(branch)}
                                                    className="p-2 bg-white text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg border border-slate-200 shadow-sm transition-colors"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(branch.id)} // Gắn hàm xóa vào đây
                                                    className="p-2 bg-white text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg border border-slate-200 shadow-sm transition-colors"
                                                    title="Xóa vĩnh viễn"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Phân trang */}
                {!isLoading && totalPages > 1 && (
                    <div className="p-4 border-t border-slate-200 bg-slate-50">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                )}
            </div>

            {/* ================= MODAL XEM NHANH BẢN ĐỒ ================= */}
            {mapPreview.isOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setMapPreview({ ...mapPreview, isOpen: false })}
                >
                    <div
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()} // Chặn đóng khi nhấn vào trong modal
                    >
                        {/* Header của Modal */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                                    <MapPin className="text-indigo-600" size={20} />
                                    Vị trí: {mapPreview.name}
                                </h3>
                            </div>
                            <button
                                onClick={() => setMapPreview({ ...mapPreview, isOpen: false })}
                                className="p-2 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Nội dung bản đồ */}
                        <div className="relative w-full aspect-video sm:h-[500px] bg-slate-100">
                            {mapPreview.url ? (
                                <iframe
                                    src={mapPreview.url}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title={`Bản đồ ${mapPreview.name}`}
                                ></iframe>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                                    <Map size={48} className="opacity-20" />
                                    <p className="font-bold">Chi nhánh này chưa cập nhật link bản đồ</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Modal */}
                        <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setMapPreview({ ...mapPreview, isOpen: false })}
                                className="cursor-pointer px-6 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all active:scale-95"
                            >
                                Đóng cửa sổ
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ================= MODAL THÊM MỚI CHI NHÁNH ================= */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl my-auto animate-in zoom-in-95 duration-300">

                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
                            <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                                <Plus className="text-indigo-600 bg-indigo-100 p-1 rounded-lg" size={28} />
                                {editingId ? 'Cập nhật Chi nhánh' : 'Thêm mới Chi nhánh'}
                            </h3>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-2 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body - Form */}
                        <form onSubmit={handleFormSubmitClick} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Cột Trái: Thông tin cơ bản */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">
                                            Tên chi nhánh <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="VD: Sửa xe Honda Quận 1"

                                            // 1. Thêm thuộc tính disabled kiểm tra xem editingId có tồn tại không
                                            disabled={!!editingId}

                                            // 2. Thêm các class disabled:... của Tailwind để làm mờ ô input khi bị khóa
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed disabled:border-slate-300"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Số Hotline <span className="text-rose-500">*</span></label>
                                        <input required type="text" name="hotline" value={formData.hotline} onChange={handleInputChange} placeholder="VD: 0901234567" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Trạng thái hoạt động</label>
                                        <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none cursor-pointer font-medium text-slate-700">
                                            <option value={true}>Đang hoạt động</option>
                                            <option value={false}>Tạm ngừng hoạt động</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Ảnh đại diện (File) <span className="text-rose-500">*</span></label>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <input required={!editingId} type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer" />
                                            </div>
                                            {imagePreview && (
                                                <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-sm" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Cột Phải: Địa chỉ & Bản đồ */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">
                                            Tên chi nhánh <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            placeholder="VD: Sửa xe Honda Quận 1"

                                            // 1. Thêm thuộc tính disabled kiểm tra xem editingId có tồn tại không
                                            disabled={!!editingId}

                                            // 2. Thêm các class disabled:... của Tailwind để làm mờ ô input khi bị khóa
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed disabled:border-slate-300"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Link nhúng bản đồ (Iframe URL) <span className="text-rose-500">*</span></label>
                                        <input required type="url" name="mapUrl" value={formData.mapUrl} onChange={handleInputChange} placeholder="https://www.google.com/maps/embed?..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Kinh độ (Longitude) <span className="text-rose-500">*</span></label>
                                            <input required type="number" step="any" name="longitude" value={formData.longitude} onChange={handleInputChange} placeholder="VD: 106.6297" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none font-mono text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Vĩ độ (Latitude) <span className="text-rose-500">*</span></label>
                                            <input required type="number" step="any" name="latitude" value={formData.latitude} onChange={handleInputChange} placeholder="VD: 10.8231" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none font-mono text-sm" />
                                        </div>
                                    </div>

                                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl mt-2">
                                        <p className="text-xs text-amber-700 font-medium">
                                            * Lưu ý: Kinh độ và vĩ độ được sử dụng để tính toán khoảng cách từ khách hàng đến chi nhánh trên App.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">
                                    Hủy bỏ
                                </button>
                                {/* Nút Submit */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-600/20 disabled:bg-indigo-400 disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100 transition-all duration-200 min-w-[160px]"
                                >
                                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : (editingId ? <Edit size={20} /> : <Plus size={20} />)}
                                    {isSubmitting ? 'Đang lưu...' : (editingId ? 'Cập nhật' : 'Lưu chi nhánh')}
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

            {/* ================= MODAL XÁC NHẬN (CONFIRM DIALOG) ================= */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="text-center">
                            {/* Icon tùy biến theo trạng thái */}
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