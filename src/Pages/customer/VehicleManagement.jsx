import React, { useEffect, useState } from 'react';
import { Plus, Edit, ShieldCheck, Calendar, Hash, Wrench, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { vehicleApi } from '../../api/vehicleApi';
import AddVehicleModal from '../../components/common/VehicleManagement/AddVehicleModal';
import { getErrorMessage } from '../../utils/errorHandler';
import EditVehicleModal from '../../components/common/VehicleManagement/EditVehicleModal';
import { useNavigate } from 'react-router-dom';

export default function VehicleManagement() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [vehicles, setVehicles] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    // --- STATE MỚI: Dành cho Toast và Submit Loading ---
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, type: '', message: '' });

    // Hàm hiển thị Toast tự tắt sau 3 giây
    const showToast = (type, message) => {
        setToast({ show: true, type, message });
        setTimeout(() => {
            setToast({ show: false, type: '', message: '' });
        }, 3000);
    };

    const fetchVehicles = async () => {
        try {
            setIsLoading(true);
            const vehicleData = await vehicleApi.getMyVehicles();
            setVehicles(vehicleData.content || []);
        } catch (error) {
            console.error("Không thể tải dữ liệu từ server", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    const handleSaveNewVehicle = async (newVehicleData, imageFile) => {
        try {
            setIsSubmitting(true); // Bật cờ đang gửi API
            const formData = new FormData();
            formData.append('licensePlate', newVehicleData.licensePlate);
            formData.append('brand', newVehicleData.brand);
            formData.append('model', newVehicleData.model);
            formData.append('manufacture_year', newVehicleData.manufacture_year);

            if (imageFile) {
                formData.append('image', imageFile);
            }

            await vehicleApi.createVehicle(formData);

            // Tắt Modal và reset trạng thái trước
            setIsModalOpen(false);

            // Hiện thông báo thành công
            showToast('success', 'Đã thêm phương tiện mới thành công!');

            // Cập nhật lại danh sách
            await fetchVehicles();

        } catch (error) {
            console.error("Lỗi API createVehicle:", error);

            // SỬ DỤNG HÀM TÁI SỬ DỤNG Ở ĐÂY (Chỉ cần 1 dòng)
            const message = getErrorMessage(error, "Không thể lưu thông tin xe lúc này.");

            // Bắn toast thông báo
            showToast('error', message);
        } finally {
            setIsSubmitting(false); // Tắt cờ
        }
    };

    const handleUpdateVehicle = async (updatedData, imageFile) => { // Nhận thêm imageFile
        try {
            setIsSubmitting(true);
            const formData = new FormData();

            // Không truyền licensePlate vì API thường không cho phép đổi khóa chính
            formData.append('brand', updatedData.brand);
            formData.append('model', updatedData.model);
            formData.append('manufacture_year', updatedData.manufacture_year);

            // Gắn file ảnh nếu người dùng có chọn ảnh mới
            if (imageFile) {
                formData.append('image', imageFile);
            }

            // Gọi API: Đảm bảo trong vehicleApi.js bạn có hàm update tương ứng
            await vehicleApi.updateVehicle(updatedData.id, formData);

            setEditingVehicle(null);
            showToast('success', 'Cập nhật thông tin xe thành công!');
            await fetchVehicles();
        } catch (error) {
            console.error("Lỗi API updateVehicle:", error);

            // SỬ DỤNG HÀM TÁI SỬ DỤNG Ở ĐÂY (Chỉ cần 1 dòng)
            const message = getErrorMessage(error, "Không thể lưu thông tin xe lúc này.");
            showToast('error', message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 4. HÀM GỌI API XÓA XE
    const handleDeleteVehicle = async (vehicleId) => {
        try {
            setIsSubmitting(true);

            // Gọi API Xóa (Bạn cần viết thêm hàm deleteVehicle trong vehicleApi.js)
            // await vehicleApi.deleteVehicle(vehicleId);

            setEditingVehicle(null); // Đóng modal
            showToast('success', 'Đã xóa xe khỏi danh sách!');
            await fetchVehicles();
        } catch (error) {
            const message = getErrorMessage(error, "Không thể xóa xe lúc này.");
            showToast('error', message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full min-h-screen bg-gray-50 pb-12 relative overflow-hidden">

            {/* --- UI TOAST THÔNG BÁO GÓC TRÊN CÙNG BÊN PHẢI --- */}
            <div className={`fixed top-5 right-5 z-[9999] transition-all duration-500 transform ${toast.show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
                {toast.show && (
                    <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                        {toast.type === 'success' ? <CheckCircle2 className="text-emerald-500" /> : <XCircle className="text-red-500" />}
                        <span className="font-semibold text-sm">{toast.message}</span>
                    </div>
                )}
            </div>

            <AddVehicleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveNewVehicle}
                isSubmitting={isSubmitting} // Truyền cờ này xuống để disable form
            />

            {/* 6. NHÚNG COMPONENT EDIT VÀO CUỐI TRANG */}
            <EditVehicleModal
                isOpen={!!editingVehicle}
                onClose={() => setEditingVehicle(null)}
                initialData={editingVehicle}
                onUpdate={handleUpdateVehicle}
                onDelete={handleDeleteVehicle}
                isSubmitting={isSubmitting}
            />

            {/* ... KHU VỰC BANNER VÀ RENDER DANH SÁCH XE CỦA BẠN GIỮ NGUYÊN NHƯ CŨ ... */}
            {/* (Chỗ này bạn cứ để nguyên code cũ của bạn là chạy mượt) */}
            {/* KHU VỰC BANNER FULL WIDTH */}
            <div className="relative w-full h-[320px]">
                <img
                    src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=2070"
                    alt="Garage Background"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/60 to-transparent flex flex-col justify-end pb-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto w-full">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 drop-shadow-md">
                            Quản lý xe cá nhân
                        </h1>
                        <p className="text-gray-200 text-base md:text-lg max-w-xl">
                            Theo dõi tình trạng, lịch sử bảo dưỡng và quản lý thông tin phương tiện của bạn một cách dễ dàng.
                        </p>
                    </div>
                </div>
            </div>

            {/* KHU VỰC NỘI DUNG CHÍNH */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">

                {/* Thanh công cụ (Toolbar) */}
                <div className="bg-white rounded-xl shadow-lg p-5 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Wrench size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Danh sách phương tiện</h2>
                            <p className="text-gray-500 text-sm font-medium">Bạn đang có {vehicles.length} xe được quản lý</p>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/vehicleManagement/addVehiclePage')} // Điều hướng sang route mới
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg w-full sm:w-auto justify-center"
                    >
                        <Plus size={20} strokeWidth={2.5} />
                        Thêm xe mới
                    </button>
                </div>

                {/* Danh sách xe */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center pt-20 text-gray-500 gap-3">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                        <p className="font-medium">Đang tải dữ liệu phương tiện...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {vehicles.map((vehicle) => (
                            <div key={vehicle.id}
                                onClick={() => navigate(`/vehicleDetail/${vehicle.id}`)}
                                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group cursor-pointer">
                                {/* Khung ảnh */}
                                <div className="h-52 w-full bg-gray-200 overflow-hidden relative">
                                    <img
                                        src={vehicle.iamge || "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800"}
                                        alt={vehicle.model}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm flex items-center gap-1">
                                        <ShieldCheck size={14} className="text-green-600" />
                                        {vehicle.brand}
                                    </div>
                                </div>
                                {/* Chi tiết */}
                                <div className="p-5 flex-grow flex flex-col">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                        {vehicle.model}
                                    </h3>
                                    <div className="space-y-3 mb-6 flex-grow">
                                        <div className="flex items-center text-gray-600 text-sm">
                                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center mr-3">
                                                <Hash size={16} className="text-gray-400" />
                                            </div>
                                            <span className="font-medium text-gray-900 mr-1">Biển số:</span>
                                            <span className="text-gray-700">{vehicle.licensePlate}</span>
                                        </div>
                                        <div className="flex items-center text-gray-600 text-sm">
                                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center mr-3">
                                                <Calendar size={16} className="text-gray-400" />
                                            </div>
                                            <span className="font-medium text-gray-900 mr-1">Đời xe:</span>
                                            <span className="text-gray-700">{vehicle.manufacture_year}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Điều hướng sang trang edit kèm theo ID của xe
                                            navigate(`/vehicleManagement/edit/${vehicle.id}`);
                                        }}
                                        className="cursor-pointer mt-auto w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-blue-500 text-gray-700 hover:text-white border border-gray-200 hover:border-blue-200 font-semibold py-2.5 rounded-lg transition-colors"
                                    >
                                        <Edit size={16} />
                                        Cập nhật thông tin
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}