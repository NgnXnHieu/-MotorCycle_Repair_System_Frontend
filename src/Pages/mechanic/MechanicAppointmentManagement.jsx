import React, { useState, useEffect } from 'react';
import {
    FaMotorcycle, FaUser, FaPhone, FaSearch, FaFilter,
    FaSpinner, FaClipboardCheck, FaTools, FaUserCog,
    FaMoneyBillWave, FaCheckCircle, FaTimesCircle, FaMapMarkerAlt,
    FaWallet, FaCreditCard, FaRegClock
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { shiftInBranchApi } from '../../api/shiftInBranchApi';
import { appointmentApi } from '../../api/appointmentApi';
import { serviceApi } from '../../api/serviceApi'; // <-- Thêm import serviceApi
import Pagination from '../../components/common/Pagination';

// THÊM IMPORT MODAL CHI TIẾT DỊCH VỤ
import ServiceDetailModal from '../customer/ServiceDetailModal'; // Hãy sửa đường dẫn cho đúng với dự án của bạn

const MechanicAppointmentManagement = () => {
    // ================= 1. STATES QUẢN LÝ TAB, FILTER & PAGINATION =================
    const [activeTab, setActiveTab] = useState('regular');
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [selectedShift, setSelectedShift] = useState('');
    const [activeStatus, setActiveStatus] = useState('');

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // ================= 2. STATES DỮ LIỆU TỪ API =================
    const [shifts, setShifts] = useState([]);
    const [mechanicStatuses, setMechanicStatuses] = useState([]);
    const [appointments, setAppointments] = useState([]);

    const [loading, setLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // ================= 3. STATES CHO MODAL CHI TIẾT DỊCH VỤ =================
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [selectedServiceData, setSelectedServiceData] = useState(null);
    const [isServiceLoading, setIsServiceLoading] = useState(false);

    // ================= 4. UTILS & HELPER =================
    const translateStatus = (apiStatus, isEmergency = false) => {
        if (isEmergency) {
            const emergencyMap = {
                'WAITING': 'Yêu cầu hỗ trợ',
                'FIXING': 'Đang sửa',
                'FINISHED': 'Đã sửa'
            };
            return emergencyMap[apiStatus] || apiStatus;
        }

        const statusMap = {
            'WAITING': 'Được phân ca',
            'FIXING': 'Đang sửa',
            'FINISHED': 'Đã sửa'
        };
        return statusMap[apiStatus] || apiStatus;
    };

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    // ================= 5. GỌI API KHỞI TẠO =================
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [shiftRes, statusRes] = await Promise.all([
                    shiftInBranchApi.getShiftByBranch(),
                    appointmentApi.getStatusesMechanic()
                ]);

                const shiftData = Array.isArray(shiftRes) ? shiftRes : (shiftRes?.data || []);
                setShifts(shiftData);

                if (shiftData.length > 0) {
                    const now = new Date();
                    const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
                    let bestShiftId = shiftData[0].shiftInBranchId;
                    let minDiff = Infinity;

                    for (const s of shiftData) {
                        const [sH, sM, sS] = s.startTime.split(':').map(Number);
                        const [eH, eM, eS] = s.endTime.split(':').map(Number);
                        const startSec = sH * 3600 + sM * 60 + sS;
                        const endSec = eH * 3600 + eM * 60 + eS;

                        if (currentSeconds >= startSec && currentSeconds <= endSec) {
                            bestShiftId = s.shiftInBranchId;
                            break;
                        }
                        const diff = Math.abs(currentSeconds - startSec);
                        if (diff < minDiff) {
                            minDiff = diff;
                            bestShiftId = s.shiftInBranchId;
                        }
                    }
                    setSelectedShift(bestShiftId.toString());
                }

                setMechanicStatuses(Array.isArray(statusRes) ? statusRes : (statusRes?.data || []));
            } catch (error) {
                console.error("Lỗi khi load dữ liệu ban đầu:", error);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        setCurrentPage(0);
    }, [activeTab, selectedDate, selectedShift, activeStatus]);

    // ================= 6. LOAD DANH SÁCH =================
    useEffect(() => {
        const fetchAppointments = async () => {
            setLoading(true);
            try {
                let formattedDate = null;
                if (selectedDate) {
                    const [year, month, day] = selectedDate.split('-');
                    formattedDate = `${day}/${month}/${year}`;
                }

                const filterForm = {
                    day: formattedDate,
                    shiftInBranchId: selectedShift ? parseInt(selectedShift) : null,
                    status: activeStatus || null,
                    appointmentType: activeTab === 'regular' ? "OFFLINE" : "EMERGENCY",
                    page: currentPage,
                    size: 10
                };

                const res = await appointmentApi.getAppointmentMechanic(filterForm);
                const responseData = res?.data || res;

                setAppointments(responseData?.content || []);
                setTotalPages(responseData?.page?.totalPages || 0);

            } catch (error) {
                console.error("Lỗi khi load danh sách ca sửa:", error);
                setAppointments([]);
                setTotalPages(0);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, [selectedDate, selectedShift, activeStatus, activeTab, currentPage, refreshKey]);

    // ================= 7. HÀM XỬ LÝ SỰ KIỆN =================

    // HÀM CLICK MỞ MODAL CHI TIẾT DỊCH VỤ
    const handleServiceClick = async (serviceDetailId) => {
        setIsServiceLoading(true);
        try {
            const response = await serviceApi.getServiceDetail(serviceDetailId);
            const data = response.data || response;
            setSelectedServiceData(data);
            setIsServiceModalOpen(true);
        } catch (error) {
            console.error("Lỗi khi tải chi tiết dịch vụ:", error);
            Swal.fire('Lỗi', 'Không thể tải thông tin dịch vụ.', 'error');
        } finally {
            setIsServiceLoading(false);
        }
    };

    const handleStartFixing = async (id, isEmergency) => {
        const result = await Swal.fire({
            title: isEmergency ? 'Tiếp nhận cứu hộ?' : 'Nhận ca sửa chữa?',
            text: "Xác nhận bắt đầu tiến hành công việc này?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Đồng ý, bắt đầu!',
            cancelButtonText: 'Hủy',
            borderRadius: '0' // Xóa bo góc Swal cho đồng bộ UI
        });

        if (!result.isConfirmed) return;

        try {
            await appointmentApi.updateMechanicToFixing(id)
            await Swal.fire({
                icon: 'success', title: 'Đã nhận ca!', text: 'Trạng thái đã chuyển sang Đang sửa.', timer: 1500, showConfirmButton: false
            });
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            Swal.fire('Lỗi', 'Không thể cập nhật trạng thái.', 'error');
        }
    };

    const handleFinishFixing = async (id) => {
        const result = await Swal.fire({
            title: 'Hoàn thành công việc?',
            text: "Xác nhận bạn đã hoàn tất việc sửa chữa cho xe này?",
            icon: 'success',
            showCancelButton: true,
            confirmButtonColor: '#22c55e',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Đã hoàn thành',
            cancelButtonText: 'Chưa',
            borderRadius: '0'
        });

        if (!result.isConfirmed) return;

        try {
            await appointmentApi.updateMechanicToFinished(id);
            await Swal.fire({
                icon: 'success', title: 'Tuyệt vời!', text: 'Công việc đã được đánh dấu hoàn thành.', timer: 1500, showConfirmButton: false
            });
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            Swal.fire('Lỗi', 'Không thể cập nhật trạng thái.', 'error');
        }
    };

    const handlePayment = async (repairOrderId) => {
        const result = await Swal.fire({
            title: 'Kích hoạt thanh toán',
            text: 'Vui lòng chọn hình thức thanh toán của khách hàng:',
            icon: 'info',
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-wallet"></i> Tiền mặt',
            denyButtonText: '<i class="fas fa-credit-card"></i> Chuyển khoản',
            cancelButtonText: 'Hủy',
            confirmButtonColor: '#22c55e',
            denyButtonColor: '#3b82f6',
            borderRadius: '0'
        });

        if (result.isConfirmed || result.isDenied) {
            const paymentMethod = result.isConfirmed ? 'CASH' : 'TRANSFER';
            try {
                // await appointmentApi.updatePaymentStatus(repairOrderId, { method: paymentMethod });
                await Swal.fire({
                    icon: 'success', title: 'Thanh toán thành công!', text: `Đã xác nhận qua ${paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}.`, timer: 2000, showConfirmButton: false
                });
                setRefreshKey(prev => prev + 1);
            } catch (error) {
                Swal.fire('Lỗi', 'Không thể xử lý thanh toán.', 'error');
            }
        }
    };

    // ================= 8. RENDER =================
    return (
        <div className="p-6 bg-gray-100 min-h-screen relative font-sans">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 uppercase tracking-wide border-l-4 border-gray-800 pl-3">Không gian làm việc - Kỹ thuật viên</h1>

            {/* TABS SWITCHER (Vuông vức, tương phản cao) */}
            <div className="flex gap-1 mb-6 border-b-2 border-gray-300 pb-0">
                <button
                    onClick={() => { setActiveTab('regular'); setActiveStatus(''); }}
                    className={`px-8 py-3 font-bold rounded-t-sm transition-colors border-b-4 ${activeTab === 'regular'
                        ? 'bg-[#5b9b8b] text-white border-green-800' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border-transparent'}`}
                >
                    CA SỬA TẠI CỬA HÀNG
                </button>
                <button
                    onClick={() => { setActiveTab('emergency'); setActiveStatus(''); }}
                    className={`px-8 py-3 font-bold rounded-t-sm transition-colors border-b-4 ${activeTab === 'emergency'
                        ? 'bg-red-600 text-white border-red-800' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border-transparent'}`}
                >
                    CA CỨU HỘ KHẨN CẤP
                </button>
            </div>

            {/* FILTERS AREA */}
            <div className="bg-white p-5 rounded-sm shadow-md border border-gray-300 mb-6 flex flex-wrap gap-5 items-end">
                <div className="flex flex-col">
                    <label className="text-sm font-bold text-gray-800 mb-1">Chọn ngày</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="border border-gray-400 rounded-sm px-4 py-2 outline-none focus:border-[#5b9b8b] focus:ring-1 focus:ring-[#5b9b8b]"
                    />
                </div>

                {activeTab === 'regular' && (
                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-800 mb-1">Khung giờ</label>
                        <select
                            value={selectedShift}
                            onChange={(e) => setSelectedShift(e.target.value)}
                            className="border border-gray-400 rounded-sm px-4 py-2 outline-none focus:border-[#5b9b8b] focus:ring-1 focus:ring-[#5b9b8b] min-w-[200px]"
                        >
                            <option value="">Tất cả khung giờ</option>
                            {shifts.map((shiftInfo, index) => (
                                <option key={`shift-${shiftInfo.shiftInBranchId}-${index}`} value={shiftInfo.shiftInBranchId}>
                                    {shiftInfo.shiftName} ({shiftInfo.startTime?.slice(0, 5)} - {shiftInfo.endTime?.slice(0, 5)})
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* STATUS TABS */}
            <div className="flex flex-wrap gap-2 mb-8">
                <button
                    onClick={() => setActiveStatus('')}
                    className={`px-5 py-2 text-sm font-bold rounded-sm border transition-colors ${activeStatus === ''
                        ? 'bg-gray-800 text-white border-gray-900' : 'bg-white text-gray-800 border-gray-400 hover:bg-gray-200'}`}
                >
                    TẤT CẢ
                </button>
                {mechanicStatuses.map((status, index) => (
                    <button
                        key={`status-${status}-${index}`}
                        onClick={() => setActiveStatus(status)}
                        className={`px-5 py-2 text-sm font-bold rounded-sm border transition-colors ${activeStatus === status
                            ? 'bg-[#5b9b8b] text-white border-green-800' : 'bg-white text-gray-800 border-gray-400 hover:bg-gray-200'}`}
                    >
                        {translateStatus(status, activeTab === 'emergency').toUpperCase()}
                    </button>
                ))}
            </div>

            {/* TICKET LIST - Tăng gap lên 6 để phân chia rõ ràng */}
            <div className="flex flex-col gap-6">
                {loading ? (
                    <div className="text-center py-10 text-gray-600 font-bold">
                        <FaSpinner className="animate-spin inline-block text-2xl mr-2" /> Đang tải dữ liệu...
                    </div>
                ) : (
                    appointments.map((item, index) => {
                        const appt = item.appointmentDTO;
                        const vehicle = appt?.vehicleDTO;
                        const shiftInfo = appt?.dailyShiftCapacityDTO?.shiftInBranchDTO?.shiftDTO;
                        const status = appt?.appointment_status;
                        const isEmergency = activeTab === 'emergency';
                        const repairOrder = item.repairOrderDTO;
                        const serviceList = item.serviceDetialDTOList || [];
                        const locationInfo = item.appointmentLocationDTO;

                        return (
                            <div key={`appt-${appt?.id}-${index}`}
                                className={`bg-white border border-gray-300 shadow-md rounded-sm flex flex-col md:flex-row overflow-hidden relative border-l-8 ${isEmergency ? 'border-l-red-600' : 'border-l-[#5b9b8b]'}`}
                            >
                                {/* ================== CỘT TRÁI: THÔNG TIN KHÁCH HÀNG ================== */}
                                <div className={`p-5 md:w-[28%] border-r border-gray-300 flex flex-col justify-center ${isEmergency ? 'bg-red-50' : 'bg-gray-50'}`}>

                                    {/* 1. Biển số xe nổi bật */}
                                    <div className="mb-3">
                                        <span className="bg-green-300 text-gray-900 font-bold text-xl px-4 py-1.5 rounded-sm border-2 border-gray-600 shadow-sm tracking-widest inline-block uppercase">
                                            {vehicle?.licensePlate || 'CHƯA CÓ BSX'}
                                        </span>
                                    </div>

                                    {/* 2. Loại xe */}
                                    <div className="font-bold text-base text-gray-700 flex items-center gap-2 uppercase mb-4">
                                        <FaMotorcycle className={isEmergency ? "text-red-600" : "text-[#5b9b8b]"} size={20} />
                                        {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Chưa có thông tin xe'}
                                    </div>

                                    {/* 3. Tên và SĐT thiết kế vuông vức, sạch sẽ */}
                                    <div className="flex items-center gap-3 text-sm text-gray-800 mt-2 font-medium">
                                        <div className="w-6 h-6 rounded-sm flex items-center justify-center bg-gray-200 border border-gray-300"><FaUser className="text-gray-600" size={12} /></div>
                                        {appt?.bringer_name || 'Không rõ tên'}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-800 mt-3 font-medium">
                                        <div className="w-6 h-6 rounded-sm flex items-center justify-center bg-gray-200 border border-gray-300"><FaPhone className="text-gray-600" size={12} /></div>
                                        <span className={!appt?.bringer_phone ? 'text-red-500 italic' : 'font-bold'}>
                                            {appt?.bringer_phone || 'Chưa có SĐT'}
                                        </span>
                                    </div>
                                </div>

                                {/* ================== CỘT PHẢI: CHI TIẾT & HÀNH ĐỘNG ================== */}
                                <div className="p-5 md:w-[72%] flex flex-col justify-between relative bg-white">

                                    {/* STATUS BADGE GÓC TRÊN BÊN PHẢI */}
                                    <div className="absolute top-4 right-5">
                                        <span className={`px-4 py-1.5 rounded-sm font-black text-xs text-white shadow-sm uppercase tracking-wider
                                            ${status === 'WAITING' ? 'bg-purple-600' :
                                                status === 'FIXING' ? 'bg-blue-600' :
                                                    status === 'FINISHED' ? 'bg-green-600' : 'bg-gray-600'}`}>
                                            {translateStatus(status, isEmergency)}
                                        </span>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-start mb-4 border-b border-gray-200 pb-3 pr-32"> {/* Thêm pr-32 để không đè lên status */}
                                            <div className="flex flex-wrap gap-3 items-center">
                                                <span className={`font-black text-lg ${isEmergency ? 'text-red-700' : 'text-[#5b9b8b]'}`}>MÃ PHIẾU: #{appt?.id}</span>
                                                <span className={`text-xs px-3 py-1.5 rounded-sm border font-bold uppercase tracking-wide ${isEmergency ? 'bg-red-100 text-red-800 border-red-300' : (appt?.appointmentType === "ONLINE" ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-gray-200 text-gray-800 border-gray-400')}`}>
                                                    {isEmergency ? "🚨 Cứu hộ" : (appt?.appointmentType === "ONLINE" ? "Khách đặt lịch" : "Khách vãng lai")}
                                                </span>
                                                {shiftInfo && !isEmergency && (
                                                    <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1.5 rounded-sm border border-blue-300 font-bold uppercase">
                                                        {shiftInfo.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Tình trạng khách báo */}
                                        <div className="mb-4">
                                            <p className="text-sm text-gray-800 mb-2 leading-relaxed bg-yellow-50 border border-yellow-200 p-3 rounded-sm">
                                                <strong className="text-gray-900 uppercase">Tình trạng khách báo:</strong>{' '}
                                                {isEmergency && locationInfo?.descriptionOfCus
                                                    ? locationInfo.descriptionOfCus
                                                    : (appt?.description || 'Chưa có mô tả lỗi')}
                                            </p>

                                            {isEmergency && locationInfo?.mapUrl && (
                                                <a href={locationInfo.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 px-4 py-2 rounded-sm text-sm font-bold transition-colors shadow-sm mt-1">
                                                    <FaMapMarkerAlt /> XEM VỊ TRÍ KHÁCH HÀNG (BẢN ĐỒ)
                                                </a>
                                            )}
                                        </div>

                                        {/* Khung nhiệm vụ của thợ & Chi phí (Viền vuông, rõ ràng) */}
                                        {repairOrder && (
                                            <div className="mt-5 bg-blue-50 border border-blue-200 rounded-sm p-4 grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-6">

                                                <div className="col-span-1 md:col-span-2 bg-white p-3 rounded-sm border border-blue-200 shadow-sm">
                                                    <div className="flex items-start gap-3 text-sm">
                                                        <FaClipboardCheck className="text-blue-600 text-lg mt-0.5 shrink-0" />
                                                        <div>
                                                            <span className="font-black text-blue-900 uppercase block mb-1">Yêu cầu sửa chữa: </span>
                                                            <span className="text-gray-800 font-medium">
                                                                {appt.description}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Danh sách dịch vụ - Hiển thị thành các nút bấm giống quản lý */}
                                                <div className="flex items-start gap-3 text-sm pl-1 pr-2">
                                                    <FaTools className="text-orange-600 text-base mt-0.5 shrink-0" />
                                                    <div className="w-full">
                                                        <span className="font-black text-gray-900 uppercase block mb-2">Dịch vụ cần làm:</span>
                                                        {serviceList.length > 0 ? (
                                                            <div className="flex flex-wrap gap-2">
                                                                {serviceList.map((svcDetail, idx) => (
                                                                    <button
                                                                        key={idx}
                                                                        type="button"
                                                                        onClick={() => handleServiceClick(svcDetail.id)}
                                                                        disabled={isServiceLoading}
                                                                        className="bg-white border-2 border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-500 text-xs px-3 py-1.5 rounded-sm font-bold shadow-sm transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
                                                                        title="Nhấn để xem chi tiết"
                                                                    >
                                                                        {svcDetail.serviceDTO?.name || 'Không rõ tên'}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-500 italic font-medium block mt-1">Chưa cập nhật</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-3 text-sm pl-1">
                                                    <FaUserCog className="text-purple-600 text-base mt-0.5 shrink-0" />
                                                    <div>
                                                        <span className="font-black text-gray-900 uppercase block mb-1">Thợ phụ trách:</span>
                                                        <div className="bg-white border border-gray-300 px-2 py-1.5 rounded-sm inline-flex items-center shadow-sm">
                                                            <span className="text-gray-900 font-bold">
                                                                {repairOrder?.employeeDTO?.full_name || 'Chưa phân công'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Bổ sung: Chi phí & Thanh toán (Thêm border trên chia khối) */}
                                                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 pt-4 border-t border-blue-200">
                                                    <div className="flex items-start gap-3 text-sm pl-1">
                                                        <FaMoneyBillWave className="text-green-700 text-base mt-0.5 shrink-0" />
                                                        <div>
                                                            <span className="font-black text-gray-900 uppercase block mb-1">Tổng chi phí:</span>
                                                            <span className="text-red-600 font-black text-lg">
                                                                {repairOrder?.total_price ? formatPrice(repairOrder.total_price) : '0 ₫'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start gap-3 text-sm pl-1">
                                                        {repairOrder?.payment_status === 'PAID' ? (
                                                            <FaCheckCircle className="text-green-600 text-base mt-0.5 shrink-0" />
                                                        ) : (
                                                            <FaTimesCircle className="text-yellow-600 text-base mt-0.5 shrink-0" />
                                                        )}
                                                        <div>
                                                            <span className="font-black text-gray-900 uppercase block mb-1">Thanh toán:</span>
                                                            {repairOrder?.payment_status === 'PAID' ? (
                                                                <span className="bg-green-100 text-green-800 border-2 border-green-300 text-xs px-2 py-1 rounded-sm font-bold shadow-sm uppercase tracking-wide inline-block">
                                                                    ĐÃ THANH TOÁN
                                                                </span>
                                                            ) : (
                                                                <span className="bg-yellow-100 text-yellow-800 border-2 border-yellow-300 text-xs px-2 py-1 rounded-sm font-bold shadow-sm uppercase tracking-wide inline-block">
                                                                    CHƯA THANH TOÁN
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer card: Thời gian & Nút chức năng */}
                                    <div className="flex flex-wrap justify-between items-end pt-4 border-t border-gray-200 mt-5">

                                        <div className="flex flex-col gap-2">
                                            <div className="text-sm text-gray-600 font-medium bg-gray-100 px-3 py-1.5 rounded-sm border border-gray-300 flex items-center gap-2 shadow-sm">
                                                <span className="font-bold text-gray-800 uppercase text-xs">Tạo lúc:</span>
                                                {appt?.created_at ? new Date(appt.created_at).toLocaleString('vi-VN') : 'N/A'}
                                            </div>
                                            {appt?.status_time && (
                                                <div className="text-sm text-blue-800 font-medium bg-blue-50 px-3 py-1.5 rounded-sm border border-blue-200 flex items-center gap-2 shadow-sm">
                                                    <span className="font-bold uppercase text-xs">Cập nhật:</span>
                                                    {new Date(appt.status_time).toLocaleString('vi-VN')}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 mt-4 sm:mt-0">
                                            {/* NÚT THU TIỀN */}
                                            {repairOrder && repairOrder?.payment_status !== 'PAID' && (
                                                <button
                                                    onClick={() => handlePayment(repairOrder.id)}
                                                    className="bg-orange-500 border-2 border-orange-600 hover:bg-orange-600 text-white px-5 py-2 rounded-sm text-sm font-bold transition-colors shadow-md flex items-center gap-2 uppercase tracking-wide"
                                                >
                                                    <FaMoneyBillWave /> THU TIỀN
                                                </button>
                                            )}

                                            {/* NÚT NHẬN CA */}
                                            {status === 'WAITING' && (
                                                <button
                                                    onClick={() => handleStartFixing(appt.id, isEmergency)}
                                                    className="bg-blue-600 border-2 border-blue-700 hover:bg-blue-700 text-white px-5 py-2 rounded-sm text-sm font-bold transition-colors shadow-md flex items-center gap-2 uppercase tracking-wide"
                                                >
                                                    <FaTools /> NHẬN CA SỬA
                                                </button>
                                            )}

                                            {/* NÚT HOÀN THÀNH */}
                                            {status === 'FIXING' && (
                                                <button
                                                    onClick={() => handleFinishFixing(appt.id)}
                                                    className="bg-green-600 border-2 border-green-700 hover:bg-green-700 text-white px-5 py-2 rounded-sm text-sm font-bold transition-colors shadow-md flex items-center gap-2 uppercase tracking-wide"
                                                >
                                                    <FaCheckCircle /> HOÀN THÀNH
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

                {!loading && appointments.length === 0 && (
                    <div className="text-center py-16 text-gray-500 flex flex-col items-center gap-3 bg-white border border-gray-300 rounded-sm shadow-sm">
                        <FaFilter size={40} className="text-gray-300" />
                        <p className="font-bold text-lg text-gray-600">Không có công việc nào trong danh sách.</p>
                    </div>
                )}
            </div>

            {/* COMPONENT PHÂN TRANG */}
            {!loading && totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                />
            )}

            {/* MODAL HIỂN THỊ CHI TIẾT DỊCH VỤ */}
            <ServiceDetailModal
                isOpen={isServiceModalOpen}
                onClose={() => {
                    setIsServiceModalOpen(false);
                    setTimeout(() => setSelectedServiceData(null), 200);
                }}
                serviceData={selectedServiceData}
            />
        </div>
    );
};

export default MechanicAppointmentManagement;