import React, { useState, useEffect } from 'react';
import { Search, Filter, ShoppingCart, Eye, Heart } from 'lucide-react';
import { categoryApi } from '../../api/categoryApi';
import { itemApi } from '../../api/itemApi';
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

    // --- 1. THÊM STATE PHÂN TRANG ---
    const [totalPages, setTotalPages] = useState(0);
    const PAGE_SIZE = 20; // Bạn có thể tùy chỉnh số lượng item mỗi trang

    const brands = ['Honda', 'Yamaha', 'Michelin', 'Motul', 'Bosch'];

    // --- THÊM DÒNG NÀY ---
    const [searchParams, setSearchParams] = useSearchParams();

    // Lấy số trang từ URL (nếu URL chưa có gì thì mặc định là 0)
    const pageFromUrl = parseInt(searchParams.get('page')) || 0;

    // Sửa lại state currentPage để lấy giá trị khởi tạo từ URL thay vì luôn luôn là 0
    const [currentPage, setCurrentPage] = useState(pageFromUrl);

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
        // Mỗi khi URL thay đổi (VD: người dùng nhấn Back hoặc đổi trang)
        const page = parseInt(searchParams.get('page')) || 0;

        // Cập nhật state UI và gọi API theo đúng số trang trên URL
        setCurrentPage(page);
        handleSearch(page);
    }, [searchParams]); // <-- Quan trọng nhất là dependency này

    // 3. Sửa lại các hàm điều hướng
    const handleResetSearch = () => {
        // Thay vì gọi handleSearch(0), ta chỉ cần đổi URL về 0
        // useEffect số 2 ở trên sẽ tự động bắt được và fetch data
        setSearchParams({ page: 0 });
    };

    const handlePageChange = (pageNumber) => {
        // Tương tự, chỉ cần cập nhật URL
        setSearchParams({ page: pageNumber });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    // --- 2. CẬP NHẬT HÀM HANDLESEARCH ĐỂ NHẬN TRANG ---
    const handleSearch = async (page = 0) => {
        const filterForm = {
            categoryIds: selectedCategoryIds,
            brandNames: selectedBrands,
            minPrice: minPrice,
            maxPrice: maxPrice,
            searchName: searchName,
            page: page,      // Gửi trang cần lấy xuống Backend
            size: PAGE_SIZE  // Gửi kích thước trang
        };

        try {
            const response = await itemApi.getFiltedItem(filterForm);
            console.log(response)
            // Backend Page trả về đối tượng có: content (danh sách), totalPages, number (trang hiện tại)
            const data = response.content || response;
            const page = response.page
            console.log(data)
            setProducts(data || []);
            setTotalPages(page.totalPages || 0);
            setCurrentPage(page.number || 0);

        } catch (error) {
            const message = getErrorMessage(error, "Không thể tìm kiếm item lúc này.");
            console.error(message);
        }
    };



    const handleCategoryToggle = (id) => {
        setSelectedCategoryIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const handleBrandToggle = (brandName) => {
        setSelectedBrands(prev => prev.includes(brandName) ? prev.filter(item => item !== brandName) : [...prev, brandName]);
    };


    // ---  Hàm xử lý điều hướng ---
    const handleNavigateToDetail = (productId) => {
        // Điều hướng sang trang chi tiết. Bạn cần đảm bảo Route trong App.js đã được cấu hình dạng: <Route path="/item/:id" element={<ItemDetailPage />} />
        navigate(`/itemDetailPage/${productId}`);
    };

    // --- Hàm xử lý nút thả tim ---
    const handleHeartClick = (e, productId) => {
        e.stopPropagation(); // QUAN TRỌNG: Chặn sự kiện click truyền lên thẻ cha (chặn điều hướng)
        console.log("Thêm vào yêu thích sản phẩm ID:", productId);
        // Thêm logic call API yêu thích tại đây
    };

    const handleMinChange = (e) => setMinPrice(Math.min(Number(e.target.value), maxPrice - STEP));
    const handleMaxChange = (e) => setMaxPrice(Math.max(Number(e.target.value), minPrice + STEP));

    const minPercent = ((minPrice - MIN_BOUNDARY) / (MAX_BOUNDARY - MIN_BOUNDARY)) * 100;
    const maxPercent = ((maxPrice - MIN_BOUNDARY) / (MAX_BOUNDARY - MIN_BOUNDARY)) * 100;
    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    return (
        <div className="min-h-screen bg-gray-50 pb-12 font-sans">
            <div className="bg-white border-b border-gray-200 py-6 mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-black text-gray-900">Danh mục Phụ tùng & Linh kiện</h1>
                    <p className="text-gray-500 mt-2 font-medium">Cung cấp linh kiện chính hãng, bảo hành uy tín</p>
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
                        <div className="relative mb-8 flex gap-3">
                            <div className="relative flex-1">
                                <input type="text" value={searchName} onChange={(e) => setSearchName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleResetSearch()} placeholder="Tìm kiếm phụ kiện, linh kiện..." className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                            </div>
                            <button onClick={handleResetSearch} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-colors">Tìm kiếm</button>
                        </div>

                        {products.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                                <p className="text-gray-500 font-medium text-lg">Không tìm thấy sản phẩm nào.</p>
                            </div>
                        ) : (
                            // --- 3. HIỂN THỊ DANH SÁCH VÀ PHÂN TRANG ---
                            <>
                                <div className="cursor-pointer grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {products.map((product) => {
                                        // Kiểm tra xem có hết hàng hay không (đề phòng backend trả về null thì fallback về 0)
                                        const isOutOfStock = (product.totalStockQuantity || 0) === 0;

                                        return (
                                            <div key={product.id}
                                                onClick={() => handleNavigateToDetail(product.id)}
                                                className={`bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all flex flex-col relative group ${isOutOfStock ? 'opacity-85' : ''}`}
                                            >
                                                <div className="relative h-48 bg-gray-100 overflow-hidden flex items-center justify-center p-4">

                                                    {/* --- THÊM MỚI: BADGE HẾT HÀNG --- */}
                                                    {isOutOfStock && (
                                                        <div className="absolute top-3 right-3 bg-red-600/90 backdrop-blur-sm text-white text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm z-10">
                                                            Hết hàng
                                                        </div>
                                                    )}

                                                    {/* Thêm hiệu ứng grayscale (ảnh trắng đen) nếu hết hàng */}
                                                    <img
                                                        src={product.imageUrl}
                                                        alt={product.name}
                                                        className={`w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? 'grayscale opacity-70' : ''}`}
                                                    />
                                                </div>

                                                <div className="p-5 flex flex-col flex-1">
                                                    <span className="text-xs font-bold text-gray-400 uppercase mb-1">
                                                        {typeof product.brand === 'object' ? product.brand?.name : product.brand}
                                                    </span>
                                                    <h3 className={`text-base font-bold leading-tight mb-2 line-clamp-2 ${isOutOfStock ? 'text-gray-500' : 'text-gray-800'}`}>
                                                        {product.name}
                                                    </h3>
                                                    <div className="mt-auto pt-4 flex flex-col">
                                                        <span className={`text-xl font-black ${isOutOfStock ? 'text-gray-400' : 'text-red-600'}`}>
                                                            {formatPrice(product.price)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="p-4 pt-0 border-t border-gray-50 mt-2 flex gap-2">
                                                    <button className="cursor-pointer hover:bg-blue-600 hover:text-white flex-1 bg-white border-2 border-blue-600 text-blue-600 font-bold py-2 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                                                        <Eye size={16} /> Chi tiết
                                                    </button>
                                                    {/* <button
                                                        onClick={(e) => handleHeartClick(e, product.id)}
                                                        className="cursor-pointer flex-none bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-colors"
                                                    >
                                                        <Heart size={20} />
                                                    </button> */}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* NHÚNG COMPONENT PHÂN TRANG TẠI ĐÂY */}
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}