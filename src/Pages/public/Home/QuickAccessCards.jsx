import React from 'react';
import { Package, MapPin, Car, BookOpenText } from 'lucide-react';
import { Link } from 'react-router-dom'; // BẮT BUỘC: Import Link từ react-router-dom

// BƯỚC 1: Bổ sung thuộc tính 'path' để khai báo đích đến cho từng thẻ
const cards = [
    {
        icon: BookOpenText,
        title: 'Sửa chữa & Bảo dưỡng',
        btn: 'Xem chi tiết dịch vụ',
        path: '/servicePage' // Sửa lại route tương ứng với project của bạn
    },
    {
        icon: Package,
        title: 'Phụ tùng',
        btn: 'Khám phá phụ tùng',
        path: '/parts'
    },
    {
        icon: MapPin,
        title: 'Tất cả cơ sở',
        btn: 'Tìm cơ sở',
        path: '/branchPage' // Trỏ về trang Danh sách cơ sở vừa làm
    },
    {
        icon: Car,
        title: 'Quản lý xe của bạn',
        btn: 'Xe của tôi',
        path: '/my-history' // Trỏ về trang Lịch sử của tôi vừa làm
    },
];

export default function QuickAccessCards() {
    return (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-10 max-w-7xl mx-auto px-4 sm:px-6">
            {cards.map((card, index) => (
                <div
                    key={index}
                    // Áp dụng Rule UI/UX: Nền trắng, viền mỏng, hover nổi lên và đổ bóng đậm
                    className="group bg-white p-8 rounded-2xl border border-slate-200 text-center flex flex-col items-center gap-6 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-indigo-300"
                >
                    {/* Icon wrapper: Đổi sang tone Indigo sang trọng */}
                    <div className="bg-indigo-50/50 p-5 rounded-2xl shadow-inner border border-indigo-100 transition-colors duration-300 group-hover:bg-indigo-50">
                        <card.icon className="h-14 w-14 text-indigo-600 stroke-1 transition-transform duration-300 group-hover:scale-110" />
                    </div>

                    {/* Title: Text màu tối, font đậm, tracking-tight */}
                    <h3 className="font-bold text-xl text-slate-900 tracking-tight flex-grow leading-snug">
                        {card.title}
                    </h3>

                    {/* BƯỚC 2: Thay thẻ <button> thành thẻ <Link> */}
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