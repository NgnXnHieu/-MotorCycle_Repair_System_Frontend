import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
    FaArrowLeft,
    FaFileSignature,
    FaCalendarCheck,
    FaUserGear,
    FaRightFromBracket
} from 'react-icons/fa6';
import { authApi } from '../api/authApi';
import { useNavigate } from 'react-router-dom';

const EmployeeSidebar = () => {
    const navigate = useNavigate()
    // State quản lý trạng thái thu/phóng của sidebar
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = async () => {
        await authApi.logout()
        navigate(`/login`)
    }

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            {/* SIDEBAR CONTAINER */}
            <aside
                className={`bg-[#5b9b8b] text-white flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'w-[70px]' : 'w-[250px]'
                    }`}
            >
                {/* Header */}
                <div className="flex items-center h-[70px] relative w-full">
                    {/* Logo / Tên role */}
                    <span
                        className={`absolute left-5 text-lg font-bold whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
                            }`}
                    >
                        Receptionist
                    </span>

                    {/* Nút Toggle */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`absolute text-white text-xl cursor-pointer transition-all duration-300 hover:text-gray-200 ${isCollapsed
                            ? 'rotate-180 left-1/2 -translate-x-1/2' /* Căn giữa khi thu nhỏ */
                            : 'rotate-0 right-5'                     /* Nằm sát phải khi mở rộng */
                            }`}
                    >
                        <FaArrowLeft />
                    </button>
                </div>

                {/* Menu Navigation */}
                <ul className="flex-1 mt-4 flex flex-col gap-1">
                    <li>
                        <a
                            href="/receptionist/walkInBooking"
                            className="flex items-center px-5 py-3 text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                        >
                            <FaFileSignature className="text-xl min-w-[30px]" />
                            <span
                                className={`ml-3 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100 block'
                                    }`}
                            >
                                Tạo phiếu sửa
                            </span>
                        </a>
                    </li>
                    <li>
                        <a
                            href="/receptionist/appointmentManagement"
                            className="flex items-center px-5 py-3 text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                        >
                            <FaCalendarCheck className="text-xl min-w-[30px]" />
                            <span
                                className={`ml-3 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100 block'
                                    }`}
                            >
                                Quản lý ca sửa
                            </span>
                        </a>
                    </li>
                    <li>
                        <a
                            href="/receptionist/employeeProfile"
                            className="flex items-center px-5 py-3 text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                        >
                            <FaUserGear className="text-xl min-w-[30px]" />
                            <span
                                className={`ml-3 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100 block'
                                    }`}
                            >
                                Quản lý tài khoản
                            </span>
                        </a>
                    </li>
                </ul>

                {/* Footer */}
                <div className="pb-5 border-t border-white/10 mt-auto">
                    <div
                        onClick={() => handleLogout()}
                        className="cursor-pointer flex items-center px-5 py-4 text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                    >
                        <FaRightFromBracket className="text-xl min-w-[30px]" />
                        <span

                            className={`ml-3 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100 block'
                                }`}
                        >
                            Đăng xuất
                        </span>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 p-8 overflow-y-auto">
                {/* <h1 className="text-2xl font-bold text-gray-800">Dashboard Tư vấn viên</h1>
                <p className="mt-4 text-gray-600">
                    Nội dung chính của trang web như bảng biểu, form tạo phiếu sửa xe sẽ nằm ở khu vực này...
                </p> */}
                <Outlet />
            </main>
        </div>
    );
};

export default EmployeeSidebar;