import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Wrench, LogIn, Eye, EyeOff, AlertCircle } from "lucide-react"; // Thêm AlertCircle
import { authApi } from "../../api/authApi";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import useSmartScroll from "../../components/common/useSmartScroll";

export default function Login() {
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
    const navigate = useNavigate();
    const { fetchProfile } = useContext(AuthContext);

    // State quản lý ẩn/hiện mật khẩu
    const [showPassword, setShowPassword] = useState(false);

    // ==========================================
    // STATE QUẢN LÝ LỖI ĐĂNG NHẬP (HIỂN THỊ LÊN MÀN HÌNH)
    // ==========================================
    const [loginError, setLoginError] = useState("");

    // useEffect(() => {
    //     window.scrollTo(0, 0);
    //     reset();
    // }, [reset]);
    useSmartScroll(isLoading);

    const onSubmit = async (data) => {
        // Reset lại lỗi mỗi lần bấm đăng nhập
        setLoginError("");

        try {
            const response = await authApi.login(data);
            toast.success("Đăng nhập thành công!");

            const role = response?.role;
            setTimeout(async () => {
                if (role === "ROLE_CUSTOMER") {
                    await fetchProfile();
                    navigate('/');
                } else if (role === "ROLE_RECEPTIONIST") {
                    navigate('/receptionist/appointmentManagement');
                } else if (role === "ROLE_GENERAL_MANAGER") {
                    navigate('/generalManager/employeeProfile');
                } else if (role === "ROLE_MECHANIC") {
                    navigate(`/mechanic/myShift`)
                }
            }, 1000);

        } catch (error) {
            // Lấy thông báo lỗi từ backend hoặc dùng câu thông báo mặc định
            const errorMsg = error.response?.data?.message || "Sai tên đăng nhập hoặc mật khẩu. Vui lòng kiểm tra lại!";

            // Set thông báo lỗi để hiển thị ra màn hình form
            setLoginError(errorMsg);

            // Vẫn giữ toast để thông báo thêm (có thể bỏ nếu không thích)
            toast.error(errorMsg);
        }
    };

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center p-4 bg-cover bg-center relative"
            style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=2070&auto=format&fit=crop')`
            }}
        >
            <div className="absolute inset-0 bg-gray-900/50 z-0"></div>

            <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-8 sm:p-10 rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-500">

                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-white/20 p-3 rounded-full mb-3 backdrop-blur-sm border border-white/30 shadow-inner">
                        <Wrench className="h-8 w-8 text-blue-300" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Đăng Nhập</h1>
                    <p className="text-gray-200 mt-2 text-sm font-medium drop-shadow-sm">MotorCare - Dịch vụ sửa chữa uy tín</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">

                    {/* KHUNG HIỂN THỊ LỖI ĐĂNG NHẬP */}
                    {loginError && (
                        <div className="bg-red-500/20 backdrop-blur-md border border-red-500/50 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
                            <p className="text-red-200 text-sm font-semibold leading-relaxed drop-shadow-md">
                                {loginError}
                            </p>
                        </div>
                    )}

                    {/* Input Tên đăng nhập */}
                    <div>
                        <label className="block text-sm font-bold text-white mb-1.5 pl-1 drop-shadow-sm">Tên đăng nhập</label>
                        <input
                            type="text"
                            placeholder="Nhập username"
                            className={`w-full px-5 py-3.5 bg-white/60 backdrop-blur-md border rounded-2xl focus:ring-4 focus:outline-none transition-all placeholder-gray-500 text-gray-900 font-medium shadow-inner
                                ${errors.username ? 'border-red-400 focus:ring-red-400/50' : 'border-white/40 focus:border-blue-400 focus:ring-blue-400/50'}`}
                            {...register("username", { required: "Vui lòng nhập tên đăng nhập" })}
                        />
                        {errors.username && <p className="text-red-300 text-xs mt-1.5 font-bold pl-1 drop-shadow-md">{errors.username.message}</p>}
                    </div>

                    {/* Input Mật khẩu */}
                    <div>
                        <div className="flex justify-between items-center mb-1.5 pl-1">
                            <label className="block text-sm font-bold text-white drop-shadow-sm">Mật khẩu</label>
                            <a href="#" className="text-sm font-bold text-blue-300 hover:text-blue-200 hover:underline drop-shadow-sm">Quên mật khẩu?</a>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                className={`w-full pl-5 pr-12 py-3.5 bg-white/60 backdrop-blur-md border rounded-2xl focus:ring-4 focus:outline-none transition-all placeholder-gray-500 text-gray-900 font-medium shadow-inner
                                    ${errors.password ? 'border-red-400 focus:ring-red-400/50' : 'border-white/40 focus:border-blue-400 focus:ring-blue-400/50'}`}
                                {...register("password", { required: "Vui lòng nhập mật khẩu" })}
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

                    {/* Nút Đăng Nhập */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-4 rounded-xl font-black text-white flex justify-center items-center gap-2 transition-all mt-8 tracking-wider shadow-lg border border-white/20
                            ${isSubmitting ? 'bg-gray-500/80 cursor-not-allowed' : 'bg-blue-600/90 hover:bg-blue-500 hover:-translate-y-0.5 active:translate-y-0 shadow-blue-900/50'}`}
                    >
                        {isSubmitting ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP'}
                        {!isSubmitting && <LogIn className="h-5 w-5" />}
                    </button>
                </form>

                {/* Link Đăng Ký */}
                <div className="mt-8 text-center text-gray-200 font-medium drop-shadow-sm">
                    Chưa có tài khoản?{" "}
                    <Link to="/register" className="font-bold text-blue-300 hover:text-blue-100 hover:underline transition-all">
                        Đăng ký ngay
                    </Link>
                </div>
            </div>

            <ToastContainer position="top-right" autoClose={3000} theme="colored" />
        </div>
    );
}