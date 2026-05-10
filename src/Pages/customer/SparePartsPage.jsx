import React, { useState, useEffect } from 'react';
import { Search, Filter, ShoppingCart, Eye, Heart, ShieldCheck } from 'lucide-react';
import { categoryApi } from '../../api/categoryApi';
import { itemApi } from '../../api/itemApi';
import { contentApi } from '../../api/contentApi'; // Bổ sung import contentApi
import { getErrorMessage } from '../../utils/errorHandler';
import Pagination from '../../components/common/Pagination';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function SparePartsPage() {
    const MIN_BOUNDARY = 0;
    const MAX_BOUNDARY = 5000000;
    const STEP = 100000;

    const navigate = useNavigate();
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(5000000);
    const [categories, setCategories] = useState([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [searchName, setSearchName] = useState("");
    const [products, setProducts] = useState([]);

    // --- STATE DỮ LIỆU ĐỘNG (CMS) ---
    const [pageContents, setPageContents] = useState({});

    // --- STATE PHÂN TRANG ---
    const [totalPages, setTotalPages] = useState(0);
    const PAGE_SIZE = 20;

    const brands = ['Honda', 'Yamaha', 'Michelin', 'Motul', 'Bosch'];
    const [searchParams, setSearchParams] = useSearchParams();
    const pageFromUrl = parseInt(searchParams.get('page')) || 0;
    const [currentPage, setCurrentPage] = useState(pageFromUrl);

    // 0. Fetch Dữ liệu CMS (Nội dung tĩnh được cấu hình)
    useEffect(() => {
        const fetchPageContents = async () => {
            try {
                // Thay 'SPARE_PART' bằng page_code thực tế của bạn trong DB
                const response = await contentApi.getContentList('ITEM_PAGE');
                const contentList = response.data || response;

                if (Array.isArray(contentList)) {
                    const mappedContents = contentList.reduce((acc, item) => {
                        // Map chuẩn theo API trả về (contentKey, contentValue)
                        acc[item.contentKey] = {
                            value: item.contentValue,
                            color: item.color
                        };
                        return acc;
                    }, {});
                    setPageContents(mappedContents);
                }
            } catch (error) {
                console.error("Lỗi khi tải nội dung động:", error);
            }
        };
        fetchPageContents();
    }, []);

    // 1. Chỉ chạy 1 lần duy nhất để lấy danh mục
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await categoryApi.getAllCategory();
                setCategories(response.content || response.data || response);
            } catch (error) {
                console.error("Lỗi khi tải danh mục:", error);
            }
        };
        fetchCategories();
    }, []);

    // 2. Lắng nghe searchParams (URL) để fetch dữ liệu sản phẩm
    useEffect(() => {
        const page = parseInt(searchParams.get('page')) || 0;
        setCurrentPage(page);
        handleSearch(page);
    }, [searchParams]);

    // 3. Hàm gọi API tìm kiếm
    const handleSearch = async (page = 0) => {
        const filterForm = {
            categoryIds: selectedCategoryIds,
            brandNames: selectedBrands,
            minPrice: minPrice,
            maxPrice: maxPrice,
            searchName: searchName,
            page: page,
            size: PAGE_SIZE
        };

        try {
            const response = await itemApi.getFiltedItem(filterForm);
            const data = response.content || response;
            const pageInfo = response.page;

            setProducts(data || []);
            setTotalPages(pageInfo?.totalPages || 0);
            setCurrentPage(pageInfo?.number || 0);

        } catch (error) {
            const message = getErrorMessage(error, "Không thể tìm kiếm item lúc này.");
            console.error(message);
        }
    };

    const handleResetSearch = () => {
        setSearchParams({ page: 0 });
    };

    const handlePageChange = (pageNumber) => {
        setSearchParams({ page: pageNumber });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCategoryToggle = (id) => {
        setSelectedCategoryIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const handleBrandToggle = (brandName) => {
        setSelectedBrands(prev => prev.includes(brandName) ? prev.filter(item => item !== brandName) : [...prev, brandName]);
    };

    const handleNavigateToDetail = (productId) => {
        navigate(`/itemDetailPage/${productId}`);
    };

    const handleMinChange = (e) => setMinPrice(Math.min(Number(e.target.value), maxPrice - STEP));
    const handleMaxChange = (e) => setMaxPrice(Math.max(Number(e.target.value), minPrice + STEP));

    const minPercent = ((minPrice - MIN_BOUNDARY) / (MAX_BOUNDARY - MIN_BOUNDARY)) * 100;
    const maxPercent = ((maxPrice - MIN_BOUNDARY) / (MAX_BOUNDARY - MIN_BOUNDARY)) * 100;
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
        <div className="min-h-screen bg-gray-50 pb-12 font-sans">
            {/* HEADER PAGE ĐÃ ĐƯỢC CHUYỂN THÀNH CMS ĐỘNG */}
            <div className="bg-white border-b border-gray-200 py-6 mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1
                        className="text-3xl font-black"
                        style={{ color: pageContents.header_title?.color || '#111827' }}
                        dangerouslySetInnerHTML={{ __html: pageContents.header_title?.value || 'Danh mục Phụ tùng & Linh kiện' }}
                    />
                    <p
                        className="mt-2 font-medium"
                        style={{ color: pageContents.header_subtitle?.color || '#6b7280' }}
                    >
                        {pageContents.header_subtitle?.value || 'Cung cấp linh kiện chính hãng, bảo hành uy tín'}
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* SIDEBAR BỘ LỌC */}
                    <div className="w-full lg:w-1/4 flex-shrink-0">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
                            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                                <Filter className="text-blue-600" size={20} />
                                <h2 className="text-lg font-bold text-gray-800">Bộ lọc tìm kiếm</h2>
                            </div>

                            {/* Danh mục */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">Danh mục</h3>
                                <ul className="space-y-2.5">
                                    {categories.map((cat) => (
                                        <li key={cat.id}>
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input type="checkbox" checked={selectedCategoryIds.includes(cat.id)} onChange={() => handleCategoryToggle(cat.id)} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                                                <span className="text-gray-600 group-hover:text-blue-600 font-medium text-sm">{cat.name}</span>
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Hãng */}
                            <div className="mb-6 pt-6 border-t border-gray-100">
                                <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">Hãng sản xuất</h3>
                                <ul className="space-y-2.5">
                                    {brands.map((brand, index) => (
                                        <li key={index}>
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input type="checkbox" checked={selectedBrands.includes(brand)} onChange={() => handleBrandToggle(brand)} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                                                <span className="text-gray-600 group-hover:text-blue-600 font-medium text-sm">{brand}</span>
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Khoảng giá */}
                            <div className="pt-6 border-t border-gray-100">
                                <h3 className="font-semibold text-gray-900 mb-6 text-sm uppercase tracking-wider">Khoảng giá</h3>
                                <div className="relative h-2 bg-gray-200 rounded-lg">
                                    <div className="absolute h-full bg-blue-600 rounded-lg z-10" style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}></div>
                                    <input type="range" min={MIN_BOUNDARY} max={MAX_BOUNDARY} step={STEP} value={minPrice} onChange={handleMinChange} className="absolute w-full -top-1.5 h-5 appearance-none bg-transparent pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-600 [&::-webkit-slider-thumb]:rounded-full" />
                                    <input type="range" min={MIN_BOUNDARY} max={MAX_BOUNDARY} step={STEP} value={maxPrice} onChange={handleMaxChange} className="absolute w-full -top-1.5 h-5 appearance-none bg-transparent pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-600 [&::-webkit-slider-thumb]:rounded-full" />
                                </div>
                                <div className="flex justify-between items-center mt-6 text-sm font-bold text-gray-700">
                                    <div className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg text-center w-[45%]">{formatPrice(minPrice)}</div>
                                    <span className="text-gray-300">-</span>
                                    <div className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg text-center w-[45%]">{formatPrice(maxPrice)}</div>
                                </div>
                                <button onClick={handleResetSearch} className="w-full mt-6 bg-blue-50 text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100">
                                    Áp dụng bộ lọc
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* VÙNG NỘI DUNG CHÍNH */}
                    <div className="flex-1">
                        {/* Thanh tìm kiếm */}
                        <div className="relative mb-8 flex gap-3">
                            <div className="relative flex-1">
                                <input type="text" value={searchName} onChange={(e) => setSearchName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleResetSearch()} placeholder="Tìm kiếm phụ kiện, linh kiện..." className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                            </div>
                            <button onClick={handleResetSearch} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">Tìm kiếm</button>
                        </div>

                        {products.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                                <p className="text-gray-400 font-medium text-lg">Không tìm thấy sản phẩm nào.</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {products.map((product) => {
                                        const isOutOfStock = (product.totalStockQuantity || 0) === 0;
                                        const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;

                                        return (
                                            <div key={product.id}
                                                onClick={() => handleNavigateToDetail(product.id)}
                                                className={`group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col relative overflow-hidden cursor-pointer ${isOutOfStock ? 'grayscale-[0.8] opacity-90' : ''}`}
                                            >
                                                <div className="relative h-60 w-full overflow-hidden bg-gray-50">
                                                    <img
                                                        src={product.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    />

                                                    {isOutOfStock ? (
                                                        <div className="absolute top-4 left-4 bg-rose-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full z-10 shadow-lg">
                                                            Hết hàng
                                                        </div>
                                                    ) : (
                                                        <div className="absolute top-4 left-4 bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full z-10 flex items-center gap-1 shadow-md">
                                                            <ShieldCheck size={12} /> Sẵn hàng
                                                        </div>
                                                    )}

                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                </div>

                                                <div className="p-6 flex flex-col flex-1 bg-white relative">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${getBrandStyle(brandName)}`}>
                                                            {brandName || 'Generic'}
                                                        </span>
                                                    </div>

                                                    <h3 className="text-lg font-bold text-gray-800 leading-snug mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                        {product.name}
                                                    </h3>

                                                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Giá bán lẻ</span>
                                                            <span className={`text-xl font-black ${isOutOfStock ? 'text-red-400' : 'text-red-600'}`}>
                                                                {formatPrice(product.price)}
                                                            </span>
                                                        </div>

                                                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner border border-gray-100">
                                                            <Eye size={18} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-12 flex justify-center">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={handlePageChange}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}