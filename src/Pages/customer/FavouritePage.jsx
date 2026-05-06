import React, { useState, useEffect } from 'react';
import { Heart, ArrowLeft, Eye, PackageX, Trash2, AlertCircle, X, HeartOff } from 'lucide-react';
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
            // Giả sử API có hỗ trợ truyền page (nếu không bạn bỏ tham số page đi)
            const response = await itemApi.getMyFavouriteList({ page, size: 12 });
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
        e.stopPropagation(); // Ngăn sự kiện click nhảy sang trang chi tiết
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    // --- HÀM XỬ LÝ XÓA SAU KHI XÁC NHẬN ---
    const handleConfirmUnsave = async () => {
        if (!selectedProduct) return;

        setIsDeleting(true);
        try {
            // Sử dụng ID của bản ghi favourite (favouriteRecordId) hoặc ID item tùy theo API của bạn yêu cầu
            await itemApi.removeToFavouriteList(selectedProduct.id || selectedProduct.id);

            // Xóa khỏi state để UI cập nhật
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

    // --- HÀM ĐIỀU HƯỚNG ---
    const handleNavigateToDetail = (productId) => {
        navigate(`/itemDetailPage/${productId}`);
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    // --- MÀU SẮC THƯƠNG HIỆU (Đồng bộ từ SparePartsPage) ---
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

            {/* 1. MODAL XÁC NHẬN (Được làm đẹp hơn) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isDeleting && setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-7 relative z-10 animate-in fade-in zoom-in duration-200">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center mb-6 mt-2">
                            <div className="bg-red-50 text-red-500 p-4 rounded-full mb-4">
                                <HeartOff size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">Bỏ lưu sản phẩm</h3>
                            <p className="text-gray-500 leading-relaxed">
                                Bạn có chắc chắn muốn bỏ lưu <br /> <span className="font-bold text-gray-800">"{selectedProduct?.name}"</span>?
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button disabled={isDeleting} onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                                Giữ lại
                            </button>
                            <button disabled={isDeleting} onClick={handleConfirmUnsave} className={`flex-1 py-3.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 flex justify-center items-center gap-2 ${isDeleting ? 'opacity-70' : ''}`}>
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
                        <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                                <Heart className="text-red-500" size={32} fill="currentColor" />
                                Danh sách yêu thích
                            </h1>
                            <p className="text-gray-500 mt-1 font-medium text-sm ml-11">Những phụ tùng và linh kiện bạn đã quan tâm</p>
                        </div>
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
                        <button onClick={() => navigate('/spare-parts')} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                            Khám phá phụ tùng
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {favorites.map((product) => {
                                const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;

                                return (
                                    <div
                                        key={product.id}
                                        onClick={() => handleNavigateToDetail(product.id)}
                                        className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col relative overflow-hidden cursor-pointer"
                                    >
                                        {/* PHẦN ẢNH NỔI BẬT */}
                                        <div className="relative h-60 w-full overflow-hidden bg-gray-50 flex items-center justify-center">
                                            {product.imageUrl ? (
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                            ) : (
                                                <PackageX size={48} className="text-gray-300" />
                                            )}

                                            {/* NÚT THAO TÁC (Tim -> Thùng rác khi Hover) */}
                                            <button
                                                onClick={(e) => openConfirmModal(e, product)}
                                                className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2.5 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 transition-all z-20 shadow-sm group/btn"
                                                title="Bỏ lưu"
                                            >
                                                {/* Mặc định hiện tim, khi hover nút này thì ẩn tim hiện thùng rác */}
                                                <Heart className="block group-hover/btn:hidden" fill="currentColor" size={18} />
                                                <Trash2 className="hidden group-hover/btn:block" size={18} />
                                            </button>

                                            <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        </div>

                                        {/* PHẦN NỘI DUNG THẺ */}
                                        <div className="p-5 flex flex-col flex-1 bg-white relative">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${getBrandStyle(brandName)}`}>
                                                    {brandName || 'Sản phẩm'}
                                                </span>
                                            </div>

                                            <h3 className="text-base font-bold text-gray-800 leading-snug mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                {product.name}
                                            </h3>

                                            {/* Dòng giá tiền và nút xem chi tiết */}
                                            <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Giá bán lẻ</span>
                                                    <span className="text-xl font-black text-red-600">
                                                        {formatPrice(product.price)}
                                                    </span>
                                                </div>

                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner border border-blue-100">
                                                    <Eye size={18} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* PHÂN TRANG */}
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