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

    // ================= 3. STATES MASTER DATA TỪ API (DÙNG CHO MODAL) =================
    const [services, setServices] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [categories, setCategories] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);

    const [itemSearchText, setItemSearchText] = useState('');
    const [selectedItemCategory, setSelectedItemCategory] = useState('');

    const [filteredItems, setFilteredItems] = useState([])

    // ================= 4. STATES CHO MODAL ĐÁNH GIÁ (DIAGNOSING) =================
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalLoading, setIsModalLoading] = useState(false); // <--- State loading cho Modal
    const [diagnoseForm, setDiagnoseForm] = useState({
        appointmentId: null,
        serviceId: '',
        description: '',
        employeeId: '',
        itemList: {}
    });


    // Định nghĩa danh sách trạng thái cho từng Tab
    const REGULAR_STATUSES = ['BOOKED', 'DIAGNOSING', 'WAITING', 'FIXING', 'FINISHED', 'CANCELED'];
    const EMERGENCY_STATUSES = ['REQUEST', 'ACCEPT', 'WAITING', 'FIXING', 'FINISHED', 'CANCELED'];

    // Cập nhật hàm dịch để phân biệt ý nghĩa tùy theo loại ca
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

    // ================= 5. GỌI API KHỞI TẠO (CHỈ LOAD CA & TRẠNG THÁI) =================
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

    // API Lấy danh sách Appointment & Emergency
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
                    // Đối với ca khẩn cấp, backend của bạn có thể không cần truyền appointmentType vì đã tách API riêng,
                    // nhưng cứ giữ nguyên form cho an toàn.
                    appointmentType: activeTab === 'regular' ? "OFFLINE" : 'EMERGENCY'
                };

                console.log("Filter Form:", filterForm);

                // CHIA NHÁNH GỌI API DỰA VÀO TAB
                let res;
                if (activeTab === 'regular') {
                    res = await appointmentApi.getAppointmentsForReps(filterForm);
                } else {
                    res = await appointmentApi.getEmergencysForReps(filterForm);
                }

                console.log("Data Response:", res);
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
    const handleReceiveVehicle = async (id) => {
        const result = await Swal.fire({
            title: 'Xác nhận nhận xe?',
            text: "Bạn có chắc chắn muốn xác nhận đã nhận xe không?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6', // Màu nút Đồng ý (Có thể đổi theo theme web)
            cancelButtonColor: '#d33',     // Màu nút Hủy
            confirmButtonText: 'Xác nhận',
            cancelButtonText: 'Hủy bỏ'
        });
        if (!result.isConfirmed) return;
        try {
            await appointmentApi.updateToDiagnosing(id);

            await Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Đã cập nhật chuẩn đoán và phân công thợ thành công!',
                timer: 2000, // Tự động đóng sau 2 giây cho xịn
                showConfirmButton: false
            });
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            alert("Có lỗi xảy ra khi cập nhật trạng thái.");
        }
    };

    // <--- CHỈ GỌI API KHI MỞ MODAL NÀY --->
    const openDiagnosingModal = async (appointmentId) => {
        // Mở modal và bật trạng thái loading
        setIsModalOpen(true);
        setIsModalLoading(true);

        // Reset Form
        setDiagnoseForm({
            appointmentId: appointmentId,
            serviceId: '',
            description: '',
            employeeId: '',
            itemList: {}
        });
        setItemSearchText('');
        setSelectedItemCategory('');

        try {
            // Gọi song song (Promise.all) để lấy dữ liệu nhanh nhất
            const [empRes, svcRes, catRes, itemRes] = await Promise.all([
                employeeApi.getEmployeesOfBranch(),
                serviceApi.getServiceList(),
                categoryApi.getAllCategory(),
                itemApi.getItem4Rep({})
            ]);

            setEmployees(Array.isArray(empRes) ? empRes : (empRes?.data || []));
            setServices(Array.isArray(svcRes) ? svcRes : (svcRes?.data || []));
            setCategories(catRes?.content || catRes?.data?.content || (Array.isArray(catRes) ? catRes : []));
            console.log(Array.isArray(empRes) ? empRes : (empRes?.data || []))
            console.log(Array.isArray(svcRes) ? svcRes : (svcRes?.data || []))
            console.log(catRes?.content || catRes?.data?.content || (Array.isArray(catRes) ? catRes : []))
            const itemsData = itemRes?.content || itemRes?.data?.content || itemRes || [];
            setInventoryItems(itemsData);
            setFilteredItems(itemsData)
            console.log(itemsData)
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu cho Modal:", error);
            alert("Không thể tải danh sách Dịch vụ/Linh kiện. Vui lòng thử lại!");
            setIsModalOpen(false); // Tải lỗi thì đóng modal lại
        } finally {
            setIsModalLoading(false); // Tắt loading
        }
    };

    const handleItemQuantityChange = (itemId, change, maxStock) => {
        setDiagnoseForm(prev => {
            const currentQty = prev.itemList[itemId] || 0;
            let newQty = currentQty + change;

            if (newQty > maxStock) newQty = maxStock;

            const newItemList = { ...prev.itemList };
            if (newQty <= 0) {
                delete newItemList[itemId];
            } else {
                newItemList[itemId] = newQty;
            }

            return { ...prev, itemList: newItemList };
        });
    };

    const handleSubmitDiagnosis = async (e) => {
        e.preventDefault();
        const payload = {
            appointmentId: diagnoseForm.appointmentId,
            serviceId: parseInt(diagnoseForm.serviceId),
            description: diagnoseForm.description,
            employeeId: parseInt(diagnoseForm.employeeId),
            itemList: diagnoseForm.itemList
        };

        try {
            console.log(payload)
            // Hiển thị Popup xác nhận cực đẹp
            const result = await Swal.fire({
                title: 'Xác nhận chuẩn đoán?',
                text: "Bạn có chắc chắn muốn lưu kết luận chuẩn đoán và phân công thợ này không?",
                icon: 'question', // Có thể đổi thành 'warning', 'info'
                showCancelButton: true,
                confirmButtonColor: '#3085d6', // Màu nút Đồng ý (Có thể đổi theo theme web)
                cancelButtonColor: '#d33',     // Màu nút Hủy
                confirmButtonText: 'Đồng ý, lưu lại!',
                cancelButtonText: 'Hủy bỏ'
            });

            // Nếu người dùng bấm "Hủy bỏ" hoặc click ra ngoài, dừng hàm lại
            if (!result.isConfirmed) return;

            // if (!window.confirm("Xác nhận đã kết luận chuẩn đoán")) return;
            await appointmentApi.updateToWaiting(payload);

            // thông báo thành công
            await Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Đã cập nhật chuẩn đoán và phân công thợ thành công!',
                timer: 2000, // Tự động đóng sau 2 giây cho xịn
                showConfirmButton: false
            });

            setIsModalOpen(false);
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            alert("Có lỗi xảy ra khi gửi dữ liệu lên máy chủ.");
            console.log(error.response?.data?.message);
        }
    };

    // ================= 7. LOGIC RENDER =================
    const selectedServiceObj = services.find(s => s.id.toString() === diagnoseForm.serviceId.toString());
    const isPartsService = selectedServiceObj && (
        selectedServiceObj.name.toLowerCase().includes('thay linh kiện') ||
        // selectedServiceObj.name.toLowerCase().includes('phụ tùng') ||
        selectedServiceObj.id === 3
    );

    useEffect(() => {
        if (isModalOpen) {
            // 1. Tạo một bộ đếm thời gian (timer)
            const delayDebounceFn = setTimeout(async () => {
                try {
                    const payload = {
                        categoryId: selectedItemCategory !== '' ? selectedItemCategory : null,
                        searchName: itemSearchText
                    };

                    const res = await itemApi.getItem4Rep(payload);
                    setFilteredItems(res?.content); // Cập nhật lại UI khi có data từ server
                    console.log(res?.content)
                } catch (error) {
                    console.error("Lỗi khi tìm kiếm phụ tùng:", error);
                }
            }, 500); // Chờ 500ms (nửa giây) sau lần gõ phím cuối cùng mới chạy hàm trên

            // 3. Cleanup function: Xóa timer cũ nếu người dùng gõ tiếp ký tự mới trước khi 500ms kết thúc
            return () => clearTimeout(delayDebounceFn);
        }

    }, [selectedItemCategory, itemSearchText]);

    //Hàm xử lý updaate trạng thái từ Resquest sang Accept
    const handleAcceptEmergency = async (id) => {
        // 1. Hiển thị Popup xác nhận
        const result = await Swal.fire({
            title: 'Tiếp nhận ca cứu hộ?',
            text: "Xác nhận chuyển trạng thái thành 'Đã chấp nhận hỗ trợ'?",
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#eab308', // Màu vàng cho hợp với trạng thái
            cancelButtonColor: '#d33',
            confirmButtonText: 'Xác nhận tiếp nhận',
            cancelButtonText: 'Hủy bỏ'
        });

        if (!result.isConfirmed) return;

        try {
            // Bật loading (tùy chọn, nếu bạn muốn hiện loading toàn trang)
            setLoading(true);

            // 2. Gọi API cập nhật trạng thái
            await appointmentApi.updateRequestToAccept(id);

            // 3. Thông báo thành công
            await Swal.fire({
                icon: 'success',
                title: 'Đã tiếp nhận!',
                text: 'Ca cứu hộ đã được chuyển sang trạng thái chờ phân thợ.',
                timer: 2000,
                showConfirmButton: false
            });

            // 4. Trigger tải lại dữ liệu danh sách
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error("Lỗi khi tiếp nhận cứu hộ:", error);
            console.log(error.response)
            await Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái. Vui lòng thử lại!'
            });
        } finally {
            setLoading(false);
        }
    };


    // Hàm xử lý Khởi hành / Phân thợ cho ca khẩn cấp
    const handleAssignEmergencyEmployee = async (appointmentId) => {
        try {
            // 1. Bật loading để người dùng biết hệ thống đang xử lý
            setLoading(true);

            // 2. Fetch danh sách nhân viên kỹ thuật từ backend
            const empRes = await employeeApi.getEmployeesOfBranch();
            const employeeList = Array.isArray(empRes) ? empRes : (empRes?.data || []);

            if (employeeList.length === 0) {
                setLoading(false);
                await Swal.fire('Thông báo', 'Không có nhân viên nào trong chi nhánh để phân công!', 'warning');
                return;
            }

            // 3. Format data nhân viên để đưa vào SweetAlert Select
            const inputOptions = {};
            employeeList.forEach(emp => {
                inputOptions[emp.id] = `${emp.full_name} - ${emp.phone}`;
            });

            // Tắt loading trước khi hiện popup
            setLoading(false);

            // 4. Hiển thị Popup có kèm Select Box
            const { value: selectedEmployeeId } = await Swal.fire({
                title: 'Phân công thợ cứu hộ',
                text: 'Vui lòng chọn nhân viên kỹ thuật đi cứu hộ:',
                icon: 'question',
                input: 'select',
                inputOptions: inputOptions,
                inputPlaceholder: '-- Chọn thợ phụ trách --',
                showCancelButton: true,
                confirmButtonColor: '#3b82f6', // Màu xanh lam
                cancelButtonColor: '#d33',
                confirmButtonText: 'Xác nhận khởi hành',
                cancelButtonText: 'Hủy',
                inputValidator: (value) => {
                    if (!value) {
                        return 'Bạn phải chọn một nhân viên để tiếp tục!';
                    }
                }
            });

            // 5. Nếu người dùng chọn thợ và bấm xác nhận
            if (selectedEmployeeId) {
                setLoading(true);

                // Form chuẩn theo DTO của Backend (chỉ chứa employeeId)
                const payload = {
                    employeeId: parseInt(selectedEmployeeId)
                };

                // Gọi API
                await appointmentApi.updateAcceptToWaiting(appointmentId, payload);

                // Thông báo thành công
                await Swal.fire({
                    icon: 'success',
                    title: 'Đã phân công!',
                    text: 'Thợ đã được phân công và đang khởi hành đến chỗ khách.',
                    timer: 2000,
                    showConfirmButton: false
                });

                // Load lại danh sách
                setRefreshKey(prev => prev + 1);
            }
        } catch (error) {
            console.error("Lỗi khi phân thợ cứu hộ:", error);
            await Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: error.response?.data?.message || 'Có lỗi xảy ra khi phân thợ. Vui lòng thử lại!'
            });
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="p-6 bg-gray-50 min-h-screen relative font-sans">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản lý ca sửa chữa</h1>

            {/* TABS SWITCHER */}
            <div className="flex gap-2 mb-6 border-b border-gray-300 pb-2">
                <button
                    onClick={() => setActiveTab('regular')}
                    className={`px-6 py-2 font-semibold rounded-t-md transition-colors ${activeTab === 'regular'
                        ? 'bg-[#5b9b8b] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                    Ca sửa
                </button>
                <button
                    onClick={() => setActiveTab('emergency')}
                    className={`px-6 py-2 font-semibold rounded-t-md transition-colors ${activeTab === 'emergency'
                        ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                    Ca sửa khẩn cấp
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
                            {/* FIX BUG TRÙNG KEY BẰNG CÁCH NỐI INDEX VÀO ID */}
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
                        ? 'bg-[#5b9b8b] text-white border-[#5b9b8b]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                >
                    Tất cả
                </button>
                {/* Chọn mảng trạng thái dựa vào Tab đang active */}
                {(activeTab === 'regular' ? REGULAR_STATUSES : EMERGENCY_STATUSES).map((status, index) => (
                    <button
                        key={`status-${status}-${index}`}
                        onClick={() => setActiveStatus(status)}
                        className={`px-4 py-1.5 text-sm rounded border transition-colors ${activeStatus === status
                            ? 'bg-[#5b9b8b] text-white border-[#5b9b8b]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                    >
                        {translateStatus(status, activeTab === 'emergency')}
                    </button>
                ))}
            </div>

            {/* TICKET LIST */}
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
                        const isEmergency = appt?.appointmentType === "EMERGENCY";

                        return (
                            <div key={`appt-${appt?.id}-${index}`} className={`bg-white border-2 rounded-lg shadow-sm flex flex-col md:flex-row overflow-hidden ${isEmergency ? 'border-red-100' : 'border-gray-100'}`}>
                                {/* Cột trái */}
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

                                {/* Cột phải */}
                                <div className="p-4 md:w-3/4 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex gap-3 items-center">
                                                <span className={`font-semibold ${isEmergency ? 'text-red-600' : 'text-[#5b9b8b]'}`}>Mã phiếu: #{appt?.id}</span>

                                                {/* Badge loại ca */}
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

                                        {/* Khai báo thêm locationInfo từ item */}
                                        {(() => {
                                            const locationInfo = item.appointmentLocationDTO;

                                            return (
                                                <div className="mb-3">
                                                    {/* Tình trạng khách báo (Ưu tiên descriptionOfCus nếu là ca khẩn cấp) */}
                                                    <p className="text-sm text-gray-700 mb-2">
                                                        <strong>Tình trạng khách báo:</strong>{' '}
                                                        {isEmergency && locationInfo?.descriptionOfCus
                                                            ? locationInfo.descriptionOfCus
                                                            : (appt?.description || 'Chưa có mô tả lỗi')}
                                                    </p>

                                                    {/* Nút Xem Vị Trí Bản Đồ (Chỉ hiện ở Ca Khẩn Cấp và có mapUrl) */}
                                                    {isEmergency && locationInfo?.mapUrl && (
                                                        <a
                                                            href={locationInfo.mapUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors shadow-sm"
                                                        >
                                                            <FaMapMarkerAlt className="text-red-500" />
                                                            Xem vị trí khách hàng (Bản đồ)
                                                        </a>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        {/* ================= KHU VỰC THÔNG TIN KỸ THUẬT & CHI PHÍ ================= */}
                                        {(() => {
                                            const repairOrder = item.repairOrderDTO;
                                            const firstService = item.serviceDetialDTOList?.[0]?.serviceDTO;

                                            return ['WAITING', 'FIXING', 'FINISHED'].includes(status) && repairOrder ? (
                                                <div className="mt-4 bg-blue-50/50 border border-blue-100 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 shadow-sm">

                                                    {/* Hàng 1 (Full width): Kết luận của thợ */}
                                                    <div className="col-span-1 md:col-span-2 bg-white p-3 rounded-lg border border-blue-50">
                                                        <div className="flex items-start gap-3 text-sm">
                                                            <FaClipboardCheck className="text-blue-500 text-lg mt-0.5 shrink-0" />
                                                            <div>
                                                                <span className="font-bold text-blue-900 block mb-1">Kết luận của kỹ thuật viên:</span>
                                                                <span className="text-gray-700 italic">
                                                                    {repairOrder?.description || appt?.description || 'Chưa có kết luận chi tiết'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Hàng 2 - Cột 1: Dịch vụ */}
                                                    <div className="flex items-start gap-3 text-sm pl-1">
                                                        <FaTools className="text-orange-500 text-base mt-0.5 shrink-0" />
                                                        <div>
                                                            <span className="font-semibold text-gray-700 block mb-0.5">Dịch vụ sử dụng:</span>
                                                            <span className="text-gray-800 font-medium line-clamp-1" title={firstService?.name}>
                                                                {firstService?.name || 'Chưa cập nhật'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Hàng 2 - Cột 2: Nhân viên phụ trách */}
                                                    <div className="flex items-start gap-3 text-sm pl-1">
                                                        <FaUserCog className="text-purple-500 text-base mt-0.5 shrink-0" />
                                                        <div>
                                                            <span className="font-semibold text-gray-700 block mb-0.5">Thợ phụ trách:</span>
                                                            <span className="text-gray-800 font-medium">
                                                                {repairOrder?.employeeDTO?.full_name || 'Chưa phân công'}
                                                            </span>
                                                            {repairOrder?.employeeDTO?.phone && (
                                                                <span className="text-gray-500 text-xs block mt-0.5">SĐT: {repairOrder.employeeDTO.phone}</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* ================= PHẦN MỚI THÊM: CHI PHÍ & THANH TOÁN ================= */}

                                                    {/* Hàng 3 - Cột 1: Tổng chi phí */}
                                                    <div className="flex items-start gap-3 text-sm pl-1 pt-2 border-t border-blue-100/50">
                                                        <FaMoneyBillWave className="text-green-600 text-base mt-0.5 shrink-0" />
                                                        <div>
                                                            <span className="font-semibold text-gray-700 block mb-0.5">Tổng chi phí:</span>
                                                            <span className="text-red-600 font-bold text-base">
                                                                {/* Sử dụng hàm formatPrice đã định nghĩa ở dòng 76 */}
                                                                {repairOrder?.total_price ? formatPrice(repairOrder.total_price) : '0 ₫'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Hàng 3 - Cột 2: Trạng thái thanh toán */}
                                                    <div className="flex items-start gap-3 text-sm pl-1 pt-2 border-t border-blue-100/50">
                                                        {repairOrder?.payment_status === 'PAID' ? (
                                                            <FaCheckCircle className="text-green-500 text-base mt-0.5 shrink-0" />
                                                        ) : (
                                                            <FaTimesCircle className="text-yellow-500 text-base mt-0.5 shrink-0" />
                                                        )}
                                                        <div>
                                                            <span className="font-semibold text-gray-700 block mb-1">Thanh toán:</span>
                                                            {repairOrder?.payment_status === 'PAID' ? (
                                                                <span className="bg-green-100 text-green-700 border border-green-200 text-xs px-2 py-0.5 rounded font-semibold shadow-sm">
                                                                    Đã thanh toán
                                                                </span>
                                                            ) : (
                                                                <span className="bg-yellow-100 text-yellow-700 border border-yellow-200 text-xs px-2 py-0.5 rounded font-semibold shadow-sm">
                                                                    Chưa thanh toán
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                </div>
                                            ) : null;
                                        })()}
                                    </div>

                                    {/* Footer card */}
                                    <div className="flex flex-wrap justify-between items-end pt-3 border-t border-gray-100 mt-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-sm text-gray-500">
                                                <span className="font-medium">Tạo lúc: </span>
                                                {new Date(appt?.created_at).toLocaleString('vi-VN')}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 mt-3 sm:mt-0">
                                            {/* Badge trạng thái thay đổi màu dựa vào Tab/Status */}
                                            <span className={`px-4 py-1.5 rounded font-medium text-sm text-white shadow-sm
                                                ${['BOOKED', 'REQUEST'].includes(status) ? 'bg-yellow-500' :
                                                    ['DIAGNOSING', 'ACCEPT'].includes(status) ? 'bg-orange-500' :
                                                        status === 'WAITING' ? 'bg-purple-500' :
                                                            status === 'FIXING' ? 'bg-blue-500' :
                                                                status === 'FINISHED' ? 'bg-green-500' : 'bg-red-500'}`}>
                                                {translateStatus(status, isEmergency)}
                                            </span>

                                            {/* Action Buttons cho CA THƯỜNG */}
                                            {!isEmergency && status === 'BOOKED' && (
                                                <button onClick={() => handleReceiveVehicle(appt.id)} className="border border-[#5b9b8b] text-[#5b9b8b] hover:bg-[#5b9b8b] hover:text-white px-4 py-1.5 rounded text-sm font-medium transition-colors">
                                                    Đã nhận xe
                                                </button>
                                            )}
                                            {!isEmergency && status === 'DIAGNOSING' && (
                                                <button onClick={() => openDiagnosingModal(appt.id)} className="border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-4 py-1.5 rounded text-sm font-medium transition-colors shadow-sm">
                                                    Kết luận tình trạng
                                                </button>
                                            )}

                                            {/* Action Buttons cho CA KHẨN CẤP */}
                                            {isEmergency && status === 'REQUEST' && (
                                                <button
                                                    onClick={() => handleAcceptEmergency(appt.id)}
                                                    className="border border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white px-4 py-1.5 rounded text-sm font-medium transition-colors shadow-sm"
                                                >
                                                    Tiếp nhận cứu hộ
                                                </button>
                                            )}
                                            {isEmergency && status === 'ACCEPT' && (
                                                <button
                                                    onClick={() => handleAssignEmergencyEmployee(appt.id)}
                                                    className="border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-4 py-1.5 rounded text-sm font-medium transition-colors shadow-sm"
                                                >
                                                    Khởi hành / Phân thợ
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
                        <p>Không có {activeTab === 'emergency' ? 'ca cứu hộ' : 'ca sửa'} nào phù hợp với bộ lọc hiện tại.</p>
                    </div>
                )}
            </div>

            {/* ================= MODAL LỚN VỚI BACKDROP BLUR ================= */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-[95vw] md:w-[90vw] max-w-7xl h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">

                        {/* Header Modal */}
                        <div className="px-6 py-4 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
                            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                                    <FaWrench size={18} />
                                </div>
                                Kết Luận Tình Trạng Phiếu #{diagnoseForm.appointmentId}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                                <FaTimes size={18} />
                            </button>
                        </div>

                        {/* Body Modal (Có trạng thái Loading) */}
                        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">

                            {/* HIỂN THỊ LOADING SPINNER KHI CHỜ GỌI API */}
                            {isModalLoading ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4">
                                    <FaSpinner className="animate-spin text-blue-500 text-4xl" />
                                    <p className="text-gray-500 font-medium">Đang tải dữ liệu, vui lòng chờ...</p>
                                </div>
                            ) : (
                                <form id="diagnosisForm" onSubmit={handleSubmitDiagnosis} className="flex flex-col lg:flex-row gap-8 h-full">
                                    {/* CỘT TRÁI: THÔNG TIN CHUNG */}
                                    <div className={`flex flex-col gap-6 transition-all duration-300 ${isPartsService ? 'lg:w-1/3' : 'w-full max-w-3xl mx-auto'}`}>

                                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-5">
                                            <h3 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3">Thông tin xử lý</h3>

                                            <div className="flex flex-col gap-2">
                                                <label className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Mô tả chi tiết <span className="text-red-500">*</span></label>
                                                <textarea
                                                    required
                                                    rows="4"
                                                    placeholder="Ghi rõ các vấn đề kỹ thuật phát hiện được..."
                                                    value={diagnoseForm.description}
                                                    onChange={e => setDiagnoseForm({ ...diagnoseForm, description: e.target.value })}
                                                    className="border border-gray-200 rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <label className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Gói Dịch Vụ <span className="text-red-500">*</span></label>
                                                <select
                                                    required
                                                    value={diagnoseForm.serviceId}
                                                    onChange={e => setDiagnoseForm({
                                                        ...diagnoseForm,
                                                        serviceId: e.target.value,
                                                        itemList: {}
                                                    })}
                                                    className="border border-gray-200 rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white"
                                                >
                                                    <option value="">-- Chọn dịch vụ thực hiện --</option>
                                                    {services.map((svc, index) => (
                                                        <option key={`svc-${svc.id}-${index}`} value={svc.id}>{svc.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <label className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Phân công Thợ <span className="text-red-500">*</span></label>
                                                <select
                                                    required
                                                    value={diagnoseForm.employeeId}
                                                    onChange={e => setDiagnoseForm({ ...diagnoseForm, employeeId: e.target.value })}
                                                    className="border border-gray-200 rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white"
                                                >
                                                    <option value="">-- Chọn nhân viên kỹ thuật --</option>
                                                    {employees.map((emp, index) => (
                                                        <option key={`emp-${emp.id}-${index}`} value={emp.id}>
                                                            #{emp.id} - {emp.full_name} - {emp.phone}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CỘT PHẢI: CHỌN LINH KIỆN */}
                                    {isPartsService && (
                                        <div className="lg:w-2/3 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[700px] lg:h-auto overflow-hidden">

                                            {/* Filter Header */}
                                            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center z-10 bg-white">
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                                        <FaWrench size={16} />
                                                    </div>
                                                    <h3 className="font-bold text-gray-900 text-lg hidden sm:block whitespace-nowrap">Kho Phụ Tùng</h3>
                                                </div>

                                                <div className="flex gap-3 w-full sm:w-auto flex-1 justify-end">
                                                    <div className="relative flex-1 sm:max-w-[250px]">
                                                        <input
                                                            type="text"
                                                            placeholder="Tìm kiếm linh kiện..."
                                                            value={itemSearchText}
                                                            onChange={e => setItemSearchText(e.target.value)}
                                                            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                                        />
                                                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    </div>
                                                    <div className="relative min-w-[180px]">
                                                        <select
                                                            value={selectedItemCategory}
                                                            onChange={e => setSelectedItemCategory(e.target.value)}
                                                            className="w-full pl-11 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none"
                                                        >
                                                            <option value="">Tất cả danh mục</option>
                                                            {categories.map((cat, index) => (
                                                                <option key={`cat-${cat.id}-${index}`} value={cat.id}>{cat.name}</option>
                                                            ))}
                                                        </select>
                                                        <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1 1L5 5L9 1" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Danh sách cuộn */}
                                            <div className="p-5 overflow-y-auto flex-1 bg-gray-50/50">
                                                {filteredItems.length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 py-10">
                                                        <FaWrench size={40} className="opacity-20" />
                                                        <p className="font-medium text-lg">Không tìm thấy linh kiện nào.</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                                                        {filteredItems.map((itemObj, index) => {
                                                            const item = itemObj.itemSimpleDTO;
                                                            const stock = itemObj.stockQuantity;
                                                            const qtyInCart = diagnoseForm.itemList[item.id] || 0;
                                                            const isOutOfStock = stock <= 0;
                                                            const isSelected = qtyInCart > 0;

                                                            return (
                                                                <div
                                                                    key={`item-${item.id}-${index}`}
                                                                    className={`bg-white rounded-2xl border overflow-hidden flex flex-col relative group transition-all duration-300
                                                                        ${isOutOfStock
                                                                            ? 'opacity-75 grayscale bg-gray-50 border-gray-100'
                                                                            : isSelected
                                                                                ? 'border-blue-500 shadow-md ring-1 ring-blue-500'
                                                                                : 'border-gray-100 hover:shadow-xl hover:border-gray-200'
                                                                        }`}
                                                                >
                                                                    <div className="relative h-36 bg-gray-50 flex items-center justify-center p-3 overflow-hidden">
                                                                        {isOutOfStock && (
                                                                            <div className="absolute top-2 right-2 bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm z-10">
                                                                                Hết hàng
                                                                            </div>
                                                                        )}

                                                                        {item.imageUrl ? (
                                                                            <img
                                                                                src={item.imageUrl}
                                                                                alt={item.name}
                                                                                className={`w-full h-full object-contain transition-transform duration-500 group-hover:scale-110 ${isOutOfStock ? 'opacity-60' : ''}`}
                                                                            />
                                                                        ) : (
                                                                            <FaWrench className={`text-gray-300 text-4xl transition-transform duration-500 group-hover:scale-110 ${isOutOfStock ? 'opacity-50' : ''}`} />
                                                                        )}
                                                                    </div>

                                                                    <div className="p-4 flex flex-col flex-1 border-t border-gray-50">
                                                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 line-clamp-1">
                                                                            {item.categoryDTO?.name || 'Chưa phân loại'}
                                                                        </span>

                                                                        <h3 className={`text-sm font-bold leading-snug mb-1 line-clamp-2 ${isOutOfStock ? 'text-gray-500' : 'text-gray-800'}`} title={item.name}>
                                                                            {item.name}
                                                                        </h3>

                                                                        <div className="text-xs font-medium text-gray-500 mb-3">
                                                                            Kho: <span className={isOutOfStock ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}>{stock}</span>
                                                                        </div>

                                                                        <div className="mt-auto pt-2 flex items-center justify-between">
                                                                            <span className={`text-base font-black ${isOutOfStock ? 'text-gray-400' : 'text-red-600'}`}>
                                                                                {formatPrice(item.price || 0)}
                                                                            </span>

                                                                            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg p-1">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleItemQuantityChange(item.id, -1, stock)}
                                                                                    disabled={qtyInCart === 0}
                                                                                    className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${qtyInCart === 0 ? 'text-gray-300' : 'bg-white text-gray-700 shadow-sm hover:bg-gray-100 hover:text-blue-600'}`}
                                                                                >
                                                                                    <FaMinus size={10} />
                                                                                </button>
                                                                                <span className={`w-5 text-center font-bold text-sm ${isSelected ? 'text-blue-600' : 'text-gray-800'}`}>
                                                                                    {qtyInCart}
                                                                                </span>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleItemQuantityChange(item.id, 1, stock)}
                                                                                    disabled={isOutOfStock || qtyInCart >= stock}
                                                                                    className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${isOutOfStock || qtyInCart >= stock ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'}`}
                                                                                >
                                                                                    <FaPlus size={10} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </form>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                form="diagnosisForm"
                                disabled={isModalLoading}
                                className={`px-8 py-2.5 rounded-xl font-bold text-white transition-all ${isModalLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 hover:-translate-y-0.5'}`}
                            >
                                Lưu Kết Luận
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentManagement;