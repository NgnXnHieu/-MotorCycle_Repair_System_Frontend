import React, { useState, useEffect } from 'react';
import {
    FaMotorcycle, FaUser, FaPhone, FaSearch, FaFilter,
    FaSpinner, FaClipboardCheck, FaTools, FaUserCog,
    FaMoneyBillWave, FaCheckCircle, FaTimesCircle, FaMapMarkerAlt,
    FaWallet, FaCreditCard, FaRegClock // <-- Thêm các icon mới phục vụ thanh toán
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { shiftInBranchApi } from '../../api/shiftInBranchApi';
import { appointmentApi } from '../../api/appointmentApi';
import Pagination from '../../components/common/Pagination';

const MechanicAppointmentManagement = () => {
    // ================= 1. STATES QUẢN LÝ TAB, FILTER & PAGINATION =================
    const [activeTab, setActiveTab] = useState('regular');
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0]; // Format yyyy-mm-dd cho thẻ input date
    });
    const [selectedShift, setSelectedShift] = useState('');
    const [activeStatus, setActiveStatus] = useState('');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // ================= 2. STATES DỮ LIỆU TỪ API =================
    const [shifts, setShifts] = useState([]);
    const [mechanicStatuses, setMechanicStatuses] = useState([]); // Chứa WAITING, FIXING, FINISHED
    const [appointments, setAppointments] = useState([]);

    const [loading, setLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // ================= 3. UTILS & HELPER =================
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

    // ================= 4. GỌI API KHỞI TẠO =================
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

    // ================= 5. LOAD DANH SÁCH =================
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

    // ================= 6. HÀM XỬ LÝ SỰ KIỆN CỦA THỢ =================
    const handleStartFixing = async (id, isEmergency) => {
        const result = await Swal.fire({
            title: isEmergency ? 'Tiếp nhận cứu hộ?' : 'Nhận ca sửa chữa?',
            text: "Xác nhận bắt đầu tiến hành công việc này?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Đồng ý, bắt đầu!',
            cancelButtonText: 'Hủy'
        });

        if (!result.isConfirmed) return;

        try {
            await appointmentApi.updateMechanicToFixing(id)
            await Swal.fire({
                icon: 'success', title: 'Đã nhận ca!', text: 'Trạng thái đã chuyển sang Đang sửa.', timer: 1500, showConfirmButton: false
            });
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            Swal.fire('Lỗi', 'Không thể cập nhật trạng thái. Vui lòng thử lại.', 'error');
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
            cancelButtonText: 'Chưa'
        });

        if (!result.isConfirmed) return;

        try {
            await appointmentApi.updateMechanicToFinished(id);
            await Swal.fire({
                icon: 'success', title: 'Tuyệt vời!', text: 'Công việc đã được đánh dấu hoàn thành.', timer: 1500, showConfirmButton: false
            });
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            Swal.fire('Lỗi', 'Không thể cập nhật trạng thái. Vui lòng thử lại.', 'error');
        }
    };

    // --- HÀM XỬ LÝ THANH TOÁN MỚI THÊM ---
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
            confirmButtonColor: '#22c55e', // Xanh lá cho Tiền mặt
            denyButtonColor: '#3b82f6',    // Xanh dương cho Chuyển khoản
        });

        // isConfirmed: Nút Tiền mặt, isDenied: Nút Chuyển khoản
        if (result.isConfirmed || result.isDenied) {
            const paymentMethod = result.isConfirmed ? 'CASH' : 'TRANSFER';

            try {
                // TODO: Gọi API cập nhật trạng thái thanh toán (Bạn cần bổ sung hàm này bên file appointmentApi.js)
                // Ví dụ: await appointmentApi.updatePaymentStatus(repairOrderId, { method: paymentMethod });

                await Swal.fire({
                    icon: 'success',
                    title: 'Thanh toán thành công!',
                    text: `Đã xác nhận thanh toán qua ${paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}.`,
                    timer: 2000,
                    showConfirmButton: false
                });
                setRefreshKey(prev => prev + 1);
            } catch (error) {
                console.error("Lỗi khi thanh toán:", error);
                Swal.fire('Lỗi', 'Không thể xử lý thanh toán. Vui lòng thử lại.', 'error');
            }
        }
    };

    // ================= 7. RENDER =================
    return (
        <div className="p-6 bg-gray-50 min-h-screen relative font-sans">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Không gian làm việc của Kỹ thuật viên</h1>

            {/* TABS SWITCHER */}
            <div className="flex gap-2 mb-6 border-b border-gray-300 pb-2">
                <button
                    onClick={() => { setActiveTab('regular'); setActiveStatus(''); }}
                    className={`px-6 py-2 font-semibold rounded-t-md transition-colors ${activeTab === 'regular'
                        ? 'bg-[#5b9b8b] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                    Ca sửa tại xưởng
                </button>
                <button
                    onClick={() => { setActiveTab('emergency'); setActiveStatus(''); }}
                    className={`px-6 py-2 font-semibold rounded-t-md transition-colors ${activeTab === 'emergency'
                        ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                    Ca cứu hộ khẩn cấp
                </button>
            </div>

            {/* FILTERS AREA */}
            <div className="bg-white p-4 rounded-md shadow-sm mb-6 flex flex-wrap gap-4 items-end">
                <div className="flex flex-col">
                    <label className="text-sm text-gray-600 mb-1">Chọn ngày</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 outline-none focus:border-[#5b9b8b]"
                    />
                </div>

                {activeTab === 'regular' && (
                    <div className="flex flex-col">
                        <label className="text-sm text-gray-600 mb-1">Khung giờ</label>
                        <select
                            value={selectedShift}
                            onChange={(e) => setSelectedShift(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-2 outline-none focus:border-[#5b9b8b] min-w-[150px]"
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
            <div className="flex flex-wrap gap-2 mb-6">
                <button
                    onClick={() => setActiveStatus('')}
                    className={`px-4 py-1.5 text-sm rounded border transition-colors ${activeStatus === ''
                        ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                >
                    Tất cả
                </button>
                {mechanicStatuses.map((status, index) => (
                    <button
                        key={`status-${status}-${index}`}
                        onClick={() => setActiveStatus(status)}
                        className={`px-4 py-1.5 text-sm rounded border transition-colors ${activeStatus === status
                            ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                    >
                        {translateStatus(status, activeTab === 'emergency')}
                    </button>
                ))}
            </div>

            {/* TICKET LIST */}
            <div className="flex flex-col gap-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">
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
                        const firstService = item.serviceDetialDTOList?.[0]?.serviceDTO;
                        const locationInfo = item.appointmentLocationDTO;

                        return (
                            <div key={`appt-${appt?.id}-${index}`} className={`bg-white border-2 rounded-lg shadow-sm flex flex-col md:flex-row overflow-hidden ${isEmergency ? 'border-red-100' : 'border-gray-100'}`}>
                                {/* Cột trái: Thông tin xe & khách hàng */}
                                <div className={`${isEmergency ? 'bg-red-50/30' : 'bg-gray-100'} p-4 md:w-1/4 border-r border-gray-200 flex flex-col justify-center`}>
                                    <div className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                        <FaMotorcycle className={isEmergency ? "text-red-500" : "text-[#5b9b8b]"} />
                                        {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Chưa có thông tin xe'}
                                    </div>
                                    <div className="text-gray-600 text-sm mb-3">
                                        {vehicle?.licensePlate || 'Chưa cập nhật biển số'}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-700 mt-2">
                                        <FaUser className="text-gray-400" /> {appt?.bringer_name || 'Không rõ tên'}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-700 mt-1">
                                        <FaPhone className="text-gray-400" />
                                        <span className={!appt?.bringer_phone ? 'text-red-400 italic' : 'font-medium'}>
                                            {appt?.bringer_phone || 'Chưa có SĐT'}
                                        </span>
                                    </div>
                                </div>

                                {/* Cột phải: Chi tiết công việc & Hành động */}
                                <div className="p-4 md:w-3/4 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex gap-3 items-center">
                                                <span className={`font-semibold ${isEmergency ? 'text-red-600' : 'text-[#5b9b8b]'}`}>Mã phiếu: #{appt?.id}</span>
                                                <span className={`text-xs px-2 py-1 rounded border font-medium ${isEmergency ? 'bg-red-100 text-red-700 border-red-200' : (appt?.appointmentType === "ONLINE" ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-700 border-gray-200')}`}>
                                                    {isEmergency ? "🚨 Cứu hộ khẩn cấp" : (appt?.appointmentType === "ONLINE" ? "Khách đặt lịch" : "Khách vãng lai")}
                                                </span>
                                                {shiftInfo && !isEmergency && (
                                                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded border border-blue-200">
                                                        {shiftInfo.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <p className="text-sm text-gray-700 mb-2">
                                                <strong>Tình trạng khách báo:</strong>{' '}
                                                {isEmergency && locationInfo?.descriptionOfCus
                                                    ? locationInfo.descriptionOfCus
                                                    : (appt?.description || 'Chưa có mô tả lỗi')}
                                            </p>

                                            {isEmergency && locationInfo?.mapUrl && (
                                                <a href={locationInfo.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors shadow-sm">
                                                    <FaMapMarkerAlt className="text-red-500" /> Vị trí cứu hộ (Bản đồ)
                                                </a>
                                            )}
                                        </div>

                                        {/* Khung nhiệm vụ của thợ & Chi phí */}
                                        {repairOrder && (
                                            <div className="mt-4 bg-blue-50/50 border border-blue-100 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 shadow-sm">
                                                <div className="col-span-1 md:col-span-2 bg-white p-3 rounded-lg border border-blue-50">
                                                    <div className="flex items-start gap-3 text-sm">
                                                        <FaClipboardCheck className="text-blue-500 text-lg mt-0.5 shrink-0" />
                                                        <div>
                                                            <span className="font-bold text-blue-900 block mb-1">Kết luận / Yêu cầu sửa chữa </span>
                                                            <span className="text-gray-700 italic">
                                                                {appt.description}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-3 text-sm pl-1">
                                                    <FaTools className="text-orange-500 text-base mt-0.5 shrink-0" />
                                                    <div>
                                                        <span className="font-semibold text-gray-700 block mb-0.5">Dịch vụ cần làm:</span>
                                                        <span className="text-gray-800 font-medium line-clamp-1">
                                                            {firstService?.name || 'Đang cập nhật'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* --- BỔ SUNG: CHI PHÍ & THANH TOÁN --- */}
                                                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                                                    {/* Tổng chi phí */}
                                                    <div className="flex items-start gap-3 text-sm pl-1 pt-3 border-t border-blue-100/50">
                                                        <FaMoneyBillWave className="text-green-600 text-base mt-0.5 shrink-0" />
                                                        <div>
                                                            <span className="font-semibold text-gray-700 block mb-0.5">Tổng chi phí:</span>
                                                            <span className="text-red-600 font-bold text-base">
                                                                {repairOrder?.total_price ? formatPrice(repairOrder.total_price) : '0 ₫'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Trạng thái thanh toán */}
                                                    <div className="flex items-start gap-3 text-sm pl-1 pt-3 border-t border-blue-100/50">
                                                        {repairOrder?.payment_status === 'PAID' ? (
                                                            <FaCheckCircle className="text-green-500 text-base mt-0.5 shrink-0" />
                                                        ) : (
                                                            <FaTimesCircle className="text-yellow-500 text-base mt-0.5 shrink-0" />
                                                        )}
                                                        <div>
                                                            <span className="font-semibold text-gray-700 block mb-1">Thanh toán:</span>
                                                            <div className="flex flex-col gap-1">
                                                                {repairOrder?.payment_status === 'PAID' ? (
                                                                    <>
                                                                        <span className="bg-green-100 text-green-700 border border-green-200 text-xs px-2 py-0.5 rounded font-semibold shadow-sm w-fit">
                                                                            Đã thanh toán
                                                                        </span>
                                                                        {/* Hiển thị thời gian thanh toán nếu có */}
                                                                        {repairOrder?.payment_time && (
                                                                            <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                                                <FaRegClock /> {new Date(repairOrder.payment_time).toLocaleString('vi-VN')}
                                                                            </span>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <span className="bg-yellow-100 text-yellow-700 border border-yellow-200 text-xs px-2 py-0.5 rounded font-semibold shadow-sm w-fit">
                                                                        Chưa thanh toán
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer card: Trạng thái & Nút chức năng cho THỢ */}
                                    <div className="flex flex-wrap justify-between items-end pt-3 border-t border-gray-100 mt-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-sm text-gray-500">
                                                <span className="font-medium">Cập nhật lúc: </span>
                                                {new Date(appt?.status_time || appt?.created_at).toLocaleString('vi-VN')}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 mt-3 sm:mt-0">
                                            <span className={`px-4 py-1.5 rounded font-medium text-sm text-white shadow-sm
                                                ${status === 'WAITING' ? 'bg-purple-500' :
                                                    status === 'FIXING' ? 'bg-blue-500' :
                                                        status === 'FINISHED' ? 'bg-green-500' : 'bg-gray-500'}`}>
                                                {translateStatus(status, isEmergency)}
                                            </span>

                                            {/* NÚT THU TIỀN (Hiển thị nếu chưa thanh toán) */}
                                            {repairOrder && repairOrder?.payment_status !== 'PAID' && (
                                                <button
                                                    onClick={() => handlePayment(repairOrder.id)}
                                                    className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-1.5 rounded text-sm font-semibold transition-colors shadow-md flex items-center gap-2"
                                                >
                                                    <FaMoneyBillWave /> Thu tiền
                                                </button>
                                            )}

                                            {/* HIỂN THỊ NÚT DỰA VÀO TRẠNG THÁI CA LÀM VIỆC */}
                                            {status === 'WAITING' && (
                                                <button
                                                    onClick={() => handleStartFixing(appt.id, isEmergency)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded text-sm font-semibold transition-colors shadow-md flex items-center gap-2"
                                                >
                                                    <FaTools /> Nhận ca
                                                </button>
                                            )}

                                            {status === 'FIXING' && (
                                                <button
                                                    onClick={() => handleFinishFixing(appt.id)}
                                                    className="bg-green-500 hover:bg-green-600 text-white px-5 py-1.5 rounded text-sm font-semibold transition-colors shadow-md flex items-center gap-2"
                                                >
                                                    <FaCheckCircle /> Hoàn thành
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
                    <div className="text-center py-10 text-gray-500 flex flex-col items-center gap-2">
                        <FaFilter size={30} className="text-gray-300" />
                        <p>Không có công việc nào trong danh sách hiện tại.</p>
                    </div>
                )}
            </div>

            {/* HIỂN THỊ COMPONENT PHÂN TRANG */}
            {!loading && totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                />
            )}
        </div>
    );
};

export default MechanicAppointmentManagement;