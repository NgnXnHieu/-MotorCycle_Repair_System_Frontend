import React, { useState, useEffect, useRef } from 'react';
// Import api của bạn, ví dụ: import { customerApi } from '../../api/customerApi';
import {
    User, Phone, Mail, Plus, RefreshCw, Loader2,
    Camera, KeyRound, ShieldCheck, CheckCircle2, XCircle, X,
    Award, Star, Crown, Gem, Gift
} from 'lucide-react';
import { accountApi } from '../../api/accountApi';
import { customerApi } from '../../api/customerApi';

export default function CustomerProfile() {
    // --- State Quản lý dữ liệu ---
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // --- State Modal & Tương tác ---
    const [isViewingAvatar, setIsViewingAvatar] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    // --- State Đổi mật khẩu ---
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordError, setPasswordError] = useState('');
    const [isSubmittingPass, setIsSubmittingPass] = useState(false);

    useEffect(() => {
        // Giả lập gọi API getProfile của Customer
        const fetchProfile = async () => {
            setIsLoading(true);
            try {
                const res = await customerApi.getProfile();
                setProfile(res);
            } catch (error) {
                console.error("Lỗi fetch profile:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    // Xử lý Escape để đóng Modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsViewingAvatar(false);
                if (isChangingPassword) handleCancelChangePW();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isChangingPassword]);

    // --- Helper: Cấu hình hiển thị theo Hạng Thành Viên ---
    const getTierConfig = (tier) => {
        const configs = {
            'BRONZE': { name: 'Hạng Đồng', color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-200', icon: <Star size={16} /> },
            'SILVER': { name: 'Hạng Bạc', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-300', icon: <Award size={16} /> },
            'GOLD': { name: 'Hạng Vàng', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-300', icon: <Crown size={16} /> },
            'DIAMOND': { name: 'Hạng Kim Cương', color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200', icon: <Gem size={16} /> },
        };
        return configs[tier] || { name: 'Thành viên', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', icon: <User size={16} /> };
    };

    // --- Handlers Avatar ---
    const handleCameraClick = () => fileInputRef.current?.click();

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate dung lượng ảnh dưới 10MB cho đồng bộ
        if (file.size > 10 * 1024 * 1024) return alert("Vui lòng chọn ảnh dưới 10MB");

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            // 1. Gọi API lưu ảnh lên Server
            await accountApi.changeAvatar(formData);

            // 2. Dùng thủ thuật Preview ảnh local giống hệt EmployeeProfile
            const previewUrl = URL.createObjectURL(file);
            setProfile(prev => ({ ...prev, avatar: previewUrl }));

            alert("Cập nhật ảnh thành công!");

        } catch (error) {
            console.error("Lỗi khi upload avatar:", error?.response);
            alert(error.response?.data?.message || "Có lỗi xảy ra khi tải ảnh lên!");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // --- Handlers Đổi mật khẩu ---
    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({ ...prev, [name]: value }));
        if (passwordError) setPasswordError('');
    };

    const handleChangePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            return setPasswordError('Vui lòng điền đầy đủ các trường.');
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            return setPasswordError('Mật khẩu xác nhận không trùng khớp!');
        }

        setIsSubmittingPass(true);
        try {
            // Thực tế: Gọi API đổi mật khẩu
            await new Promise(resolve => setTimeout(resolve, 1000));
            alert("Đổi mật khẩu thành công!");
            handleCancelChangePW();
        } catch (error) {
            setPasswordError(error.response?.data?.message || 'Có lỗi xảy ra!');
        } finally {
            setIsSubmittingPass(false);
        }
    };

    const handleCancelChangePW = () => {
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setIsChangingPassword(false);
    };

    if (isLoading) return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <p className="text-slate-500 font-medium">Đang tải hồ sơ...</p>
        </div>
    );

    const tierConfig = getTierConfig(profile?.membership_tier);

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-indigo-500 selection:text-white">
            {/* --- BANNER --- */}
            <div className="h-56 bg-gradient-to-br from-indigo-900 via-slate-800 to-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-24 relative z-10">

                {/* --- PHẦN 1: THÔNG TIN CÁ NHÂN --- */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-6">
                    <div className="p-8 sm:p-10">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">

                            {/* Avatar */}
                            <div className="relative group shrink-0">
                                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                                <div
                                    className={`w-36 h-36 rounded-full border-4 shadow-lg flex items-center justify-center overflow-hidden bg-slate-100 ${profile.avatar ? 'cursor-pointer hover:border-indigo-400 transition-colors' : 'border-white'}`}
                                    onClick={() => profile.avatar && setIsViewingAvatar(true)}
                                >
                                    {isUploading ? (
                                        <Loader2 className="animate-spin text-indigo-600" size={32} />
                                    ) : profile.avatar ? (
                                        <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <User size={56} className="text-slate-300" />
                                    )}
                                </div>
                                <button
                                    onClick={handleCameraClick}
                                    disabled={isUploading}
                                    className="cursor-pointer absolute bottom-2 right-2 p-3 bg-indigo-600 text-white rounded-full border-2 border-white shadow-lg hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    <Camera size={18} />
                                </button>
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center md:text-left pt-2">
                                <div className="flex flex-col md:flex-row items-center gap-4 mb-3">
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">{profile.full_name}</h1>
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 border shadow-sm ${tierConfig.bg} ${tierConfig.color} ${tierConfig.border}`}>
                                        {tierConfig.icon} {tierConfig.name}
                                    </span>
                                </div>
                                <p className="text-slate-500 font-medium mb-6">Khách hàng thành viên từ 2026</p>

                                <button
                                    onClick={() => setIsChangingPassword(true)}
                                    className="cursor-pointer inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-md shadow-slate-900/20"
                                >
                                    <KeyRound size={18} /> Đổi mật khẩu bảo mật
                                </button>
                            </div>
                        </div>

                        {/* Grid Liên hệ */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 pt-8 border-t border-slate-100">
                            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-indigo-100 transition-colors">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg"><Phone size={20} /></div>
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Số điện thoại</p>
                                    <p className="text-base font-black text-slate-800">{profile.phone}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-indigo-100 transition-colors">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg"><Mail size={20} /></div>
                                <div className="flex-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Địa chỉ Email</p>
                                    {profile.email ? (
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-bold text-slate-800">{profile.email}</p>
                                            <button className="cursor-pointer text-[11px] text-indigo-600 font-bold hover:underline flex items-center gap-1">
                                                <RefreshCw size={12} /> Đổi
                                            </button>
                                        </div>
                                    ) : (
                                        <button className="cursor-pointer text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                            <Plus size={14} /> Cập nhật email ngay
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- PHẦN 2: THỐNG KÊ & ĐIỂM THƯỞNG --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Thẻ Điểm Thưởng */}
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><Gift size={120} /></div>
                        <div className="relative z-10">
                            <h3 className="text-indigo-100 text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Award size={18} /> Điểm tích lũy hiện tại
                            </h3>
                            <div className="flex items-baseline gap-2 mb-6">
                                <span className="text-5xl font-black">{profile.reward_point}</span>
                                <span className="text-indigo-200 font-medium">điểm</span>
                            </div>
                            <p className="text-sm text-indigo-100 opacity-90 mb-6">
                                Sử dụng điểm thưởng để đổi lấy voucher giảm giá, dịch vụ rửa xe miễn phí và nhiều ưu đãi khác.
                            </p>
                            <button className="cursor-pointer bg-white text-indigo-700 px-5 py-2.5 rounded-lg text-sm font-black hover:bg-indigo-50 transition-colors active:scale-95 shadow-lg">
                                Xem danh sách ưu đãi
                            </button>
                        </div>
                    </div>

                    {/* Thẻ Quyền Lợi (Placeholder) */}
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-lg ${tierConfig.bg} ${tierConfig.color}`}>
                                {tierConfig.icon}
                            </div>
                            <h3 className="font-black text-slate-800 text-lg">Đặc quyền {tierConfig.name}</h3>
                        </div>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                <CheckCircle2 size={16} className="text-emerald-500" /> Tích lũy 1% điểm cho mỗi hóa đơn.
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                <CheckCircle2 size={16} className="text-emerald-500" /> Ưu tiên đặt lịch hẹn sửa chữa.
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                <CheckCircle2 size={16} className="text-emerald-500" /> Nhận thông báo khuyến mãi sớm nhất.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* --- MODAL ZOOM AVATAR --- */}
            {isViewingAvatar && profile.avatar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setIsViewingAvatar(false)}>
                    <button className="cursor-pointer absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-all" onClick={() => setIsViewingAvatar(false)}>
                        <X size={24} />
                    </button>
                    <img src={profile.avatar} alt="Zoomed" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()} />
                </div>
            )}

            {/* --- MODAL ĐỔI MẬT KHẨU --- */}
            {isChangingPassword && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={handleCancelChangePW}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-black text-slate-800 flex items-center gap-2">
                                <ShieldCheck className="text-indigo-600" size={20} /> Đổi mật khẩu
                            </h3>
                            <button onClick={handleCancelChangePW} className="cursor-pointer text-slate-400 hover:text-rose-500 p-1 bg-slate-100 hover:bg-rose-50 rounded-md transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleChangePasswordSubmit} className="p-6 space-y-4">
                            {passwordError && (
                                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm font-bold rounded-xl flex items-center gap-2">
                                    <XCircle size={16} /> {passwordError}
                                </div>
                            )}
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-500 uppercase">Mật khẩu hiện tại</label>
                                <input type="password" name="oldPassword" value={passwordForm.oldPassword} onChange={handlePasswordInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Nhập mật khẩu cũ..." />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-500 uppercase">Mật khẩu mới</label>
                                <input type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Nhập mật khẩu mới..." />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-500 uppercase">Xác nhận mật khẩu mới</label>
                                <input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Nhập lại mật khẩu mới..." />
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                                <button type="button" onClick={handleCancelChangePW} className="cursor-pointer flex-1 py-2.5 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                                    Hủy bỏ
                                </button>
                                <button type="submit" disabled={isSubmittingPass} className="cursor-pointer flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                                    {isSubmittingPass ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />} Lưu thay đổi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}