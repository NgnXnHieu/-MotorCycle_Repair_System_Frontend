import { Outlet } from 'react-router-dom'
import Navbar from '../components/common/Navbar'

export default function PublicLayout() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* 1. SỬ DỤNG DUY NHẤT NAVBAR COMPONENT MỚI Ở ĐÂY */}
            <Navbar />

            {/* 2. TỐI ƯU PHẦN NỘI DUNG CHÍNH (MAIN) */}
            <main className="flex-grow">
                {/*
          Thêm Container giới hạn chiều rộng (max-w-7xl)
          và căn giữa (mx-auto) cho toàn bộ nội dung bên trong
        */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
                    <Outlet />
                </div>
            </main>

            {/* 3. FOOTER (Cập nhật padding cho đẹp hơn) */}
            <footer className="bg-gray-800 text-white p-6 md:p-10 text-center border-t border-gray-700">
                <p className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    © 2026 Bản quyền thuộc về Hệ thống sửa xe MotorCare.
                </p>
            </footer>
        </div>
    )
}