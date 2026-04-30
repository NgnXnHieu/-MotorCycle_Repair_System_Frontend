import React, { useState, useEffect } from 'react';
import { Search, Filter, ShieldCheck, Clock, Repeat, SlidersHorizontal, ChevronRight } from 'lucide-react';
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
        setSearchParams({ page: 0 });
        handleSearch()
    };

    const handlePageChange = (pageNumber) => {
        setSearchParams({ page: pageNumber });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

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

    return (
        <div className="min-h-screen bg-zinc-50 pb-12 font-sans text-zinc-900">
            {/* HER0 SECTION */}
            <div className="relative w-full h-[320px] md:h-[400px] mb-10 overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1549317661-ef355e75fe22?q=80&w=1920&auto=format&fit=crop"
                    alt="Dịch vụ sửa chữa xe"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/95 via-zinc-900/80 to-zinc-900/30"></div>

                <div className="absolute inset-0 flex flex-col items-start justify-center px-6 md:px-16 lg:px-24 max-w-[1440px] mx-auto z-10">
                    <span className="text-amber-500 font-bold tracking-[0.2em] uppercase text-xs mb-4 drop-shadow-sm border-l-2 border-amber-500 pl-3">Dịch Vụ Cao Cấp</span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-md tracking-tight max-w-2xl leading-tight">
                        Chăm sóc xe <br /> chuyên nghiệp
                    </h1>
                    <p className="text-base md:text-lg text-zinc-300 font-light max-w-xl drop-shadow-sm leading-relaxed">
                        Nâng tầm trải nghiệm bảo dưỡng xe với các gói dịch vụ cao cấp. Đảm bảo hiệu suất tối đa và độ bền bỉ vượt thời gian.
                    </p>
                </div>
            </div>

            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* SIDEBAR BỘ LỌC */}
                    <div className="flex flex-col gap-4 flex-shrink-0 z-10">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-medium transition-all shadow-sm border self-start w-full lg:w-auto bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                        >
                            <SlidersHorizontal size={18} className={isFilterOpen ? "text-zinc-900" : "text-zinc-500"} />
                            <span className="text-sm">Bộ lọc tìm kiếm</span>
                        </button>

                        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isFilterOpen ? 'w-full lg:w-[280px] opacity-100 max-h-[2000px]' : 'lg:w-0 max-h-0 lg:max-h-[2000px] opacity-0 m-0'}`}>
                            <div className="w-full lg:w-[280px]">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200 sticky top-6">
                                    <div className="flex items-center gap-3 mb-6 border-b border-zinc-100 pb-4">
                                        <Filter className="text-zinc-900" size={18} />
                                        <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">Lọc Dịch Vụ</h2>
                                    </div>

                                    {/* Thời hạn gói */}
                                    <div className="mb-8">
                                        <h3 className="font-semibold text-zinc-400 mb-4 text-[11px] uppercase tracking-widest">Thời hạn gói</h3>
                                        <ul className="space-y-3">
                                            {durationUnits.map((unit) => (
                                                <li key={unit.value}>
                                                    <label className="flex items-center gap-3 cursor-pointer group">
                                                        <div className="relative flex items-center justify-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedDurationUnits.includes(unit.value)}
                                                                onChange={() => handleDurationToggle(unit.value)}
                                                                className="w-4 h-4 text-zinc-900 rounded-[4px] border-zinc-300 focus:ring-zinc-900 focus:ring-offset-0"
                                                            />
                                                        </div>
                                                        <span className="text-zinc-600 group-hover:text-zinc-900 transition-colors font-medium text-sm">{unit.label}</span>
                                                    </label>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Khoảng giá */}
                                    <div className="pt-6 border-t border-zinc-100">
                                        <h3 className="font-semibold text-zinc-400 mb-6 text-[11px] uppercase tracking-widest">Khoảng giá (VNĐ)</h3>
                                        <div className="relative h-1 bg-zinc-100 rounded-full">
                                            <div className="absolute h-full bg-zinc-900 rounded-full z-10" style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}></div>
                                            <input type="range" min={MIN_BOUNDARY} max={MAX_BOUNDARY} step={STEP} value={minPrice} onChange={handleMinChange} className="absolute w-full -top-1.5 h-4 appearance-none bg-transparent pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[2.5px] [&::-webkit-slider-thumb]:border-zinc-900 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-grab" />
                                            <input type="range" min={MIN_BOUNDARY} max={MAX_BOUNDARY} step={STEP} value={maxPrice} onChange={handleMaxChange} className="absolute w-full -top-1.5 h-4 appearance-none bg-transparent pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[2.5px] [&::-webkit-slider-thumb]:border-zinc-900 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-grab" />
                                        </div>
                                        <div className="flex justify-between items-center mt-6 text-xs font-semibold text-zinc-900">
                                            <div className="bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-lg text-center w-[45%] truncate">{formatPrice(minPrice)}</div>
                                            <span className="text-zinc-300">-</span>
                                            <div className="bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-lg text-center w-[45%] truncate">{formatPrice(maxPrice)}</div>
                                        </div>
                                        <button
                                            onClick={handleResetSearch}
                                            className="w-full mt-8 bg-zinc-900 text-white font-semibold py-3 rounded-lg hover:bg-zinc-800 transition-colors shadow-sm text-xs tracking-wider uppercase"
                                        >
                                            Áp Dụng
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* VÙNG NỘI DUNG CHÍNH */}
                    <div className="flex-1 transition-all duration-300 min-w-0 flex flex-col">
                        {/* Thanh công cụ Tìm kiếm */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-8">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={searchName}
                                    onChange={(e) => setSearchName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleResetSearch()}
                                    placeholder="Tìm kiếm dịch vụ..."
                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-zinc-200 shadow-sm focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 outline-none text-sm transition-all bg-white"
                                />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                            </div>

                            <button
                                onClick={handleResetSearch}
                                className="hidden sm:flex items-center justify-center gap-2 bg-zinc-900 text-white px-8 py-3.5 rounded-xl font-medium hover:bg-zinc-800 transition-colors shadow-sm text-sm"
                            >
                                <Search size={16} />
                                <span>Tìm Kiếm</span>
                            </button>
                        </div>

                        {/* LƯỚI HIỂN THỊ GÓI DỊCH VỤ */}
                        {packages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-zinc-200 shadow-sm">
                                <Search className="text-zinc-300 mb-4" size={48} />
                                <p className="text-zinc-500 font-medium text-sm">Không tìm thấy gói dịch vụ nào phù hợp.</p>
                            </div>
                        ) : (
                            <>
                                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${isFilterOpen ? 'xl:grid-cols-3' : 'xl:grid-cols-4'} gap-6 transition-all duration-300`}>
                                    {packages.map((pkg) => {
                                        const displayImage = pkg.imageUrl || pkg.image;

                                        return (
                                            <div key={pkg.id}
                                                onClick={() => handleNavigateToDetail(pkg.id)}
                                                className="bg-white rounded-xl border border-zinc-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer hover:-translate-y-1"
                                            >
                                                <div className="h-48 bg-zinc-100 flex items-center justify-center border-b border-zinc-100 relative overflow-hidden">
                                                    {displayImage ? (
                                                        <img
                                                            src={displayImage}
                                                            alt={pkg.name}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 z-10 relative"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-zinc-900 flex items-center justify-center relative overflow-hidden">
                                                            <ShieldCheck size={48} className="text-zinc-700 group-hover:scale-110 group-hover:text-amber-500 transition-all duration-500 z-10" />
                                                            <div className="absolute -right-8 -top-8 w-32 h-32 bg-zinc-800/50 rounded-full blur-2xl"></div>
                                                            <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-zinc-800/50 rounded-full blur-2xl"></div>
                                                        </div>
                                                    )}
                                                    {/* Badge */}
                                                    {/* <div className="absolute top-4 right-4 bg-zinc-900/95 backdrop-blur-sm text-amber-500 text-[10px] font-bold px-3 py-1.5 rounded-sm uppercase tracking-widest z-20 shadow-sm">
                                                        Premium
                                                    </div> */}
                                                </div>

                                                <div className="p-5 flex flex-col flex-1">
                                                    <h3 className="text-lg font-bold text-zinc-900 leading-snug mb-2 group-hover:text-amber-600 transition-colors line-clamp-2">{pkg.name}</h3>
                                                    <p className="text-sm text-zinc-500 mb-6 line-clamp-2 leading-relaxed font-light">{pkg.description || "Gói dịch vụ bảo dưỡng cao cấp giúp tối ưu hiệu suất và duy trì độ bền cho xế yêu."}</p>

                                                    <div className="mt-auto grid grid-cols-2 gap-3 mb-6">
                                                        <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 bg-zinc-50 border border-zinc-100 px-3 py-2.5 rounded-lg">
                                                            <Clock size={14} className="text-zinc-400 flex-shrink-0" />
                                                            <span className="truncate">{pkg.duration || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 bg-zinc-50 border border-zinc-100 px-3 py-2.5 rounded-lg">
                                                            <Repeat size={14} className="text-zinc-400 flex-shrink-0" />
                                                            <span className="truncate">{pkg.usageTimes || 0} Lần</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-end justify-between pt-5 border-t border-zinc-100">
                                                        <div>
                                                            <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-1.5 font-medium">Giá trọn gói</p>
                                                            <span className="text-xl font-bold text-red-600">{formatPrice(pkg.price)}</span>
                                                        </div>
                                                        <button className="bg-white border border-zinc-200 text-zinc-900 p-2.5 rounded-lg group-hover:bg-zinc-900 group-hover:border-zinc-900 group-hover:text-white transition-all shadow-sm">
                                                            <ChevronRight size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
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