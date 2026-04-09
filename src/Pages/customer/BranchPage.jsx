import React, { useState, useEffect } from 'react';
import {
    MapPin, Navigation, Clock, ShieldCheck,
    Wrench, CheckCircle2, ChevronDown, Search, Phone, Loader2, Image as ImageIcon
} from 'lucide-react';
import { branchApi } from '../../api/branchApi'; // Trỏ đúng đường dẫn file API của bạn
import Pagination from '../../components/common/Pagination';
import { useNavigate } from 'react-router-dom';

export default function BranchPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [branches, setBranches] = useState([]);
    const navigate = useNavigate();

    // States quản lý UI và Phân trang
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // HÀM FETCH DATA TỪ API
    const fetchBranches = async () => {
        setIsLoading(true);
        try {
            const response = await branchApi.getAllBranch(currentPage, 5); // Lấy 5 item / trang
            const data = response.data || response;

            if (data && data.content) {
                // Map dữ liệu từ API thành format UI cần dùng
                const mappedBranches = data.content.map(item => ({
                    id: item.id,
                    name: item.name,
                    address: item.address,
                    hotline: item.hotline,
                    dbStatus: item.status,
                    mapUrl: item.mapUrl,
                    imageUrl: item.imageUrl // Lấy thêm imageUrl từ API
                }));

                setBranches(mappedBranches);
                setTotalPages(data.page.totalPages);

                // Mặc định focus vào thẻ đầu tiên nếu chưa chọn
                if (mappedBranches.length > 0 && !selectedBranch) {
                    setSelectedBranch(mappedBranches[0].id);
                }
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách cơ sở:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Gọi API khi load trang hoặc khi currentPage thay đổi
    useEffect(() => {
        fetchBranches();
        window.scrollTo({ top: 350, behavior: 'smooth' });
    }, [currentPage]);

    // HÀM XỬ LÝ LOGIC TRẠNG THÁI (Đóng/Mở/Tạm Dừng)
    const getBranchStatusInfo = (dbStatus) => {
        if (dbStatus === false) {
            return {
                label: "Tạm dừng hoạt động",
                badgeClass: "bg-red-50 text-red-600 border-red-200",
                dotClass: "bg-red-500",
                allowBooking: true
            };
        }

        const currentHour = new Date().getHours();
        const isOpenHours = currentHour >= 7 && currentHour < 17;

        if (isOpenHours) {
            return {
                label: "Đang mở cửa",
                badgeClass: "bg-emerald-50 text-emerald-600 border-emerald-200",
                dotClass: "bg-emerald-500 animate-pulse",
                allowBooking: true
            };
        } else {
            return {
                label: "Đóng cửa (Ngoài giờ)",
                badgeClass: "bg-amber-50 text-amber-600 border-amber-200",
                dotClass: "bg-amber-500",
                allowBooking: true
            };
        }
    };

    const handleBookingClick = (branchId) => {
        navigate(`/bookingPage?branchId=${branchId}`);
    };

    const activeMapUrl = branches.find(b => b.id === selectedBranch)?.mapUrl;

    return (
        <div className="w-full min-h-screen bg-slate-50 font-sans antialiased pb-20">

            {/* --- HERO BANNER --- */}
            <div className="relative w-full h-[280px] sm:h-[350px] bg-slate-900 overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1613214149922-f1809c99b414?q=80&w=2070&auto=format&fit=crop"
                    alt="Workshop"
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full p-6 sm:p-10 max-w-7xl mx-auto">
                    <span className="px-3 py-1 bg-indigo-600/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest rounded-lg mb-3 inline-block shadow-sm">
                        Bước 1 / 3
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight drop-shadow-md">Chọn cơ sở dịch vụ</h1>
                    <p className="text-slate-300 mt-2 font-medium max-w-xl text-sm sm:text-base">
                        Hệ thống trung tâm chăm sóc xe. Vui lòng chọn cơ sở thuận tiện nhất cho bạn.
                    </p>
                </div>
            </div>

            {/* --- MAIN LAYOUT --- */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start relative">

                    {/* --- CỘT TRÁI: Danh sách (Chiếm 5 cột) --- */}
                    <div className="lg:col-span-5 flex flex-col gap-6">

                        {/* Bộ lọc */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1 group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                    <Search size={18} />
                                </div>
                                <select className="w-full appearance-none bg-white border border-slate-200 text-slate-700 font-bold py-3 pl-10 pr-10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer">
                                    <option value="">Tất cả Quận/Huyện</option>
                                    <option value="caugiay">Quận Cầu Giấy</option>
                                    <option value="haibatrung">Quận Hai Bà Trưng</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                                    <ChevronDown size={18} />
                                </div>
                            </div>
                        </div>

                        {/* Loading State hoặc Danh sách Cards */}
                        <div className="flex flex-col gap-5 min-h-[500px]">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-40">
                                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                                </div>
                            ) : branches.length === 0 ? (
                                <div className="text-center py-10 text-slate-500 font-medium bg-white rounded-2xl border border-slate-200 shadow-sm">
                                    Không tìm thấy cơ sở nào.
                                </div>
                            ) : (
                                branches.map((branch) => {
                                    const statusInfo = getBranchStatusInfo(branch.dbStatus);

                                    return (
                                        <div
                                            key={branch.id}
                                            onClick={() => setSelectedBranch(branch.id)}
                                            className={`group cursor-pointer bg-white p-4 rounded-2xl border transition-all duration-300 ease-in-out ${selectedBranch === branch.id
                                                ? 'border-indigo-600 ring-2 ring-indigo-600/20 shadow-md'
                                                : 'border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1'
                                                }`}
                                        >
                                            <div className="flex flex-col sm:flex-row gap-4">

                                                {/* --- THÊM PHẦN HÌNH ẢNH Ở ĐÂY --- */}
                                                <div className="w-full sm:w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 relative">
                                                    {branch.imageUrl ? (
                                                        <img
                                                            src={branch.imageUrl}
                                                            alt={branch.name}
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                            onError={(e) => {
                                                                // Fallback nếu link ảnh bị lỗi
                                                                e.target.onerror = null;
                                                                e.target.src = "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=300";
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                                            <ImageIcon size={24} className="mb-1 opacity-50" />
                                                            <span className="text-[10px] uppercase font-bold tracking-wider">No Image</span>
                                                        </div>
                                                    )}
                                                    {/* Lớp overlay mờ khi được chọn */}
                                                    {selectedBranch === branch.id && (
                                                        <div className="absolute inset-0 bg-indigo-600/10 mix-blend-multiply"></div>
                                                    )}
                                                </div>

                                                {/* --- PHẦN THÔNG TIN --- */}
                                                <div className="flex-1 flex flex-col justify-between">
                                                    <div>
                                                        <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-tight mb-1 uppercase group-hover:text-indigo-600 transition-colors">
                                                            {branch.name}
                                                        </h3>
                                                        <p className="text-sm font-medium text-slate-500 leading-snug flex items-start gap-1.5 mb-2.5">
                                                            <MapPin size={16} className="flex-shrink-0 mt-0.5 text-slate-400" />
                                                            <span className="line-clamp-2">{branch.address}</span>
                                                        </p>

                                                        {/* Badge Trạng thái & Hotline */}
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm ${statusInfo.badgeClass}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`}></span>
                                                                {statusInfo.label}
                                                            </span>

                                                            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                                                                <Phone size={10} className="text-indigo-500" /> {branch.hotline}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Nút Chọn (sẽ trượt xuống khi active thẻ) */}
                                                    <div className={`mt-3 transition-all duration-300 overflow-hidden ${selectedBranch === branch.id ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // Ngăn sự kiện click lan ra ngoài thẻ div cha
                                                                handleBookingClick(branch.id);
                                                            }}
                                                            disabled={!statusInfo.allowBooking}
                                                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-600/20 disabled:bg-slate-300 disabled:shadow-none disabled:active:scale-100"
                                                        >
                                                            Đặt lịch bảo dưỡng <CheckCircle2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Phân trang */}
                        {!isLoading && totalPages > 1 && (
                            <div className="border-t border-slate-200 pt-4">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        )}
                    </div>

                    {/* --- CỘT PHẢI: BẢN ĐỒ CỐ ĐỊNH --- */}
                    <div className="lg:col-span-7 sticky top-6 h-[500px] lg:h-[calc(100vh-3rem)] z-10 hidden lg:block">
                        <div className="w-full h-full bg-slate-200 rounded-3xl overflow-hidden border border-slate-200 shadow-xl relative group">
                            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.05)] z-10"></div>

                            <div className="absolute top-5 left-5 right-5 z-20 flex justify-between pointer-events-none">
                                <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-lg border border-slate-200 transition-all">
                                    <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <MapPin size={18} className="text-indigo-600 animate-bounce" />
                                        Bản đồ tự động ghim vị trí
                                    </p>
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 gap-3">
                                    <Loader2 className="animate-spin text-indigo-400" size={40} />
                                    <span className="font-bold tracking-wide">Đang tải bản đồ...</span>
                                </div>
                            ) : activeMapUrl ? (
                                <iframe
                                    src={activeMapUrl}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    className="w-full h-full object-cover transition-opacity duration-500"
                                    title="Bản đồ cơ sở"
                                ></iframe>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 font-bold">
                                    Chưa chọn cơ sở
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}