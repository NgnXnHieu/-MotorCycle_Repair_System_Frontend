import { useForm } from "react-hook-form";
import { Wrench, ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react";
import { authApi } from "../../api/authApi";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function Register() {
    const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm();
    const navigate = useNavigate();

    // ==========================================
    // STATE QUẢN LÝ ẨN/HIỆN MẬT KHẨU & LỖI
    // ==========================================
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [registerError, setRegisterError] = useState("");

    const password = watch("password");

    useEffect(() => {
        window.scrollTo(0, 0);
        reset();
    }, [reset]);

    const onSubmit = async (data) => {
        setRegisterError(""); // Xóa lỗi cũ khi bấm đăng ký lại
        try {
            const { confirmPassword, ...registerData } = data;

            const response = await authApi.register(registerData);
            toast.success("Đăng ký thành công! Đang chuyển hướng...");

            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (error) {
            const backendMessage = error?.response?.data?.message || "Đăng ký thất bại, vui lòng kiểm tra lại thông tin!";
            setRegisterError(backendMessage);
            toast.error(backendMessage);
        }
    };

    return (
        // --- 1. BACKGROUND FULL MÀN HÌNH ---
        <div
            className="min-h-screen w-full flex items-center justify-center p-4 py-8 bg-cover bg-center relative"
            style={{
                // Ảnh nền phù hợp với chủ đề MotorCare
                backgroundImage: `url('https://images.unsplash.com/photo-1599256621730-535171e28e50?q=80&w=1974&auto=format&fit=crop')`
            }}
        >
            {/* Lớp phủ (overlay) tối màu để làm nổi form */}
            <div className="absolute inset-0 bg-gray-900/60 z-0"></div>

            {/* --- 2. KHỐI FORM ĐĂNG KÝ (GLASSMORPHISM) Ở GIỮA --- */}
            <div className="relative z-10 w-full max-w-lg bg-white/10 backdrop-blur-xl border border-white/20 p-8 sm:p-10 rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-500">

                {/* Header (Logo + Tiêu đề) */}
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-white/20 p-3 rounded-full mb-3 backdrop-blur-sm border border-white/30 shadow-inner">
                        <Wrench className="h-8 w-8 text-blue-300" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Tạo Tài Khoản</h1>
                    <p className="text-gray-200 mt-2 text-sm font-medium drop-shadow-sm text-center">
                        Tham gia hệ thống quản lý bảo dưỡng MotorCare
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">

                    {/* KHUNG HIỂN THỊ LỖI ĐĂNG KÝ */}
                    {registerError && (
                        <div className="bg-red-500/20 backdrop-blur-md border border-red-500/50 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
                            <p className="text-red-200 text-sm font-semibold leading-relaxed drop-shadow-md">
                                {registerError}
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* 1. Họ và tên */}
                        <div>
                            <label className="block text-sm font-bold text-white mb-1.5 pl-1 drop-shadow-sm">Họ và tên</label>
                            <input
                                type="text" placeholder="Nguyễn Văn A"
                                className={`w-full px-5 py-3 bg-white/60 backdrop-blur-md border rounded-2xl focus:ring-4 focus:outline-none transition-all placeholder-gray-600 text-gray-900 font-medium shadow-inner
                                    ${errors.full_name ? 'border-red-400 focus:ring-red-400/50' : 'border-white/40 focus:border-blue-400 focus:ring-blue-400/50'}`}
                                {...register("full_name", { required: "Vui lòng nhập họ và tên" })}
                            />
                            {errors.full_name && <p className="text-red-300 text-xs mt-1.5 font-bold pl-1 drop-shadow-md">{errors.full_name.message}</p>}
                        </div>

                        {/* 2. Số điện thoại */}
                        <div>
                            <label className="block text-sm font-bold text-white mb-1.5 pl-1 drop-shadow-sm">Số điện thoại</label>
                            <input
                                type="text" placeholder="09xxxxxxxx"
                                className={`w-full px-5 py-3 bg-white/60 backdrop-blur-md border rounded-2xl focus:ring-4 focus:outline-none transition-all placeholder-gray-600 text-gray-900 font-medium shadow-inner
                                    ${errors.phone ? 'border-red-400 focus:ring-red-400/50' : 'border-white/40 focus:border-blue-400 focus:ring-blue-400/50'}`}
                                {...register("phone", {
                                    required: "Vui lòng nhập SĐT",
                                    pattern: { value: /^[0-9]{10,11}$/, message: "SĐT từ 10-11 số" }
                                })}
                            />
                            {errors.phone && <p className="text-red-300 text-xs mt-1.5 font-bold pl-1 drop-shadow-md">{errors.phone.message}</p>}
                        </div>
                    </div>

                    {/* 3. Tên đăng nhập */}
                    <div>
                        <label className="block text-sm font-bold text-white mb-1.5 pl-1 drop-shadow-sm">Tên đăng nhập</label>
                        <input
                            type="text" placeholder="Nhập username"
                            autoComplete="new-password"
                            className={`w-full px-5 py-3 bg-white/60 backdrop-blur-md border rounded-2xl focus:ring-4 focus:outline-none transition-all placeholder-gray-600 text-gray-900 font-medium shadow-inner
                                ${errors.username ? 'border-red-400 focus:ring-red-400/50' : 'border-white/40 focus:border-blue-400 focus:ring-blue-400/50'}`}
                            {...register("username", {
                                required: "Vui lòng nhập tên đăng nhập",
                                minLength: { value: 6, message: "Tài khoản phải có ít nhất 8 ký tự" }
                            })}
                        />
                        {errors.username && <p className="text-red-300 text-xs mt-1.5 font-bold pl-1 drop-shadow-md">{errors.username.message}</p>}
                    </div>

                    {/* 4. Mật khẩu CÓ CON MẮT */}
                    <div>
                        <label className="block text-sm font-bold text-white mb-1.5 pl-1 drop-shadow-sm">Mật khẩu</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                autoComplete="new-password"
                                className={`w-full pl-5 pr-12 py-3 bg-white/60 backdrop-blur-md border rounded-2xl focus:ring-4 focus:outline-none transition-all placeholder-gray-600 text-gray-900 font-medium shadow-inner
                                    ${errors.password ? 'border-red-400 focus:ring-red-400/50' : 'border-white/40 focus:border-blue-400 focus:ring-blue-400/50'}`}
                                {...register("password", {
                                    required: "Vui lòng nhập mật khẩu",
                                    minLength: { value: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" }
                                })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-blue-700 transition-colors focus:outline-none"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {errors.password && <p className="text-red-300 text-xs mt-1.5 font-bold pl-1 drop-shadow-md">{errors.password.message}</p>}
                    </div>

                    {/* 5. Xác nhận mật khẩu CÓ CON MẮT */}
                    <div>
                        <label className="block text-sm font-bold text-white mb-1.5 pl-1 drop-shadow-sm">Xác nhận mật khẩu</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Nhập lại mật khẩu"
                                className={`w-full pl-5 pr-12 py-3 bg-white/60 backdrop-blur-md border rounded-2xl focus:ring-4 focus:outline-none transition-all placeholder-gray-600 text-gray-900 font-medium shadow-inner
                                    ${errors.confirmPassword ? 'border-red-400 focus:ring-red-400/50' : 'border-white/40 focus:border-blue-400 focus:ring-blue-400/50'}`}
                                {...register("confirmPassword", {
                                    required: "Vui lòng xác nhận mật khẩu",
                                    validate: (value) => value === password || "Mật khẩu xác nhận không trùng khớp"
                                })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-blue-700 transition-colors focus:outline-none"
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {errors.confirmPassword && <p className="text-red-300 text-xs mt-1.5 font-bold pl-1 drop-shadow-md">{errors.confirmPassword.message}</p>}
                    </div>

                    <button
                        type="submit" disabled={isSubmitting}
                        className={`w-full py-4 rounded-xl font-black text-white flex justify-center items-center gap-2 transition-all mt-8 tracking-wider shadow-lg border border-white/20
                            ${isSubmitting ? 'bg-gray-500/80 cursor-not-allowed' : 'bg-blue-600/90 hover:bg-blue-500 hover:-translate-y-0.5 active:translate-y-0 shadow-blue-900/50'}`}
                    >
                        {isSubmitting ? 'ĐANG TẠO...' : 'ĐĂNG KÝ NGAY'}
                        {!isSubmitting && <ArrowRight className="h-5 w-5" />}
                    </button>
                </form>

                {/* Link sang Login */}
                <div className="mt-8 text-center text-gray-200 font-medium drop-shadow-sm">
                    Đã có tài khoản?{" "}
                    <Link to="/login" className="font-bold text-blue-300 hover:text-blue-100 hover:underline transition-all">
                        Đăng nhập
                    </Link>
                </div>
            </div>

            <ToastContainer position="top-right" autoClose={3000} theme="colored" />
        </div>
    );
}