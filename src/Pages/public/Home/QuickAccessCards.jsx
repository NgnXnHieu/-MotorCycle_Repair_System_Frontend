import React from 'react';
import { Package, MapPin, Car, BookOpenText } from 'lucide-react';
import { Link } from 'react-router-dom';

// Thêm props { contentData } để nhận dữ liệu từ Home.jsx truyền xuống
export default function QuickAccessCards({ contentData }) {

    // CHUYỂN MẢNG CARDS VÀO TRONG COMPONENT
    // Sử dụng contentData để lấy dữ liệu, dùng || để tạo giá trị mặc định (fallback) nếu API bị trống
    const cards = [
        {
            defaultIcon: BookOpenText,
            imgUrl: contentData?.card_1_img,
            title: contentData?.card_1_title || 'Sửa chữa & Bảo dưỡng',
            btn: contentData?.card_1_btn || 'Xem chi tiết dịch vụ',
            path: '/servicePage'
        },
        {
            defaultIcon: Package,
            imgUrl: contentData?.card_2_img,
            title: contentData?.card_2_title || 'Phụ tùng',
            btn: contentData?.card_2_btn || 'Khám phá phụ tùng',
            path: '/parts'
        },
        {
            defaultIcon: MapPin,
            imgUrl: contentData?.card_3_img,
            title: contentData?.card_3_title || 'Tất cả cơ sở',
            btn: contentData?.card_3_btn || 'Tìm cơ sở',
            path: '/branchPage'
        },
        {
            defaultIcon: Car,
            imgUrl: contentData?.card_4_img,
            title: contentData?.card_4_title || 'Quản lý xe của bạn',
            btn: contentData?.card_4_btn || 'Xe của tôi',
            path: '/my-history'
        },
        {
            defaultIcon: Car,
            imgUrl: contentData?.card_4_img,
            title: contentData?.card_4_title || 'Quản lý xe của bạn',
            btn: contentData?.card_4_btn || 'Xe của tôi',
            path: '/my-history'
        },
    ];

    return (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 my-10 max-w-7xl mx-auto px-4 sm:px-6">
            {cards.map((card, index) => (
                <div
                    key={index}
                    className="group bg-white p-8 rounded-2xl border border-slate-200 text-center flex flex-col items-center gap-6 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-indigo-300"
                >
                    <div className="bg-indigo-50/50 p-5 rounded-2xl shadow-inner border border-indigo-100 transition-colors duration-300 group-hover:bg-indigo-50">
                        {/* ĐIỂM QUAN TRỌNG: Kiểm tra xem có ảnh từ API không */}
                        {card.imgUrl ? (
                            // Nếu có ảnh URL (từ database), hiển thị thẻ img
                            <img
                                src={card.imgUrl}
                                alt={card.title}
                                className="h-14 w-14 object-contain transition-transform duration-300 group-hover:scale-110"
                            />
                        ) : (
                            // Nếu không có ảnh, dùng lại Icon Lucide mặc định
                            <card.defaultIcon className="h-14 w-14 text-indigo-600 stroke-1 transition-transform duration-300 group-hover:scale-110" />
                        )}
                    </div>

                    <h3 className="font-bold text-xl text-slate-900 tracking-tight flex-grow leading-snug">
                        {card.title}
                    </h3>

                    <Link
                        to={card.path}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold transition-all duration-300 ease-in-out hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/30 active:scale-95 text-sm inline-flex items-center justify-center"
                    >
                        {card.btn}
                    </Link>
                </div>
            ))}
        </section>
    );
}