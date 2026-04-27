import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, UserPlus, Search, MapPin, Briefcase,
    MoreHorizontal, Edit, Trash2, ArrowRightLeft,
    CheckCircle2, Clock, Phone, Mail, X, AlertTriangle, Image as ImageIcon
} from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import { branchApi } from '../../api/branchApi';
import { employeeApi } from '../../api/employeeApi';

const ROLE_DICTIONARY = {
    "MECHANIC": "Thợ sửa",
    "RECEPTIONIST": "Tư vấn viên",
    "BRANCH_MANAGER": "Quản lý chi nhánh",
    "GENERAL_MANAGER": "Quản lý chuỗi chi nhánh"
};

const INITIAL_FORM_STATE = {
    username: '', password: '', phone: '', full_name: '',
    base_salary: '', branch_id: '', hired_date: '',
    role: '', email: '', is_active: true, isAvailable: true
};

const formatDateToBackend = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
};

const formatDateToFrontend = (dateStr) => {
    if (!dateStr) return '';
    const [d, m, y] = dateStr.split('/');
    return `${y}-${m}-${d}`;
};

const PersonnelManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [branches, setBranches] = useState([]);
    const [roles, setRoles] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [role4GBM, setRole4GBM] = useState([])

    const [filters, setFilters] = useState({ searchName: '', role: '', branchId: '', isActive: '' });

    const [zoomedImage, setZoomedImage] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState('create');
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [editingId, setEditingId] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    // --- State lưu trữ lỗi Validation ---
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const branchRes = await branchApi.getBranchList();
                const roleRes = await employeeApi.getRoles();
                const role4GBMRes = await employeeApi.getRole4GBM();
                setBranches(branchRes);
                setRoles(roleRes);
                setRole4GBM(role4GBMRes)
            } catch (error) {
                console.error("Lỗi khi lấy Branch/Role:", error);
            }
        };
        fetchInitialData();
    }, []);

    const fetchEmployees = useCallback(async () => {
        try {
            const params = {
                page: currentPage, size: 10,
                ...(filters.searchName && { searchName: filters.searchName }),
                ...(filters.role && { role: filters.role }),
                ...(filters.branchId && { branchId: filters.branchId }),
                ...(filters.isActive !== '' && { isActive: filters.isActive === 'true' })
            };
            const res = await employeeApi.getFiltedEmployee({ params });
            console.log(res)
            setEmployees(res.content);
            setCurrentPage(res.page.number);
            setTotalPages(res.page.totalPages);
            setTotalElements(res.totalElements);
        } catch (error) {
            console.error("Lỗi lấy danh sách nhân viên:", error);
        }
    }, [currentPage, filters]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => { fetchEmployees(); }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [fetchEmployees]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(0);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Xóa lỗi của field tương ứng khi người dùng bắt đầu nhập lại
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const openCreateForm = () => {
        setFormMode('create');
        setFormData(INITIAL_FORM_STATE);
        setSelectedFile(null);
        setPreviewUrl(null);
        setErrors({}); // Xóa hết lỗi cũ
        setIsFormOpen(true);
    };

    const openUpdateForm = async (id) => {
        try {
            const emp = await employeeApi.getById(id);
            console.log("Dữ liệu nhân viên tải về:", emp);

            setFormMode('update');
            setEditingId(emp.id);

            setFormData({
                // Để trống username vì UI không render ô này trong chế độ 'update'
                username: '',
                phone: emp.phone || '',
                full_name: emp.full_name || '',
                base_salary: emp.base_salary || '',

                // Lấy trực tiếp branchId từ BE trả về (Lưu ý: Nếu BE của bạn đặt tên biến 
                // là branch_id thì nhớ đổi lại cho khớp nhé)
                branch_id: emp.branchId || '',

                // Xử lý an toàn: Nếu BE trả về null/undefined thì để trống
                hired_date: emp.hired_date || '',
                role: emp.role || '',
                email: emp.email || '',
                is_active: emp.is_active ?? true,
                isAvailable: emp.isAvailable ?? true
            });

            setSelectedFile(null);
            setPreviewUrl(emp.avatar || null);
            setErrors({}); // Xóa hết lỗi cũ
            setIsFormOpen(true);
        } catch (error) {
            console.log("Lỗi gọi api lấy thông tin employee:", error.response?.data || error);
        }
    };

    // --- HÀM VALIDATE THEO CHUẨN BACKEND ---
    const validateForm = () => {
        let newErrors = {};

        // Validation cho API Create
        if (formMode === 'create') {
            if (!formData.username?.trim()) {
                newErrors.username = "Username is required";
            } else if (formData.username.length < 8) {
                newErrors.username = "Tài khoản ít nhất phải có 8 ký tự";
            }

            if (!formData.password?.trim()) {
                newErrors.password = "Password is required";
            } else if (formData.password.length < 8) {
                newErrors.password = "Mật khẩu phải có ít nhất 8 ký tự";
            }
        }

        // Thông tin chung
        if (!formData.full_name?.trim()) {
            newErrors.full_name = "Fullname is required";
        }

        if (!formData.phone?.trim()) {
            newErrors.phone = "Phone is required";
        } else if (formData.phone.length < 10 || formData.phone.length > 11) {
            newErrors.phone = "Phone must be around 10 -11 numbers";
        }

        if (!formData.branch_id) {
            newErrors.branch_id = "Branch is required";
        }

        if (!formData.role) {
            newErrors.role = "Không để trống vai trò";
        }

        if (!formData.hired_date) {
            newErrors.hired_date = "Ngày vào làm không được để trống";
        }

        if (formData.email?.trim()) {
            // Regex cơ bản để check Email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                newErrors.email = "Hãy điền Email theo đúng định dạng";
            }
        }

        setErrors(newErrors);
        // Trả về true nếu không có lỗi nào (object rỗng)
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmitRequest = (e) => {
        e.preventDefault(); // Ngăn chặn form submit mặc định của HTML
        if (validateForm()) {
            setIsConfirmOpen(true);
        }
    };

    const executeAction = async () => {
        try {
            if (formMode === 'create') {
                const submitData = new FormData();
                const formattedDate = formatDateToBackend(formData.hired_date);

                submitData.append('username', formData.username);
                submitData.append('password', formData.password);
                submitData.append('phone', formData.phone);
                submitData.append('full_name', formData.full_name);
                submitData.append('base_salary', formData.base_salary);
                submitData.append('branch_id', formData.branch_id);
                submitData.append('hired_date', formattedDate);
                submitData.append('role', formData.role);
                submitData.append('email', formData.email);
                submitData.append('is_active', formData.is_active);
                submitData.append('isAvailable', formData.isAvailable);
                if (selectedFile) submitData.append('file', selectedFile);

                await employeeApi.createEmployee(submitData);
                alert("Thêm nhân viên thành công!");
            } else {
                const updatePayload = {
                    phone: formData.phone, full_name: formData.full_name, base_salary: formData.base_salary,
                    branch_id: formData.branch_id, hired_date: formatDateToBackend(formData.hired_date),
                    role: formData.role, email: formData.email, is_active: formData.is_active
                };
                await employeeApi.updateEmployeeDetail(editingId, updatePayload);
                alert("Cập nhật thông tin thành công!");
            }
            setIsConfirmOpen(false);
            setIsFormOpen(false);
            fetchEmployees();
        } catch (error) {
            console.error("Lỗi thực thi:", error);
            // Bắt lỗi thêm từ Backend nếu có (ví dụ trùng Username)
            alert("Có lỗi xảy ra: " + (error.response?.data?.message || "Vui lòng kiểm tra lại data"));
            setIsConfirmOpen(false);
        }
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen font-sans">
            {/* Header và Bảng Danh sách giữ nguyên như cũ... */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Users className="text-indigo-600" /> Hệ thống Quản lý Nhân sự
                    </h1>
                    <p className="text-slate-500 text-sm">Quản lý nhân sự và điều phối giữa các chi nhánh tiệm xe.</p>
                </div>
                <button onClick={openCreateForm} className="cursor-pointer flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                    <UserPlus size={18} /> Thêm nhân viên
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" name="searchName" placeholder="Tìm theo tên nhân viên..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20" value={filters.searchName} onChange={handleFilterChange} />
                </div>
                <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                    <select name="branchId" value={filters.branchId} onChange={handleFilterChange} className="cursor-pointer bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none">
                        <option value="">Toàn hệ thống chi nhánh</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <select name="role" value={filters.role} onChange={handleFilterChange} className="cursor-pointer bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none">
                        <option value="">Tất cả vai trò</option>
                        {roles.map(r => <option key={r} value={r}>{ROLE_DICTIONARY[r] || r}</option>)}
                    </select>
                    <select name="isActive" value={filters.isActive} onChange={handleFilterChange} className="cursor-pointer bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none">
                        <option value="">Tất cả trạng thái</option>
                        <option value="true">Đang hoạt động</option>
                        <option value="false">Ngừng hoạt động</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nhân viên</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vai trò</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Chi nhánh</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {employees.map((emp) => (
                                <tr key={emp.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img src={emp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.full_name)}&background=random`} alt={emp.full_name} className="w-10 h-10 rounded-full border border-slate-200 cursor-pointer hover:scale-105 transition-transform" onClick={() => setZoomedImage(emp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.full_name)}&background=random`)} />
                                            <div>
                                                <div className="font-bold text-slate-900">{emp.full_name}</div>
                                                <div className="text-xs text-slate-500">ID: #00{emp.id} | {emp.phone}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><span className="text-sm text-slate-700 font-medium">{emp.role ? ROLE_DICTIONARY[emp.role] : "Chưa cập nhật"}</span></td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{emp.branchName || "Chưa phân bổ"}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${emp.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${emp.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                            {emp.is_active ? 'Hoạt động' : 'Đã nghỉ'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openUpdateForm(emp.id)} className="cursor-pointer p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {employees.length > 0 && (
                <div className="mt-4"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} /></div>
            )}

            {/* Modal Zoom Ảnh */}
            {zoomedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setZoomedImage(null)}>
                    <div className="relative max-w-3xl max-h-screen p-4">
                        <button className="absolute top-0 right-0 p-2 m-4 bg-white/20 hover:bg-white/40 rounded-full text-white cursor-pointer" onClick={() => setZoomedImage(null)}><X size={24} /></button>
                        <img src={zoomedImage} alt="Zoomed Avatar" className="w-auto h-auto max-w-full max-h-[80vh] rounded-xl shadow-2xl object-contain" />
                    </div>
                </div>
            )}

            {/* MODAL FORM THÊM / SỬA - ĐÃ THÊM LỖI VALIDATION */}
            {isFormOpen && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800">{formMode === 'create' ? 'Thêm nhân viên mới' : 'Cập nhật thông tin nhân viên'}</h2>
                            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={24} /></button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {/* Chú ý: Đã bỏ thuộc tính HTML 'required' để kiểm tra validation bằng React JS */}
                            <form id="employeeForm" onSubmit={handleSubmitRequest} className="grid grid-cols-1 md:grid-cols-2 gap-6" noValidate>
                                <div className="space-y-4 md:col-span-2 flex flex-col md:flex-row gap-6">
                                    {formMode === 'create' && (
                                        <div className="flex-shrink-0 flex flex-col items-center gap-2">
                                            <div className="w-32 h-32 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden relative group cursor-pointer">
                                                {previewUrl ? <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-400" size={32} />}
                                                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            </div>
                                            <span className="text-xs text-slate-500 font-medium">Nhấn để chọn ảnh</span>
                                        </div>
                                    )}

                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {formMode === 'create' && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tài khoản <span className="text-red-500">*</span></label>
                                                    <input type="text" name="username" value={formData.username} onChange={handleInputChange}
                                                        className={`w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 ${errors.username ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} />
                                                    {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu <span className="text-red-500">*</span></label>
                                                    <input type="password" name="password" value={formData.password} onChange={handleInputChange}
                                                        className={`w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 ${errors.password ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} />
                                                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                                                </div>
                                            </>
                                        )}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Họ và Tên <span className="text-red-500">*</span></label>
                                            <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange}
                                                className={`w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 ${errors.full_name ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} />
                                            {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                                            <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                                                className={`w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 ${errors.phone ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} />
                                            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                                        className={`w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 ${errors.email ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Vai trò <span className="text-red-500">*</span></label>
                                    <select name="role" value={formData.role} onChange={handleInputChange}
                                        className={`cursor-pointer w-full p-2 border rounded-lg outline-none bg-white focus:ring-2 focus:ring-indigo-500/20 ${errors.role ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}>
                                        <option value="">-- Chọn vai trò --</option>
                                        {role4GBM.map(r => <option key={r} value={r}>{ROLE_DICTIONARY[r] || r}</option>)}
                                    </select>
                                    {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Chi nhánh trực thuộc <span className="text-red-500">*</span></label>
                                    <select name="branch_id" value={formData.branch_id} onChange={handleInputChange}
                                        className={`cursor-pointer w-full p-2 border rounded-lg outline-none bg-white focus:ring-2 focus:ring-indigo-500/20 ${errors.branch_id ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}>
                                        <option value="">-- Chọn chi nhánh --</option>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                    {errors.branch_id && <p className="text-red-500 text-xs mt-1">{errors.branch_id}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Ngày vào làm <span className="text-red-500">*</span></label>
                                    <input type="date" name="hired_date" value={formData.hired_date} onChange={handleInputChange}
                                        className={`cursor-pointer w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 ${errors.hired_date ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} />
                                    {errors.hired_date && <p className="text-red-500 text-xs mt-1">{errors.hired_date}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Lương cơ bản</label>
                                    <input type="number" name="base_salary" value={formData.base_salary} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20" />
                                </div>

                                <div className="flex items-center gap-4 mt-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 rounded cursor-pointer" />
                                        <span className="text-sm font-medium text-slate-700">Đang hoạt động</span>
                                    </label>
                                    {formMode === 'create' && (
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" name="isAvailable" checked={formData.isAvailable} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 rounded cursor-pointer" />
                                            <span className="text-sm font-medium text-slate-700">Đang sẵn sàng làm việc</span>
                                        </label>
                                    )}
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
                            <button onClick={() => setIsFormOpen(false)} className="cursor-pointer px-4 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors">Hủy bỏ</button>
                            <button type="submit" form="employeeForm" className="cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm">{formMode === 'create' ? 'Lưu nhân viên' : 'Cập nhật'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Xác nhận */}
            {isConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0"><AlertTriangle size={24} /></div>
                            <h3 className="text-lg font-bold text-slate-800">Xác nhận {formMode === 'create' ? 'thêm mới' : 'cập nhật'}</h3>
                        </div>
                        <p className="text-slate-600 mb-6">Bạn có chắc chắn muốn {formMode === 'create' ? 'tạo nhân viên này' : 'lưu các thay đổi này'} vào hệ thống không?</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setIsConfirmOpen(false)} className="cursor-pointer px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors">Hủy</button>
                            <button onClick={executeAction} className="cursor-pointer px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">Đồng ý</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersonnelManagement;