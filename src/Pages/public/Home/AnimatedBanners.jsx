// src/pages/public/Home/AnimatedBanners.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const BannerFrame = ({ img1, img2, caption, link }) => {
    const [showFirstImage, setShowFirstImage] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(() => {
            setShowFirstImage((prev) => !prev);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const defaultImg = "https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&w=800";

    return (
        <div
            onClick={() => navigate(link || '/')}
            // [ĐÃ SỬA] Đổi h-40 thành h-56, md:h-56 thành md:h-[300px] để cao hơn 1/3
            className="relative w-full h-56 md:h-[300px] overflow-hidden cursor-pointer group shadow-md"
        >
            {/* LỚP ẢNH */}
            <img
                src={img1 || defaultImg}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out transform group-hover:scale-105 ${showFirstImage ? 'opacity-100' : 'opacity-0'}`}
                alt="Promo 1"
            />
            <img
                src={img2 || defaultImg}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out transform group-hover:scale-105 ${showFirstImage ? 'opacity-0' : 'opacity-100'}`}
                alt="Promo 2"
            />

            {/* LỚP PHỦ ĐEN */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>

            {/* CHÚ THÍCH GÓC DƯỚI */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 text-white text-sm md:text-base font-semibold bg-black/40 backdrop-blur-md px-5 py-2 border border-white/20 transition-colors duration-300 group-hover:bg-blue-600 group-hover:border-blue-400">
                <span>{caption || 'Khám phá ngay'}</span>
                <ArrowRight className="h-4 w-4" />
            </div>
        </div>
    );
};

export default function AnimatedBanners({ contentData }) {
    if (!contentData) return null;

    return (
        <section className="w-full mt-6 mb-8 relative z-30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BannerFrame
                    img1={contentData.banner_1_img_1}
                    img2={contentData.banner_1_img_2}
                    caption={contentData.banner_1_caption}
                    link={contentData.banner_1_link}
                />
                <BannerFrame
                    img1={contentData.banner_2_img_1}
                    img2={contentData.banner_2_img_2}
                    caption={contentData.banner_2_caption}
                    link={contentData.banner_2_link}
                />
            </div>
        </section>
    );
}