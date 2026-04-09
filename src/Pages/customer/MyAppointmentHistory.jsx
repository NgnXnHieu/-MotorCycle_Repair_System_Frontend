import React, { useState, useEffect } from 'react';
import {
    CalendarDays, Clock, FileText, Wrench,
    CheckCircle2, MapPin, Loader2, UserCog, Receipt, Filter, Car
} from 'lucide-react';
import { appointmentApi } from '../../api/appointmentApi';
import Pagination from '../../components/common/Pagination';

export default function MyAppointmentHistory() {
    const [isLoading, setIsLoading] = useState(true);
    const [appointments, setAppointments] = useState([]);

    const [activeFilter, setActiveFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const filterForm = {
                page: currentPage,
                size: 5,
                status: activeFilter === 'ALL' ? null : activeFilter
            };

            const response = await appointmentApi.getMyHistory(filterForm);
            const data = response.data || response;

            if (data && data.content) {
                const mappedAppointments = data.content.map(item => {
                    const appt = item.appointmentDTO;
                    const vehicle = appt.vehicleDTO;
                    const repairOrder = item.repairOrderDTO;
                    const services = item.serviceDetailDTOList || item.serviceDetialDTOList;

                    const [year, month, day] = appt.dailyShiftCapacityDTO.workingDay.split('-');
                    const shift = appt.dailyShiftCapacityDTO.shiftInBranchDTO.shiftDTO;
                    const branch = appt.dailyShiftCapacityDTO.shiftInBranchDTO.branchDTO;
                    const isEarlyStage = ['BOOKED', 'DIAGNOSING'].includes(appt.appointment_status);

                    return {
                        id: appt.id,
                        status_time: appt.status_time,
                        bringer_name: appt.bringer_name,
                        bringer_phone: appt.bringer_phone,
                        appointment_status: appt.appointment_status,
                        description: isEarlyStage
                            ? (appt.description || "Đang chờ kiểm tra và cập nhật chẩn đoán...")
                            : (appt.description || "Không có ghi chú cụ thể"),
                        services: services ? services.map(s => s.serviceDTO.name) : [],
                        shift_date: `${day}/${month}/${year}`,
                        shift_time: `${shift.name} (${shift.start_time.slice(0, 5)} - ${shift.end_time.slice(0, 5)})`,
                        branch_name: `${branch.name} - ${branch.address}`,
                        mechanic_name: repairOrder?.employeeDTO?.full_name || null,
                        mechanic_phone: repairOrder?.employeeDTO?.phone || null,
                        total_price: repairOrder?.total_price || 0,
                        payment_status: repairOrder?.payment_status || 'PENDING',
                        payment_date: repairOrder?.date || null,
                        has_repair_order: !!repairOrder,
                        vehicle: {
                            id: vehicle.id,
                            licensePlate: vehicle.licensePlate,
                            brand: vehicle.brand,
                            model: vehicle.model,
                            image: vehicle.iamge || vehicle.image || "https://via.placeholder.com/150?text=No+Image"
                        }
                    };
                });

                setAppointments(mappedAppointments);
                setTotalPages(data.page.totalPages);
            } else {
                setAppointments([]);
                setTotalPages(0);
            }
        } catch (error) {
            console.error("Lỗi khi fetch lịch sử sửa chữa: ", error);
            setAppointments([]);
            setTotalPages(0);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setCurrentPage(0);
    }, [activeFilter]);

    useEffect(() => {
        fetchHistory();
    }, [currentPage, activeFilter]);

    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    const formatStatusTime = (isoString) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        return `${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    };

    const getStatusBadge = (status) => {
        const styles = {
            'BOOKED': 'bg-slate-100 text-slate-700 border-slate-200',
            'DIAGNOSING': 'bg-indigo-50 text-indigo-700 border-indigo-200',
            'WAITING': 'bg-amber-50 text-amber-700 border-amber-200',
            'FIXING': 'bg-blue-50 text-blue-700 border-blue-200',
            'FINISHED': 'bg-emerald-50 text-emerald-700 border-emerald-200',
            'CANCELED': 'bg-red-50 text-red-700 border-red-200'
        };
        const labels = {
            'BOOKED': 'ĐÃ ĐẶT LỊCH',
            'DIAGNOSING': 'ĐANG CHẨN ĐOÁN',
            'WAITING': 'CHỜ SỬA CHỮA',
            'FIXING': 'ĐANG SỬA CHỮA',
            'FINISHED': 'ĐÃ HOÀN THÀNH',
            'CANCELED': 'ĐÃ HỦY'
        };
        return (
            <span className={`${styles[status] || 'bg-slate-100 text-slate-700 border-slate-200'} border px-3 py-1.5 rounded-full text-xs font-bold tracking-wide inline-flex items-center gap-2 shadow-sm`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status === 'FIXING' ? 'bg-blue-600 animate-pulse' : status === 'DIAGNOSING' ? 'bg-indigo-600 animate-pulse' : 'bg-current opacity-60'}`}></span>
                {labels[status] || status}
            </span>
        );
    };

    const filterTabs = [
        { id: 'ALL', label: 'Tất cả' },
        { id: 'BOOKED', label: 'Đang đợi' },
        { id: 'FINISHED', label: 'Đã sửa xong' }
    ];

    return (
        // R1 & R5: bg-slate-50 (tương phản), antialiased cho chữ sắc nét
        <div className="w-full min-h-screen bg-slate-50 pb-20 pt-10 font-sans selection:bg-indigo-500 selection:text-white antialiased">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">

                {/* --- HEADER --- */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20">
                            <Car size={32} strokeWidth={2} />
                        </div>
                        <div>
                            {/* R5: Tiêu đề text-slate-900, font-bold tracking-tight */}
                            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Lịch sử phương tiện</h1>
                            <p className="text-slate-500 mt-1 font-medium text-base">Quản lý toàn bộ tiến trình bảo dưỡng và sửa chữa</p>
                        </div>
                    </div>
                </div>

                {/* --- TABS BỘ LỌC --- */}
                <div className="mb-10 flex bg-slate-200/50 p-1.5 rounded-2xl w-full md:w-auto md:inline-flex overflow-x-auto hide-scrollbar border border-slate-200/60 shadow-inner">
                    {filterTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFilter(tab.id)}
                            disabled={isLoading}
                            // R3: transition-all, active:scale-95
                            className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 ease-in-out active:scale-95 whitespace-nowrap ${activeFilter === tab.id
                                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* --- DANH SÁCH LỊCH HẸN --- */}
                {isLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>
                ) : (
                    <div className="space-y-8">
                        {appointments.length === 0 ? (
                            <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm transition-all duration-300">
                                <Filter className="mx-auto text-slate-300 mb-5" size={56} strokeWidth={1.5} />
                                <h4 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">Không tìm thấy lịch sử</h4>
                                <p className="text-slate-500 font-medium text-base max-w-sm mx-auto leading-relaxed">
                                    {activeFilter === 'ALL'
                                        ? 'Bạn chưa có lịch sử đặt lịch hay sửa chữa nào trên hệ thống.'
                                        : 'Không có dịch vụ nào đang ở trạng thái bạn đã chọn.'}
                                </p>
                            </div>
                        ) : (
                            appointments.map((appt) => (
                                // R2 & R3: Card bo góc 2xl, bóng sm, hover nổi lên & đổi viền
                                <div key={appt.id} className="group flex flex-col md:flex-row bg-white rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-slate-300 overflow-hidden">

                                    {/* CỘT TRÁI: Phương tiện & Thời gian */}
                                    <div className="md:w-1/3 flex flex-col p-6 sm:p-8 md:border-r border-slate-100 bg-slate-50/50 relative">

                                        {/* Block Xe */}
                                        <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-8 transition-all duration-300 group-hover:border-indigo-200 group-hover:shadow-md">
                                            <img src={appt.vehicle.image} alt="vehicle" className="w-16 h-16 rounded-lg object-cover bg-slate-50 border border-slate-100" />
                                            <div>
                                                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">{appt.vehicle.brand} {appt.vehicle.model}</p>
                                                <p className="text-xl font-bold text-slate-900 tracking-tight">{appt.vehicle.licensePlate}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 flex-grow">
                                            <div>
                                                <div className="flex items-center gap-3 text-slate-800 font-bold text-lg mb-2">
                                                    <div className="p-2 bg-white rounded-lg text-indigo-600 border border-slate-200 shadow-sm"><CalendarDays size={18} /></div>
                                                    {appt.shift_date}
                                                </div>
                                                <div className="flex items-center gap-2.5 text-slate-500 text-sm font-medium ml-2">
                                                    <Clock size={16} /> {appt.shift_time}
                                                </div>
                                            </div>

                                            <div className="pt-6 border-t border-slate-200 mt-auto">
                                                {getStatusBadge(appt.appointment_status)}
                                                <p className="text-xs text-slate-400 mt-4 font-medium">
                                                    Cập nhật lần cuối: <span className="font-semibold text-slate-600">{formatStatusTime(appt.status_time)}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CỘT PHẢI: Nội dung chi tiết (R4: padding lớn p-8) */}
                                    <div className="md:w-2/3 flex flex-col p-6 sm:p-8">

                                        {/* Thông tin người mang xe & ID */}
                                        <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold border border-slate-200 shadow-sm text-lg">
                                                    {appt.bringer_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Người giao xe</p>
                                                    <p className="text-base font-bold text-slate-900 tracking-tight">{appt.bringer_name} <span className="text-slate-300 mx-2 font-normal">|</span> <span className="text-indigo-600 text-sm font-semibold">{appt.bringer_phone}</span></p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                                                MÃ HẸN: #{appt.id}
                                            </div>
                                        </div>

                                        {/* Chẩn đoán */}
                                        <div className={`p-5 rounded-xl border mb-6 transition-colors duration-300 ${['BOOKED', 'DIAGNOSING'].includes(appt.appointment_status) ? 'bg-slate-50 border-slate-200 border-dashed' : 'bg-white border-slate-200 shadow-sm'}`}>
                                            <div className="flex items-start gap-4">
                                                <div className="mt-0.5 p-2 bg-white rounded-lg shadow-sm border border-slate-100 text-slate-400"><FileText size={16} /></div>
                                                <div>
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                                                        {['BOOKED'].includes(appt.appointment_status) ? 'Ghi chú đặt lịch' : 'Kết quả chẩn đoán'}
                                                    </span>
                                                    <p className={`text-sm leading-relaxed ${['BOOKED', 'DIAGNOSING'].includes(appt.appointment_status) && !appt.description ? 'text-slate-400 italic' : 'text-slate-700 font-medium'}`}>
                                                        {appt.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dịch vụ (Nếu có Order) */}
                                        {appt.has_repair_order && appt.services.length > 0 && (
                                            <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 mb-8">
                                                <div className="flex items-start gap-4">
                                                    <div className="mt-0.5 p-2 bg-white rounded-lg text-indigo-600 shadow-sm border border-indigo-100"><Wrench size={16} /></div>
                                                    <div className="w-full">
                                                        <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-2.5 block">Dịch vụ áp dụng</span>
                                                        <div className="flex flex-wrap gap-2.5">
                                                            {appt.services.map((service, idx) => (
                                                                <span key={idx} className="bg-white border border-indigo-200/60 text-indigo-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all hover:border-indigo-300">
                                                                    {service}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Footer Card: Chi nhánh & Kỹ thuật viên */}
                                        <div className="mt-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                                            {appt.mechanic_name ? (
                                                <div className="flex items-center gap-3.5">
                                                    <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-600"><UserCog size={18} /></div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kỹ thuật viên</p>
                                                        <p className="text-sm font-bold text-slate-800 tracking-tight">{appt.mechanic_name}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3.5 opacity-60 grayscale">
                                                    <div className="p-2 bg-slate-100 rounded-lg border border-slate-200 text-slate-400"><UserCog size={18} /></div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kỹ thuật viên</p>
                                                        <p className="text-sm font-medium text-slate-500 italic">Chưa phân công</p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200 shadow-sm">
                                                <MapPin size={14} className="text-indigo-500" />
                                                {appt.branch_name}
                                            </div>
                                        </div>

                                        {/* Khối Hóa Đơn (Premium styling) */}
                                        {appt.has_repair_order && (
                                            <div className={`mt-8 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 border transition-all duration-300 ${appt.payment_status === 'PAYED'
                                                ? 'bg-emerald-50/50 border-emerald-200 hover:shadow-md hover:border-emerald-300'
                                                : 'bg-orange-50/50 border-orange-200 hover:shadow-md hover:border-orange-300'
                                                }`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3.5 rounded-xl border shadow-sm ${appt.payment_status === 'PAYED' ? 'bg-white border-emerald-200 text-emerald-600' : 'bg-white border-orange-200 text-orange-500'}`}>
                                                        <Receipt size={24} />
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Tổng thanh toán</span>
                                                        <span className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(appt.total_price)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col sm:items-end w-full sm:w-auto">
                                                    <span className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide border flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm ${appt.payment_status === 'PAYED'
                                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                                        : 'bg-white text-orange-600 border-orange-200'
                                                        }`}>
                                                        {appt.payment_status === 'PAYED' ? (
                                                            <><CheckCircle2 size={16} /> ĐÃ THANH TOÁN</>
                                                        ) : (
                                                            <><Clock size={16} /> CHƯA THANH TOÁN</>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}