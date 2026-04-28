import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, ShoppingCart, CalendarDays, ShieldCheck,
    Ruler, Wrench, CheckCircle2, PackageSearch, Tag,
    Heart, Info, ListTree,
    X // --- 1. IMPORT THÊM ICON X ĐỂ LÀM NÚT ĐÓNG ---
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { itemApi } from '../../api/itemApi';

export default function ItemDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [quantity, setQuantity] = useState(1);
    const [item, setItem] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);

    // --- 2. THÊM STATE QUẢN LÝ ẢNH ZOOM ---
    const [zoomedImage, setZoomedImage] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const detailResponse = await itemApi.getItemByID(id);
                const itemData = detailResponse.data || detailResponse;

                // Chuẩn hóa biến isLiked (đề phòng API trả về likedByMe như trang trước)
                if (itemData.likedByMe !== undefined && itemData.isLiked === undefined) {
                    itemData.isLiked = itemData.likedByMe;
                }
                setItem(itemData);

                const categoryId = itemData.category?.id || itemData.categoryDTO?.id;

                if (categoryId) {
                    try {
                        const relatedResponse = await itemApi.getRelatedItems(categoryId, itemData.id);
                        const relatedList = relatedResponse.content || relatedResponse.data?.content || [];

                        // Chuẩn hóa isLiked cho mảng related
                        const normalizedRelatedList = relatedList.map(prod => ({
                            ...prod,
                            isLiked: prod.isLiked !== undefined ? prod.isLiked : prod.likedByMe
                        }));

                        setRelatedProducts(normalizedRelatedList);
                    } catch (relatedErr) {
                        console.error("Lỗi khi tải sản phẩm liên quan:", relatedErr);
                        setRelatedProducts([]);
                    }
                }
            } catch (err) {
                console.error("Lỗi tải chi tiết sản phẩm:", err);
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

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    // --- HÀM XỬ LÝ THẢ TIM SẢN PHẨM CHÍNH ---
    const handleMainItemHeartClick = async () => {
        if (!item) return;

        const previousState = { ...item };
        setItem({ ...item, isLiked: !item.isLiked });

        try {
            if (previousState.isLiked) {
                await itemApi.removeToFavouriteList(item.id);
            } else {
                await itemApi.addToFavouriteList(item.id);
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật yêu thích:", error?.response);
            setItem(previousState);
        }
    };

    // --- HÀM XỬ LÝ THẢ TIM SẢN PHẨM LIÊN QUAN ---
    const handleRelatedHeartClick = async (e, prod) => {
        e.stopPropagation();

        setRelatedProducts(prev => prev.map(p =>
            p.id === prod.id ? { ...p, isLiked: !p.isLiked } : p
        ));

        try {
            if (prod.isLiked) {
                await itemApi.removeToFavouriteList(prod.id);
            } else {
                await itemApi.addToFavouriteList(prod.id);
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật yêu thích:", error);
            setRelatedProducts(prev => prev.map(p =>
                p.id === prod.id ? { ...p, isLiked: !p.isLiked } : p
            ));
        }
    };


    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-3">
                    <Wrench className="animate-spin text-blue-600" size={32} />
                    <span className="text-gray-500 font-bold">Đang tải dữ liệu...</span>
                </div>
            </div>
        );
    }

    if (error || !item) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
                <p className="text-red-500 font-bold text-lg">{error || "Không tìm thấy sản phẩm"}</p>
                <button onClick={() => navigate(-1)} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl">Quay lại</button>
            </div>
        );
    }

    const isOutOfStock = (item.totalStockQuantity || 0) === 0;

    return (
        <div className="min-h-screen bg-gray-50 pb-16 font-sans">
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

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
                    <div className="md:w-5/12 bg-gray-100 p-8 flex items-center justify-center relative border-b md:border-b-0 md:border-r border-gray-100">
                        {item.category?.name && (
                            <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-black text-blue-700 shadow-sm border border-gray-200 flex items-center gap-1.5 z-10">
                                <Tag size={14} /> {item.category.name.toUpperCase()}
                            </div>
                        )}
                        {isOutOfStock && (
                            <div className="absolute top-6 right-6 bg-red-600 text-white text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm z-10">
                                Hết hàng
                            </div>
                        )}

                        {/* --- 3. GẮN SỰ KIỆN CLICK VÀO ẢNH CHÍNH SẢN PHẨM --- */}
                        <img
                            src={item.imageUrl || item.image}
                            alt={item.name}
                            onClick={() => setZoomedImage(item.imageUrl || item.image)} // Mở modal
                            className={`w-full max-w-sm h-auto object-contain mix-blend-multiply drop-shadow-xl transition-transform duration-500 cursor-zoom-in ${isOutOfStock ? 'grayscale opacity-60' : 'hover:scale-105'}`}
                        />
                    </div>

                    <div className="md:w-7/12 p-8 lg:p-10 flex flex-col justify-center">
                        <div className="mb-6">
                            <h1 className="text-3xl font-black text-gray-900 leading-tight mb-3">{item.name}</h1>
                            <div className="flex items-center gap-4">
                                <span className={`flex items-center gap-1.5 text-sm font-bold ${isOutOfStock ? 'text-red-600' : 'text-green-600'}`}>
                                    {!isOutOfStock ? <><CheckCircle2 size={16} /> Còn hàng ({item.totalStockQuantity})</> : 'Hết hàng'}
                                </span>
                                <span className="text-gray-300">|</span>
                                <span className="text-gray-500 text-sm font-medium flex items-center gap-1">
                                    <PackageSearch size={16} /> SKU: ITM-{item.id?.toString().padStart(4, '0')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-gray-500 text-sm font-medium">Loại phụ tùng:</span>
                                <span className="bg-blue-100 text-blue-700 text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wide border border-blue-200">
                                    {item.categoryDTO?.name || "Chưa phân loại"}
                                </span>
                            </div>
                        </div>

                        <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 mb-8 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-semibold">Giá linh kiện:</span>
                                <span className={`text-2xl font-black ${isOutOfStock ? 'text-gray-400' : 'text-red-600'}`}>
                                    {formatPrice(item.price)}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                            <button
                                onClick={handleMainItemHeartClick}
                                className={`flex-1 border-2 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-sm cursor-pointer ${item.isLiked
                                    ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                                    : 'bg-white border-blue-600 text-blue-600 hover:bg-blue-50'
                                    }`}
                            >
                                <Heart
                                    size={20}
                                    fill={item.isLiked ? "currentColor" : "none"}
                                    className={`transition-transform duration-300 ${item.isLiked ? 'scale-110' : 'scale-100'}`}
                                />
                                {item.isLiked ? 'Đã lưu' : 'Lưu'}
                            </button>

                            <button
                                disabled={isOutOfStock}
                                className={`flex-1 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md ${isOutOfStock ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 cursor-pointer'}`}
                            >
                                <CalendarDays size={20} /> Đặt lịch ngay
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 lg:p-10">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                        <Info className="text-blue-600" size={24} />
                        <h2 className="text-2xl font-black text-gray-900">Thông tin chi tiết</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-1 space-y-4">
                            {item.dimension && (
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start gap-3">
                                    <Ruler size={20} className="text-blue-500 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase">Kích thước / Cỡ</p>
                                        <p className="text-base font-bold text-gray-800 mt-1">{item.dimension}</p>
                                    </div>
                                </div>
                            )}
                            {item.warranty_year > 0 && (
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start gap-3">
                                    <ShieldCheck size={20} className="text-blue-500 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase">Bảo hành</p>
                                        <p className="text-base font-bold text-gray-800 mt-1">{item.warranty_year} Năm chính hãng</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="md:col-span-2 text-gray-600 leading-relaxed text-justify space-y-4">
                            <p>{item.decription || "Chưa có mô tả cho sản phẩm này."}</p>
                        </div>
                    </div>
                </div>

                <div className="pt-8">
                    <div className="flex items-center gap-2 mb-6">
                        <ListTree className="text-blue-600" size={24} />
                        <h2 className="text-2xl font-black text-gray-900">Sản phẩm liên quan</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {relatedProducts.length > 0 ? (
                            relatedProducts.map((prod) => (
                                <div
                                    key={prod.id}
                                    onClick={() => navigate(`/itemDetailPage/${prod.id}`)}
                                    className="bg-white group rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col"
                                >
                                    <div className="aspect-square bg-gray-50 rounded-xl mb-4 overflow-hidden flex items-center justify-center p-4 relative group/img">
                                        {(prod.totalStockQuantity || 0) === 0 && (
                                            <div className="absolute top-2 right-2 bg-red-600/90 text-white text-[10px] font-black uppercase px-2 py-1 rounded shadow-sm z-10">
                                                Hết hàng
                                            </div>
                                        )}

                                        {/* Gắn sự kiện click để xem ảnh sản phẩm liên quan */}
                                        <img
                                            src={prod.imageUrl || prod.image}
                                            alt={prod.name}
                                            onClick={(e) => {
                                                e.stopPropagation(); // Không chuyển trang khi click vào ảnh
                                                setZoomedImage(prod.imageUrl || prod.image);
                                            }}
                                            className={`w-full h-full object-contain mix-blend-multiply transition-transform duration-500 cursor-zoom-in ${(prod.totalStockQuantity || 0) === 0 ? 'grayscale opacity-60' : 'group-hover:scale-110'}`}
                                        />
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-sm md:text-base line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                                        {prod.name}
                                    </h3>
                                    <div className="mt-auto flex items-center justify-between">
                                        <span className="font-black text-red-600">{formatPrice(prod.price)}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-8 text-gray-400 font-medium">
                                Không có sản phẩm liên quan nào.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- 4. IMAGE ZOOM MODAL --- */}
            {zoomedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 sm:p-10 animate-in fade-in duration-200"
                    onClick={() => setZoomedImage(null)}
                >
                    {/* Nút Đóng */}
                    <button
                        className="absolute top-4 right-4 sm:top-8 sm:right-8 p-2.5 bg-white/10 hover:bg-white/25 rounded-full text-white transition-all hover:rotate-90 z-50"
                        onClick={() => setZoomedImage(null)}
                    >
                        <X size={24} />
                    </button>

                    {/* Hình ảnh hiển thị */}
                    <img
                        src={zoomedImage}
                        alt="Zoomed Detail"
                        className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl ring-1 ring-white/20 animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()} // Bấm vào ảnh không bị tắt
                    />
                </div>
            )}

        </div>
    );
}