import { Outlet } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import ChatBotWidget from '../Pages/customer/ChatBotWidget'

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
                <main className="flex-grow w-full">
                    <Outlet /> {/* Không còn lồng nhốt nữa, thả rông hoàn toàn */}
                </main>
            </main>

            {/* 3. FOOTER (Cập nhật padding cho đẹp hơn) */}
            <footer className="bg-gray-800 text-white p-6 md:p-10 text-center border-t border-gray-700">
                <p className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    © Trang Web chỉ phục vụ cho mục đích học tập.
                </p>
            </footer>

            {/* 4. CHATBOT WIDGET */}
            <ChatBotWidget />
        </div>
    )
}