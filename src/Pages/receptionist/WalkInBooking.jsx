import React, { useState, useRef, useEffect } from 'react';
import {
    MapPin, User, Phone, Car, CalendarDays,
    Clock, CheckCircle2, AlertCircle,
    ChevronLeft, ChevronRight, Map, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { branchApi } from '../../api/branchApi';
import { dailyShiftApi } from '../../api/dailyShiftApi';
import { appointmentApi } from '../../api/appointmentApi';


export default function WalkInBooking() {
    const [formData, setFormData] = useState({ fullName: '', phone: '', licensePlate: '', brand: '', model: '' });
    const [selectedDate, setSelectedDate] = useState(0);
    const [selectedShift, setSelectedShift] = useState(null);

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [currentBranch, setCurrentBranch] = useState(null);
    const [isBranchLoading, setIsBranchLoading] = useState(true);

    const [shifts, setShifts] = useState([]);
    const [isShiftsLoading, setIsShiftsLoading] = useState(false);

    const navigate = useNavigate();

    // 1. LẤY THÔNG TIN CHI NHÁNH CỦA NHÂN VIÊN HIỆN TẠI
    useEffect(() => {
        const fetchMyBranch = async () => {
            setIsBranchLoading(true);
            try {
                // Gọi API getMyBranch như bạn cung cấp
                const response = await branchApi.getMyBranch();
                const data = response.data || response;
                setCurrentBranch(data);
            } catch (error) {
                console.error("Lỗi khi tải thông tin cơ sở của nhân viên:", error);
                console.log(error.response)
            } finally {
                setIsBranchLoading(false);
            }
        };

        fetchMyBranch();
    }, []);

    // 2. TẠO DANH SÁCH NGÀY
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

    // 3. LẤY DANH SÁCH CA TRỐNG
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

    // Xử lý scroll mượt cho danh sách ngày
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

    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = "Tên khách hàng không được để trống";
        }

        if (!formData.phone.trim()) {
            newErrors.phone = "Số điện thoại không được để trống";
        } else if (!/^[0-9]{10,}$/.test(formData.phone)) {
            newErrors.phone = "Số điện thoại phải có ít nhất 10 chữ số hợp lệ";
        }

        if (!formData.licensePlate.trim()) {
            newErrors.licensePlate = "Biển số xe không được để trống";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!currentBranch || !selectedShift) {
            alert("Vui lòng đảm bảo đã chọn thời gian tiếp nhận!");
            return;
        }

        if (!validateForm()) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setIsSubmitting(true);

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

            // Có thể dùng thư viện Swal để show popup đẹp hơn
            alert("Đã tiếp nhận khách vãng lai thành công!");

            // Reset form hoặc chuyển hướng về trang quản lý ca sửa
            navigate(`/receptionist/appointmentManagement`); // Đổi lại route tới trang quản lý ca sửa của bạn

        } catch (error) {
            console.error("Lỗi tạo phiếu:", error);
            const errorMessage = error.response?.data?.message || "Có lỗi xảy ra khi tạo phiếu. Vui lòng thử lại.";
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full min-h-screen bg-slate-50 font-sans antialiased pb-20 relative">
            <style>{` .hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } `}</style>

            <div className="relative w-full h-[180px] sm:h-[220px] bg-slate-900 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1625047509168-a7026f36de04?q=80&w=2070&auto=format&fit=crop" alt="Reception" className="w-full h-full object-cover opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full p-6 sm:p-10 max-w-7xl mx-auto">
                    <span className="px-3 py-1 bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest rounded-lg mb-3 inline-block shadow-sm">Dành cho tư vấn viên</span>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight drop-shadow-md">Tiếp nhận khách vãng lai</h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 sm:mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

                    {/* CỘT TRÁI: FORM NHẬP LIỆU */}
                    <div className="lg:col-span-5 flex flex-col gap-6">

                        {/* --- BOX CƠ SỞ CỦA NHÂN VIÊN --- */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                                <MapPin className="text-indigo-600" size={20} /> Cơ sở tiếp nhận
                            </h3>

                            {isBranchLoading ? (
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                                    <Loader2 className="animate-spin text-indigo-600" size={20} />
                                    <span className="text-sm font-medium text-slate-500">Đang đồng bộ cơ sở làm việc...</span>
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
                                <div className="flex flex-col items-center justify-center p-6 bg-red-50 rounded-xl border border-red-200 border-dashed text-center">
                                    <AlertCircle size={32} className="text-red-400 mb-2" />
                                    <p className="text-sm font-bold text-red-700">Lỗi xác thực cơ sở</p>
                                    <p className="text-xs text-red-600/70 mt-1">Không thể lấy thông tin cơ sở của bạn.</p>
                                </div>
                            )}
                        </div>

                        {/* --- FORM THÔNG TIN KHÁCH HÀNG --- */}
                        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                                <User className="text-indigo-600" size={20} /> Thông tin khách hàng
                            </h3>
                            <div className="space-y-5">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                        Họ và tên khách hàng <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text" name="fullName" value={formData.fullName}
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
                                        type="tel" name="phone" value={formData.phone}
                                        onChange={handleInputChange} placeholder="Nhập số điện thoại"
                                        className={`w-full bg-slate-50 border text-slate-900 font-semibold text-sm rounded-xl px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 transition-all ${errors.phone ? 'border-red-400 focus:ring-red-400 bg-red-50/30' : 'border-slate-200 focus:ring-indigo-500'}`}
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs font-medium mt-1.5 flex items-center gap-1"><AlertCircle size={12} /> {errors.phone}</p>}
                                </div>
                            </div>
                        </div>

                        {/* --- FORM PHƯƠNG TIỆN --- */}
                        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                                <Car className="text-indigo-600" size={20} /> Chi tiết phương tiện
                            </h3>
                            <div className="space-y-5">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                        Biển số xe <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text" name="licensePlate" value={formData.licensePlate}
                                        onChange={handleInputChange} placeholder="VD: 29A-123.45"
                                        className={`w-full bg-slate-50 border text-slate-900 font-bold text-sm rounded-xl px-4 py-3 uppercase focus:bg-white focus:outline-none focus:ring-2 transition-all ${errors.licensePlate ? 'border-red-400 focus:ring-red-400 bg-red-50/30' : 'border-slate-200 focus:ring-indigo-500'}`}
                                    />
                                    {errors.licensePlate && <p className="text-red-500 text-xs font-medium mt-1.5 flex items-center gap-1"><AlertCircle size={12} /> {errors.licensePlate}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Hãng xe</label>
                                        <input type="text" name="brand" value={formData.brand} onChange={handleInputChange} placeholder="VD: Honda" className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-semibold text-sm rounded-xl px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Dòng xe</label>
                                        <input type="text" name="model" value={formData.model} onChange={handleInputChange} placeholder="VD: Air Blade" className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-semibold text-sm rounded-xl px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
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
                                Xếp ca tiếp nhận
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
                                </div>

                                {isShiftsLoading ? (
                                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                                        <Loader2 className="animate-spin text-indigo-500" size={28} />
                                        <span className="text-sm font-medium text-slate-500">Đang tải danh sách ca...</span>
                                    </div>
                                ) : !currentBranch ? (
                                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                                        <p className="text-sm font-medium text-slate-400">Không có dữ liệu cơ sở.</p>
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
                                            if (selectedDate === 0) {
                                                const now = new Date();
                                                const [endH, endM] = shift.endTime.split(':').map(Number);

                                                const shiftEndTimeObj = new Date();
                                                shiftEndTimeObj.setHours(endH, endM, 0, 0);

                                                const cutoffTimeObj = new Date(shiftEndTimeObj.getTime() - 45 * 60000);

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

                        {/* --- NÚT HOÀN TẤT DÀNH CHO NHÂN VIÊN --- */}
                        <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-slate-800">
                            <div className="text-left w-full sm:w-auto">
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Xác nhận tạo phiếu</p>
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
                                    <p className="text-amber-400 text-sm font-medium flex items-center gap-1.5"><AlertCircle size={16} /> Vui lòng xếp ca</p>
                                )}
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={!selectedShift || !currentBranch || isSubmitting}
                                className="flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed w-full sm:w-auto bg-amber-500 text-white font-bold text-sm px-8 py-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all duration-300 hover:bg-amber-600 active:scale-95 disabled:bg-slate-700 disabled:text-slate-500 disabled:shadow-none"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="animate-spin" size={18} /> ĐANG XỬ LÝ...</>
                                ) : (
                                    "Tạo phiếu sửa"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}