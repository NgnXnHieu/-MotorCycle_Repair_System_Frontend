import React, { useState, useEffect } from 'react';
import { Heart, ArrowLeft, Eye, PackageX, Trash2, HeartOff, LayoutGrid } from 'lucide-react';
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
    const [isDeleting, setIsDeleting] = useState(false);

    // --- STATE CHO PHÂN TRANG ---
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchFavorites = async (page = 0) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await itemApi.getMyFavouriteList({ page, size: 15 });
            const dataList = response.content || response.data?.content || [];

            const normalizedData = dataList.map(record => ({
                favouriteRecordId: record.id,
                ...record.itemDTO,
                isLiked: true
            }));

            setFavorites(normalizedData);
            setTotalPages(response.page?.totalPages || response.totalPages || 0);
            setCurrentPage(response.page?.number || response.number || 0);
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
        e.stopPropagation();
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    // --- HÀM XỬ LÝ XÓA SAU KHI XÁC NHẬN ---
    const handleConfirmUnsave = async () => {
        if (!selectedProduct) return;

        setIsDeleting(true);
        try {
            await itemApi.removeToFavouriteList(selectedProduct.id || selectedProduct.id);
            setFavorites(prev => prev.filter(item => item.id !== selectedProduct.id));
            setIsModalOpen(false);
            setSelectedProduct(null);
        } catch (error) {
            console.error("Lỗi khi xóa:", error?.response);
            alert("Có lỗi xảy ra, không thể bỏ lưu sản phẩm này.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleNavigateToDetail = (productId) => navigate(`/itemDetailPage/${productId}`);
    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    const getBrandStyle = (brandName) => {
        const name = (typeof brandName === 'object' ? brandName?.name : brandName) || '';
        const lowerName = name.toLowerCase();

        if (lowerName.includes('honda')) return 'bg-red-100 text-red-700 border-red-200';
        if (lowerName.includes('yamaha')) return 'bg-blue-100 text-blue-700 border-blue-200';
        if (lowerName.includes('michelin')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        if (lowerName.includes('motul')) return 'bg-orange-100 text-orange-700 border-orange-200';
        if (lowerName.includes('bosch')) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
        return 'bg-slate-100 text-slate-600 border-slate-200';
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-16 font-sans relative">

            {/* MODAL XÁC NHẬN */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isDeleting && setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-7 relative z-10 animate-in fade-in zoom-in duration-200">
                        <div className="flex flex-col items-center text-center mb-6 mt-2">
                            <div className="bg-red-50 text-red-500 p-4 rounded-full mb-4">
                                <HeartOff size={32} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">Bỏ lưu sản phẩm</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Bạn có chắc chắn muốn bỏ lưu <br /> <span className="font-bold text-gray-800">"{selectedProduct?.name}"</span>?
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button disabled={isDeleting} onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                                Giữ lại
                            </button>
                            <button disabled={isDeleting} onClick={handleConfirmUnsave} className={`flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 flex justify-center items-center gap-2 ${isDeleting ? 'opacity-70' : ''}`}>
                                {isDeleting ? 'Đang xử lý...' : 'Đồng ý'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="bg-white border-b border-gray-200 py-6 mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer shrink-0">
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-3">
                                    <Heart className="text-red-500" size={28} fill="currentColor" />
                                    Sản phẩm yêu thích
                                </h1>
                                <p className="text-gray-500 mt-1 font-medium text-sm sm:ml-10">Bạn đang có {favorites.length} sản phẩm được lưu</p>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/sparePartsPage')}
                            className="flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-blue-700 transition-colors shadow-md sm:w-auto w-full"
                        >
                            <LayoutGrid size={18} />
                            Xem danh sách phụ tùng
                        </button>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 flex flex-col items-center text-center border border-dashed border-gray-300">
                        <div className="bg-gray-50 p-6 rounded-full mb-6 text-gray-300">
                            <Heart size={64} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Chưa có sản phẩm yêu thích</h2>
                        <p className="text-gray-500 mb-6 max-w-md">Hãy khám phá gian hàng và lưu lại những sản phẩm bạn muốn mua sau nhé!</p>
                        <button onClick={() => navigate('/sparePartsPage')} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                            Khám phá phụ tùng ngay
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                            {favorites.map((product) => {
                                const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;

                                // KIỂM TRA HẾT HÀNG
                                const isOutOfStock = (product.totalStockQuantity || 0) === 0;

                                return (
                                    <div
                                        key={product.id}
                                        onClick={() => handleNavigateToDetail(product.id)}
                                        // Thêm lớp grayscale nếu hết hàng
                                        className={`group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col relative overflow-hidden cursor-pointer ${isOutOfStock ? 'grayscale-[0.8] opacity-90' : ''}`}
                                    >
                                        <div className="relative h-44 w-full overflow-hidden bg-gray-100 flex items-center justify-center border-b border-gray-100">
                                            {product.imageUrl ? (
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <PackageX size={40} className="text-gray-300" />
                                            )}

                                            {/* HIỂN THỊ BADGE NẾU HẾT HÀNG */}
                                            {isOutOfStock && (
                                                <div className="absolute top-2 left-2 bg-rose-600/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md z-10 shadow-sm">
                                                    Hết hàng
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4 flex flex-col flex-1 bg-white relative">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${getBrandStyle(brandName)}`}>
                                                    {brandName || 'Phụ Tùng'}
                                                </span>
                                            </div>

                                            <h3 className="text-sm font-bold text-gray-800 leading-snug mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                {product.name}
                                            </h3>

                                            <div className="mt-auto mb-3">
                                                <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Giá bán lẻ</span>
                                                {/* Làm mờ giá nếu hết hàng */}
                                                <span className={`text-lg font-black ${isOutOfStock ? 'text-gray-500' : 'text-red-600'}`}>
                                                    {formatPrice(product.price)}
                                                </span>
                                            </div>

                                            <button
                                                onClick={(e) => openConfirmModal(e, product)}
                                                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white rounded-lg transition-colors text-xs font-bold border border-red-100 shadow-sm"
                                            >
                                                <Trash2 size={14} />
                                                Bỏ yêu thích
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-12 flex justify-center">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}