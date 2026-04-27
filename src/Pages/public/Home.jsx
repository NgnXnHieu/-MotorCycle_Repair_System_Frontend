import HeroSection from "./Home/HeroSection";
import QuickAccessCards from "./Home/QuickAccessCards";
import ProductCard from "../../components/common/ProductCard";
import { ArrowRight, ShoppingCart, Loader2 } from "lucide-react";
import { itemApi } from "../../api/itemApi";
import { servicePackageApi } from "../../api/servicePackageApi";
import { contentApi } from "../../api/contentApi";
import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import AnimatedBanners from "./Home/AnimatedBanners";

export default function Home() {

    const [items, setItems] = useState([]);
    const [services, setServices] = useState([]);
    const [pageContent, setPageContent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                setIsLoading(true);

                const [itemsData, serviceData, contentRes] = await Promise.all([
                    itemApi.getAllItems({ page: 0, size: 15 }),
                    servicePackageApi.getAll({ page: 0, size: 8 }),
                    contentApi.getContentList('HOME')
                ]);

                setItems(itemsData.content || []);
                setServices(serviceData.content || []);

                const rawContentList = contentRes.data || contentRes;

                // [ĐÃ SỬA] Hàm reduce mới lấy cả value và link đóng gói thành Object
                const formattedContent = rawContentList.reduce((acc, item) => {
                    const { sectionCode, contentKey, contentValue, link } = item;
                    if (!acc[sectionCode]) {
                        acc[sectionCode] = {};
                    }
                    acc[sectionCode][contentKey] = {
                        value: contentValue,
                        url: link
                    };
                    return acc;
                }, {});

                setPageContent(formattedContent);
                console.log("Data sau khi chuẩn hóa:", formattedContent);
            } catch (error) {
                console.error("Không thể tải dữ liệu từ server", error);
                console.log(error?.response?.data)
            } finally {
                setIsLoading(false);
            }
        };

        fetchHomeData();
    }, []);

    if (isLoading || !pageContent) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-blue-600">
                <Loader2 className="h-12 w-12 animate-spin mb-4" />
                <h2 className="text-xl font-bold">Đang tải dữ liệu từ hệ thống...</h2>
            </div>
        );
    }

    const handleViewItemDetail = (id) => {
        navigate(`/itemDetailPage/${id}`);
    };

    const handleViewServiceDetail = (id) => {
        navigate(`/servicePackageDetailPage/${id}`);
    };

    return (
        <div className="flex flex-col gap-5 pb-12 w-full">
            {/* 1. Phần Banner Chính (Hero) - [ĐÃ SỬA] Thêm .value cho TẤT CẢ các thẻ */}
            <HeroSection
                title={pageContent.HERO?.hero_title?.value}
                subtitle={pageContent.HERO?.hero_subtitle?.value}
                bgImage={pageContent.HERO?.hero_banner_img?.value}

                btn1Text={pageContent.HERO?.hero_btn_1?.value}
                btn1Url={pageContent.HERO?.hero_btn_1?.url}

                btn2Text={pageContent.HERO?.hero_btn_2?.value}
                btn2Url={pageContent.HERO?.hero_btn_2?.url}
            />

            {/* 3. Phần 4 ô màu hồng (Quick Access) */}
            {/* [ĐÃ SỬA] Chuyển đổi dữ liệu cho khớp với QuickAccessCards để bạn không phải sửa file kia */}
            <QuickAccessCards
                contentData={{
                    card_1_title: pageContent.QUICK_ACCESS?.card_1_title?.value,
                    card_1_img: pageContent.QUICK_ACCESS?.card_1_img?.value,

                    card_2_title: pageContent.QUICK_ACCESS?.card_2_title?.value,
                    card_2_img: pageContent.QUICK_ACCESS?.card_2_img?.value,
                }}
            />

            {/* 2. Phần Khung ảnh động */}
            <AnimatedBanners
                contentData={{
                    banner_1_img_1: pageContent.PROMO_BANNERS?.banner_1_img_1?.value,
                    banner_1_img_2: pageContent.PROMO_BANNERS?.banner_1_img_2?.value,
                    banner_1_caption: pageContent.PROMO_BANNERS?.banner_1_caption?.value,
                    banner_1_link: pageContent.PROMO_BANNERS?.banner_1_img_1?.url,

                    banner_2_img_1: pageContent.PROMO_BANNERS?.banner_2_img_1?.value,
                    banner_2_img_2: pageContent.PROMO_BANNERS?.banner_2_img_2?.value,
                    banner_2_caption: pageContent.PROMO_BANNERS?.banner_2_caption?.value,
                    banner_2_link: pageContent.PROMO_BANNERS?.banner_2_img_1?.url,
                }}
            />



            {/* 4. Phần Danh sách Phụ tùng */}
            <section className="w-full">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex justify-between items-center mb-6">
                        {/* [ĐÃ SỬA] Thêm .value cho phần section_title */}
                        <h2 className="text-3xl font-extrabold text-gray-950">
                            {pageContent.PARTS_LIST?.section_title?.value || "Phụ tùng & Linh kiện"}
                        </h2>
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
                                actionIcon={ArrowRight}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. Phần Đăng ký dịch vụ */}
            <section className="w-full">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex justify-between items-center mb-6">
                        {/* [ĐÃ SỬA] Thêm .value cho phần section_title */}
                        <h2 className="text-3xl font-extrabold text-gray-950">
                            {pageContent.SERVICES_LIST?.section_title?.value || "Đăng ký dịch vụ"}
                        </h2>
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
                                actionIcon={ShoppingCart}
                            />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}