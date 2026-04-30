import React, { useState, useEffect, useRef } from 'react';
import { serviceApi } from '../../api/serviceApi';
import { Wrench, ShieldCheck, Clock, Medal, ChevronRight } from 'lucide-react';

// ==========================================
// COMPONENT XỬ LÝ ANIMATION KHI CUỘN CHUỘT (INTERSECTION OBSERVER)
// ==========================================
const FadeInSection = ({ children, direction = 'up', delay = 'delay-0' }) => {
    const [isVisible, setVisible] = useState(false);
    const domRef = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    // Chỉ chạy animation 1 lần khi cuộn tới
                    observer.unobserve(domRef.current);
                }
            });
        }, { threshold: 0.15 }); // Kích hoạt khi phần tử hiện ra 15% màn hình

        if (domRef.current) observer.observe(domRef.current);
        return () => {
            if (domRef.current) observer.unobserve(domRef.current);
        };
    }, []);

    // Tính toán hướng bay vào
    let translateClass = "translate-y-12"; // Mặc định bay từ dưới lên
    if (direction === 'left') translateClass = "-translate-x-12";
    if (direction === 'right') translateClass = "translate-x-12";

    return (
        <div
            ref={domRef}
            className={`transition-all duration-1000 ease-out ${delay} ${isVisible ? "opacity-100 translate-x-0 translate-y-0" : `opacity-0 ${translateClass}`
                }`}
        >
            {children}
        </div>
    );
};

export default function ServicePage() {
    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // GIẢI PHÁP 1: Luôn bắt đầu ở vị trí trên cùng khi vào trang
        window.scrollTo(0, 0);

        const fetchServices = async () => {
            try {
                setIsLoading(true);
                const response = await serviceApi.getServicePage();
                if (response && response.content) {
                    setServices(response.content);
                }
            } catch (err) {
                console.error("Lỗi khi lấy danh sách dịch vụ:", err);
                setError("Không thể tải danh sách dịch vụ lúc này. Vui lòng thử lại sau.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchServices();
    }, []);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price).replace('₫', 'đ');
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-[60vh] text-red-500 font-medium text-lg">
                {error}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-slate-800 selection:text-white pb-20 overflow-x-hidden">

            {/* 1. HERO BANNER */}
            <FadeInSection direction="up">
                <div className="relative w-full h-[60vh] min-h-[200px] flex items-center justify-center overflow-hidden">
                    <img
                        src="https://images.unsplash.com/photo-1599839619722-39751411ea63?q=80&w=2000&auto=format&fit=crop"
                        alt="Xưởng dịch vụ chuyên nghiệp"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/60 mix-blend-multiply"></div>

                    <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-12">
                        <span className="text-amber-400 font-semibold tracking-widest uppercase text-sm mb-4 block drop-shadow-md">MotorCare Premium Service</span>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6 drop-shadow-lg">
                            Phục Hồi Sức Mạnh. <br /> Đánh Thức Đam Mê.
                        </h1>
                        <p className="text-lg sm:text-xl text-slate-200 font-light max-w-2xl mx-auto leading-relaxed drop-shadow">
                            Từ bảo dưỡng định kỳ đến đại tu chuyên sâu, mỗi chi tiết trên chiếc xe của bạn đều được chăm sóc bởi những bàn tay kỹ thuật viên tài hoa nhất.
                        </p>
                    </div>
                </div>
            </FadeInSection>

            {/* 2. KHU VỰC CAM KẾT UY TÍN */}
            <FadeInSection direction="up" delay="delay-200">
                <div className="bg-slate-900 text-white py-8 border-b-4 border-amber-500">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-700/50">
                            <div className="flex flex-col items-center pt-4 md:pt-0">
                                <ShieldCheck className="h-10 w-10 text-amber-400 mb-3" strokeWidth={1.5} />
                                <h4 className="font-bold text-lg mb-1">Phụ Tùng Chính Hãng</h4>
                                <p className="text-slate-400 text-sm">Cam kết đền bù 200% nếu phát hiện hàng giả, hàng nhái.</p>
                            </div>
                            <div className="flex flex-col items-center pt-8 md:pt-0">
                                <Medal className="h-10 w-10 text-amber-400 mb-3" strokeWidth={1.5} />
                                <h4 className="font-bold text-lg mb-1">Kỹ Thuật Chuyên Sâu</h4>
                                <p className="text-slate-400 text-sm">Đội ngũ thợ máy kinh nghiệm &gt;5 năm, xử lý triệt để mọi pan bệnh.</p>
                            </div>
                            <div className="flex flex-col items-center pt-8 md:pt-0">
                                <Clock className="h-10 w-10 text-amber-400 mb-3" strokeWidth={1.5} />
                                <h4 className="font-bold text-lg mb-1">Minh Bạch Chi Phí</h4>
                                <p className="text-slate-400 text-sm">Báo giá chính xác trước khi làm, tuyệt đối không phát sinh.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </FadeInSection>

            {/* 3. DANH SÁCH DỊCH VỤ */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">

                <FadeInSection direction="up">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                            Danh Mục Dịch Vụ
                        </h2>
                        <div className="w-16 h-1.5 bg-amber-500 mx-auto mt-4"></div>
                    </div>
                </FadeInSection>

                {services.length === 0 ? (
                    <div className="text-center text-slate-500 py-10 bg-slate-50 rounded-2xl border border-slate-200">
                        Hệ thống đang cập nhật dịch vụ. Vui lòng quay lại sau.
                    </div>
                ) : (
                    <div className="flex flex-col gap-24">
                        {services.map((service, index) => {
                            // Xác định bố cục Zig-zag để hướng chữ và ảnh bay vào cho hợp lý
                            const isEven = index % 2 === 0;
                            const imgDirection = isEven ? 'left' : 'right';
                            const textDirection = isEven ? 'right' : 'left';

                            return (
                                <div
                                    key={service.id}
                                    className={`flex flex-col ${!isEven ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-10 lg:gap-16 items-center group`}
                                >
                                    {/* Ảnh bay vào từ 1 bên */}
                                    <div className="w-full lg:w-1/2 relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 aspect-[4/3]">
                                        <FadeInSection direction={imgDirection}>
                                            {service.imageUrl ? (
                                                <div className="w-full h-full relative">
                                                    <img
                                                        src={service.imageUrl}
                                                        alt={service.name}
                                                        className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110 aspect-[4/3]"
                                                    />
                                                    <div className="absolute inset-0 bg-black/10 transition-colors duration-500 group-hover:bg-transparent"></div>
                                                </div>
                                            ) : (
                                                <div className="w-full h-full aspect-[4/3] bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                                                    <Wrench className="w-16 h-16 mb-3 opacity-20" />
                                                    <span className="text-sm font-semibold tracking-widest uppercase">No Image</span>
                                                </div>
                                            )}
                                        </FadeInSection>
                                    </div>

                                    {/* Chữ bay vào từ bên đối diện */}
                                    <div className="w-full lg:w-1/2 flex flex-col justify-center">
                                        <FadeInSection direction={textDirection} delay="delay-100">
                                            <h3 className="text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight mb-6 transition-colors group-hover:text-amber-600">
                                                {service.name}
                                            </h3>

                                            {/* GIẢI PHÁP 2: text-justify giúp căn chữ đều 2 bên vuông vắn */}
                                            <p className="text-lg text-slate-600 leading-relaxed mb-8 text-justify hyphens-auto">
                                                {service.decription}
                                            </p>

                                            <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                                {/* <button className="flex items-center gap-2 font-bold text-slate-900 group/btn transition-colors hover:text-amber-600">
                                                    <span>Xem quy trình</span>
                                                    <ChevronRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
                                                </button> */}

                                                <div className="flex-shrink-0 text-right">
                                                    <span className="block text-sm text-slate-400 font-medium mb-1">Chi phí ước tính</span>
                                                    {service.price && service.price > 0 ? (
                                                        <span className="text-2xl font-black text-slate-900 tracking-tight">
                                                            {formatPrice(service.price)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-lg font-bold text-slate-900 bg-slate-100 px-4 py-2 rounded-lg">
                                                            Liên hệ tư vấn
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </FadeInSection>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}