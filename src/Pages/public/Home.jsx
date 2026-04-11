import HeroSection from "./Home/HeroSection";
import QuickAccessCards from "./Home/QuickAccessCards";
import ProductCard from "../../components/common/ProductCard";
import { ArrowRight, ShoppingCart, Loader2 } from "lucide-react";
import { itemApi } from "../../api/itemApi";
import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { servicePackageApi } from "../../api/servicePackageApi";

export default function Home() {

    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate()
    const [services, setServices] = useState([]);

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                // Bật trạng thái loading
                setIsLoading(true);

                // Gọi 2 API cùng một lúc cho nhanh (Chạy song song)
                // const [partsData, servicesData] = await Promise.all([
                //     productApi.getAllParts(),
                //     productApi.getAllServices()
                // ]);

                const itemsData = await itemApi.getAllItems({ page: 0, size: 15 })
                const serviceData = await servicePackageApi.getAll({ page: 0, size: 8 })
                // Cập nhật dữ liệu lấy được vào state
                setItems(itemsData.content || []);
                setServices(serviceData.content || [])
                // console.log(itemsData)
                // setServices(servicesData.content || []);
            } catch (error) {
                console.error("Không thể tải dữ liệu từ server", error);
                // Tùy chọn: Xử lý hiển thị thông báo lỗi ra màn hình ở đây
            } finally {
                // Dù thành công hay thất bại cũng phải tắt vòng xoay loading
                setIsLoading(false);
            }
        };

        fetchHomeData();
    }, []); // Dấu [] rỗng ở cuối nghĩa là chỉ chạy 1 lần khi load trang

    // 3. Nếu đang lấy dữ liệu, hiển thị màn hình loading
    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-blue-600">
                <Loader2 className="h-12 w-12 animate-spin mb-4" />
                <h2 className="text-xl font-bold">Đang tải dữ liệu từ hệ thống...</h2>
            </div>
        );
    }


    const handleViewItemDetail = (id) => {
        // console.log("Xem chi tiết linh kiện có ID:", id);
        navigate(`/itemDetailPage/${id}`);
    };


    const handleViewServiceDetail = (id) => {
        // console.log("Xem chi tiết linh kiện có ID:", id);
        navigate(`/servicePackageDetailPage/${id}`);
    };


    return (
        <div className="space-y-12">
            {/* 1. Phần Banner Xám (Hero) */}
            <HeroSection />

            {/* 2. Phần 4 ô màu hồng (Quick Access) */}
            <QuickAccessCards />

            {/* 3. Phần Danh sách Phụ tùng */}
            <section>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-extrabold text-gray-950">Phụ tùng & Linh kiện</h2>
                    <a href="/sparePartsPage" className="text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1.5 text-sm">
                        Xem tất cả <ArrowRight className="h-4 w-4" />
                    </a>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {items.map(part => (
                        <ProductCard
                            key={part.id}
                            name={part.name}
                            price={part.price}
                            image={part.imageUrl}
                            actionText="Xem chi tiết"
                            onAction={() => handleViewItemDetail(part.id)}
                            actionIcon={ArrowRight} // Dùng Icon Mũi tên
                        />
                    ))}
                </div>
            </section>

            {/* 4. Phần Đăng ký dịch vụ */}
            <section className="pb-10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-extrabold text-gray-950">Đăng ký dịch vụ</h2>
                    <a href="/servicePackagePage" className="text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1.5 text-sm">
                        Xem tất cả <ArrowRight className="h-4 w-4" />
                    </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {services.map(service => (
                        <ProductCard
                            key={service.id}
                            name={service.name}
                            price={service.price}
                            image={service.image}
                            actionText="Đăng ký ngay"
                            onAction={() => handleViewServiceDetail(service.id)}
                            actionIcon={ShoppingCart} // Dùng Icon Giỏ hàng
                        />
                    ))}
                </div>
            </section>

        </div>
    )
}