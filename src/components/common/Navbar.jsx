import { Link, useNavigate } from 'react-router-dom'
import { Wrench } from 'lucide-react'
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
// Import thêm authApi nếu bạn có hàm đăng xuất gọi xuống Backend
import { authApi } from '../../api/authApi';

export default function Navbar() {
    const { user, setUser } = useContext(AuthContext);
    const navigate = useNavigate();

    // Hàm xử lý Đăng xuất
    const handleLogout = async () => {
        try {
            // Nếu Backend của bạn có API đăng xuất để xóa Cookie, hãy gọi ở đây:
            await authApi.logout();
            // Cập nhật Context về null (Xóa thông tin user khỏi màn hình)
            setUser(null);

            // Chuyển hướng về trang chủ hoặc trang đăng nhập
            navigate('/login');
        } catch (error) {
            console.error("Lỗi khi đăng xuất:", error);
        }
    };

    return (
        <header className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <Wrench className="h-6 w-6 text-blue-600" />
                        <span className="font-bold text-xl text-gray-900">MotorCare</span>
                    </Link>

                    {/* Menu Links */}
                    <nav className="hidden md:flex space-x-8">
                        <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium">Trang chủ</Link>
                        <Link to="/servicePackagePage" className="text-gray-600 hover:text-blue-600 font-medium">Dịch vụ</Link>
                        <Link to="/sparePartsPage" className="text-gray-600 hover:text-blue-600 font-medium">Phụ tùng</Link>
                        <Link to="/myAppointmentHistory" className="text-gray-600 hover:text-blue-600 font-medium">Tra cứu lịch sử</Link>
                        <Link to="/vehicleManagement" className="text-gray-600 hover:text-blue-600 font-medium">Quản lý xe</Link>
                    </nav>

                    {/* Action Buttons (Đăng nhập) */}
                    <div className="flex items-center gap-4">
                        <Link
                            to="/bookingPage"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                        >
                            Đặt lịch ngay
                        </Link>

                        {/* User Info / Đăng nhập */}
                        <div className="flex items-center gap-3">
                            {user?.full_name ? (
                                // BỌC KHUNG CHỨA USER VÀO THẺ div CÓ CLASS 'group' VÀ 'relative'
                                <div className="relative group">

                                    {/* Nút Avatar (Khu vực bắt chuột) */}
                                    <div className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 p-1 pr-3 rounded-full border border-gray-700 cursor-pointer transition-colors">
                                        <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg text-white">
                                            {user.full_name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-medium text-sm text-gray-100">{user.full_name}</span>
                                    </div>

                                    {/* MENU DROPDOWN (Ẩn mặc định, hiện ra khi hover) */}
                                    {/* pt-2 là "cây cầu tàng hình" để chuột di chuyển xuống không bị mất menu */}
                                    <div className="absolute right-0 top-full pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 py-2 flex flex-col overflow-hidden">
                                            <Link
                                                to="/profile"
                                                className="px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors"
                                            >
                                                Thông tin tài khoản
                                            </Link>
                                            <Link
                                                to="/myServicePackagesPage"
                                                className="px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors"
                                            >
                                                Dịch vụ của tôi
                                            </Link>
                                            <Link
                                                to="/change-password"
                                                className="px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors"
                                            >
                                                Đổi mật khẩu
                                            </Link>

                                            {/* Đường kẻ ngang ngăn cách */}
                                            <div className="border-t border-gray-100 my-1"></div>

                                            <button
                                                onClick={handleLogout}
                                                className="px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left font-medium transition-colors w-full"
                                            >
                                                Đăng xuất
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            ) : (
                                // Nếu chưa đăng nhập -> Hiện nút
                                <Link to="/login" className="bg-black hover:bg-green-500 text-white px-5 py-2 rounded-full font-medium transition-colors text-sm">
                                    Đăng nhập
                                </Link>
                            )}
                        </div>

                    </div>

                </div>
            </div>
        </header>
    )
}