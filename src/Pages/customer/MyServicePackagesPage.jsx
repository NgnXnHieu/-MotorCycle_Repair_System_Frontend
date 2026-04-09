import React, { useState, useEffect } from 'react';
import {
    CalendarDays, Clock, CheckCircle2, XCircle,
    ShieldCheck, History, Wrench, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { customerPackageApi } from '../../api/customerPackageApi';
export default function MyServicePackagesPage() {
    const navigate = useNavigate();

    // --- STATES DỮ LIỆU ---
    const [myPackages, setMyPackages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- STATES BỘ LỌC VÀ PHÂN TRANG ---
    const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, ACTIVE, EXPIRED
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const size = 10; // Kích thước trang mặc định

    // Gọi API mỗi khi filterStatus hoặc page thay đổi
    useEffect(() => {
        const fetchMyPackages = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Xây dựng Payload gửi xuống Backend
                const filterForm = {
                    // Nếu là ALL thì gửi null để Backend (Specification) không lọc theo status
                    packageStatus: filterStatus === 'ALL' ? null : filterStatus,
                    page: page,
                    size: size
                };

                const response = await customerPackageApi.getFiltedAll(filterForm);
                console.log(response)

                // Bóc tách dữ liệu từ cục Page<T> của Spring Boot trả về
                const content = response.content || response.data?.content || response.data || [];
                const pageData = response.page || response.data?.page || { totalPages: 1 };

                setMyPackages(content);
                setTotalPages(pageData.totalPages || 1);

            } catch (err) {
                console.error("Lỗi tải danh sách gói dịch vụ:", err);
                setError("Không thể tải danh sách dịch vụ của bạn lúc này.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchMyPackages();
    }, [filterStatus, page]);

    // Hàm xử lý khi người dùng bấm chuyển Tab trạng thái
    const handleStatusChange = (status) => {
        setFilterStatus(status);
        setPage(0); // Rất quan trọng: Khi đổi bộ lọc phải reset về trang đầu tiên
    };

    // --- HELPER FUNCTIONS ---
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'ACTIVE':
                return (
                    <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-green-200">
                        <CheckCircle2 size={14} /> Đang kích hoạt
                    </span>
                );
            case 'EXPIRED':
                return (
                    <span className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-red-200">
                        <XCircle size={14} /> Đã hết hạn
                    </span>
                );
            default:
                return (
                    <span className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-gray-200">
                        <AlertCircle size={14} /> {status}
                    </span>
                );
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-3">
                    <Wrench className="animate-spin text-blue-600" size={32} />
                    <span className="text-gray-500 font-bold">Đang tải gói dịch vụ của bạn...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
                <p className="text-red-500 font-bold text-lg">{error}</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl">Thử lại</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-16 font-sans">
            {/* HEADER */}
            <div className="bg-white border-b border-gray-200 py-8 mb-8 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 mb-2">Gói Dịch Vụ Của Tôi</h1>
                        <p className="text-gray-500 font-medium">Quản lý và theo dõi các gói chăm sóc xe bạn đã mua.</p>
                    </div>

                    {/* TABS LỌC TRẠNG THÁI */}
                    <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
                        {['ALL', 'ACTIVE', 'EXPIRED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => handleStatusChange(status)}
                                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${filterStatus === status
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {status === 'ALL' ? 'Tất cả' : status === 'ACTIVE' ? 'Đang dùng' : 'Hết hạn'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* LƯU Ý: Đã đổi từ filteredPackages sang render thẳng myPackages vì Backend đã lọc rồi */}
                {myPackages.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <ShieldCheck size={40} className="text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa có gói dịch vụ nào</h3>
                        <p className="text-gray-500 mb-6">Bạn chưa đăng ký hoặc không có gói dịch vụ nào trong mục này.</p>
                        <button
                            onClick={() => navigate('/servicePackages')}
                            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
                        >
                            Khám phá gói dịch vụ
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {myPackages.map((cp) => {
                            const svc = cp.servicePackageDTO;
                            const isExpired = cp.status === 'EXPIRED';
                            const maxUses = svc.usageTimes;
                            const remaining = cp.remainingUses;
                            const used = maxUses - remaining;
                            const progressPercent = maxUses > 0 ? (used / maxUses) * 100 : 0;

                            return (
                                <div key={cp.id} className={`bg-white rounded-3xl border ${isExpired ? 'border-gray-200 opacity-80' : 'border-blue-100'} shadow-sm overflow-hidden flex flex-col sm:flex-row transition-all hover:shadow-md`}>

                                    {/* CỘT TRÁI: HÌNH ẢNH */}
                                    <div className={`sm:w-2/5 relative flex items-center justify-center p-4 border-b sm:border-b-0 sm:border-r border-gray-100 ${isExpired ? 'bg-gray-50' : 'bg-gradient-to-br from-blue-50 to-indigo-50'}`}>
                                        <div className="absolute top-3 left-3 z-10">
                                            {getStatusBadge(cp.status)}
                                        </div>

                                        {svc.image ? (
                                            <img
                                                src={svc.image}
                                                alt={svc.name}
                                                className={`w-full aspect-square object-cover rounded-2xl shadow-sm ${isExpired ? 'grayscale' : ''}`}
                                            />
                                        ) : (
                                            <div className="w-32 h-32 bg-white rounded-full shadow-sm flex items-center justify-center">
                                                <ShieldCheck size={48} className={isExpired ? "text-gray-300" : "text-blue-300"} />
                                            </div>
                                        )}
                                    </div>

                                    {/* CỘT PHẢI: THÔNG TIN CHI TIẾT */}
                                    <div className="sm:w-3/5 p-6 flex flex-col">
                                        <h2 className="text-xl font-black text-gray-900 mb-2 line-clamp-2">{svc.name}</h2>

                                        {/* Ngày tháng */}
                                        <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-2 border border-gray-100 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 font-medium flex items-center gap-1.5"><CalendarDays size={14} /> Ngày mua:</span>
                                                <span className="text-gray-800 font-bold">{formatDate(cp.purchaseDate)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 font-medium flex items-center gap-1.5"><Clock size={14} /> Ngày hết hạn:</span>
                                                <span className={`font-bold ${isExpired ? 'text-red-600' : 'text-gray-800'}`}>{formatDate(cp.expiryDate)}</span>
                                            </div>
                                        </div>

                                        {/* Thanh tiến trình sử dụng */}
                                        <div className="mb-6">
                                            <div className="flex justify-between text-sm mb-1.5">
                                                <span className="font-bold text-gray-700">Số lần sử dụng</span>
                                                <span className="font-black text-blue-700">{remaining} / {maxUses} lần</span>
                                            </div>
                                            <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${isExpired || remaining === 0 ? 'bg-red-600' : 'bg-blue-500'}`}
                                                    style={{ width: `${progressPercent}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-right mt-1.5 text-gray-400 font-medium">Đã dùng {used} lần</p>
                                        </div>

                                        {/* Nút hành động */}
                                        <div className="mt-auto flex gap-3">
                                            {/* Nút Xem lịch sử - Luôn hiện */}
                                            <button
                                                onClick={() => console.log("Xem lịch sử gói", cp.id)}
                                                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 hover:bg-gray-200 transition-colors"
                                            >
                                                <History size={16} /> Lịch sử
                                            </button>

                                            {/* Nút Đặt lịch - Chỉ hiện khi còn Active và còn số lần */}
                                            {!isExpired && remaining > 0 && (
                                                <button
                                                    onClick={() => navigate('/booking')}
                                                    className="flex-[1.5] px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 hover:bg-blue-700 shadow-md shadow-blue-200 transition-colors"
                                                >
                                                    <CalendarDays size={16} /> Đặt lịch
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}