import { useForm } from "react-hook-form";
import { Wrench, ArrowRight } from "lucide-react";
import { authApi } from "../../api/authApi";
import { Link, useNavigate } from "react-router-dom"; // Thêm useNavigate
export default function Register() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const navigate = useNavigate(); // Khởi tạo hàm chuyển trang
    const onSubmit = async (data) => {
        // Gọi API thật!
        try {
            const response = await authApi.register(data);

            // Báo thành công (Có thể dùng thư viện react-toastify cho đẹp sau này)
            alert("Đăng ký thành công! Đang chuyển hướng đến Đăng nhập...");

            // Chuyển người dùng sang trang Login
            navigate('/login');

        } catch (error) {
            // Bắt lỗi từ Spring Boot (Ví dụ: Trùng username, số điện thoại đã tồn tại...)
            console.error("Lỗi đăng ký:", error);
            alert(error.response?.data?.message || "Đăng ký thất bại, vui lòng thử lại!");
        }
    };

    return (
        // Thẻ siêu rộng, bo góc to, có bóng đổ shadow-2xl
        <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row my-8 border border-gray-100">

            {/* NỬA TRÁI: ẢNH MINH HỌA (Ẩn trên điện thoại, hiện trên tablet/PC) */}
            <div className="hidden md:block md:w-1/2 relative bg-gray-900">
                <img
                    src="https://images.unsplash.com/photo-1599256621730-535171e28e50?q=80&w=1974&auto=format&fit=crop"
                    alt="Motorbike Repair"
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
                {/* Nội dung đè lên ảnh */}
                <div className="relative z-10 p-12 flex flex-col h-full justify-between">
                    <div>
                        <Link to="/" className="flex items-center gap-2 text-white mb-8">
                            <Wrench className="h-8 w-8 text-blue-400" />
                            <span className="font-bold text-3xl tracking-tight">MotorCare</span>
                        </Link>
                        <h2 className="text-4xl font-extrabold text-white leading-tight">
                            Dịch vụ sửa chữa xe máy hàng đầu.
                        </h2>
                    </div>
                    <p className="text-gray-300 text-lg">
                        Đăng ký tài khoản ngay hôm nay để quản lý lịch sử bảo dưỡng và đặt lịch nhanh chóng.
                    </p>
                </div>
            </div>

            {/* NỬA PHẢI: FORM ĐĂNG KÝ */}
            <div className="w-full md:w-1/2 p-8 md:p-12">
                {/* Logo cho phiên bản mobile (Chỉ hiện trên điện thoại) */}
                <div className="md:hidden flex items-center gap-2 mb-8 justify-center">
                    <Wrench className="h-8 w-8 text-blue-600" />
                    <span className="font-bold text-2xl text-gray-900">MotorCare</span>
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Tạo tài khoản</h1>
                    <p className="text-gray-500 mt-2">Vui lòng điền thông tin để đăng ký.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* 1. Họ và tên */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Họ và tên</label>
                        <input
                            type="text" placeholder="Nguyễn Văn A"
                            className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:outline-none transition-colors ${errors.full_name ? 'border-red-500 focus:ring-red-200 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'}`}
                            {...register("full_name", { required: "Vui lòng nhập họ và tên" })}
                        />
                        {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>}
                    </div>

                    {/* 2. Tên đăng nhập */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Tên đăng nhập</label>
                        <input
                            type="text" placeholder="vietanh123"
                            className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:outline-none transition-colors ${errors.username ? 'border-red-500 focus:ring-red-200 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'}`}
                            {...register("username", { required: "Vui lòng nhập tên đăng nhập" })}
                        />
                        {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>}
                    </div>

                    {/* 3. Số điện thoại */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại</label>
                        <input
                            type="text" placeholder="09xxxxxxxx"
                            className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:outline-none transition-colors ${errors.phone ? 'border-red-500 focus:ring-red-200 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'}`}
                            {...register("phone", {
                                required: "Vui lòng nhập số điện thoại",
                                pattern: { value: /^[0-9]{10,11}$/, message: "Số điện thoại phải từ 10-11 số" }
                            })}
                        />
                        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
                    </div>

                    {/* 4. Mật khẩu */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu</label>
                        <input
                            type="password" placeholder="••••••••"
                            className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:outline-none transition-colors ${errors.password ? 'border-red-500 focus:ring-red-200 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'}`}
                            {...register("password", {
                                required: "Vui lòng nhập mật khẩu",
                                minLength: { value: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" }
                            })}
                        />
                        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                    </div>

                    {/* Nút Submit */}
                    <button
                        type="submit" disabled={isSubmitting}
                        className={`w-full py-3.5 rounded-xl font-bold text-white flex justify-center items-center gap-2 transition-all mt-6
              ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 hover:-translate-y-0.5'}`}
                    >
                        {isSubmitting ? 'Đang xử lý...' : 'Đăng Ký Ngay'}
                        {!isSubmitting && <ArrowRight className="h-5 w-5" />}
                    </button>
                </form>

                <div className="mt-8 text-center text-gray-600">
                    Đã có tài khoản? <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">Đăng nhập</Link>
                </div>
            </div>

        </div>
    );
}