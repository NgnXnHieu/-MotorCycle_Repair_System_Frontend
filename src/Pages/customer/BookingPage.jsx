import React, { useState, useRef, useEffect } from 'react';
import {
    MapPin, User, Phone, Car, CalendarDays,
    Clock, CheckCircle2, AlertCircle, Wand2, PlusCircle,
    ChevronLeft, ChevronRight, Map, X, Loader2
} from 'lucide-react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { branchApi } from '../../api/branchApi';
import { customerApi } from '../../api/customerApi';
import { dailyShiftApi } from '../../api/dailyShiftApi';
import { appointmentApi } from '../../api/appointmentApi';

export default function BookingPage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [formData, setFormData] = useState({ fullName: '', phone: '', licensePlate: '', brand: '', model: '' });
    const [selectedDate, setSelectedDate] = useState(0);
    const [selectedShift, setSelectedShift] = useState(null);

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();
    const branchId = searchParams.get('branchId');

    const [currentBranch, setCurrentBranch] = useState(null);
    const [isBranchLoading, setIsBranchLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [branchList, setBranchList] = useState([]);
    const [isListLoading, setIsListLoading] = useState(false);

    const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
    const [vehicleList, setVehicleList] = useState([]);
    const [isVehicleLoading, setIsVehicleLoading] = useState(false);

    const [shifts, setShifts] = useState([]);
    const [isShiftsLoading, setIsShiftsLoading] = useState(false);

    // State quản lý việc hiển thị Form Xác nhận trước khi gọi API
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const [bookingStatus, setBookingStatus] = useState({
        isOpen: false,
        type: '', // 'success' hoặc 'error'
        message: ''
    });

    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        const vehicle = location.state?.vehicle;
        if (vehicle) {
            setFormData(prev => ({
                ...prev,
                licensePlate: vehicle.licensePlate || "",
                brand: vehicle.brand || "",
                model: vehicle.model || ""
            }));
        }
    }, [])

    useEffect(() => {
        const fetchInitialBranch = async () => {
            if (branchId) {
                setIsBranchLoading(true);
                try {
                    const response = await branchApi.getById(branchId);
                    const data = response.data || response;
                    setCurrentBranch(data);
                } catch (error) {
                    console.error("Lỗi khi tải thông tin cơ sở:", error);
                } finally {
                    setIsBranchLoading(false);
                }
            } else {
                setCurrentBranch(null);
            }
        };

        fetchInitialBranch();
    }, [branchId]);

    const handleOpenModal = async () => {
        setIsModalOpen(true);
        setIsListLoading(true);
        try {
            const response = await branchApi.getAllBranch(0, 50);
            const data = response.data || response;
            setBranchList(data.content || []);
        } catch (error) {
            console.error("Lỗi khi tải danh sách cơ sở:", error);
        } finally {
            setIsListLoading(false);
        }
    };

    const handleSelectBranch = (branch) => {
        setCurrentBranch(branch);
        setIsModalOpen(false);
        setSearchParams({ branchId: branch.id });
    };

    const handleOpenVehicleModal = async () => {
        setIsVehicleModalOpen(true);
        setIsVehicleLoading(true);
        try {
            const response = await customerApi.getMyVehicles();
            const data = response.data || response;
            setVehicleList(data.content || []);
        } catch (error) {
            console.error("Lỗi khi tải danh sách xe:", error);
        } finally {
            setIsVehicleLoading(false);
        }
    };

    const handleSelectVehicle = (vehicle) => {
        setFormData(prev => ({
            ...prev,
            licensePlate: vehicle.licensePlate || "",
            brand: vehicle.brand || "",
            model: vehicle.model || ""
        }));
        setIsVehicleModalOpen(false);
        if (errors.licensePlate) setErrors(prev => ({ ...prev, licensePlate: null }));
    };

    const generateDates = () => {
        const dates = [];
        const today = new Date();
        for (let i = 0; i < 29; i++) {
            const nextDate = new Date(today);
            nextDate.setDate(today.getDate() + i);
            let dayOfWeek = "";
            if (i === 0) dayOfWeek = "Hôm nay";
            else if (i === 1) dayOfWeek = "Ngày mai";
            else {
                const day = nextDate.getDay();
                dayOfWeek = day === 0 ? "Chủ Nhật" : `Thứ ${day + 1}`;
            }

            const dd = String(nextDate.getDate()).padStart(2, '0');
            const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
            const yyyy = nextDate.getFullYear();

            dates.push({
                index: i,
                dayOfWeek: dayOfWeek,
                dateStr: `${nextDate.getDate()}/${nextDate.getMonth() + 1}`,
                fullDateApi: `${dd}/${mm}/${yyyy}`
            });
        }
        return dates;
    };
    const availableDates = generateDates();

    useEffect(() => {
        const fetchShifts = async () => {
            if (!currentBranch) {
                setShifts([]);
                return;
            }

            setIsShiftsLoading(true);
            try {
                const payload = {
                    date: availableDates[selectedDate].fullDateApi,
                    branch_id: currentBranch.id
                };

                const response = await dailyShiftApi.getTodayShift(payload);
                const data = response.data || response;

                setShifts(Array.isArray(data) ? data : []);
                setSelectedShift(null);
            } catch (error) {
                console.error("Lỗi khi tải danh sách ca:", error);
                setShifts([]);
            } finally {
                setIsShiftsLoading(false);
            }
        };

        fetchShifts();
    }, [selectedDate, currentBranch]);

    const formatTime = (timeStr) => timeStr ? timeStr.slice(0, 5) : "";

    const scrollRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = (e) => { setIsDragging(true); setStartX(e.pageX - scrollRef.current.offsetLeft); setScrollLeft(scrollRef.current.scrollLeft); };
    const handleMouseLeave = () => setIsDragging(false);
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e) => {
        if (!isDragging) return; e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft; const walk = (x - startX) * 2;
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };
    const scroll = (scrollOffset) => { if (scrollRef.current) scrollRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' }); };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleAutoFillUser = async () => {
        try {
            const response = await customerApi.getProfile();
            setCurrentUser(response);
            setFormData(prev => ({
                ...prev,
                fullName: response?.full_name || "",
                phone: response?.phone || ""
            }));
            setErrors(prev => ({ ...prev, fullName: null, phone: null }));
        } catch (error) {
            console.error("Lỗi khi lấy thông tin user:", error);
        }
    };

    // HÀM PHA 1: Chỉ kiểm tra form và hiển thị Modal Xác nhận
    const handleRequestSubmit = (e) => {
        e.preventDefault();

        if (!currentBranch || !selectedShift) {
            setBookingStatus({ isOpen: true, type: 'error', message: "Vui lòng chọn cơ sở và thời gian tiếp nhận!" });
            return;
        }

        if (!validateForm()) {
            window.scrollTo({ top: 300, behavior: 'smooth' });
            return;
        }

        // Nếu mọi thông tin đều chuẩn chỉ -> Bật Modal Hỏi Xác Nhận
        setShowConfirmModal(true);
    };

    // HÀM PHA 2: Chạy khi người dùng bấm "Đồng ý" trên Modal Xác nhận
    const executeBooking = async () => {
        setShowConfirmModal(false); // 1. Tắt modal xác nhận đi
        setIsSubmitting(true);      // 2. Bật cờ loading báo đang gọi API

        try {
            const payload = {
                dailyShiftCapacity_id: selectedShift,
                bringerName: formData.fullName.trim(),
                bringerPhone: formData.phone.trim(),
                plateNumber: formData.licensePlate.trim(),
                brand: formData.brand.trim() || null,
                model: formData.model.trim() || null,
            };

            await appointmentApi.createBooking(payload);

            // Gọi API Spring Boot thành công -> Bật Modal Success
            setBookingStatus({
                isOpen: true,
                type: 'success',
                message: "Đã đặt lịch thành công! Cảm ơn bạn đã tin tưởng sử dụng dịch vụ."
            });

        } catch (error) {
            console.error("Lỗi đặt lịch:", error);
            const errorMessage = error.response?.data?.message || "Có lỗi xảy ra khi kết nối đến máy chủ. Vui lòng thử lại.";
            setBookingStatus({ isOpen: true, type: 'error', message: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = "Tên không được để trống";
        }

        if (!formData.phone.trim()) {
            newErrors.phone = "Số điện thoại không được để trống";
        } else if (!/^[0-9]{10,}$/.test(formData.phone)) {
            newErrors.phone = "Số điện thoại phải có ít nhất 10 chữ số (chỉ chứa số)";
        }

        if (!formData.licensePlate.trim()) {
            newErrors.licensePlate = "Biển số xe không được để trống";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    return (
        <div className="w-full min-h-screen bg-slate-50 font-sans antialiased pb-20 relative">
            <style>{` .hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } `}</style>

            <div className="relative w-full h-[200px] sm:h-[250px] bg-slate-900 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1625047509168-a7026f36de04?q=80&w=2070&auto=format&fit=crop" alt="Booking" className="w-full h-full object-cover opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full p-6 sm:p-10 max-w-7xl mx-auto">
                    {/* <span className="px-3 py-1 bg-indigo-600/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest rounded-lg mb-3 inline-block shadow-sm">Bước 2 / 3</span> */}
                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight drop-shadow-md">Đặt lịch bảo dưỡng</h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 sm:mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

                    {/* CỘT TRÁI: FORM NHẬP LIỆU */}
                    <div className="lg:col-span-5 flex flex-col gap-6">

                        {/* --- BOX CƠ SỞ --- */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <MapPin className="text-indigo-600" size={20} /> Cơ sở thực hiện
                                </h3>
                                <button
                                    onClick={handleOpenModal}
                                    type="button"
                                    className="cursor-pointer text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors active:scale-95"
                                >
                                    {currentBranch ? "Thay đổi cơ sở" : "Chọn cơ sở"}
                                </button>
                            </div>

                            {isBranchLoading ? (
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                                    <Loader2 className="animate-spin text-indigo-600" size={20} />
                                    <span className="text-sm font-medium text-slate-500">Đang tải dữ liệu cơ sở...</span>
                                </div>
                            ) : currentBranch ? (
                                <div className="flex items-start gap-3 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                    <div className="mt-0.5 p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Map size={18} /></div>
                                    <div>
                                        <h3 className="text-base font-bold text-indigo-900 leading-tight mb-1">{currentBranch.name}</h3>
                                        <p className="text-sm font-medium text-indigo-700/70">{currentBranch.address}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-6 bg-amber-50 rounded-xl border border-amber-200 border-dashed text-center">
                                    <MapPin size={32} className="text-amber-400 mb-2" />
                                    <p className="text-sm font-bold text-amber-700">Chưa chọn cơ sở nào</p>
                                    <p className="text-xs text-amber-600/70 mt-1">Vui lòng chọn trung tâm để tiếp tục đặt lịch</p>
                                </div>
                            )}
                        </div>

                        {/* --- FORM LIÊN HỆ CÓ VALIDATION --- */}
                        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><User className="text-indigo-600" size={20} /> Liên hệ</h3>
                                <button onClick={handleAutoFillUser} type="button" className="cursor-pointer flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors active:scale-95">
                                    <Wand2 size={14} /> Dùng thông tin của tôi
                                </button>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                        Họ và tên <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text" name="fullName" value={formData.fullName || ""}
                                        onChange={handleInputChange} placeholder="Nhập họ và tên"
                                        className={`w-full bg-slate-50 border text-slate-900 font-semibold text-sm rounded-xl px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 transition-all ${errors.fullName ? 'border-red-400 focus:ring-red-400 bg-red-50/30' : 'border-slate-200 focus:ring-indigo-500'}`}
                                    />
                                    {errors.fullName && <p className="text-red-500 text-xs font-medium mt-1.5 flex items-center gap-1"><AlertCircle size={12} /> {errors.fullName}</p>}
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                        Số điện thoại <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel" name="phone" value={formData.phone || ""}
                                        onChange={handleInputChange} placeholder="Nhập số điện thoại"
                                        className={`w-full bg-slate-50 border text-slate-900 font-semibold text-sm rounded-xl px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 transition-all ${errors.phone ? 'border-red-400 focus:ring-red-400 bg-red-50/30' : 'border-slate-200 focus:ring-indigo-500'}`}
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs font-medium mt-1.5 flex items-center gap-1"><AlertCircle size={12} /> {errors.phone}</p>}
                                </div>
                            </div>
                        </div>

                        {/* --- FORM PHƯƠNG TIỆN CÓ VALIDATION --- */}
                        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Car className="text-indigo-600" size={20} /> Phương tiện</h3>
                                <button
                                    onClick={handleOpenVehicleModal}
                                    type="button"
                                    className="cursor-pointer flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors active:scale-95"
                                >
                                    <PlusCircle size={14} /> Chọn xe có sẵn
                                </button>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                        Biển số xe <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text" name="licensePlate" value={formData.licensePlate || ""}
                                        onChange={handleInputChange} placeholder="VD: 29A-123.45"
                                        className={`w-full bg-slate-50 border text-slate-900 font-bold text-sm rounded-xl px-4 py-3 uppercase focus:bg-white focus:outline-none focus:ring-2 transition-all ${errors.licensePlate ? 'border-red-400 focus:ring-red-400 bg-red-50/30' : 'border-slate-200 focus:ring-indigo-500'}`}
                                    />
                                    {errors.licensePlate && <p className="text-red-500 text-xs font-medium mt-1.5 flex items-center gap-1"><AlertCircle size={12} /> {errors.licensePlate}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Hãng xe</label>
                                        <input type="text" name="brand" value={formData.brand || ""} onChange={handleInputChange} placeholder="VD: Honda" className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-semibold text-sm rounded-xl px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Dòng xe</label>
                                        <input type="text" name="model" value={formData.model || ""} onChange={handleInputChange} placeholder="VD: Air Blade" className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-semibold text-sm rounded-xl px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CỘT PHẢI: CHỌN GIỜ & SUBMIT */}
                    <div className="lg:col-span-7 flex flex-col gap-6 lg:sticky lg:top-6">
                        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                                <CalendarDays className="text-indigo-600" size={20} />
                                Thời gian tiếp nhận
                            </h3>
                            <div className="relative flex items-center gap-2 mb-6 group">
                                <button onClick={() => scroll(-300)} className="cursor-pointer hidden sm:flex absolute -left-4 z-10 w-10 h-10 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-600 shadow-md hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100">
                                    <ChevronLeft size={20} />
                                </button>
                                <div ref={scrollRef} onMouseDown={handleMouseDown} onMouseLeave={handleMouseLeave} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove} className={`flex gap-3 overflow-x-auto hide-scrollbar py-2 w-full select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}>
                                    {availableDates.map((d) => (
                                        <button key={d.index} onClick={() => { setSelectedDate(d.index); setSelectedShift(null); }} className={`cursor-pointer flex-none w-[85px] py-3.5 flex flex-col items-center justify-center rounded-2xl border transition-all ${selectedDate === d.index ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}>
                                            <span className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${selectedDate === d.index ? 'text-indigo-100' : 'text-slate-400'}`}>{d.dayOfWeek}</span>
                                            <span className="text-lg font-bold tracking-tight">{d.dateStr}</span>
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => scroll(300)} className="cursor-pointer hidden sm:flex absolute -right-4 z-10 w-10 h-10 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-600 shadow-md hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100">
                                    <ChevronRight size={20} />
                                </button>
                            </div>

                            {/* --- LƯỚI CHỌN CA --- */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Các ca còn trống</h4>
                                    {!currentBranch && (
                                        <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                                            Vui lòng chọn cơ sở
                                        </span>
                                    )}
                                </div>

                                {isShiftsLoading ? (
                                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                                        <Loader2 className="animate-spin text-indigo-500" size={28} />
                                        <span className="text-sm font-medium text-slate-500">Đang tải danh sách ca...</span>
                                    </div>
                                ) : !currentBranch ? (
                                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                                        <p className="text-sm font-medium text-slate-400">Chọn cơ sở để xem ca làm việc của ngày này.</p>
                                    </div>
                                ) : shifts.length === 0 ? (
                                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                                        <p className="text-sm font-medium text-slate-400">Không có ca làm việc nào cho ngày này.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {shifts.map((shift) => {
                                            const isFull = shift.currentBook >= shift.maxCapacity;

                                            // --- LOGIC KIỂM TRA ĐÓNG CA (Sát 45 phút) ---
                                            let isClosedByTime = false;
                                            // Nếu đang chọn "Hôm nay" (index 0)
                                            if (selectedDate === 0) {
                                                const now = new Date();
                                                const [endH, endM] = shift.endTime.split(':').map(Number);

                                                // Tạo object ngày ứng với thời gian kết thúc ca
                                                const shiftEndTimeObj = new Date();
                                                shiftEndTimeObj.setHours(endH, endM, 0, 0);

                                                // Tính thời điểm chốt (Trừ đi 45 phút)
                                                const cutoffTimeObj = new Date(shiftEndTimeObj.getTime() - 45 * 60000);

                                                // Nếu giờ hiện tại đã vượt qua giờ chốt -> Khóa ca
                                                if (now >= cutoffTimeObj) {
                                                    isClosedByTime = true;
                                                }
                                            }

                                            const isDisabled = isFull || isClosedByTime;
                                            const isSelected = selectedShift === shift.id;
                                            const timeString = `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`;

                                            return (
                                                <button
                                                    key={shift.id}
                                                    disabled={isDisabled}
                                                    onClick={() => setSelectedShift(shift.id)}
                                                    className={`relative flex flex-col p-4 rounded-xl border text-left transition-all cursor-pointer disabled:cursor-not-allowed ${isDisabled
                                                        ? 'bg-slate-50 border-slate-200 opacity-60'
                                                        : isSelected
                                                            ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 shadow-sm'
                                                            : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                                                        }`}
                                                >
                                                    {isSelected && <div className="absolute top-2 right-2 text-indigo-600"><CheckCircle2 size={16} /></div>}
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{shift.shiftName}</span>
                                                    <div className={`flex items-center gap-1.5 text-sm font-bold mb-1.5 ${isSelected ? 'text-indigo-700' : 'text-slate-800'}`}>
                                                        <Clock size={14} /> {timeString}
                                                    </div>

                                                    {/* Chữ hiển thị thay đổi tùy theo lý do khóa */}
                                                    <div className={`text-xs font-semibold ${isClosedByTime ? 'text-slate-500' : isFull ? 'text-red-500' : isSelected ? 'text-indigo-600' : 'text-emerald-600'}`}>
                                                        {isClosedByTime ? 'Đã đóng ca' : isFull ? 'Đã hết chỗ' : `Còn ${shift.maxCapacity - shift.currentBook} chỗ trống`}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* --- NÚT HOÀN TẤT --- */}
                        <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-slate-800">
                            <div className="text-left w-full sm:w-auto">
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Xác nhận lịch hẹn</p>
                                {selectedShift ? (
                                    <p className="text-white font-bold flex items-center gap-2">
                                        <CalendarDays size={18} className="text-emerald-400" />
                                        {availableDates[selectedDate].dateStr} <span className="text-slate-600">|</span>
                                        {(() => {
                                            const s = shifts.find(s => s.id === selectedShift);
                                            return s ? `${formatTime(s.startTime)} - ${formatTime(s.endTime)}` : "";
                                        })()}
                                    </p>
                                ) : (
                                    <p className="text-amber-400 text-sm font-medium flex items-center gap-1.5"><AlertCircle size={16} /> Vui lòng chọn thời gian</p>
                                )}
                            </div>
                            <button
                                onClick={handleRequestSubmit}
                                disabled={!selectedShift || !currentBranch || isSubmitting}
                                className="flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed w-full sm:w-auto bg-emerald-500 text-white font-bold text-sm px-8 py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:bg-emerald-600 active:scale-95 disabled:bg-slate-700 disabled:text-slate-500 disabled:shadow-none"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="animate-spin" size={18} /> ĐANG XỬ LÝ...</>
                                ) : (
                                    "HOÀN TẤT ĐẶT LỊCH"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODAL CHỌN CƠ SỞ --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <MapPin className="text-indigo-600" /> Chọn trung tâm dịch vụ
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="cursor-pointer p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto">
                            {isListLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                                    <p className="text-slate-500 font-medium">Đang tải danh sách...</p>
                                </div>
                            ) : branchList.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">Không tìm thấy cơ sở nào.</div>
                            ) : (
                                <div className="grid gap-3">
                                    {branchList.map((branch) => (
                                        <div
                                            key={branch.id}
                                            onClick={() => handleSelectBranch(branch)}
                                            className={`cursor-pointer group p-4 rounded-xl border transition-all ${currentBranch?.id === branch.id
                                                ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500'
                                                : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{branch.name}</h4>
                                                    <p className="text-sm text-slate-500 mt-1">{branch.address}</p>
                                                </div>
                                                {currentBranch?.id === branch.id && (
                                                    <CheckCircle2 className="text-indigo-600" size={20} />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL CHỌN XE --- */}
            {isVehicleModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsVehicleModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Car className="text-indigo-600" /> Chọn phương tiện của bạn
                            </h2>
                            <button onClick={() => setIsVehicleModalOpen(false)} className="cursor-pointer p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-5 overflow-y-auto bg-slate-50/30">
                            {isVehicleLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                                    <p className="text-slate-500 font-medium">Đang tải danh sách phương tiện...</p>
                                </div>
                            ) : vehicleList.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <Car className="mx-auto mb-3 text-slate-300" size={48} />
                                    <p className="font-medium text-slate-600">Bạn chưa có xe nào được lưu trong hệ thống.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {vehicleList.map((vehicle) => (
                                        <div
                                            key={vehicle.id}
                                            onClick={() => handleSelectVehicle(vehicle)}
                                            className="cursor-pointer group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-indigo-500 hover:shadow-lg transition-all duration-300 active:scale-[0.98]"
                                        >
                                            <div className="h-40 bg-slate-100 relative overflow-hidden">
                                                <img
                                                    src={vehicle.iamge || vehicle.image || "https://via.placeholder.com/400x200?text=No+Image"}
                                                    alt={vehicle.model}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                                    Chọn xe này
                                                </div>
                                            </div>
                                            <div className="p-4 flex-1 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h4 className="font-bold text-slate-900 text-lg uppercase tracking-tight">
                                                            {vehicle.licensePlate}
                                                        </h4>
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-500">
                                                        {vehicle.brand} • {vehicle.model}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* --- MODAL THÔNG BÁO TRẠNG THÁI ĐẶT LỊCH --- */}
            {bookingStatus.isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl z-10 p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200">

                        {/* Icon trạng thái */}
                        <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-5 shadow-inner ${bookingStatus.type === 'success' ? 'bg-emerald-100 text-emerald-500' : 'bg-red-100 text-red-500'}`}>
                            {bookingStatus.type === 'success' ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
                        </div>

                        {/* Tiêu đề */}
                        <h3 className={`text-2xl font-black mb-3 tracking-tight ${bookingStatus.type === 'success' ? 'text-slate-900' : 'text-red-600'}`}>
                            {bookingStatus.type === 'success' ? 'Thành công!' : 'Đặt lịch thất bại'}
                        </h3>

                        {/* Lời nhắn */}
                        <p className="text-slate-500 font-medium mb-8 leading-relaxed text-sm">
                            {bookingStatus.message}
                        </p>

                        {/* Nút hành động */}
                        <button
                            onClick={() => {
                                setBookingStatus({ ...bookingStatus, isOpen: false });
                                // Nếu thành công thì chuyển trang, nếu lỗi thì chỉ đóng modal để sửa lại form
                                if (bookingStatus.type === 'success') {
                                    navigate('/myAppointmentHistory');
                                }
                            }}
                            className={`w-full py-4 rounded-xl font-bold text-white transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 ${bookingStatus.type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/30'}`}
                        >
                            {bookingStatus.type === 'success' ? 'Xem lịch hẹn của tôi' : 'Quay lại chỉnh sửa'}
                        </button>
                    </div>
                </div>
            )}
            {/* Form xác nhận đặt */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl z-10 p-6 sm:p-8 animate-in zoom-in-95 duration-200">

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                                <CalendarDays size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Xác nhận lịch hẹn</h3>
                                <p className="text-slate-500 text-sm font-medium">Kiểm tra kỹ thông tin trước khi gửi.</p>
                            </div>
                        </div>

                        {/* Tóm tắt nhanh thông tin để khách kiểm tra */}
                        <div className="bg-slate-50 rounded-xl p-4 mb-8 space-y-3 border border-slate-100">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Khách hàng:</span>
                                <span className="font-bold text-slate-900">{formData.fullName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Xe:</span>
                                <span className="font-bold text-slate-900">{formData.licensePlate}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Thời gian:</span>
                                <span className="font-bold text-indigo-600">
                                    {(() => {
                                        const s = shifts.find(s => s.id === selectedShift);
                                        return s ? `${availableDates[selectedDate].dateStr} | ${s.startTime.slice(0, 5)}` : "";
                                    })()}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)} // Nút Hủy
                                className="flex-1 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                Quay lại
                            </button>
                            <button
                                onClick={executeBooking} // Nút Đồng ý -> Gọi hàm Pha 2
                                className="flex-1 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 flex justify-center items-center gap-2"
                            >
                                Đồng ý đặt lịch
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}