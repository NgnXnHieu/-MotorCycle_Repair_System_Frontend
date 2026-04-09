import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, ShieldCheck, Clock, Repeat, SlidersHorizontal } from 'lucide-react';
import { servicePackageApi } from '../../api/servicePackageApi';
import { getErrorMessage } from '../../utils/errorHandler';
import Pagination from '../../components/common/Pagination';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function ServicePackagePage() {
    const MIN_BOUNDARY = 0;
    const MAX_BOUNDARY = 5000000;
    const STEP = 100000;

    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Lấy số trang từ URL (nếu URL chưa có gì thì mặc định là 0)
    const pageFromUrl = parseInt(searchParams.get('page')) || 0;

    // --- STATES BỘ LỌC ---
    const [isFilterOpen, setIsFilterOpen] = useState(true);
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(5000000);
    const [searchName, setSearchName] = useState("");
    const [selectedDurationUnits, setSelectedDurationUnits] = useState([]);

    // --- STATES DỮ LIỆU & PHÂN TRANG ---
    const [packages, setPackages] = useState([]);
    const [currentPage, setCurrentPage] = useState(pageFromUrl);
    const [totalPages, setTotalPages] = useState(0);

    // Tăng PAGE_SIZE lên 10 để khi dàn 5 cột sẽ được 2 hàng chẵn
    const PAGE_SIZE = 20;

    const durationUnits = [
        { value: 'DAY', label: 'Tính theo Ngày' },
        { value: 'MONTH', label: 'Tính theo Tháng' },
        { value: 'YEAR', label: 'Tính theo Năm' }
    ];

    // 1. Lắng nghe searchParams (URL) để fetch dữ liệu gói dịch vụ
    useEffect(() => {
        const page = parseInt(searchParams.get('page')) || 0;
        setCurrentPage(page);
        handleSearch(page);
    }, [searchParams]);

    // 2. Hàm gọi API
    const handleSearch = async (page = 0) => {
        const filterForm = {
            minPrice: minPrice,
            maxPrice: maxPrice,
            searchName: searchName,
            durationUnitList: selectedDurationUnits,
            page: page,
            size: PAGE_SIZE
        };

        try {
            console.log(filterForm)
            const response = await servicePackageApi.getFiltedAll(filterForm);

            // Tương tự trang Phụ tùng, xử lý object Page trả về từ backend
            const data = response.content || response;
            const pageData = response.page || { totalPages: 1, number: 0 };

            setPackages(data || []);
            setTotalPages(pageData.totalPages || 0);
            setCurrentPage(pageData.number || 0);
            console.log(response)

        } catch (error) {
            console.error(getErrorMessage(error, "Không thể tìm kiếm gói dịch vụ lúc này."));
        }
    };

    // 3. Xử lý điều hướng & kích hoạt tìm kiếm
    const handleResetSearch = () => {
        // Chỉ cần set lại page về 0, useEffect sẽ tự động bắt sự thay đổi và gọi API
        setSearchParams({ page: 0 });
        handleSearch()
    };

    const handlePageChange = (pageNumber) => {
        setSearchParams({ page: pageNumber });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Các hàm handle cập nhật state UI
    const handleDurationToggle = (unitValue) => {
        setSelectedDurationUnits(prev =>
            prev.includes(unitValue) ? prev.filter(item => item !== unitValue) : [...prev, unitValue]
        );
    };

    const handleNavigateToDetail = (packageId) => navigate(`/servicePackageDetailPage/${packageId}`);

    const handleMinChange = (e) => setMinPrice(Math.min(Number(e.target.value), maxPrice - STEP));
    const handleMaxChange = (e) => setMaxPrice(Math.max(Number(e.target.value), minPrice + STEP));

    const minPercent = ((minPrice - MIN_BOUNDARY) / (MAX_BOUNDARY - MIN_BOUNDARY)) * 100;
    const maxPercent = ((maxPrice - MIN_BOUNDARY) / (MAX_BOUNDARY - MIN_BOUNDARY)) * 100;
    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    const translateDuration = (value, unit) => {
        if (unit === 'DAY') return `${value} Ngày`;
        if (unit === 'MONTH') return `${value} Tháng`;
        if (unit === 'YEAR') return `${value} Năm`;
        return `${value} ${unit}`;
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12 font-sans">
            {/* HEADER */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-900 border-b border-gray-200 py-10 mb-8">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 text-white">
                    <h1 className="text-3xl font-black mb-2">Các Gói Dịch Vụ & Ưu Đãi</h1>
                    <p className="text-blue-100 font-medium text-lg">Tiết kiệm hơn - Chăm sóc xe chuyên nghiệp hơn</p>
                </div>
            </div>

            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-6 xl:gap-8">

                    {/* --- SIDEBAR BỘ LỌC --- */}
                    <div className="flex flex-col gap-4 flex-shrink-0 z-10">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-bold transition-all shadow-sm border self-start w-full lg:w-auto bg-white border-gray-200 text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                        >
                            <SlidersHorizontal size={20} className={isFilterOpen ? "text-blue-600" : "text-gray-500"} />
                        </button>

                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isFilterOpen ? 'w-full lg:w-[260px] xl:w-[280px] opacity-100 max-h-[2000px]' : 'lg:w-0 max-h-0 lg:max-h-[2000px] opacity-0 m-0'}`}>
                            <div className="w-full lg:w-[260px] xl:w-[280px]">
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
                                    <div className="flex items-center gap-2 mb-5 border-b border-gray-100 pb-3">
                                        <Filter className="text-blue-600" size={18} />
                                        <h2 className="text-base font-bold text-gray-800">Cài đặt tìm kiếm</h2>
                                    </div>

                                    {/* Thời hạn gói */}
                                    <div className="mb-5">
                                        <h3 className="font-semibold text-gray-900 mb-3 text-xs uppercase tracking-wider">Thời hạn gói</h3>
                                        <ul className="space-y-2">
                                            {durationUnits.map((unit) => (
                                                <li key={unit.value}>
                                                    <label className="flex items-center gap-3 cursor-pointer group">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedDurationUnits.includes(unit.value)}
                                                            onChange={() => handleDurationToggle(unit.value)}
                                                            className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                                        />
                                                        <span className="text-gray-600 group-hover:text-blue-600 font-medium text-sm">{unit.label}</span>
                                                    </label>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Khoảng giá */}
                                    <div className="pt-5 border-t border-gray-100">
                                        <h3 className="font-semibold text-gray-900 mb-5 text-xs uppercase tracking-wider">Khoảng giá</h3>
                                        <div className="relative h-1.5 bg-gray-200 rounded-lg">
                                            <div className="absolute h-full bg-blue-600 rounded-lg z-10" style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}></div>
                                            <input type="range" min={MIN_BOUNDARY} max={MAX_BOUNDARY} step={STEP} value={minPrice} onChange={handleMinChange} className="absolute w-full -top-1.5 h-4 appearance-none bg-transparent pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-600 [&::-webkit-slider-thumb]:rounded-full" />
                                            <input type="range" min={MIN_BOUNDARY} max={MAX_BOUNDARY} step={STEP} value={maxPrice} onChange={handleMaxChange} className="absolute w-full -top-1.5 h-4 appearance-none bg-transparent pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-600 [&::-webkit-slider-thumb]:rounded-full" />
                                        </div>
                                        <div className="flex justify-between items-center mt-5 text-xs font-bold text-gray-700">
                                            <div className="bg-gray-50 border border-gray-200 px-2 py-1.5 rounded-md text-center w-[45%] truncate">{formatPrice(minPrice)}</div>
                                            <span className="text-gray-300">-</span>
                                            <div className="bg-gray-50 border border-gray-200 px-2 py-1.5 rounded-md text-center w-[45%] truncate">{formatPrice(maxPrice)}</div>
                                        </div>
                                        <button
                                            onClick={handleResetSearch}
                                            className="w-full mt-5 bg-blue-50 text-blue-600 font-bold py-2.5 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100 text-sm"
                                        >
                                            Áp dụng
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- VÙNG NỘI DUNG CHÍNH --- */}
                    <div className="flex-1 transition-all duration-300 min-w-0 flex flex-col">

                        {/* Thanh công cụ Tìm kiếm */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={searchName}
                                    onChange={(e) => setSearchName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleResetSearch()}
                                    placeholder="Nhập tên gói dịch vụ bạn muốn tìm..."
                                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                                />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            </div>

                            <button
                                onClick={handleResetSearch}
                                className="hidden sm:block bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-blue-700 transition-colors flex-shrink-0 text-sm"
                            >
                                Tìm kiếm
                            </button>
                        </div>

                        {/* LƯỚI HIỂN THỊ GÓI DỊCH VỤ */}
                        {packages.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                                <p className="text-gray-500 font-medium text-sm">Không tìm thấy gói dịch vụ nào phù hợp.</p>
                            </div>
                        ) : (
                            <>
                                <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${isFilterOpen ? 'lg:grid-cols-3 xl:grid-cols-4' : 'lg:grid-cols-4 xl:grid-cols-5'} gap-4 transition-all duration-300`}>
                                    {packages.map((pkg) => {
                                        const displayImage = pkg.imageUrl || pkg.image;

                                        return (
                                            <div key={pkg.id}
                                                onClick={() => handleNavigateToDetail(pkg.id)}
                                                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all flex flex-col group cursor-pointer hover:border-blue-300"
                                            >
                                                {/* KHỐI HÌNH ẢNH ĐÃ ĐƯỢC CẬP NHẬT */}
                                                <div className="h-36 bg-gray-50 flex items-center justify-center border-b border-gray-100 relative overflow-hidden">
                                                    {displayImage ? (
                                                        <img
                                                            src={displayImage}
                                                            alt={pkg.name}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 z-10 relative"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center relative">
                                                            <ShieldCheck size={40} className="text-blue-500/80 group-hover:scale-110 transition-transform duration-500 z-10" />
                                                            <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-600/5 rounded-full blur-xl"></div>
                                                            <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-indigo-600/5 rounded-full blur-xl"></div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="p-4 flex flex-col flex-1">
                                                    <h3 className="text-base font-bold text-gray-900 leading-tight mb-1.5 group-hover:text-blue-700 transition-colors line-clamp-2">{pkg.name}</h3>
                                                    <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed">{pkg.description}</p>

                                                    <div className="mt-auto grid grid-cols-2 gap-2 mb-4">
                                                        <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-700 bg-gray-50 px-2 py-1 rounded-md truncate">
                                                            <Clock size={12} className="text-blue-500 flex-shrink-0" />
                                                            <span className="truncate">{pkg.duration}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-700 bg-gray-50 px-2 py-1 rounded-md truncate">
                                                            <Repeat size={12} className="text-green-500 flex-shrink-0" />
                                                            <span className="truncate">{pkg.usageTimes} Lần</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                                        <span className="text-lg font-black text-red-600">{formatPrice(pkg.price)}</span>
                                                        <button className="bg-blue-50 text-blue-700 font-bold px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-1 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                            <Eye size={12} /> Chi tiết
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="mt-6">
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