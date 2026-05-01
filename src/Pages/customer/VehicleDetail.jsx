import React, { useState, useEffect } from 'react';
import {
    CalendarDays, Clock, FileText, Gauge,
    CheckCircle2, Wrench, MapPin, Loader2, PlusCircle, UserCog, Receipt, ShieldCheck, Filter
} from 'lucide-react';
import { vehicleApi } from '../../api/vehicleApi';
import { useParams, useNavigate } from 'react-router-dom';

export default function VehicleDetail() {
    // Tách riêng 2 trạng thái loading cho độc lập
    const [isVehicleLoading, setIsVehicleLoading] = useState(true);
    const [isAppointmentsLoading, setIsAppointmentsLoading] = useState(true);

    const [vehicle, setVehicle] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const { id } = useParams();
    const [activeFilter, setActiveFilter] = useState('ALL');

    const navigate = useNavigate();

    // 1. HÀM FETCH THÔNG TIN XE (CHỈ GỌI 1 LẦN DỰA VÀO ID)
    const fetchVehicleDetail = async () => {
        setIsVehicleLoading(true);
        try {
            // Lưu ý: Tùy theo config axios interceptor của bạn mà .data có cần thiết hay không
            const response = await vehicleApi.getById(id);
            const vehicleData = response.data || response;

            // Xử lý an toàn dữ liệu
            const rawKm = vehicleData.kilometters ?? vehicleData.kilometers ?? 0;
            const parsedKm = parseInt(rawKm, 10);
            const finalKm = isNaN(parsedKm) ? 0 : parsedKm;

            setVehicle({
                id: vehicleData.id,
                licensePlate: vehicleData.licensePlate,
                brand: vehicleData.brand,
                model: vehicleData.model,
                manufacture_year: vehicleData.manufacture_year,
                image: vehicleData.iamge || vehicleData.image,
                kilometers: finalKm
            });
        } catch (error) {
            console.error("Lỗi khi fetch thông tin xe: ", error);
            setVehicle(null);
        } finally {
            setIsVehicleLoading(false);
        }
    };

    // 2. HÀM FETCH DANH SÁCH LỊCH HẸN (GỌI KHI ĐỔI FILTER)
    const fetchAppointments = async (currentStatus) => {
        setIsAppointmentsLoading(true);
        try {
            const filterForm = {
                page: 0,
                size: 50,
                status: currentStatus === 'ALL' ? null : currentStatus
            };

            const apiResponse = await vehicleApi.getAppointmentHistory(id, filterForm);

            if (apiResponse && apiResponse.content) {
                const mappedAppointments = apiResponse.content.map(item => {
                    const appt = item.appointmentDTO;
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
                            ? (appt.description || "Đang chờ kỹ thuật viên kiểm tra và cập nhật chẩn đoán...")
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
                        has_repair_order: !!repairOrder
                    };
                });
                setAppointments(mappedAppointments);
            } else {
                setAppointments([]);
            }
        } catch (error) {
            console.error("Lỗi khi fetch lịch hẹn: ", error);
            setAppointments([]);
        } finally {
            setIsAppointmentsLoading(false);
        }
    };

    // TRIGGER GỌI API XE KHI CÓ ID
    useEffect(() => {
        if (id) {
            fetchVehicleDetail();
        }
    }, [id]);

    // TRIGGER GỌI API LỊCH HẸN KHI ID HOẶC BỘ LỌC THAY ĐỔI
    useEffect(() => {
        if (id) {
            fetchAppointments(activeFilter);
        }
    }, [id, activeFilter]);

    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    const formatNumber = (num) => new Intl.NumberFormat('vi-VN').format(num);

    const formatStatusTime = (isoString) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        return `${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    };

    //Chuyển màn hình
    const handleBookButton = () => {
        navigate(`/bookingPage`, { state: { vehicle: vehicle } });
    }

    const getStatusBadge = (status) => {
        const styles = {
            'BOOKED': 'bg-slate-100 text-slate-700 border-slate-300 shadow-sm',
            'DIAGNOSING': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300 shadow-sm shadow-fuchsia-900/10',
            'WAITING': 'bg-amber-100 text-amber-800 border-amber-300 shadow-sm shadow-amber-900/10',
            'FIXING': 'bg-blue-100 text-blue-800 border-blue-300 shadow-sm shadow-blue-900/10',
            'FINISHED': 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm shadow-emerald-900/10',
            'CANCELED': 'bg-red-100 text-red-800 border-red-300 shadow-sm shadow-red-900/10'
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
            <span className={`${styles[status] || 'bg-gray-200 text-gray-800 border-gray-300'} border px-3 py-1.5 rounded-full text-[11px] font-black tracking-wide inline-flex items-center gap-1.5 transition-all`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status === 'FIXING' ? 'bg-blue-600 animate-pulse' : status === 'DIAGNOSING' ? 'bg-fuchsia-600 animate-pulse' : 'bg-current opacity-60'}`}></span>
                {labels[status] || status}
            </span>
        );
    };

    const filterTabs = [
        { id: 'ALL', label: 'Tất cả' },
        { id: 'BOOKED', label: 'Đang đợi' },
        { id: 'FINISHED', label: 'Đã sửa xong' }
    ];

    // MÀN HÌNH LOADING CHÍNH CHO XE
    if (isVehicleLoading) return <div className="min-h-screen flex items-center justify-center bg-zinc-50"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

    // NẾU KHÔNG CÓ DỮ LIỆU XE (API lỗi hoặc ID sai)
    if (!vehicle) return <div className="text-center py-20 text-slate-500 font-medium">Không tìm thấy dữ liệu phương tiện</div>;

    return (
        <div className="w-full min-h-screen bg-zinc-50 pb-16 pt-8 font-sans selection:bg-blue-500 selection:text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">

                {/* HEADER */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Hồ sơ phương tiện</h1>
                        <p className="text-slate-500 mt-1 font-medium">Theo dõi tình trạng và lịch sử bảo dưỡng</p>
                    </div>
                    <button
                        onClick={handleBookButton}
                        className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3 px-6 rounded-2xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2">
                        <PlusCircle size={20} /> Đặt lịch dịch vụ
                    </button>
                </div>

                {/* --- CARD THÔNG TIN XE --- */}
                <div className="bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row mb-12 border border-slate-800 relative group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

                    <div className="md:w-5/12 h-80 md:h-auto relative overflow-hidden bg-slate-800">
                        <img src={vehicle.image} alt="vehicle" className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out" />
                        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent"></div>
                        <div className="absolute top-5 left-5 bg-blue-600/90 backdrop-blur-md px-4 py-1.5 rounded-xl text-xs font-black text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-400/30 tracking-wider">
                            {vehicle.brand?.toUpperCase()}
                        </div>
                    </div>

                    <div className="p-8 sm:p-10 md:w-7/12 flex flex-col justify-center relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <ShieldCheck className="text-emerald-400" size={24} />
                            <span className="text-emerald-400 font-semibold text-sm tracking-wide">Đã xác thực</span>
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-black text-white mb-8 tracking-tight drop-shadow-md">{vehicle.model}</h2>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-white/5 backdrop-blur-lg p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Biển số</p>
                                <p className="text-xl font-black text-white">{vehicle.licensePlate}</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-lg p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Đời xe</p>
                                <p className="text-xl font-black text-white">{vehicle.manufacture_year}</p>
                            </div>
                            <div className="bg-blue-900/30 backdrop-blur-lg p-5 rounded-2xl border border-blue-500/30 col-span-2 md:col-span-1 shadow-[inset_0_0_20px_rgba(37,99,235,0.1)] relative overflow-hidden">
                                <div className="absolute -right-4 -bottom-4 opacity-10 text-blue-400"><Gauge size={80} /></div>
                                <p className="text-xs font-bold text-blue-400 uppercase mb-1.5 tracking-wider flex items-center gap-1.5">
                                    <Gauge size={14} /> ODO Gần nhất
                                </p>
                                <p className="text-2xl font-black text-white tracking-tight">{formatNumber(vehicle.kilometers)} <span className="text-sm font-semibold text-slate-400">km</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- TABS FILTER & TIÊU ĐỀ LỊCH HẸN --- */}
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-white text-blue-600 rounded-2xl shadow-lg shadow-zinc-200 border border-zinc-100">
                            <CalendarDays size={26} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Lịch sử & Tiến trình</h3>
                            <p className="text-slate-500 font-medium text-sm mt-0.5">Chi tiết các dịch vụ sửa chữa, bảo dưỡng</p>
                        </div>
                    </div>

                    <div className="flex bg-slate-200/60 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto hide-scrollbar">
                        {filterTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveFilter(tab.id)}
                                disabled={isAppointmentsLoading}
                                className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${activeFilter === tab.id
                                    ? 'bg-white text-blue-600 shadow-sm shadow-slate-200'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- NỘI DUNG LỊCH HẸN --- */}
                {isAppointmentsLoading ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
                ) : (
                    <div className="space-y-6">
                        {appointments.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-[2rem] border border-dashed border-zinc-300 shadow-sm">
                                <Filter className="mx-auto text-zinc-300 mb-4" size={48} strokeWidth={1.5} />
                                <h4 className="text-lg font-black text-slate-800 mb-1">Không có dữ liệu</h4>
                                {/* FIX: Thông báo rỗng thân thiện theo đúng yêu cầu */}
                                <p className="text-slate-500 font-medium text-sm">
                                    {activeFilter === 'ALL'
                                        ? 'Chưa có lịch sử sửa chữa nào cho phương tiện này.'
                                        : 'Không có lịch sử nào ở trạng thái bạn đang lọc.'}
                                </p>
                            </div>
                        ) : (
                            appointments.map((appt) => (
                                <div key={appt.id} className="group flex flex-col md:flex-row bg-white rounded-[2rem] border border-zinc-200/80 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 hover:border-blue-200 transition-all duration-300 ease-out hover:-translate-y-1 overflow-hidden">
                                    {/* CỘT TRÁI: Thời gian & Trạng thái */}
                                    <div className="md:w-1/3 flex flex-col gap-4 p-6 sm:p-8 md:border-r border-zinc-100 bg-zinc-50/50 group-hover:bg-blue-50/30 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-2.5 text-slate-800 font-black text-lg mb-1.5">
                                                <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600"><CalendarDays size={18} /></div>
                                                {appt.shift_date}
                                            </div>
                                            <div className="flex items-center gap-2.5 text-slate-500 text-sm font-semibold ml-1">
                                                <Clock size={16} /> {appt.shift_time}
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-5 border-t border-zinc-200/80">
                                            {getStatusBadge(appt.appointment_status)}
                                            <p className="text-xs text-slate-400 mt-3 font-medium">
                                                Cập nhật: <span className="font-semibold text-slate-600">{formatStatusTime(appt.status_time)}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* CỘT PHẢI: Nội dung chi tiết */}
                                    <div className="md:w-2/3 flex flex-col p-6 sm:p-8 pt-0 md:pt-8 relative">
                                        {/* Info & ID */}
                                        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-50 to-zinc-100 flex items-center justify-center text-blue-700 font-black border border-blue-100/50 shadow-inner text-lg">
                                                    {appt.bringer_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-base font-black text-slate-900">{appt.bringer_name}</p>
                                                    <p className="text-sm text-slate-500 font-semibold">{appt.bringer_phone}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-zinc-100/80 px-3 py-1.5 rounded-xl border border-zinc-200">
                                                MÃ: #{appt.id}
                                            </div>
                                        </div>

                                        {/* Chẩn đoán */}
                                        <div className={`p-4 sm:p-5 rounded-2xl border mb-5 transition-colors ${['BOOKED', 'DIAGNOSING'].includes(appt.appointment_status) ? 'bg-zinc-50 border-zinc-200 border-dashed' : 'bg-slate-50 border-slate-200 shadow-inner'}`}>
                                            <div className="flex items-start gap-3.5">
                                                <div className="mt-0.5 p-1.5 bg-white rounded-lg shadow-sm text-slate-400"><FileText size={16} /></div>
                                                <div>
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                                                        {['BOOKED'].includes(appt.appointment_status) ? 'Ghi chú đặt lịch' : 'Kết quả chẩn đoán'}
                                                    </span>
                                                    <p className={`text-sm leading-relaxed ${['BOOKED', 'DIAGNOSING'].includes(appt.appointment_status) && !appt.description ? 'text-slate-400 italic font-medium' : 'text-slate-700 font-bold'}`}>
                                                        {appt.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dịch vụ */}
                                        {appt.has_repair_order && appt.services.length > 0 && (
                                            <div className="bg-blue-50/50 p-4 sm:p-5 rounded-2xl border border-blue-100/80 mb-6">
                                                <div className="flex items-start gap-3.5">
                                                    <div className="mt-0.5 p-1.5 bg-blue-100 rounded-lg text-blue-600"><Wrench size={16} /></div>
                                                    <div className="w-full">
                                                        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-2 block">Dịch vụ áp dụng</span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {appt.services.map((service, idx) => (
                                                                <span key={idx} className="bg-white border border-blue-200/60 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                                                                    {service}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Thợ & Chi nhánh */}
                                        <div className="mt-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            {appt.mechanic_name ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-600 shadow-sm">
                                                        <UserCog size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Kỹ thuật viên</p>
                                                        <p className="text-sm font-bold text-slate-800">{appt.mechanic_name} <span className="text-slate-300 mx-1.5">|</span> <span className="text-blue-600">{appt.mechanic_phone}</span></p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 opacity-60 grayscale">
                                                    <div className="p-2 bg-zinc-100 rounded-xl border border-zinc-200 text-slate-400">
                                                        <UserCog size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Kỹ thuật viên</p>
                                                        <p className="text-sm font-medium text-slate-500 italic">Chưa phân công</p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-zinc-50 px-3 py-2 rounded-xl border border-zinc-200">
                                                <MapPin size={14} className="text-red-500" />
                                                {appt.branch_name}
                                            </div>
                                        </div>

                                        {/* KHỐI HÓA ĐƠN */}
                                        {appt.has_repair_order && (
                                            <div className={`mt-6 p-5 sm:p-6 rounded-[1.5rem] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 shadow-xl transition-all border ${appt.payment_status === 'PAYED'
                                                ? 'bg-slate-900 border-slate-800 text-white shadow-slate-900/10'
                                                : 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-400/50 text-white shadow-orange-500/20'
                                                }`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3.5 rounded-2xl ${appt.payment_status === 'PAYED' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'bg-white/20 text-white border border-white/20 backdrop-blur-sm'}`}>
                                                        <Receipt size={28} />
                                                    </div>
                                                    <div>
                                                        <span className="text-[11px] font-bold uppercase tracking-widest block mb-1.5 opacity-70">Tổng thanh toán</span>
                                                        <span className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm">{formatCurrency(appt.total_price)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col sm:items-end w-full sm:w-auto mt-2 sm:mt-0">
                                                    <span className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider border flex items-center justify-center gap-2 w-full sm:w-auto shadow-inner ${appt.payment_status === 'PAYED'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                        : 'bg-white text-orange-600 border-transparent shadow-lg'
                                                        }`}>
                                                        {appt.payment_status === 'PAYED' ? (
                                                            <><CheckCircle2 size={16} /> ĐÃ THANH TOÁN</>
                                                        ) : (
                                                            <><Clock size={16} /> CHƯA THANH TOÁN</>
                                                        )}
                                                    </span>
                                                    {appt.payment_status === 'PAYED' && appt.payment_date && (
                                                        <p className="text-[11px] font-medium mt-2.5 opacity-60 flex items-center justify-center sm:justify-end gap-1.5 w-full">
                                                            Ghi nhận lúc: {formatStatusTime(appt.payment_date)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}