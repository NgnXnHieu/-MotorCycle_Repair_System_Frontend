import React, { useState, useEffect } from 'react';
import { Heart, ArrowLeft, Eye, PackageX, Trash2, AlertCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { itemApi } from '../../api/itemApi';
import Pagination from '../../components/common/Pagination';

export default function FavouritePage() {
    const navigate = useNavigate();

    const [favorites, setFavorites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- STATE CHO MODAL XÁC NHẬN ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false); // Trạng thái khi đang gọi API xóa

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchFavorites = async (page = 0) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await itemApi.getMyFavouriteList();
            const dataList = response.content || response.data?.content || [];

            const normalizedData = dataList.map(record => ({
                favouriteRecordId: record.id,
                ...record.itemDTO,
                isLiked: true
            }));

            setFavorites(normalizedData);
            setTotalPages(response.page?.totalPages || 0);
            setCurrentPage(response.page?.number || 0);
        } catch (err) {
            console.error("Lỗi khi tải danh sách yêu thích:", err);
            setError("Không thể tải danh sách yêu thích lúc này.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFavorites(currentPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    // --- HÀM MỞ MODAL XÁC NHẬN ---
    const openConfirmModal = (e, product) => {
        e.stopPropagation(); // Chặn click vào card
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    // --- HÀM XỬ LÝ XÓA SAU KHI XÁC NHẬN ---
    const handleConfirmUnsave = async () => {
        if (!selectedProduct) return;

        setIsDeleting(true);
        try {
            await itemApi.removeToFavouriteList(selectedProduct.id);
            // Xóa khỏi state để UI cập nhật
            setFavorites(prev => prev.filter(item => item.id !== selectedProduct.id));
            setIsModalOpen(false);
            setSelectedProduct(null);
        } catch (error) {
            console.error("Lỗi khi xóa:", error);
            alert("Có lỗi xảy ra, không thể bỏ lưu sản phẩm này.");
        } finally {
            setIsDeleting(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-16 font-sans relative">
            {/* 1. MODAL XÁC NHẬN (CONFIRMATION FORM) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop mờ */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => !isDeleting && setIsModalOpen(false)}
                    ></div>

                    {/* Nội dung Modal */}
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative z-10 animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 text-red-600 mb-4">
                            <div className="bg-red-50 p-2 rounded-full">
                                <AlertCircle size={24} />
                            </div>
                            <h3 className="text-xl font-black">Xác nhận bỏ lưu</h3>
                        </div>

                        <p className="text-gray-600 mb-6 leading-relaxed">
                            Bạn có chắc chắn muốn bỏ lưu <span className="font-bold text-gray-900">"{selectedProduct?.name}"</span> khỏi danh sách yêu thích không?
                        </p>

                        <div className="flex gap-3">
                            <button
                                disabled={isDeleting}
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                disabled={isDeleting}
                                onClick={handleConfirmUnsave}
                                className={`flex-1 px-4 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-100 flex items-center justify-center gap-2 cursor-pointer ${isDeleting ? 'opacity-70' : ''}`}
                            >
                                {isDeleting ? 'Đang xử lý...' : 'Đồng ý bỏ lưu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="bg-white border-b border-gray-200 py-6 mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4 mb-2">
                        <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 rounded-full text-gray-600 cursor-pointer">
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                            <Heart className="text-red-500" size={32} fill="currentColor" />
                            Danh sách yêu thích
                        </h1>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {favorites.length === 0 && !isLoading ? (
                    <div className="bg-white rounded-3xl p-16 flex flex-col items-center text-center">
                        <Heart size={64} className="text-gray-200 mb-4" />
                        <h2 className="text-xl font-bold text-gray-800">Danh sách trống</h2>
                        <button onClick={() => navigate('/spare-parts')} className="mt-4 text-blue-600 font-bold underline">Khám phá sản phẩm</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {favorites.map((product) => (
                            <div key={product.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all flex flex-col relative group">
                                {/* PHẦN HÌNH ẢNH */}
                                <div className="relative h-48 bg-gray-50 flex items-center justify-center p-4">
                                    {/* TRÁI TIM MÀU ĐỎ (TĨNH - KHÔNG NHẤN ĐƯỢC) */}
                                    <div className="absolute top-3 right-3 z-10 text-red-500 drop-shadow-sm bg-white/80 p-1.5 rounded-full backdrop-blur-sm">
                                        <Heart size={20} fill="currentColor" />
                                    </div>

                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
                                    ) : (
                                        <PackageX size={48} className="text-gray-200" />
                                    )}
                                </div>

                                {/* PHẦN NỘI DUNG */}
                                <div className="p-5 flex flex-col flex-1">
                                    <h3 className="text-base font-bold text-gray-800 line-clamp-2 mb-2">{product.name}</h3>
                                    <span className="text-xl font-black text-red-600 mt-auto">{formatPrice(product.price)}</span>
                                </div>

                                {/* PHẦN NÚT HÀNH ĐỘNG */}
                                <div className="p-4 pt-0 flex gap-2">
                                    <button
                                        onClick={() => navigate(`/itemDetailPage/${product.id}`)}
                                        className="flex-1 bg-gray-50 text-gray-600 font-bold py-2.5 rounded-xl text-sm hover:bg-gray-100 transition-colors cursor-pointer"
                                    >
                                        Chi tiết
                                    </button>

                                    {/* NÚT BỎ LƯU MỚI THÊM */}
                                    <button
                                        onClick={(e) => openConfirmModal(e, product)}
                                        className="flex-1 bg-white border-2 border-red-500 text-red-500 font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors cursor-pointer"
                                    >
                                        <Trash2 size={16} /> Bỏ lưu
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}