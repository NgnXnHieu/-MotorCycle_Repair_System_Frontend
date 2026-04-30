import HeroSection from "./Home/HeroSection";
import QuickAccessCards from "./Home/QuickAccessCards";
import ProductCard from "../../components/common/ProductCard";
import { ArrowRight, ShoppingCart, Loader2, Sparkles, Wrench } from "lucide-react";
import { itemApi } from "../../api/itemApi";
import { servicePackageApi } from "../../api/servicePackageApi";
import { contentApi } from "../../api/contentApi";
import { useState, useEffect } from 'react';
import { useNavigate, Link } from "react-router-dom"; // Thêm Link từ react-router-dom
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
            } catch (error) {
                console.error("Không thể tải dữ liệu từ server", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHomeData();
    }, []);

    if (isLoading || !pageContent) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center bg-slate-50 text-slate-800">
                <Loader2 className="h-12 w-12 animate-spin mb-4 text-blue-600" />
                <h2 className="text-xl font-bold">Đang tải dữ liệu từ hệ thống...</h2>
            </div>
        );
    }

    const handleViewItemDetail = (id) => navigate(`/itemDetailPage/${id}`);
    const handleViewServiceDetail = (id) => navigate(`/servicePackageDetailPage/${id}`);

    return (
        // ĐỔI NỀN TRANG: Chuyển sang bg-slate-50 để làm nổi bật các khối màu trắng bên trong
        <div className="flex flex-col pb-16 w-full bg-slate-50 min-h-screen font-sans">

            {/* HERO SECTION */}
            <HeroSection
                title={pageContent.HERO?.hero_title?.value}
                subtitle={pageContent.HERO?.hero_subtitle?.value}
                bgImage={pageContent.HERO?.hero_banner_img?.value}
                btn1Text={pageContent.HERO?.hero_btn_1?.value}
                btn1Url={pageContent.HERO?.hero_btn_1?.url}
                btn2Text={pageContent.HERO?.hero_btn_2?.value}
                btn2Url={pageContent.HERO?.hero_btn_2?.url}
            />

            {/* QUICK ACCESS */}
            <div className="relative z-10 -mt-6 sm:-mt-10">
                <QuickAccessCards
                    contentData={{
                        // Truyền đủ 5 card
                        card_1_title: pageContent.QUICK_ACCESS?.card_1_title?.value,
                        card_1_img: pageContent.QUICK_ACCESS?.card_1_img?.value,
                        card_2_title: pageContent.QUICK_ACCESS?.card_2_title?.value,
                        card_2_img: pageContent.QUICK_ACCESS?.card_2_img?.value,
                        card_3_title: pageContent.QUICK_ACCESS?.card_3_title?.value,
                        card_3_img: pageContent.QUICK_ACCESS?.card_3_img?.value,
                        card_4_title: pageContent.QUICK_ACCESS?.card_4_title?.value,
                        card_4_img: pageContent.QUICK_ACCESS?.card_4_img?.value,
                        card_5_title: pageContent.QUICK_ACCESS?.card_5_title?.value,
                        card_5_img: pageContent.QUICK_ACCESS?.card_5_img?.value,
                    }}
                />
            </div>

            {/* MAIN CONTENT WRAPPER: Giới hạn chiều rộng và tạo khoảng cách cho các section */}
            <div className="max-w-[90rem] mx-auto px-4 sm:px-6 w-full flex flex-col gap-10 mt-4">

                {/* BANNERS: Nằm gọn gàng giữa trang */}
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

                {/* KHỐI 1: DANH SÁCH PHỤ TÙNG (CONTAINER MÀU TRẮNG ĐỘC LẬP) */}
                <section className="bg-white rounded-[2rem] p-6 sm:p-10 shadow-sm border border-slate-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4 border-b border-slate-100 pb-6">
                        <div>
                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                {pageContent.PARTS_LIST?.section_title?.value || "Phụ tùng & Linh kiện"}
                            </h2>
                        </div>

                        <Link to="/sparePartsPage" className="group inline-flex items-center gap-2 px-5 py-2.5 bg-slate-50 text-slate-700 rounded-xl font-semibold text-sm transition-all duration-300 hover:bg-slate-900 hover:text-white border border-slate-200 hover:border-slate-900">
                            Khám phá kho <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {items.map(part => (
                            <ProductCard
                                key={part.id}
                                name={part.name}
                                price={part.price}
                                image={part.imageUrl}
                                actionText="Chi tiết"
                                onAction={() => handleViewItemDetail(part.id)}
                                actionIcon={ArrowRight}
                            />
                        ))}
                    </div>
                </section>

                {/* KHỐI 2: ĐĂNG KÝ DỊCH VỤ (CONTAINER MÀU TRẮNG ĐỘC LẬP) */}
                <section className="bg-white rounded-[2rem] p-6 sm:p-10 shadow-sm border border-slate-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4 border-b border-slate-100 pb-6">
                        <div>
                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                {pageContent.SERVICES_LIST?.section_title?.value || "Gói Dịch Vụ Tiêu Chuẩn"}
                            </h2>
                        </div>

                        <Link to="/servicePackagePage" className="group inline-flex items-center gap-2 px-5 py-2.5 bg-slate-50 text-slate-700 rounded-xl font-semibold text-sm transition-all duration-300 hover:bg-blue-600 hover:text-white border border-slate-200 hover:border-blue-600 hover:shadow-lg hover:shadow-blue-200">
                            Tất cả dịch vụ <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                        {services.map(service => (
                            <ProductCard
                                key={service.id}
                                name={service.name}
                                price={service.price}
                                image={service.image}
                                actionText="Đặt lịch ngay"
                                onAction={() => handleViewServiceDetail(service.id)}
                                actionIcon={ShoppingCart}
                            />
                        ))}
                    </div>
                </section>

            </div>
        </div>
    )
}