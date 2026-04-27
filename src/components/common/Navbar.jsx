import { Link, useNavigate } from 'react-router-dom'
import { Wrench } from 'lucide-react'
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';
import { contentApi } from '../../api/contentApi';
import { menuApi } from '../../api/menuApi';

export default function Navbar() {
    const { user, setUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [contentData, setContentData] = useState({});
    const [menu, setMenu] = useState(null);

    const handleLogout = async () => {
        try {
            await authApi.logout();
            setUser(null);
            navigate('/login');
        } catch (error) {
            console.error("Lỗi khi đăng xuất:", error);
        }
    };

    useEffect(() => {
        const fetchNavbarData = async () => {
            try {
                const contentRes = await contentApi.getContentList('NAVBAR');
                const rawContentList = contentRes.data || contentRes;
                const menu = await menuApi.getMenuById(4)
                setMenu(menu)
                const formattedContent = rawContentList.reduce((acc, item) => {
                    const { sectionCode, contentKey, contentValue, link, color } = item;

                    // 1. Khởi tạo mảng/object tương ứng với Section
                    if (!acc[sectionCode]) {
                        if (sectionCode === 'MAIN_MENU' || sectionCode === 'USER_MENU') {
                            acc[sectionCode] = [];
                        } else {
                            acc[sectionCode] = {};
                        }
                    }

                    const dataObj = {
                        value: contentValue,
                        url: link,
                        color: color
                    };

                    // 2. Nhét dữ liệu vào
                    if (Array.isArray(acc[sectionCode])) {
                        acc[sectionCode].push(dataObj);
                    } else {
                        acc[sectionCode][contentKey] = dataObj;
                    }

                    return acc;
                }, {});
                // console.log(formattedContent)
                setContentData(formattedContent);
            } catch (error) {
                console.error("Không thể tải dữ liệu từ server", error);
            }
        };


        fetchNavbarData();
    }, [])

    return (
        <header className="shadow-md sticky top-0 z-50"
            style={{ backgroundColor: menu?.color }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* ===== 1. KHU VỰC LOGO ===== */}
                    <Link to={contentData.LOGO?.brand_name?.url || "/"} className="flex items-center gap-2">
                        <Wrench className="h-6 w-6 text-blue-600" />
                        <span
                            className="font-bold text-xl transition-colors"
                            style={{ color: contentData.LOGO?.brand_name?.color || '#111827' }}
                        >
                            {contentData.LOGO?.brand_name?.value || "MotorCare"}
                        </span>
                    </Link>

                    {/* ===== 2. KHU VỰC MAIN MENU ===== */}
                    <nav className="hidden md:flex space-x-8">
                        {contentData.MAIN_MENU && contentData.MAIN_MENU.map((menuItem, index) => (
                            <Link
                                key={index}
                                to={menuItem.url}
                                className="font-medium hover:opacity-70 transition-opacity"
                                style={{ color: menuItem.color || '#4B5563' }}
                            >
                                {menuItem.value}
                            </Link>
                        ))}
                    </nav>

                    {/* ===== 3. KHU VỰC ACTION BUTTON & USER MENU ===== */}
                    <div className="flex items-center gap-4">

                        {/* Nút Đặt lịch */}
                        <Link
                            to={contentData.ACTION_BTN?.booking_btn?.url || "/bookingPage"}
                            className="px-4 py-2 rounded-md font-medium transition-opacity hover:opacity-90 shadow-sm"
                            style={{
                                color: contentData.ACTION_BTN?.booking_btn?.color || '#FFFFFF',
                                backgroundColor: contentData.NAVBAR_STYLE?.booking_bg?.color || '#2563EB'
                            }}
                        >
                            {contentData.ACTION_BTN?.booking_btn?.value || "Đặt lịch ngay"}
                        </Link>

                        {/* User Info / Đăng nhập */}
                        <div className="flex items-center gap-3">
                            {user?.full_name ? (
                                <div className="relative group">
                                    {/* KHUNG CHỨA TÊN USER (Đã có màu nền động) */}
                                    <div
                                        className="flex items-center gap-3 p-1 pr-3 rounded-full border border-gray-700 cursor-pointer transition-opacity hover:opacity-90"
                                        style={{ backgroundColor: contentData.NAVBAR_STYLE?.user_wrap_bg?.color || '#1F2937' }}
                                    >
                                        {/* AVATAR VÒNG TRÒN (Đã có màu nền động) */}
                                        <div
                                            className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-inner"
                                            style={{ backgroundColor: contentData.NAVBAR_STYLE?.avatar_bg?.color || '#2563EB' }}
                                        >
                                            {user.full_name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-medium text-sm text-gray-100">{user.full_name}</span>
                                    </div>

                                    {/* MENU DROPDOWN CỦA USER */}
                                    <div className="absolute right-0 top-full pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 py-2 flex flex-col overflow-hidden">

                                            {contentData.USER_MENU && contentData.USER_MENU.map((item, index) => {
                                                if (!item.url) return null;
                                                return (
                                                    <Link
                                                        key={index}
                                                        to={item.url}
                                                        className="px-4 py-2.5 text-sm hover:bg-gray-50 font-medium transition-colors"
                                                        style={{ color: item.color || '#374151' }}
                                                    >
                                                        {item.value}
                                                    </Link>
                                                )
                                            })}

                                            <div className="border-t border-gray-100 my-1"></div>

                                            <button
                                                onClick={handleLogout}
                                                className="px-4 py-2.5 text-sm hover:bg-red-50 text-left font-medium transition-colors w-full"
                                                style={{ color: contentData.USER_MENU?.find(item => !item.url)?.color || '#DC2626' }}
                                            >
                                                {contentData.USER_MENU?.find(item => !item.url)?.value || "Đăng xuất"}
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            ) : (
                                // NÚT ĐĂNG NHẬP (Đã có màu nền động)
                                <Link
                                    to={contentData.LOGIN?.login_btn?.url || "/login"}
                                    className="px-5 py-2 rounded-full font-medium transition-opacity hover:opacity-90 text-sm shadow-sm"
                                    style={{
                                        color: contentData.LOGIN?.login_btn?.color || '#FFFFFF',
                                        backgroundColor: contentData.NAVBAR_STYLE?.login_bg?.color || '#000000'
                                    }}
                                >
                                    {contentData.LOGIN?.login_btn?.value || "Đăng nhập"}
                                </Link>
                            )}
                        </div>

                    </div>

                </div>
            </div>
        </header >
    )
}