import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Wrench, LogIn } from "lucide-react";
import { authApi } from "../../api/authApi";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

export default function Login() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const navigate = useNavigate();
    const { fetchProfile } = useContext(AuthContext); // Lấy cái hàm cập nhật profile ra
    const onSubmit = async (data) => {
        try {
            // Gọi API Đăng nhập thật!
            const response = await authApi.login(data);

            console.log("Đăng nhập thành công:", response);
            //Thông báo hệ thống gọi hàm getProfile
            const role = response?.role;
            if (role === "ROLE_CUSTOMER") {
                await fetchProfile();
                navigate('/');
            } else if (role === "ROLE_RECEPTIONIST") {
                navigate('/receptionist/appointmentManagement');
            } else if (role === "ROLE_GENERAL_MANAGER") {
                navigate('/generalManager/employeeProfile');
            }

        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
            alert(error.response?.data?.message || "Sai tên đăng nhập hoặc mật khẩu!");
        }
    };

    return (
        // Thẻ siêu rộng chia đôi
        <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row my-10 border border-gray-100">

            {/* NỬA TRÁI: ẢNH MINH HỌA */}
            <div className="hidden md:block md:w-1/2 relative bg-gray-900">
                <img
                    src="https://images.unsplash.com/photo-1625047509248-ec889cbff17f?q=80&w=2070&auto=format&fit=crop"
                    alt="Motorbike Repair Login"
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
                <div className="relative z-10 p-12 flex flex-col h-full justify-between">
                    <div>
                        <Link to="/" className="flex items-center gap-2 text-white mb-8">
                            <Wrench className="h-8 w-8 text-blue-400" />
                            <span className="font-bold text-3xl tracking-tight">MotorCare</span>
                        </Link>
                    </div>
                    <div>
                        <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
                            Chào mừng <br />trở lại.
                        </h2>
                        <p className="text-gray-300 text-lg">
                            Hệ thống quản lý dịch vụ bảo dưỡng và sửa chữa xe máy chuyên nghiệp nhất.
                        </p>
                    </div>
                </div>
            </div>

            {/* NỬA PHẢI: FORM ĐĂNG NHẬP */}
            <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center">
                {/* Logo Mobile */}
                <div className="md:hidden flex items-center gap-2 mb-8 justify-center">
                    <Wrench className="h-8 w-8 text-blue-600" />
                    <span className="font-bold text-2xl text-gray-900">MotorCare</span>
                </div>

                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-gray-900">Đăng Nhập</h1>
                    <p className="text-gray-500 mt-2">Vui lòng điền thông tin để tiếp tục.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Tên đăng nhập</label>
                        <input
                            type="text" placeholder="Nhập username của bạn"
                            className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:outline-none transition-colors ${errors.username ? 'border-red-500 focus:ring-red-200 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'}`}
                            {...register("username", { required: "Vui lòng nhập tên đăng nhập" })}
                        />
                        {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>}
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-semibold text-gray-700">Mật khẩu</label>
                            <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">Quên mật khẩu?</a>
                        </div>
                        <input
                            type="password" placeholder="••••••••"
                            className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:outline-none transition-colors ${errors.password ? 'border-red-500 focus:ring-red-200 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'}`}
                            {...register("password", { required: "Vui lòng nhập mật khẩu" })}
                        />
                        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                    </div>

                    <button
                        type="submit" disabled={isSubmitting}
                        className={`w-full py-3.5 rounded-xl font-bold text-white flex justify-center items-center gap-2 transition-all mt-4
              ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 hover:-translate-y-0.5'}`}
                    >
                        {isSubmitting ? 'Đang xử lý...' : 'Đăng Nhập'}
                        {!isSubmitting && <LogIn className="h-5 w-5" />}
                    </button>
                </form>

                <div className="mt-8 text-center text-gray-600">
                    Chưa có tài khoản? <Link to="/register" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">Đăng ký ngay</Link>
                </div>
            </div>

        </div>
    );
}