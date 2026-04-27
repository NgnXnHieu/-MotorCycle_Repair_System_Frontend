import React, { useState } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import {
    FaChevronLeft,
    FaChevronRight,
    FaChartPie,
    FaStore,
    FaWrench,
    FaListUl,
    FaBoxOpen,
    FaCubes,
    FaLaptopCode,
    FaUsers,
    FaUserGear,
    FaRightFromBracket,

} from 'react-icons/fa6';
import { authApi } from '../api/authApi';

const MechanicSideBar = () => {
    const navigate = useNavigate();
    // State quản lý trạng thái thu/phóng của sidebar
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = async () => {
        try {
            await authApi.logout();
            navigate(`/login`);
        } catch (error) {
            console.error("Lỗi đăng xuất:", error);
        }
    };

    // Hệ thống Icon đã được cập nhật lại cho phù hợp với từng nghiệp vụ
    const MENU_ITEMS = [
        { path: '/mechanic/myShift', icon: <FaChartPie />, label: 'Ca sửa' },
        // { path: '/mechanic/mechanicAppointmentManagement', icon: <FaUserGear />, label: 'Quản lý Tài khoản' },
        { path: '/mechanic/myProfile', icon: <FaUserGear />, label: 'Quản lý Tài khoản' },

    ];

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            {/* SIDEBAR CONTAINER */}
            <aside
                className={`relative bg-slate-900 flex flex-col transition-all duration-300 ease-in-out shadow-xl z-20 ${isCollapsed ? 'w-[80px]' : 'w-[260px]'
                    }`}
            >
                {/* Header / Logo */}
                <div className="flex items-center h-[80px] w-full px-5 border-b border-slate-800">
                    <div className="w-10 h-10 rounded-lg bg-[#5b9b8b] text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-lg shadow-[#5b9b8b]/30">
                        G
                    </div>
                    <div
                        className={`ml-3 flex flex-col transition-opacity duration-300 overflow-hidden ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-full'
                            }`}
                    >
                        <span className="text-white font-bold text-sm tracking-wider whitespace-nowrap">
                            HỆ THỐNG
                        </span>
                        <span className="text-slate-400 text-xs whitespace-nowrap">
                            General Manager
                        </span>
                    </div>
                </div>

                {/* Nút Toggle Floating */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute top-6 -right-4 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-slate-600 hover:text-[#5b9b8b] hover:shadow-md transition-all cursor-pointer z-50"
                >
                    {isCollapsed ? <FaChevronRight size={14} /> : <FaChevronLeft size={14} />}
                </button>

                {/* Danh sách Menu */}
                <ul className="flex-1 mt-6 flex flex-col gap-2 overflow-y-auto px-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-track]:bg-transparent">
                    {MENU_ITEMS.map((item, index) => (
                        <li key={index}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center px-3 py-3 rounded-xl transition-all duration-200 whitespace-nowrap group ${isActive
                                        ? 'bg-[#5b9b8b] text-white shadow-lg shadow-[#5b9b8b]/30' // Trạng thái đang chọn
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'    // Trạng thái bình thường
                                    }`
                                }
                            >
                                <span className={`text-xl flex items-center justify-center min-w-[24px] ${isCollapsed ? 'mx-auto' : ''}`}>
                                    {item.icon}
                                </span>

                                <span
                                    className={`ml-3 font-medium transition-all duration-300 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100 block'
                                        }`}
                                >
                                    {item.label}
                                </span>

                                {/* Tooltip khi thu gọn Sidebar */}
                                {isCollapsed && (
                                    <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-800 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                                        {item.label}
                                    </div>
                                )}
                            </NavLink>
                        </li>
                    ))}
                </ul>

                {/* Footer / Đăng xuất */}
                <div className="p-4 mt-auto border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center w-full px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors whitespace-nowrap group ${isCollapsed ? 'justify-center' : ''
                            }`}
                    >
                        <FaRightFromBracket className="text-xl min-w-[24px]" />
                        <span
                            className={`ml-3 font-medium transition-all duration-300 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100 block'
                                }`}
                        >
                            Đăng xuất
                        </span>

                        {isCollapsed && (
                            <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-800 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                                Đăng xuất
                            </div>
                        )}
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto relative bg-gray-50">
                <Outlet />
            </main>
        </div>
    );
};

export default MechanicSideBar;