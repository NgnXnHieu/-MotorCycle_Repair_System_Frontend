import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, CalendarDays, ShieldCheck,
    Ruler, Wrench, CheckCircle2, PackageSearch, Tag,
    Heart, Info, ListTree, X
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { itemApi } from '../../api/itemApi';

export default function ItemDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [item, setItem] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [zoomedImage, setZoomedImage] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const detailResponse = await itemApi.getItemByID(id);
                const itemData = detailResponse.data || detailResponse;
                if (itemData.likedByMe !== undefined && itemData.isLiked === undefined) {
                    itemData.isLiked = itemData.likedByMe;
                }
                setItem(itemData);

                const categoryId = itemData.category?.id || itemData.categoryDTO?.id;
                if (categoryId) {
                    try {
                        const relatedResponse = await itemApi.getRelatedItems(categoryId, itemData.id);
                        const relatedList = relatedResponse.content || relatedResponse.data?.content || [];
                        const normalizedRelatedList = relatedList.map(prod => ({
                            ...prod,
                            isLiked: prod.isLiked !== undefined ? prod.isLiked : prod.likedByMe
                        }));
                        setRelatedProducts(normalizedRelatedList);
                    } catch (relatedErr) {
                        setRelatedProducts([]);
                    }
                }
            } catch (err) {
                setError("Không thể tải thông tin sản phẩm lúc này.");
            } finally {
                setIsLoading(false);
            }
        };
        if (id) {
            fetchData();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [id]);

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    const handleMainItemHeartClick = async () => {
        if (!item) return;
        const previousState = { ...item };
        setItem({ ...item, isLiked: !item.isLiked });
        try {
            if (previousState.isLiked) await itemApi.removeToFavouriteList(item.id);
            else await itemApi.addToFavouriteList(item.id);
        } catch (error) {
            setItem(previousState);
        }
    };

    if (isLoading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-3">
                <Wrench className="animate-spin text-blue-600" size={32} />
                <span className="text-gray-500 font-bold">Đang tải dữ liệu...</span>
            </div>
        </div>
    );

    if (error || !item) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
            <p className="text-red-500 font-bold text-lg">{error || "Không tìm thấy sản phẩm"}</p>
            <button onClick={() => navigate(-1)} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl">Quay lại</button>
        </div>
    );

    const isOutOfStock = (item.totalStockQuantity || 0) === 0;

    return (
        <div className="min-h-screen bg-gray-50 pb-16 font-sans selection:bg-indigo-600 selection:text-white">
            <div className="bg-white border-b border-gray-200 py-4 mb-8">
                <div className="max-w-6xl mx-auto px-4 flex items-center gap-2 text-sm text-gray-500 font-medium">
                    <button onClick={() => navigate(-1)} className="hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer">
                        <ArrowLeft size={16} /> Quay lại
                    </button>
                    <span className="text-gray-300">|</span>
                    <span className="hover:text-blue-600 cursor-pointer">{item.category?.name}</span>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-800 font-bold truncate max-w-[200px] sm:max-w-none">{item.name}</span>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 space-y-8">
                {/* --- CARD CHI TIẾT CHÍNH --- */}
                <div className="bg-white rounded-[2rem] shadow-md border border-slate-200 overflow-hidden flex flex-col md:flex-row">

                    {/* CỘT TRÁI: ẢNH TRÀN VIỀN (FIXED) */}
                    {/* 1. Xóa p-8 để ảnh sát mép
                        2. Sử dụng overflow-hidden để mượn bo góc từ Card cha
                        3. Đặt min-h để đảm bảo khung ảnh không bị bẹp trên mobile */}
                    <div className="md:w-5/12 relative bg-slate-100 flex-shrink-0 border-b md:border-b-0 md:border-r border-slate-200 min-h-[350px] md:min-h-full">
                        {item.category?.name && (
                            <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-black text-indigo-700 shadow-md border border-white/50 flex items-center gap-1.5 z-20">
                                <Tag size={14} /> {item.category.name.toUpperCase()}
                            </div>
                        )}
                        {isOutOfStock && (
                            <div className="absolute top-6 right-6 bg-rose-600 text-white text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg z-20">
                                Hết hàng
                            </div>
                        )}

                        <img
                            src={item.imageUrl || item.image}
                            alt={item.name}
                            onClick={() => setZoomedImage(item.imageUrl || item.image)}
                            // SỬA: Dùng absolute inset-0 và object-cover để kín khung hoàn toàn
                            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out cursor-zoom-in z-10 ${isOutOfStock ? 'grayscale opacity-60' : 'hover:scale-105'}`}
                        />

                        {/* Hiệu ứng Gradient mờ dưới đáy để tăng độ sâu chuyên nghiệp */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-15 pointer-events-none" />
                    </div>

                    {/* CỘT PHẢI: THÔNG TIN (Giữ nguyên p-8 cho chữ thoáng) */}
                    <div className="md:w-7/12 p-8 lg:p-12 flex flex-col justify-center">
                        <div className="mb-8">
                            <h1 className="text-3xl font-black text-slate-900 leading-tight mb-4 tracking-tight">{item.name}</h1>
                            <div className="flex items-center gap-4">
                                <span className={`flex items-center gap-1.5 text-sm font-bold ${isOutOfStock ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {!isOutOfStock ? <><CheckCircle2 size={16} /> Còn hàng ({item.totalStockQuantity})</> : 'Hết hàng'}
                                </span>
                                <span className="text-slate-300">|</span>
                                <span className="text-slate-500 text-sm font-semibold flex items-center gap-1.5">
                                    <PackageSearch size={18} /> SKU: ITM-{item.id?.toString().padStart(4, '0')}
                                </span>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-10">
                            <span className="text-slate-400 text-xs font-black uppercase tracking-widest block mb-2">Giá linh kiện niêm yết</span>
                            <span className={`text-3xl font-black tracking-tight ${isOutOfStock ? 'text-slate-400' : 'text-rose-600'}`}>
                                {formatPrice(item.price)}
                            </span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                            <button
                                onClick={handleMainItemHeartClick}
                                className={`flex-1 border-2 py-4 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-sm ${item.isLiked
                                    ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100'
                                    : 'bg-white border-slate-900 text-slate-900 hover:bg-slate-50'
                                    }`}
                            >
                                <Heart size={22} fill={item.isLiked ? "currentColor" : "none"} className={item.isLiked ? 'scale-110' : ''} />
                                {item.isLiked ? 'Đã lưu' : 'Lưu sản phẩm'}
                            </button>

                            <button
                                disabled={isOutOfStock}
                                className={`flex-[1.5] font-black py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md uppercase tracking-wide ${isOutOfStock ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]'}`}
                            >
                                <CalendarDays size={22} /> Đặt lịch lắp đặt
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- KHỐI THÔNG TIN CHI TIẾT --- */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 lg:p-12">
                    <div className="flex items-center gap-3 mb-8 pb-5 border-b border-slate-100">
                        <Info className="text-indigo-600" size={26} />
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Thông số kỹ thuật</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div className="md:col-span-1 space-y-4">
                            {item.dimension && (
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-start gap-4">
                                    <Ruler size={22} className="text-indigo-500 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kích cỡ tiêu chuẩn</p>
                                        <p className="text-base font-black text-slate-800 mt-1">{item.dimension}</p>
                                    </div>
                                </div>
                            )}
                            {item.warranty_year > 0 && (
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-start gap-4">
                                    <ShieldCheck size={22} className="text-indigo-500 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chế độ Bảo hành</p>
                                        <p className="text-base font-black text-slate-800 mt-1">{item.warranty_year} Năm chính hãng</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="md:col-span-2 text-slate-600 leading-relaxed text-justify text-lg bg-slate-50/50 p-8 rounded-3xl border border-slate-50 italic">
                            <p className="whitespace-pre-line">{item.decription || "Chưa có mô tả kỹ thuật cho linh kiện này."}</p>
                        </div>
                    </div>
                </div>

                {/* --- SẢN PHẨM LIÊN QUAN --- */}
                <div className="pt-10">
                    <div className="flex items-center gap-3 mb-8">
                        <ListTree className="text-indigo-600" size={26} />
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cùng danh mục phụ tùng</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {relatedProducts.length > 0 ? (
                            relatedProducts.map((prod) => (
                                <div
                                    key={prod.id}
                                    onClick={() => navigate(`/itemDetailPage/${prod.id}`)}
                                    className="bg-white group rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer flex flex-col hover:-translate-y-1.5"
                                >
                                    <div className="aspect-[4/5] bg-slate-50 rounded-2xl mb-5 overflow-hidden flex items-center justify-center relative shadow-inner">
                                        {(prod.totalStockQuantity || 0) === 0 && (
                                            <div className="absolute top-3 right-3 bg-rose-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded shadow-md z-10">
                                                Hết hàng
                                            </div>
                                        )}
                                        <img
                                            src={prod.imageUrl || prod.image}
                                            alt={prod.name}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setZoomedImage(prod.imageUrl || prod.image);
                                            }}
                                            className={`w-full h-full object-cover transition-transform duration-700 ease-out cursor-zoom-in ${(prod.totalStockQuantity || 0) === 0 ? 'grayscale opacity-60' : 'group-hover:scale-110'}`}
                                        />
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-sm md:text-base line-clamp-2 mb-3 group-hover:text-indigo-600 transition-colors px-1">
                                        {prod.name}
                                    </h3>
                                    <div className="mt-auto flex items-center justify-between px-1">
                                        <span className="font-black text-rose-600 text-lg tracking-tight">{formatPrice(prod.price)}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-10 text-slate-400 font-medium italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                Không có sản phẩm liên quan nào trong danh mục này.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- MODAL ZOOM (GIỮ NGUYÊN) --- */}
            {zoomedImage && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 sm:p-10 animate-in fade-in duration-300"
                    onClick={() => setZoomedImage(null)}
                >
                    <button className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:rotate-90 z-50">
                        <X size={28} />
                    </button>
                    <img
                        src={zoomedImage}
                        alt="Zoomed Detail"
                        className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10 animate-in zoom-in-95 duration-500"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}