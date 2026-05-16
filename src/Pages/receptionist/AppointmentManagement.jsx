import React, { useState, useEffect } from 'react';
import {
    FaMotorcycle,
    FaUser,
    FaPhone,
    FaWrench,
    FaTimes,
    FaPlus,
    FaMinus,
    FaSearch,
    FaFilter,
    FaSpinner,
    FaClipboardCheck,
    FaTools,
    FaUserCog,
    FaMoneyBillWave, FaCheckCircle, FaTimesCircle, FaMapMarkerAlt
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { shiftInBranchApi } from '../../api/shiftInBranchApi';
import { appointmentApi } from '../../api/appointmentApi';
import { employeeApi } from '../../api/employeeApi';
import { serviceApi } from '../../api/serviceApi';
import { categoryApi } from '../../api/categoryApi';
import { itemApi } from '../../api/itemApi';
import { useNavigate } from 'react-router-dom';
import PaymentQRCodeModal from '../customer/PaymentQRCodeModal';
import { paymentApi } from '../../api/paymentApi';

// IMPORT MODAL CHI TIẾT DỊCH VỤ VỪA TẠO
import ServiceDetailModal from '../customer/ServiceDetailModal';

const AppointmentManagement = () => {
    // ================= 1. STATES QUẢN LÝ TAB & FILTER =================
    const [activeTab, setActiveTab] = useState('regular');
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [selectedShift, setSelectedShift] = useState('');
    const [activeStatus, setActiveStatus] = useState('');

    // ================= 2. STATES DỮ LIỆU APPOINTMENT =================
    const [shifts, setShifts] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // ================= 3. STATES MASTER DATA TỪ API =================
    const [services, setServices] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [categories, setCategories] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);

    const [itemSearchText, setItemSearchText] = useState('');
    const [selectedItemCategory, setSelectedItemCategory] = useState('');
    const [filteredItems, setFilteredItems] = useState([]);

    // ================= 4. STATES CHO MODAL CHI TIẾT DỊCH VỤ =================
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [selectedServiceData, setSelectedServiceData] = useState(null);
    const [isServiceLoading, setIsServiceLoading] = useState(false);

    // ================= STATES CHO THANH TOÁN =================
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentData, setPaymentData] = useState(null);

    // ================= STATES CHO MODAL ĐÁNH GIÁ (GIỮ NGUYÊN) =================
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalLoading, setIsModalLoading] = useState(false);
    const [diagnoseForm, setDiagnoseForm] = useState({
        appointmentId: null,
        serviceId: '',
        description: '',
        employeeId: '',
        itemList: {}
    });

    const navigate = useNavigate();

    const REGULAR_STATUSES = ['BOOKED', 'DIAGNOSING', 'WAITING', 'FIXING', 'FINISHED', 'CANCELED'];
    const EMERGENCY_STATUSES = ['REQUEST', 'ACCEPT', 'WAITING', 'FIXING', 'FINISHED', 'CANCELED'];

    const translateStatus = (apiStatus, isEmergency = false) => {
        if (isEmergency) {
            const emergencyMap = {
                'REQUEST': 'Yêu cầu hỗ trợ',
                'ACCEPT': 'Đã chấp nhận hỗ trợ',
                'WAITING': 'Đang gửi hỗ trợ',
                'FIXING': 'Đang sửa',
                'FINISHED': 'Đã sửa xong',
                'CANCELED': 'Đã hủy'
            };
            return emergencyMap[apiStatus] || apiStatus;
        }

        const statusMap = {
            'BOOKED': 'Chờ tiếp nhận',
            'DIAGNOSING': 'Đang chuẩn đoán tình trạng',
            'WAITING': 'Đang phân công thợ',
            'FIXING': 'Đang sửa',
            'FINISHED': 'Đã sửa',
            'CANCELED': 'Đã hủy'
        };
        return statusMap[apiStatus] || apiStatus;
    };

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    // ================= 5. GỌI API KHỞI TẠO =================
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const shiftRes = await shiftInBranchApi.getShiftByBranch();
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

                const statusRes = await appointmentApi.getStatuses();
                setStatuses(Array.isArray(statusRes) ? statusRes : (statusRes?.data || []));
            } catch (error) {
                console.error("Lỗi khi load dữ liệu ban đầu:", error);
            }
        };
        fetchInitialData();
    }, []);

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
                    appointmentType: activeTab === 'regular' ? "OFFLINE" : 'EMERGENCY'
                };

                let res;
                if (activeTab === 'regular') {
                    res = await appointmentApi.getAppointmentsForReps(filterForm);
                } else {
                    res = await appointmentApi.getEmergencysForReps(filterForm);
                }
                console.log(res)
                setAppointments(Array.isArray(res) ? res : (res?.data || []));
            } catch (error) {
                console.error("Lỗi khi load danh sách ca sửa/cứu hộ:", error);
                setAppointments([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, [selectedDate, selectedShift, activeStatus, activeTab, refreshKey]);

    // ================= 6. HÀM XỬ LÝ SỰ KIỆN =================

    // HÀM MỚI: Xử lý khi bấm vào Tag Dịch vụ để mở Modal
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

    const handleReceiveVehicle = async (id) => {
        const result = await Swal.fire({
            title: 'Xác nhận nhận xe?',
            text: "Bạn có chắc chắn muốn xác nhận đã nhận xe không?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Xác nhận',
            cancelButtonText: 'Hủy bỏ',
            borderRadius: '0' // Làm vuông form Swal
        });
        if (!result.isConfirmed) return;
        try {
            await appointmentApi.updateToDiagnosing(id);
            await Swal.fire({
                icon: 'success', title: 'Thành công!', text: 'Đã cập nhật thành công!', timer: 2000, showConfirmButton: false
            });
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            alert("Có lỗi xảy ra khi cập nhật trạng thái.");
        }
    };

    const handleAcceptEmergency = async (id) => {
        const result = await Swal.fire({
            title: 'Tiếp nhận ca cứu hộ?', text: "Xác nhận chuyển trạng thái thành 'Đã chấp nhận hỗ trợ'?", icon: 'info', showCancelButton: true, confirmButtonColor: '#eab308', cancelButtonColor: '#d33', confirmButtonText: 'Xác nhận', cancelButtonText: 'Hủy bỏ'
        });
        if (!result.isConfirmed) return;
        try {
            setLoading(true);
            await appointmentApi.updateRequestToAccept(id);
            await Swal.fire({ icon: 'success', title: 'Đã tiếp nhận!', timer: 2000, showConfirmButton: false });
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            await Swal.fire({ icon: 'error', title: 'Lỗi', text: error.response?.data?.message || 'Có lỗi xảy ra!' });
        } finally {
            setLoading(false);
        }
    };

    const handleAssignEmergencyEmployee = async (appointmentId) => {
        try {
            setLoading(true);
            const empRes = await employeeApi.getEmployeesOfBranch();
            const employeeList = Array.isArray(empRes) ? empRes : (empRes?.data || []);

            if (employeeList.length === 0) {
                setLoading(false);
                await Swal.fire('Thông báo', 'Không có nhân viên nào trong chi nhánh!', 'warning');
                return;
            }

            const inputOptions = {};
            employeeList.forEach(emp => { inputOptions[emp.id] = `${emp.full_name} - ${emp.phone}`; });
            setLoading(false);

            const { value: selectedEmployeeId } = await Swal.fire({
                title: 'Phân công thợ cứu hộ', input: 'select', inputOptions: inputOptions, inputPlaceholder: '-- Chọn thợ phụ trách --', showCancelButton: true, confirmButtonColor: '#3b82f6', cancelButtonColor: '#d33', confirmButtonText: 'Khởi hành', cancelButtonText: 'Hủy'
            });

            if (selectedEmployeeId) {
                setLoading(true);
                await appointmentApi.updateAcceptToWaiting(appointmentId, { employeeId: parseInt(selectedEmployeeId) });
                await Swal.fire({ icon: 'success', title: 'Đã phân công!', timer: 2000, showConfirmButton: false });
                setRefreshKey(prev => prev + 1);
            }
        } catch (error) {
            await Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Có lỗi xảy ra khi phân thợ.' });
        } finally {
            setLoading(false);
        }
    };

    // Hàm gọi khi chọn phương thức thanh toán
    const handlePaymentChoice = async (orderId) => {
        const result = await Swal.fire({
            title: 'Chọn hình thức thanh toán',
            text: 'Vui lòng chọn hình thức thanh toán cho hóa đơn này.',
            icon: 'question',
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: '📱 Chuyển khoản QR',
            denyButtonText: '💵 Tiền mặt',
            cancelButtonText: 'Đóng',
            confirmButtonColor: '#4f46e5', // Màu xanh Indigo
            denyButtonColor: '#16a34a',    // Màu xanh lá
        });

        if (result.isConfirmed) {
            // 1. NẾU CHỌN CHUYỂN KHOẢN -> MỞ MODAL QR
            try {
                Swal.showLoading();
                const response = await paymentApi.generateQR(orderId);
                const data = response.data || response;

                setPaymentData({
                    orderId: orderId,
                    orderCode: data.orderCode,
                    qrUrl: data.qrUrl,
                    amount: data.amount,
                    endTime: data.endTime
                });

                Swal.close();
                setIsPaymentModalOpen(true); // Bật form QR Code
            } catch (error) {
                console.error("Lỗi khi tạo QR:", error);
                Swal.fire('Lỗi', 'Không thể tạo mã QR lúc này. Vui lòng thử lại!', 'error');
            }

        } else if (result.isDenied) {
            // 2. NẾU CHỌN TIỀN MẶT -> XÁC NHẬN VÀ GỌI API TRỰC TIẾP
            const confirmCash = await Swal.fire({
                title: 'Xác nhận thu tiền mặt',
                text: 'Xác nhận bạn đã thu đủ tiền mặt từ khách hàng?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Xác nhận đã thu',
                cancelButtonText: 'Hủy'
            });

            if (confirmCash.isConfirmed) {
                try {
                    Swal.showLoading();

                    // LƯU Ý: Chỗ này bạn tự gọi API cập nhật trạng thái thanh toán tiền mặt ở Backend nhé
                    await paymentApi.payByCash(orderId);

                    handlePaymentSuccess(); // Báo thành công
                } catch (error) {
                    Swal.fire('Lỗi', 'Lỗi khi xác nhận thanh toán tiền mặt!', 'error');
                }
            }
        }
    };

    // Hàm gọi khi thanh toán thành công (Dùng chung cho cả Tiền mặt và Chuyển khoản)
    const handlePaymentSuccess = () => {
        setIsPaymentModalOpen(false); // Đóng Modal QR (nếu đang mở)
        Swal.fire({
            title: 'Thanh toán thành công!',
            text: 'Giao dịch đã được hệ thống ghi nhận.',
            icon: 'success',
            timer: 3000,
            showConfirmButton: false
        });
        setRefreshKey(prev => prev + 1); // Gọi lệnh reload lại danh sách để đổi trạng thái
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen relative font-sans">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 uppercase tracking-wide border-l-4 border-gray-800 pl-3">Quản lý ca sửa chữa</h1>

            {/* TABS SWITCHER (Bo tròn ít hơn, rõ ràng hơn) */}
            <div className="flex gap-1 mb-6 border-b-2 border-gray-300 pb-0">
                <button
                    onClick={() => setActiveTab('regular')}
                    className={`px-8 py-3 font-bold rounded-t-sm transition-colors border-b-4 ${activeTab === 'regular'
                        ? 'bg-[#5b9b8b] text-white border-green-800' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border-transparent'}`}
                >
                    CA SỬA TẠI CỬA HÀNG
                </button>
                <button
                    onClick={() => setActiveTab('emergency')}
                    className={`px-8 py-3 font-bold rounded-t-sm transition-colors border-b-4 ${activeTab === 'emergency'
                        ? 'bg-red-600 text-white border-red-800' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border-transparent'}`}
                >
                    CA CỨU HỘ KHẨN CẤP
                </button>
            </div>

            {/* FILTERS AREA (Tương phản cao) */}
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
                            className="border border-gray-400 rounded-sm px-4 py-2 outline-none focus:border-[#5b9b8b] focus:ring-1 focus:ring-[#5b9b8b] min-w-[200px] bg-white"
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

            {/* STATUS TABS (Hình khối cứng cáp) */}
            <div className="flex flex-wrap gap-2 mb-8">
                <button
                    onClick={() => setActiveStatus('')}
                    className={`px-5 py-2 text-sm font-bold rounded-sm border transition-colors ${activeStatus === ''
                        ? 'bg-gray-800 text-white border-gray-900' : 'bg-white text-gray-800 border-gray-400 hover:bg-gray-200'}`}
                >
                    TẤT CẢ
                </button>
                {(activeTab === 'regular' ? REGULAR_STATUSES : EMERGENCY_STATUSES).map((status, index) => (
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

            {/* TICKET LIST */}
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
                        const isEmergency = appt?.appointmentType === "EMERGENCY";

                        return (
                            <div
                                key={`appt-${appt?.id}-${index}`}
                                className={`bg-white border border-gray-300 shadow-md rounded-sm flex flex-col md:flex-row overflow-hidden border-l-8 ${isEmergency ? 'border-l-red-600' : 'border-l-[#5b9b8b]'}`}
                            >
                                {/* CỘT TRÁI: THÔNG TIN KHÁCH HÀNG */}
                                <div className={`p-5 md:w-[28%] border-r border-gray-300 flex flex-col justify-center ${isEmergency ? 'bg-red-50' : 'bg-gray-50'}`}>

                                    <div className="mb-3">
                                        <span className="bg-[#fbbf24] text-gray-900 font-bold text-xl px-4 py-1.5 rounded-sm border-1 border-gray-800 shadow-sm tracking-widest inline-block uppercase">
                                            {vehicle?.licensePlate || 'CHƯA CÓ BSX'}
                                        </span>
                                    </div>

                                    <div className="font-bold text-base text-gray-700 flex items-center gap-2 uppercase mb-4">
                                        <FaMotorcycle className={isEmergency ? "text-red-600" : "text-[#5b9b8b]"} size={20} />
                                        {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Chưa có thông tin xe'}
                                    </div>

                                    <div className="flex items-center gap-3 text-sm text-gray-800 mt-2 font-medium">
                                        <div className="w-6 h-6 rounded flex items-center justify-center bg-gray-200"><FaUser className="text-gray-600" size={12} /></div>
                                        {appt?.bringer_name || 'Không rõ tên'}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-800 mt-3 font-medium">
                                        <div className="w-6 h-6 rounded flex items-center justify-center bg-gray-200"><FaPhone className="text-gray-600" size={12} /></div>
                                        <span className={!appt?.bringer_phone ? 'text-red-500 italic' : 'font-bold'}>
                                            {appt?.bringer_phone || 'Chưa có SĐT'}
                                        </span>
                                    </div>
                                </div>

                                {/* CỘT PHẢI: THÔNG TIN XỬ LÝ */}
                                <div className="p-5 md:w-[72%] flex flex-col justify-between bg-white">
                                    <div>
                                        {/* HEADER CỘT PHẢI: ĐÃ CHỈNH SỬA Ở ĐÂY */}
                                        <div className="flex justify-between items-start mb-4 border-b border-gray-200 pb-3 gap-4">
                                            {/* Phần thông tin mã phiếu bên trái */}
                                            <div className="flex flex-wrap gap-3 items-center">
                                                <span className={`font-black text-lg ${isEmergency ? 'text-red-700' : 'text-[#5b9b8b]'}`}>MÃ PHIẾU: #{appt?.id}</span>

                                                <span className={`text-xs px-3 py-1.5 rounded-sm border font-bold uppercase tracking-wide ${isEmergency ? 'bg-red-100 text-red-800 border-red-300' : (appt?.appointmentType === "ONLINE" ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-gray-200 text-gray-800 border-gray-400')}`}>
                                                    {isEmergency ? "🚨 Cứu hộ khẩn cấp" : (appt?.appointmentType === "ONLINE" ? "Khách đặt lịch" : "Khách vãng lai")}
                                                </span>

                                                {shiftInfo && !isEmergency && (
                                                    <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1.5 rounded-sm border border-blue-300 font-bold uppercase">
                                                        {shiftInfo.name}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Phần Badge Trạng thái bên phải */}
                                            <div className="shrink-0">
                                                <span className={`px-4 py-2 rounded-sm font-black text-sm text-white shadow-md uppercase tracking-wider
                                                    ${['BOOKED', 'REQUEST'].includes(status) ? 'bg-yellow-500 border border-yellow-600' :
                                                        ['DIAGNOSING', 'ACCEPT'].includes(status) ? 'bg-orange-500 border border-orange-600' :
                                                            status === 'WAITING' ? 'bg-purple-600 border border-purple-700' :
                                                                status === 'FIXING' ? 'bg-blue-600 border border-blue-700' :
                                                                    status === 'FINISHED' ? 'bg-green-600 border border-green-700' : 'bg-red-600 border border-red-700'}`}>
                                                    {translateStatus(status, isEmergency)}
                                                </span>
                                            </div>
                                        </div>

                                        {(() => {
                                            const locationInfo = item.appointmentLocationDTO;
                                            return (
                                                <div className="mb-4">
                                                    <p className="text-sm text-gray-800 mb-2 leading-relaxed bg-yellow-50 border border-yellow-200 p-3 rounded-sm">
                                                        <strong className="text-gray-900 uppercase">Tình trạng khách báo:</strong>{' '}
                                                        {isEmergency && locationInfo?.descriptionOfCus
                                                            ? locationInfo.descriptionOfCus
                                                            : (appt?.description || 'Chưa có mô tả lỗi')}
                                                    </p>

                                                    {isEmergency && locationInfo?.mapUrl && (
                                                        <a
                                                            href={locationInfo.mapUrl} target="_blank" rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 px-4 py-2 rounded-sm text-sm font-bold transition-colors shadow-sm mt-2"
                                                        >
                                                            <FaMapMarkerAlt /> XEM VỊ TRÍ KHÁCH HÀNG BÁO (BẢN ĐỒ)
                                                        </a>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        {/* THÔNG TIN KỸ THUẬT & CHI PHÍ */}
                                        {(() => {
                                            const repairOrder = item.repairOrderDTO;
                                            const serviceList = item.serviceDetialDTOList || [];

                                            return ['WAITING', 'FIXING', 'FINISHED'].includes(status) && repairOrder ? (
                                                <div className="mt-5 bg-blue-50 border border-blue-200 rounded-sm p-4 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">

                                                    {/* Kết luận */}
                                                    <div className="col-span-1 md:col-span-2 bg-white p-3 rounded-sm border border-blue-200 shadow-sm">
                                                        <div className="flex items-start gap-3 text-sm">
                                                            <FaClipboardCheck className="text-blue-600 text-lg mt-0.5 shrink-0" />
                                                            <div>
                                                                <span className="font-black text-blue-900 uppercase block mb-1">Kết luận của kỹ thuật viên:</span>
                                                                <span className="text-gray-800 font-medium">
                                                                    {repairOrder?.description || appt?.description || 'Chưa có kết luận chi tiết'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Dịch vụ */}
                                                    <div className="flex items-start gap-3 text-sm pl-1 pr-2">
                                                        <FaTools className="text-orange-600 text-base mt-0.5 shrink-0" />
                                                        <div className="w-full">
                                                            <span className="font-black text-gray-900 uppercase block mb-2">Dịch vụ sử dụng:</span>
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

                                                    {/* Thợ */}
                                                    <div className="flex items-start gap-3 text-sm pl-1">
                                                        <FaUserCog className="text-purple-600 text-base mt-0.5 shrink-0" />
                                                        <div>
                                                            <span className="font-black text-gray-900 uppercase block mb-1">Thợ phụ trách:</span>
                                                            <div className="bg-white border border-gray-300 px-2 py-1 rounded-sm inline-flex items-center shadow-sm">
                                                                <span className="text-gray-900 font-bold">
                                                                    {repairOrder?.employeeDTO?.full_name || 'Chưa phân công'}
                                                                </span>
                                                                {repairOrder?.employeeDTO?.phone && (
                                                                    <span className="text-gray-600 text-xs ml-2 pl-2 border-l border-gray-300">
                                                                        <FaPhone className="inline-block mr-1 text-gray-400 mb-0.5" size={10} />
                                                                        {repairOrder.employeeDTO.phone}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Tổng tiền */}
                                                    <div className="flex items-start gap-3 text-sm pl-1 pt-3 border-t border-blue-200">
                                                        <FaMoneyBillWave className="text-green-700 text-base mt-0.5 shrink-0" />
                                                        <div>
                                                            <span className="font-black text-gray-900 uppercase block mb-1">Tổng chi phí:</span>
                                                            <span className="text-red-600 font-black text-lg">
                                                                {repairOrder?.total_price ? formatPrice(repairOrder.total_price) : '0 ₫'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Thanh toán & Nút hành động */}
                                                    <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm pl-1 pt-3 border-t border-blue-200">
                                                        <div className="flex items-start gap-3">
                                                            {repairOrder?.payment_status === 'PAYED' ? (
                                                                <FaCheckCircle className="text-green-600 text-base mt-0.5 shrink-0" />
                                                            ) : (
                                                                <FaTimesCircle className="text-yellow-600 text-base mt-0.5 shrink-0" />
                                                            )}
                                                            <div>
                                                                <span className="font-black text-gray-900 uppercase block mb-1">Thanh toán:</span>
                                                                {repairOrder?.payment_status === 'PAYED' ? (
                                                                    <span className="bg-green-100 text-green-800 border-2 border-green-300 text-xs px-2 py-1 rounded-sm font-bold shadow-sm uppercase tracking-wide">
                                                                        ĐÃ THANH TOÁN
                                                                    </span>
                                                                ) : (
                                                                    <span className="bg-yellow-100 text-yellow-800 border-2 border-yellow-300 text-xs px-2 py-1 rounded-sm font-bold shadow-sm uppercase tracking-wide">
                                                                        CHƯA THANH TOÁN
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {repairOrder?.payment_status !== 'PAYED' && repairOrder?.total_price > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handlePaymentChoice(repairOrder.id)}
                                                                className="cursor-pointer bg-red-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-sm text-sm font-bold uppercase tracking-wide shadow-md transition-colors flex items-center gap-2 active:scale-95 w-full sm:w-auto justify-center"
                                                            >
                                                                <FaMoneyBillWave size={16} />
                                                                Thanh toán ngay
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : null;
                                        })()}
                                    </div>

                                    {/* FOOTER CỘT PHẢI: ĐÃ CHỈNH SỬA Ở ĐÂY */}
                                    <div className="flex flex-wrap justify-between items-end pt-4 border-t border-gray-200 mt-5">
                                        <div className="flex flex-col gap-2">
                                            <div className="text-sm text-gray-600 font-medium bg-gray-100 px-3 py-1.5 rounded-sm border border-gray-200 flex items-center gap-2">
                                                <span className="font-bold text-gray-800">Tạo lúc:</span>
                                                {appt?.created_at ? new Date(appt.created_at).toLocaleString('vi-VN') : 'N/A'}
                                            </div>

                                            {appt?.status_time && (
                                                <div className="text-sm text-blue-700 font-medium bg-blue-50 px-3 py-1.5 rounded-sm border border-blue-200 flex items-center gap-2">
                                                    <span className="font-bold text-blue-800">Cập nhật trạng thái lúc:</span>
                                                    {new Date(appt.status_time).toLocaleString('vi-VN')}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 mt-4 sm:mt-0 justify-end flex-grow">
                                            {/* ĐÃ CHUYỂN BADGE TRẠNG THÁI KHỎI KHU VỰC NÀY */}

                                            {!isEmergency && status === 'BOOKED' && (
                                                <button onClick={() => handleReceiveVehicle(appt.id)} className="cursor-pointer bg-white border-2 border-[#5b9b8b] text-[#5b9b8b] hover:bg-green-500 hover:text-white px-5 py-2 rounded-sm font-bold transition-colors uppercase text-sm shadow-sm">
                                                    ĐÃ NHẬN XE
                                                </button>
                                            )}
                                            {!isEmergency && status === 'DIAGNOSING' && (
                                                <button onClick={() => navigate(`/receptionist/diagnosisPage/${appt.id}`)}
                                                    className="bg-orange-500 border-2 border-orange-600 text-white hover:bg-orange-600 px-5 py-2 rounded-sm font-bold transition-colors shadow-md uppercase text-sm">
                                                    KẾT LUẬN TÌNH TRẠNG
                                                </button>
                                            )}

                                            {isEmergency && status === 'REQUEST' && (
                                                <button
                                                    onClick={() => handleAcceptEmergency(appt.id)}
                                                    className="bg-yellow-500 border-2 border-yellow-600 text-white hover:bg-yellow-600 px-5 py-2 rounded-sm font-bold transition-colors shadow-md uppercase text-sm"
                                                >
                                                    TIẾP NHẬN CỨU HỘ
                                                </button>
                                            )}
                                            {isEmergency && status === 'ACCEPT' && (
                                                <button
                                                    onClick={() => handleAssignEmergencyEmployee(appt.id)}
                                                    className="bg-orange-500 border-2 border-orange-600 text-white hover:bg-orange-600 px-5 py-2 rounded-sm font-bold transition-colors shadow-md uppercase text-sm"
                                                >
                                                    KHỞI HÀNH / PHÂN THỢ
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
                        <p className="font-bold text-lg text-gray-600">Không có {activeTab === 'emergency' ? 'ca cứu hộ' : 'ca sửa'} nào phù hợp với bộ lọc.</p>
                    </div>
                )}
            </div>

            {/* ===== MODAL HIỂN THỊ CHI TIẾT DỊCH VỤ ===== */}
            <ServiceDetailModal
                isOpen={isServiceModalOpen}
                onClose={() => {
                    setIsServiceModalOpen(false);
                    setTimeout(() => setSelectedServiceData(null), 200);
                }}
                serviceData={selectedServiceData}
            />

            {/* ===== MODAL THANH TOÁN QR CODE ===== */}
            <PaymentQRCodeModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                paymentData={paymentData}
                onSuccess={handlePaymentSuccess}
            />

        </div>
    );
};

export default AppointmentManagement;