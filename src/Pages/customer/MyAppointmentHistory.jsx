import React, { useState, useEffect, useRef } from 'react';
import {
    CalendarDays, Clock, FileText, Wrench,
    CheckCircle2, MapPin, Loader2, UserCog, Receipt, Filter, Car, CreditCard,
    Phone, X, Package, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { appointmentApi } from '../../api/appointmentApi';
import Pagination from '../../components/common/Pagination';
import { toast } from 'react-toastify';
import { serviceApi } from '../../api/serviceApi';

export default function MyAppointmentHistory() {
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [appointments, setAppointments] = useState([]);
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // State cho Modal Service Detail
    const [isServiceLoading, setIsServiceLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedServiceData, setSelectedServiceData] = useState(null);

    const listTopRef = useRef(null);

    // Xử lý đóng Modal bằng phím Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') closeModal();
        };
        if (isModalOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen]);

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedServiceData(null), 200); // Đợi animation đóng xong mới clear data
    };

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

                        // FIX QUAN TRỌNG: Lấy id của service_detail (s.id) để fetch detail thay vì id của service
                        services: services ? services.map(s => ({
                            detailId: s.id,
                            serviceId: s.serviceDTO.id,
                            name: s.serviceDTO.name
                        })) : [],

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
            console.error("Lỗi khi fetch lịch sử sửa chữa: ", error?.response);
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

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        if (listTopRef.current) {
            const y = listTopRef.current.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    const formatStatusTime = (isoString) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        return `${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    };

    const getStatusBadge = (status) => {
        const styles = {
            'BOOKED': 'bg-slate-700 text-white border-slate-800 shadow-slate-300/50',
            'DIAGNOSING': 'bg-indigo-600 text-white border-indigo-700 shadow-indigo-300/50',
            'WAITING': 'bg-amber-500 text-white border-amber-600 shadow-amber-300/50',
            'FIXING': 'bg-blue-600 text-white border-blue-700 shadow-blue-300/50',
            'FINISHED': 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-300/50',
            'CANCELED': 'bg-red-600 text-white border-red-700 shadow-red-300/50'
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
            <span className={`${styles[status] || 'bg-slate-700 text-white border-slate-800'} border shadow-md px-4 py-2 rounded-md text-sm font-black tracking-wider inline-flex items-center gap-2 uppercase`}>
                <span className={`w-2 h-2 rounded-full bg-white ${status === 'FIXING' || status === 'DIAGNOSING' ? 'animate-pulse' : 'opacity-90'}`}></span>
                {labels[status] || status}
            </span>
        );
    };

    // Hàm gọi API lấy chi tiết dịch vụ
    const handleServiceClick = async (detailId) => {
        setIsServiceLoading(true);
        try {
            // Đảm bảo trong file appointmentApi.js đã export hàm này: getServiceDetail: (id) => axiosClient.get(`/serviceDetail/${id}`)
            const response = await serviceApi.getServiceDetail(detailId);
            const data = response.data || response;
            setSelectedServiceData(data);
            setIsModalOpen(true);
        } catch (error) {
            console.error("Lỗi khi tải chi tiết dịch vụ:", error);
            toast.error("Không thể tải thông tin dịch vụ.");
        } finally {
            setIsServiceLoading(false);
        }
    };

    const handlePaymentClick = (apptId) => {
        toast.info("Chức năng thanh toán đang được xử lý...");
    };

    const filterTabs = [
        { id: 'ALL', label: 'Tất cả', activeClass: 'bg-white text-indigo-600 border-indigo-600 border-2' },
        { id: 'BOOKED', label: 'Đang đợi', activeClass: 'bg-white text-amber-600 border-amber-500 border-2' },
        { id: 'FINISHED', label: 'Đã sửa xong', activeClass: 'bg-white text-emerald-600 border-emerald-500 border-2' }
    ];

    // Xử lý typo từ backend an toàn
    const serviceInfo = selectedServiceData?.serviceDetialDTO || selectedServiceData?.serviceDetailDTO;
    const itemsInfo = selectedServiceData?.itemDetailDTOS || [];

    return (
        <div className="w-full min-h-screen bg-slate-50 pb-20 pt-10 font-sans selection:bg-indigo-500 selection:text-white antialiased relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-indigo-600 text-white rounded-lg shadow-lg shadow-indigo-600/20">
                            <Car size={32} strokeWidth={2} />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Lịch sử phương tiện</h1>
                            <p className="text-slate-500 mt-1 font-medium text-base">Quản lý toàn bộ tiến trình bảo dưỡng và sửa chữa</p>
                        </div>
                    </div>
                </div>

                <div className="mb-10 flex bg-slate-200/50 p-1.5 rounded-lg w-full md:w-auto md:inline-flex overflow-x-auto hide-scrollbar border border-slate-300 shadow-inner">
                    {filterTabs.map((tab) => {
                        const isActive = activeFilter === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveFilter(tab.id)}
                                disabled={isLoading}
                                className={`flex-1 md:flex-none px-8 py-3 rounded-md text-sm font-bold transition-all duration-300 ease-in-out active:scale-95 whitespace-nowrap ${isActive
                                    ? `${tab.activeClass} shadow-md`
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/80 border border-transparent'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div ref={listTopRef} id="appointment-list-top"></div>

                {isLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>
                ) : (
                    <div className="space-y-12">
                        {appointments.length === 0 ? (
                            <div className="text-center py-24 bg-white rounded-lg border-2 border-dashed border-slate-300 shadow-sm transition-all duration-300">
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
                                <div key={appt.id} className="group flex flex-col md:flex-row bg-white rounded-lg border-2 border-slate-200 shadow-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-indigo-400 overflow-hidden">

                                    <div className="md:w-1/3 flex flex-col p-6 sm:p-8 md:border-r-2 border-slate-200 bg-slate-50/80 relative">
                                        <div className="mb-6 flex justify-center">
                                            {getStatusBadge(appt.appointment_status)}
                                        </div>

                                        <div className="flex items-center gap-4 bg-white p-3 rounded-md border-2 border-slate-200 shadow-sm mb-6 transition-all duration-300 group-hover:border-indigo-300 group-hover:shadow-md">
                                            <img src={appt.vehicle.image} alt="vehicle" className="w-16 h-16 rounded-md object-cover bg-slate-50 border border-slate-100" />
                                            <div>
                                                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">{appt.vehicle.brand} {appt.vehicle.model}</p>
                                                <p className="text-xl font-black text-slate-900 tracking-tight">{appt.vehicle.licensePlate}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 flex-grow bg-white p-4 rounded-md border-2 border-slate-200 shadow-sm">
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Ngày hẹn sửa chữa</span>
                                                <div className="flex items-center gap-3 text-slate-900 font-black text-xl mb-2">
                                                    <div className="p-2.5 bg-indigo-50 rounded-md text-indigo-600 border border-indigo-100"><CalendarDays size={20} /></div>
                                                    {appt.shift_date}
                                                </div>
                                                <div className="flex items-center gap-2.5 text-indigo-600 text-sm font-bold ml-2">
                                                    <Clock size={16} /> {appt.shift_time}
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t-2 border-slate-100 mt-auto">
                                                <p className="text-xs text-slate-500 font-medium">
                                                    Cập nhật lần cuối: <br />
                                                    <span className="font-semibold text-slate-700">{formatStatusTime(appt.status_time)}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:w-2/3 flex flex-col p-6 sm:p-8">
                                        <div className="flex flex-col gap-4 mb-8">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-md bg-slate-100 flex items-center justify-center text-slate-700 font-bold border-2 border-slate-200 shadow-sm text-lg">
                                                        {appt.bringer_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Người giao xe</p>
                                                        <p className="text-base font-bold text-slate-900 tracking-tight">{appt.bringer_name} <span className="text-slate-300 mx-2 font-normal">|</span> <span className="text-indigo-600 text-sm font-semibold">{appt.bringer_phone}</span></p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white px-3 py-2 rounded-md border-2 border-slate-200 shadow-sm">
                                                    MÃ HẸN: #{appt.id}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 text-sm font-bold text-slate-800 bg-indigo-50/50 p-3 rounded-md border-2 border-indigo-100">
                                                <div className="p-1.5 bg-indigo-100 rounded text-indigo-600">
                                                    <MapPin size={18} />
                                                </div>
                                                <span>{appt.branch_name}</span>
                                            </div>
                                        </div>

                                        <div className={`p-5 rounded-md border-2 mb-6 transition-colors duration-300 ${['BOOKED', 'DIAGNOSING'].includes(appt.appointment_status) ? 'bg-slate-50 border-slate-200 border-dashed' : 'bg-white border-slate-200 shadow-sm'}`}>
                                            <div className="flex items-start gap-4">
                                                <div className="mt-0.5 p-2 bg-white rounded-md shadow-sm border border-slate-100 text-slate-400"><FileText size={16} /></div>
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

                                        {appt.has_repair_order && appt.services.length > 0 && (
                                            <div className="bg-indigo-50/50 p-5 rounded-md border-2 border-indigo-100 mb-8">
                                                <div className="flex items-start gap-4">
                                                    <div className="mt-0.5 p-2 bg-white rounded-md text-indigo-600 shadow-sm border border-indigo-100"><Wrench size={16} /></div>
                                                    <div className="w-full">
                                                        <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-2.5 flex justify-between items-center">
                                                            <span>Dịch vụ áp dụng</span>
                                                            <span className="text-[9px] text-indigo-400 font-normal italic">Nhấn vào để xem chi tiết</span>
                                                        </span>
                                                        <div className="flex flex-wrap gap-2.5">
                                                            {appt.services.map((service, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    onClick={() => handleServiceClick(service.detailId)}
                                                                    disabled={isServiceLoading}
                                                                    className="bg-white border-2 border-indigo-200 text-indigo-800 text-sm font-semibold px-4 py-2 rounded-md shadow-sm transition-all hover:border-indigo-400 hover:bg-indigo-50 active:scale-95 flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {service.name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-auto">
                                            {appt.mechanic_name ? (
                                                <div className="flex items-start gap-3.5 bg-emerald-50/40 p-3.5 rounded-md border-2 border-emerald-100 w-fit shadow-sm">
                                                    <div className="p-2 bg-emerald-100 rounded-md border border-emerald-200 text-emerald-700 mt-0.5">
                                                        <UserCog size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                                            Kỹ thuật viên phụ trách
                                                        </p>
                                                        <p className="text-sm font-black text-emerald-900 tracking-tight mb-1.5">
                                                            {appt.mechanic_name}
                                                        </p>
                                                        {appt.mechanic_phone ? (
                                                            <a
                                                                href={`tel:${appt.mechanic_phone}`}
                                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200 px-2.5 py-1.5 rounded transition-all active:scale-95 cursor-pointer border border-emerald-200"
                                                            >
                                                                <Phone size={12} className="text-emerald-600" />
                                                                {appt.mechanic_phone}
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 italic">Chưa cập nhật SĐT</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3.5 opacity-60 grayscale p-3">
                                                    <div className="p-2 bg-slate-100 rounded-md border-2 border-slate-200 text-slate-400"><UserCog size={18} /></div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Kỹ thuật viên</p>
                                                        <p className="text-sm font-medium text-slate-500 italic">Chưa phân công</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {appt.has_repair_order && (
                                            <div className={`mt-6 p-6 rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 border-2 transition-all duration-300 ${appt.payment_status === 'PAYED'
                                                ? 'bg-emerald-50/80 border-emerald-300 shadow-sm'
                                                : 'bg-orange-50/80 border-orange-300 shadow-md'
                                                }`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3.5 rounded-md border-2 shadow-sm ${appt.payment_status === 'PAYED' ? 'bg-white border-emerald-300 text-emerald-600' : 'bg-white border-orange-300 text-orange-500'}`}>
                                                        <Receipt size={24} />
                                                    </div>
                                                    <div>
                                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Tổng thanh toán</span>
                                                        <span className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(appt.total_price)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col sm:items-end w-full sm:w-auto gap-3">
                                                    <span className={`px-4 py-2 rounded-md text-xs font-bold tracking-wide border-2 flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm ${appt.payment_status === 'PAYED'
                                                        ? 'bg-emerald-600 text-white border-emerald-700'
                                                        : 'bg-white text-orange-600 border-orange-300'
                                                        }`}>
                                                        {appt.payment_status === 'PAYED' ? (
                                                            <><CheckCircle2 size={16} /> ĐÃ THANH TOÁN</>
                                                        ) : (
                                                            <><Clock size={16} /> CHƯA THANH TOÁN</>
                                                        )}
                                                    </span>

                                                    {appt.payment_status !== 'PAYED' && (
                                                        <button
                                                            onClick={() => handlePaymentClick(appt.id)}
                                                            className="w-full sm:w-auto px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-md shadow-lg shadow-orange-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-2 border-orange-600"
                                                        >
                                                            <CreditCard size={18} />
                                                            Thanh toán ngay
                                                        </button>
                                                    )}
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
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}
            </div>

            {/* ===== MODAL HIỂN THỊ CHI TIẾT DỊCH VỤ ===== */}
            {isModalOpen && selectedServiceData && serviceInfo && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                    onClick={closeModal} // Nhấn ra ngoài Modal để đóng
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()} // Ngăn chặn sự kiện click lan ra ngoài
                    >
                        {/* Header Modal */}
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <Wrench className="text-indigo-600" size={24} />
                                Chi tiết dịch vụ
                            </h3>
                            <button
                                onClick={closeModal}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body Modal (Scrollable) */}
                        <div className="overflow-y-auto p-6 space-y-6 flex-1 custom-scrollbar">

                            {/* 1. Thông tin ServiceDTO */}
                            <div className="flex flex-col md:flex-row gap-6">
                                <img
                                    src={serviceInfo.serviceDTO.imageUrl}
                                    alt={serviceInfo.serviceDTO.name}
                                    className="w-full md:w-1/3 h-48 object-cover rounded-lg border border-slate-200 shadow-sm"
                                />
                                <div className="flex-1 space-y-3">
                                    <h4 className="text-2xl font-bold text-slate-900">
                                        {serviceInfo.serviceDTO.name}
                                    </h4>
                                    <div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-md border border-indigo-100 mb-2">
                                        Phí dịch vụ: {formatCurrency(serviceInfo.serviceDTO.price)}
                                    </div>
                                    <p className="text-slate-600 text-sm leading-relaxed text-justify">
                                        {serviceInfo.serviceDTO.decription || serviceInfo.serviceDTO.description}
                                    </p>
                                </div>
                            </div>

                            {/* 2. Danh sách phụ tùng thay thế (itemDetailDTOS) */}
                            {itemsInfo.length > 0 && (
                                <div className="pt-6 border-t border-slate-200">
                                    <h5 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Package size={18} /> Phụ tùng / Linh kiện sử dụng
                                    </h5>

                                    <div className="space-y-3">
                                        {itemsInfo.map((item, index) => (
                                            <div
                                                key={index}
                                                // Chuyển trang dựa trên Router, đổi url cho khớp với Route bạn đang dùng nhé.
                                                onClick={() => navigate(`/itemDetailPage/${item.itemSimpleDTO.id}`)}
                                                className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg border-2 border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                                            >
                                                <img
                                                    src={item.itemSimpleDTO.imageUrl}
                                                    alt={item.itemSimpleDTO.name}
                                                    className="w-20 h-20 object-cover rounded-md border border-slate-200 bg-white"
                                                />
                                                <div className="flex-1 flex flex-col justify-between">
                                                    <div>
                                                        <h6 className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                                                            {item.itemSimpleDTO.name}
                                                        </h6>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-emerald-600 font-semibold">
                                                            <ShieldCheck size={14} />
                                                            Bảo hành: {item.itemSimpleDTO.warranty_year} năm
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 pt-2 border-t border-slate-100/50 sm:border-none sm:pt-0 sm:mt-0">
                                                        <div className="text-sm">
                                                            <span className="text-slate-400 text-xs block">Đơn giá</span>
                                                            <span className="font-semibold text-slate-700">{formatCurrency(item.unit_price)}</span>
                                                        </div>
                                                        <div className="text-sm">
                                                            <span className="text-slate-400 text-xs block">Số lượng</span>
                                                            <span className="font-semibold text-slate-700">x{item.quantity}</span>
                                                        </div>
                                                        <div className="text-sm sm:ml-auto text-right">
                                                            <span className="text-slate-400 text-xs block">Thành tiền</span>
                                                            <span className="font-bold text-indigo-600">{formatCurrency(item.total_price)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Footer Modal */}
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Tổng chi phí dịch vụ này:</span>
                            <span className="text-xl font-black text-indigo-600">
                                {formatCurrency(serviceInfo.total_price)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}