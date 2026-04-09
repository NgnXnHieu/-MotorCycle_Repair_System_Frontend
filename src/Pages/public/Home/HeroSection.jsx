// src/pages/public/Home/HeroSection.jsx
import { CalendarDays, AlertTriangle, Wrench } from 'lucide-react'

export default function HeroSection() {
    // Đường dẫn ảnh minh họa trên mạng (Bạn có thể thay bằng ảnh thật sau)
    const imageUrl = "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?q=80&w=2070&auto=format&fit=crop";

    return (
        // Lớp ngoài cùng: relative để các lớp con absolute dựa vào
        // rounded-3xl để bo góc đẹp giống phác thảo của bạn
        <section className="relative w-full h-[500px] md:h-[600px] rounded-3xl overflow-hidden my-6 shadow-2xl shadow-gray-200">

            {/* LỚP 1: ẢNH NỀN (Chiếm hết nền) */}
            <img
                src={imageUrl}
                alt="Motorbike Repair Shop Background"
                className="absolute inset-0 w-full h-full object-cover z-0"
            />

            {/* LỚP 2: OVERLAY (Lớp phủ đen trong suốt để làm mờ ảnh, nổi chữ) */}
            <div className="absolute inset-0 bg-black/60 z-10"></div>

            {/* LỚP 3: NỘI DUNG (Chữ và nút - nổi lên trên cùng) */}
      // z-20 để nổi trên overlay, items-center để căn giữa
            <div className="relative z-20 h-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col justify-center items-center text-center">

                <div className="space-y-10 max-w-4xl">
                    {/* Cập nhật màu chữ thành trắng (text-white) */}
                    <div className="space-y-5">
                        <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight drop-shadow-lg">
                            Sửa chữa & Bảo dưỡng<br />
                            xe máy <span className="text-blue-400">chuyên nghiệp</span>
                        </h1>
                        <p className="text-xl text-gray-200 max-w-2xl mx-auto drop-shadow">
                            Đội ngũ thợ tay nghề cao, phụ tùng chính hãng, dịch vụ tận tâm. Đặt lịch ngay để được phục vụ tốt nhất tại khu vực của bạn.
                        </p>
                    </div>

                    {/* Các nút bấm căn giữa */}
                    <div className="flex flex-col sm:flex-row gap-5 justify-center">
                        <button className="flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white px-9 py-4 rounded-xl font-bold transition-all text-lg shadow-lg shadow-blue-500/30">
                            <CalendarDays className="h-5 w-5" />
                            Đặt lịch bảo dưỡng ngay
                        </button>
                        <button className="flex items-center justify-center gap-2.5 bg-red-600 hover:bg-red-700 text-white px-9 py-4 rounded-xl font-bold transition-all text-lg shadow-lg shadow-red-500/30 hover:scale-105 transform">
                            <AlertTriangle className="h-5 w-5" />
                            Sửa chữa khẩn cấp
                        </button>
                    </div>
                </div>

            </div>
        </section>
    )
}