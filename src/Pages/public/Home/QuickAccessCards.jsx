import React from 'react';
import { Wrench, Cog, Store, ClipboardList, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function QuickAccessCards({ contentData }) {

    const cards = [
        {
            defaultIcon: Wrench,
            imgUrl: contentData?.card_1_img,
            title: contentData?.card_1_title || 'Sửa chữa',
            desc: 'Đặt lịch dịch vụ',
            path: '/servicePage',
            gradient: 'from-slate-700 to-slate-900',
        },
        {
            defaultIcon: Cog,
            imgUrl: contentData?.card_2_img,
            title: contentData?.card_2_title || 'Phụ tùng',
            desc: 'Chính hãng 100%',
            path: '/parts',
            gradient: 'from-stone-600 to-stone-800',
        },
        {
            defaultIcon: Store,
            imgUrl: contentData?.card_3_img,
            title: contentData?.card_3_title || 'Hệ thống',
            desc: 'Tìm xưởng gần',
            path: '/branchPage',
            gradient: 'from-zinc-700 to-zinc-900',
        },
        {
            defaultIcon: ClipboardList,
            imgUrl: contentData?.card_4_img,
            title: contentData?.card_4_title || 'Sổ bảo hành',
            desc: 'Quản lý xe',
            path: '/my-history',
            gradient: 'from-neutral-700 to-neutral-900',
        },
        {
            defaultIcon: Phone,
            imgUrl: contentData?.card_5_img,
            title: contentData?.card_5_title || 'Cứu hộ 24/7',
            desc: 'Hỗ trợ tức thì',
            path: '/emergency',
            gradient: 'from-red-800 to-rose-950',
        }
    ];

    return (
        <section className="w-full bg-stone-50 py-6 border-y border-stone-200 shadow-inner">
            <div className="max-w-[90rem] mx-auto px-4 sm:px-6">

                <div className="text-center mb-10 opacity-80">
                    <h2 className="text-sm font-bold text-black-500 uppercase tracking-widest">
                        Tiện ích
                    </h2>
                    <div className="w-12 h-1 bg-stone-300 mx-auto mt-3 rounded-full"></div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-10">
                    {cards.map((card, index) => {
                        const Icon = card.defaultIcon;

                        return (
                            <Link
                                key={index}
                                to={card.path}
                                // THAY ĐỔI CỐT LÕI NẰM Ở ĐÂY:
                                // 1. border-2 border-white: Giữ cho mép thẻ luôn cứng cáp và sắc nét
                                // 2. shadow-[0_0_25px_rgba(...)]: Ánh sáng Xám Stone tỏa đều 25px ra 4 hướng
                                // 3. hover:shadow-[0_0_40px_rgba(...)]: Khi rê chuột, ánh sáng tỏa rộng ra 40px và đậm lên một chút
                                className={`group flex flex-col items-center justify-center p-8 bg-white rounded-3xl 
                                          border-2 border-white 
                                          shadow-[0_0_25px_rgba(168,162,158,0.25)] 
                                          transition-all duration-500 ease-out 
                                          hover:-translate-y-2 
                                          hover:shadow-[0_0_40px_rgba(168,162,158,0.4)] relative z-10`}
                            >
                                <div className={`w-20 h-20 mb-5 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 border border-white/10`}>
                                    {card.imgUrl ? (
                                        <img
                                            src={card.imgUrl}
                                            alt={card.title}
                                            className="w-10 h-10 object-contain drop-shadow-md brightness-0 invert opacity-90"
                                        />
                                    ) : (
                                        <Icon strokeWidth={1.5} className="w-10 h-10 drop-shadow-sm opacity-90" />
                                    )}
                                </div>

                                <h3 className="font-bold text-lg text-stone-800 text-center mb-1.5 transition-colors group-hover:text-stone-950">
                                    {card.title}
                                </h3>

                                <p className="text-sm text-stone-500 text-center font-medium">
                                    {card.desc}
                                </p>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}