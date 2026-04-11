import React, { useState } from 'react';
import { branchApi } from '../../api/branchApi';
import { appointmentApi } from '../../api/appointmentApi';
import { getErrorMessage } from '../../utils/errorHandler';
import { useNavigate } from 'react-router-dom';

const EmergencyBooking = () => {
    const [formData, setFormData] = useState({
        bringerName: '',
        bringerPhone: '',
        plateNumber: '',
        brand: '',
        model: '',
        manufactureYear: '',
        descriptionOfCus: '',
        latitude: '',
        longitude: ''
    });

    const [errors, setErrors] = useState({});
    const [branches, setBranches] = useState([]);
    const navigate = useNavigate()

    // Các state quản lý trạng thái tải
    const [isLocating, setIsLocating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, type: '', message: '' });

    const showToast = (type, message) => {
        setToast({ show: true, type, message });
        setTimeout(() => {
            setToast({ show: false, type: '', message: '' });
        }, 3000);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) setErrors({ ...errors, [name]: '' });
    };

    // Hàm format khoảng cách cho đẹp
    const formatDistance = (dist) => {
        if (dist < 1) return `${(dist * 1000).toFixed(0)} m`;
        return `${dist.toFixed(1)} km`;
    };

    // 1. GỌI API LẤY CHI NHÁNH GẦN NHẤT
    const handleFindBranches = () => {
        if (!navigator.geolocation) {
            alert('Trình duyệt của bạn không hỗ trợ định vị GPS.');
            return;
        }

        setIsLocating(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                // const lat = 21.053931232888964;
                // const lng = 105.73511752341793;
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));

                try {
                    // Gọi API getNearBranches thực tế
                    // Lưu ý: params truyền vào tùy thuộc vào Backend nhận @RequestParam hay @RequestBody
                    const response = await branchApi.getNearBranches(
                        { latitude: lat, longitude: lng }
                    );
                    console.log(response)
                    setBranches(response.data || response); // Tùy vào cấu trúc interceptor của bạn
                    setIsLocating(false);
                } catch (error) {
                    console.error("🔥 Lỗi chi tiết từ Server:", error.response?.data);

                    // TÌM CÁCH LẤY MESSAGE TỪ SPRING BOOT
                    // Nếu error.response.data.message tồn tại -> lấy nó. Nếu không -> Dùng câu mặc định.
                    const serverMessage = error.response?.data?.message;
                    const displayMessage = serverMessage ? serverMessage : "Hệ thống đang bận, vui lòng thử lại sau!";

                    // Hiển thị lỗi qua hàm Toast mà bạn đã viết
                    showToast('error', displayMessage);

                    // Nếu Toast của bạn chưa hiển thị rõ, dùng thêm alert cho chắc ăn:
                    alert("❌ Không thể đặt lịch: " + displayMessage);
                    console.error("Lỗi lấy chi nhánh:", error);
                    alert("Không thể tìm thấy chi nhánh quanh đây. Vui lòng thử lại!");
                    setIsLocating(false);
                }
            },
            (error) => {
                setIsLocating(false);
                if (error.code === error.PERMISSION_DENIED) {
                    alert('Bạn đã từ chối cấp quyền vị trí. Vui lòng bật GPS!');
                } else {
                    alert('Lỗi lấy vị trí GPS.');
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    // 2. VALIDATE FORM
    const validateForm = () => {
        const newErrors = {};
        if (!formData.bringerName.trim()) newErrors.bringerName = 'Tên không được để trống';
        if (!formData.plateNumber.trim()) newErrors.plateNumber = 'Biển số xe không được để trống';

        const phoneRegex = /^[0-9]{10,}$/;
        if (!formData.bringerPhone.trim()) {
            newErrors.bringerPhone = 'Số điện thoại không được để trống';
        } else if (!phoneRegex.test(formData.bringerPhone)) {
            newErrors.bringerPhone = 'Số điện thoại >= 10 số';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 3. GỌI API TẠO EMERGENCY BOOKING
    const handleSubmitBooking = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            setIsSubmitting(true);
            try {
                // LÀM SẠCH DỮ LIỆU: Đổi chuỗi rỗng thành null đối với các trường là số bên Java
                const payload = {
                    ...formData,
                    manufactureYear: formData.manufactureYear === '' ? null : Number(formData.manufactureYear),
                    // Chắc cú thì ép kiểu luôn latitude và longitude cho an toàn tuyệt đối
                    latitude: Number(formData.latitude),
                    longitude: Number(formData.longitude)
                };

                // console.log("Dữ liệu ĐÃ LÀM SẠCH chuẩn bị gửi:", payload);

                // Gửi cục payload đã làm sạch đi thay vì formData gốc
                await appointmentApi.createEmergencyBooking(payload);

                alert("🚀 Gửi yêu cầu cứu hộ thành công! Thợ sửa xe đã nhận được vị trí và đang đến hỗ trợ bạn.");
                setIsSubmitting(false);
                // Có thể reset form hoặc chuyển hướng trang tại đây
                navigate(`/myAppointmentHistory`)
            } catch (error) {
                setIsSubmitting(false);
                console.error("🔥 Lỗi chi tiết từ Server:", error.response?.data);

                // TÌM CÁCH LẤY MESSAGE TỪ SPRING BOOT
                // Nếu error.response.data.message tồn tại -> lấy nó. Nếu không -> Dùng câu mặc định.
                const serverMessage = error.response?.data?.message;
                const displayMessage = serverMessage ? serverMessage : "Hệ thống đang bận, vui lòng thử lại sau!";

                // Hiển thị lỗi qua hàm Toast mà bạn đã viết
                showToast('error', displayMessage);

                // Nếu Toast của bạn chưa hiển thị rõ, dùng thêm alert cho chắc ăn:
                alert("❌ Không thể đặt lịch: " + displayMessage);
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 font-sans bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-red-600 mb-8 text-center uppercase tracking-wider">
                🚑 Dịch Vụ Cứu Hộ Khẩn Cấp
            </h1>

            {/* BƯỚC 1: LẤY VỊ TRÍ */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6 border-l-4 border-blue-500">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                    Xác định vị trí của bạn
                </h2>
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <button
                        onClick={handleFindBranches}
                        disabled={isLocating}
                        className={`flex-1 w-full py-4 rounded-lg text-white font-bold text-lg transition shadow-lg active:transform active:scale-95 ${isLocating ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {isLocating ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                ĐANG QUÉT VỊ TRÍ...
                            </span>
                        ) : '📍 TÌM TIỆM SỬA XE QUANH ĐÂY'}
                    </button>

                    <div className="flex-1 w-full text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
                        {formData.latitude ? (
                            <p className="text-green-600 font-bold flex items-center gap-2">
                                ✅ Đã xác định: {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
                            </p>
                        ) : (
                            <p>Vui lòng cho phép truy cập vị trí để chúng tôi điều phối thợ gần nhất.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* BƯỚC 2: HIỂN THỊ CHI NHÁNH TÌM ĐƯỢC */}
            {branches.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6 mb-6 border-l-4 border-green-500 animate-in fade-in duration-500">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <span className="bg-green-100 text-green-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                        Chi nhánh khả dụng gần bạn
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {branches.map((branch, index) => (
                            <div key={branch.id} className={`p-4 rounded-lg border-2 transition ${index === 0 ? 'border-green-500 bg-green-50 shadow-sm' : 'border-gray-100 bg-gray-50'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-800">{branch.name}</h3>
                                        <p className="text-xs text-gray-500 mb-2">{branch.address}</p>
                                    </div>
                                    {index === 0 && <span className="text-[10px] bg-green-600 text-white px-2 py-1 rounded-full uppercase">Gần nhất</span>}
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-sm">Khoảng cách: <span className="font-bold text-red-600">{formatDistance(branch.distance)}</span></p>
                                    <a href={branch.mapUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-xs underline">Xem bản đồ</a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* BƯỚC 3: FORM ĐĂNG KÝ */}
            {branches.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500 animate-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-xl font-semibold mb-4 text-red-600 flex items-center gap-2">
                        <span className="bg-red-100 text-red-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                        Thông tin cứu hộ
                    </h2>
                    <form onSubmit={handleSubmitBooking} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Tên người gọi *</label>
                                <input type="text" name="bringerName" value={formData.bringerName} onChange={handleChange} placeholder="Nguyễn Văn A" className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.bringerName ? 'border-red-500' : 'border-gray-300'}`} />
                                {errors.bringerName && <p className="text-red-500 text-xs">{errors.bringerName}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Số điện thoại *</label>
                                <input type="text" name="bringerPhone" value={formData.bringerPhone} onChange={handleChange} placeholder="09xxxxxxxx" className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.bringerPhone ? 'border-red-500' : 'border-gray-300'}`} />
                                {errors.bringerPhone && <p className="text-red-500 text-xs">{errors.bringerPhone}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Biển số xe *</label>
                                <input type="text" name="plateNumber" value={formData.plateNumber} onChange={handleChange} placeholder="29A-123.45" className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase ${errors.plateNumber ? 'border-red-500' : 'border-gray-300'}`} />
                                {errors.plateNumber && <p className="text-red-500 text-xs">{errors.plateNumber}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Hãng xe</label>
                                <input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="Honda, Yamaha..." className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Mô tả tình trạng hư hỏng</label>
                            <textarea name="descriptionOfCus" value={formData.descriptionOfCus} onChange={handleChange} placeholder="Ví dụ: Xe không đề được, thủng xăm, đứt xích..." rows="3" className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                        </div>

                        <button type="submit" disabled={isSubmitting} className={`w-full py-4 mt-4 rounded-lg text-white font-bold text-xl shadow-xl transition-all transform active:scale-95 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 hover:shadow-red-200'}`}>
                            {isSubmitting ? '⌛ ĐANG GỬI YÊU CẦU...' : '⚡ GỌI THỢ NGAY LẬP TỨC'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default EmergencyBooking;