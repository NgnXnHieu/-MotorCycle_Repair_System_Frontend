import React, { useState, useEffect, useRef } from 'react';
import { employeeApi } from '../../api/employeeApi';
import { accountApi } from '../../api/accountApi';
import {
    User, Phone, CalendarDays, DollarSign,
    Building2, MapPin, PhoneCall, ExternalLink,
    ShieldCheck, CheckCircle2, XCircle, Loader2,
    Camera, Map, KeyRound, BadgeCheck, Briefcase, Mail, Plus, RefreshCw, X
} from 'lucide-react';


export default function EmployeeProfile() {
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [isSubmittingPass, setIsSubmittingPass] = useState(false);

    const [isViewingAvatar, setIsViewingAvatar] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Giả lập gọi API với dữ liệu bạn cung cấp
        const fetchProfile = async () => {
            setIsLoading(true);
            try {
                const res = await employeeApi.getProfile();
                setProfile(res)
                console.log(res)
                console.log("xong")
                setIsLoading(false);
            } catch (error) {
                console.error("Lỗi fetch profile:", error);
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    // 1. Hàm chuyển đổi Role sang tiếng Việt
    const getRoleName = (role) => {
        const roles = {
            'CUSTOMER': 'Khách hàng',
            'RECEPTIONIST': 'Tư vấn viên',
            'MECHANIC': 'Thợ sửa',
            'BRANCH_MANAGER': 'Quản lý chi nhánh',
            'GENERAL_MANAGER': 'Quản lý chuỗi chi nhánh'
        };
        return roles[role] || 'Nhân viên';
    };

    const formatCurrency = (amount) => amount ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount) : "Bảo mật";
    const formatDate = (date) => date ? date.split('-').reverse().join('/') : "Chưa cập nhật";

    if (isLoading) return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <p className="text-slate-500 font-medium">Đang tải hồ sơ...</p>
        </div>
    );

    // THÊM MỚI: Hàm xử lý mở hộp thoại chọn file
    const handleCameraClick = () => {
        fileInputRef.current?.click();
    };

    // THÊM MỚI: Hàm xử lý khi người dùng chọn file xong
    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Tùy chọn: Validate định dạng hoặc dung lượng (vd: < 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert("Vui lòng chọn ảnh dưới 10MB");
            return;
        }

        setIsUploading(true);
        try {
            // 1. Tạo FormData để gửi file lên server
            const formData = new FormData();
            formData.append("file", file);

            // 2. GỌI API TẠI ĐÂY (Bạn cần viết thêm hàm updateAvatar trong employeeApi)
            await accountApi.changeAvatar(formData);

            // 3. (Tạm thời) Preview ảnh ngay lập tức ở frontend cho mượt
            const previewUrl = URL.createObjectURL(file);
            setProfile(prev => ({ ...prev, avatar: previewUrl }));

            alert("Cập nhật ảnh đại diện thành công!");
        } catch (error) {
            console.error("Lỗi khi upload ảnh:", error);
            alert("Có lỗi xảy ra khi đổi ảnh!");
        } finally {
            setIsUploading(false);
            // Reset input file để có thể chọn lại cùng 1 ảnh nếu cần
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // THÊM MỚI: Xử lý thay đổi input
    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({ ...prev, [name]: value }));
        // Xóa lỗi khi người dùng bắt đầu gõ lại
        if (passwordError) setPasswordError('');
    };

    // THÊM MỚI: Xử lý Submit đổi mật khẩu
    const handleChangePasswordSubmit = async (e) => {
        e.preventDefault(); // Chặn reload trang
        setPasswordError('');

        // 1. Validation cơ bản ở Frontend
        if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            return setPasswordError('Vui lòng điền đầy đủ các trường.');
        }
        if (passwordForm.newPassword.length < 6) {
            return setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự.');
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            return setPasswordError('Mật khẩu xác nhận không trùng khớp!');
        }
        if (passwordForm.oldPassword === passwordForm.newPassword) {
            return setPasswordError('Mật khẩu mới không được giống mật khẩu cũ.');
        }

        setIsSubmittingPass(true);
        try {
            // 2. GỌI API (Bạn cần viết hàm này trong employeeApi)
            const res = await accountApi.changePassword({
                oldPassword: passwordForm.oldPassword,
                password: passwordForm.newPassword,
                confirmPassword: passwordForm.confirmPassword
            });


            alert(res.message || "Đổi mật khẩu thành công!");

            // 3. Reset form và đóng modal
            setIsChangingPassword(false);
            setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error("Lỗi đổi mật khẩu:", error);
            // Kiểm tra xem lỗi có phải do Backend chủ động trả về không (có error.response)
            if (error.response && error.response.data) {
                // Tùy thuộc vào cấu trúc GlobalExceptionHandler bên Spring Boot của bạn
                // Thường nó sẽ nằm ở error.response.data.message
                const backendErrorMessage = error.response.data.message;

                // Hiển thị lỗi (VD: "Mật khẩu cũ không chính xác") lên màn hình
                setPasswordError(backendErrorMessage || 'Dữ liệu không hợp lệ!');
            } else {
                // Lỗi do mất mạng hoặc server sập
                setPasswordError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau!');
            }
        } finally {
            setIsSubmittingPass(false);
        }
    };

    const handleCancelChangePW = () => {
        passwordForm.confirmPassword = ''
        passwordForm.newPassword = ''
        passwordForm.oldPassword = ''
        setIsChangingPassword(false)
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* --- BANNER --- */}
            <div className="h-48 bg-gradient-to-r from-slate-900 to-indigo-900 relative">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
            </div>

            <div className="max-w-5xl mx-auto px-4 -mt-24 relative z-10">

                {/* ================= PHẦN 1: THÔNG TIN TÀI KHOẢN (TRÊN) ================= */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden mb-8">
                    <div className="p-8 sm:p-10">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">

                            {/* Avatar với nút đổi */}
                            <div className="relative group">
                                {/* Input file ẩn */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                />

                                <div
                                    className={`w-32 h-32 rounded-full border-4 border-blue-400 shadow-xl bg-indigo-100 flex items-center justify-center overflow-hidden ${profile.avatar ? 'cursor-pointer' : ''}`}
                                    onClick={() => profile.avatar && setIsViewingAvatar(true)} // Nhấn vào ảnh để xem to
                                    title="Nhấn để xem ảnh phóng to"
                                >
                                    {isUploading ? (
                                        <Loader2 className="animate-spin text-indigo-600" size={32} />
                                    ) : profile.avatar ? ( // Đã sửa lỗi check nhầm branchDTO
                                        <img
                                            src={profile.avatar}
                                            alt="Avatar"
                                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                                        />
                                    ) : (
                                        <User size={48} className="text-slate-400" /> // Thay bằng icon User hợp lý hơn Map
                                    )}
                                </div>

                                <button
                                    onClick={handleCameraClick} // Gọi sự kiện click
                                    disabled={isUploading}
                                    className="cursor-pointer absolute bottom-1 right-1 p-2.5 bg-indigo-600 text-white rounded-full border-2 border-white shadow-lg hover:bg-indigo-700 transition-transform active:scale-90 disabled:opacity-50"
                                    title="Đổi ảnh đại diện"
                                >
                                    <Camera size={18} />
                                </button>
                            </div>

                            {/* Thông tin chính & Role */}
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">{profile.full_name}</h1>
                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-amber-200">
                                        <BadgeCheck size={14} /> {getRoleName(profile.role)}
                                    </span>
                                </div>
                                <p className="text-slate-500 font-medium mb-6">Mã nhân viên: #EMP{profile.id}</p>

                                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                    <div className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 border ${profile.isAvailable ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                                        <div className={`w-2 h-2 rounded-full ${profile.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                                        {profile.isAvailable ? 'Sẵn sàng làm việc' : 'Đang bận / Nghỉ'}
                                    </div>

                                    <button
                                        onClick={() => setIsChangingPassword(true)}
                                        className="cursor-pointer flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/20"
                                    >
                                        <KeyRound size={18} /> Đổi mật khẩu
                                    </button>

                                </div>
                            </div>
                        </div>

                        {/* Grid thông tin chi tiết */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mt-12 pt-8 border-t border-slate-100">
                            <div className="space-y-1">
                                <p className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><Phone size={12} /> Số điện thoại</p>
                                <p className="text-sm font-bold text-slate-800">{profile.phone}</p>
                            </div>
                            <div className="space-y-2">
                                {/* Nhãn và Icon - Đổi sang icon Mail cho phù hợp với nội dung Email */}
                                <p className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5 tracking-wider">
                                    <Mail size={12} className="text-slate-400" /> Địa chỉ Email
                                </p>

                                {profile.email ? (
                                    /* TRƯỜNG HỢP 1: ĐÃ CÓ EMAIL */
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                        {/* Hiển thị Email với màu Indigo chuyên nghiệp */}
                                        <p className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100/50">
                                            {profile.email}
                                        </p>

                                        {/* Nút Đổi Email - Hiệu ứng nhẹ nhàng */}
                                        <button className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors group">
                                            <RefreshCw size={10} className="group-hover:rotate-180 transition-transform duration-500" />
                                            Đổi email
                                        </button>
                                    </div>
                                ) : (
                                    /* TRƯỜNG HỢP 2: CHƯA CÓ EMAIL */
                                    <div className="animate-in zoom-in-95 duration-300">
                                        <button className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-dashed border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all active:scale-95">
                                            <Plus size={14} />
                                            Cập nhật email
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1">
                                <p className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><CalendarDays size={12} /> Ngày gia nhập</p>
                                <p className="text-sm font-bold text-slate-800">{formatDate(profile.hired_date)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><DollarSign size={12} /> Lương cơ bản</p>
                                <p className="text-sm font-bold text-slate-800 text-indigo-600">{formatCurrency(profile.base_salary)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ================= PHẦN 2: THÔNG TIN CHI NHÁNH (DƯỚI) ================= */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Building2 size={20} /></div>
                        <h3 className="font-black text-slate-800 uppercase tracking-tight">Thông tin chi nhánh công tác</h3>
                    </div>

                    <div className="p-8 flex flex-col md:flex-row gap-10">
                        {/* Ảnh chi nhánh */}
                        <div className="w-full md:w-2/5 h-64 rounded-2xl overflow-hidden shadow-inner bg-slate-100">
                            {profile.branchDTO?.imageUrl ? (
                                <img src={profile.branchDTO.imageUrl} alt="Branch" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300"><Map size={48} /></div>
                            )}
                        </div>


                        {/* Chi tiết chi nhánh */}
                        <div className="w-full md:w-3/5 space-y-6">
                            <div>
                                <h2 className="text-2xl font-black text-indigo-900 mb-1">{profile.branchDTO?.name}</h2>
                                <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Đang hoạt động
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Khối Hotline */}
                                <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <PhoneCall className="text-slate-400 shrink-0 mt-0.5" size={20} />
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Đường dây nóng</p>
                                        <p className="text-sm font-black text-indigo-600 tracking-widest">{profile.branchDTO?.hotline}</p>
                                    </div>
                                </div>

                                {/* Khối Vị trí & Bản đồ */}
                                <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <MapPin className="text-slate-400 shrink-0 mt-0.5" size={20} />
                                    <div className="w-full">
                                        {/* Text Địa chỉ */}
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Vị trí</p>
                                        <p className="text-sm font-bold text-slate-800 leading-relaxed mb-4">{profile.branchDTO?.address}</p>

                                        {/* Khối Bản đồ (Iframe) */}
                                        {profile.branchDTO?.mapUrl && (
                                            <div className="w-full h-48 sm:h-56 rounded-xl overflow-hidden border border-slate-200 shadow-inner relative group">
                                                <iframe
                                                    src={profile.branchDTO.mapUrl}
                                                    width="100%"
                                                    height="100%"
                                                    style={{ border: 0 }}
                                                    allowFullScreen=""
                                                    loading="lazy"
                                                    referrerPolicy="no-referrer-when-downgrade"
                                                    className="w-full h-full object-cover"
                                                    title="Bản đồ cơ sở"
                                                ></iframe>

                                                {/* Overlay mờ khi hover để hiển thị nút mở rộng (Tùy chọn cho UI xịn hơn) */}
                                                <div className="absolute inset-0 bg-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                            </div>
                                        )}

                                        {/* Nút Xem mở rộng */}
                                        <a
                                            href={profile.branchDTO?.mapUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                                        >
                                            {/* Mở rộng trên Google Maps <ExternalLink size={12} /> */}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* ================= MODAL XEM ẢNH PHÓNG TO ================= */}
            {isViewingAvatar && profile.avatar && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setIsViewingAvatar(false)} // Nhấn ra ngoài để đóng
                >
                    {/* Nút đóng */}
                    <button
                        className="absolute top-6 right-6 text-slate-300 hover:text-white transition-colors"
                        onClick={() => setIsViewingAvatar(false)}
                    >
                        <X size={36} />
                    </button>

                    {/* Ảnh lớn */}
                    <img
                        src={profile.avatar}
                        alt="Avatar Fullscreen"
                        className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()} // Chặn sự kiện click để không đóng khi nhấn vào ảnh
                    />
                </div>
            )}

            {/* ================= MODAL ĐỔI MẬT KHẨU ================= */}
            {isChangingPassword && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Modal */}
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-black text-slate-800 flex items-center gap-2">
                                <ShieldCheck className="text-indigo-600" size={20} />
                                Đổi mật khẩu
                            </h3>
                            <button
                                onClick={() => handleCancelChangePW()}
                                className="cursor-pointer text-slate-400 hover:text-rose-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body Modal (Form) */}
                        <form onSubmit={handleChangePasswordSubmit} className="p-6 space-y-4">
                            {/* Hiển thị lỗi chung nếu có */}
                            {passwordError && (
                                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm font-bold rounded-xl flex items-center gap-2">
                                    <XCircle size={16} /> {passwordError}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Mật khẩu hiện tại</label>
                                <input
                                    type="password"
                                    name="oldPassword"
                                    value={passwordForm.oldPassword}
                                    onChange={handlePasswordInputChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                    placeholder="Nhập mật khẩu cũ..."
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Mật khẩu mới</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={passwordForm.newPassword}
                                    onChange={handlePasswordInputChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                    placeholder="Nhập mật khẩu mới..."
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Xác nhận mật khẩu mới</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={passwordForm.confirmPassword}
                                    onChange={handlePasswordInputChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                    placeholder="Nhập lại mật khẩu mới..."
                                />
                            </div>

                            {/* Nút hành động */}
                            <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                                <button
                                    type="button"
                                    onClick={() => handleCancelChangePW()}
                                    className="cursor-pointer flex-1 py-2.5 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingPass}
                                    className="cursor-pointer flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {isSubmittingPass ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                                    Lưu thay đổi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>



    );
}