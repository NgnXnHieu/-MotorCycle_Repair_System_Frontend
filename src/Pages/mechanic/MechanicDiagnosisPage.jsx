import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaWrench, FaSearch, FaFilter, FaSpinner, FaTimes, FaPlus, FaMinus, FaArrowLeft, FaClipboardList
} from 'react-icons/fa';
import Swal from 'sweetalert2';

// Import API 
import { appointmentApi } from '../../api/appointmentApi';
import { serviceApi } from '../../api/serviceApi';
import { categoryApi } from '../../api/categoryApi';
import { itemApi } from '../../api/itemApi';

const MechanicDiagnosisPage = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();

    // ================= STATES =================
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Master Data
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);

    // States cho Phụ tùng
    const [itemSearchText, setItemSearchText] = useState('');
    const [selectedItemCategory, setSelectedItemCategory] = useState('');

    // Form Data
    const [selectedServiceToAdd, setSelectedServiceToAdd] = useState('');
    const [diagnoseForm, setDiagnoseForm] = useState({
        appointmentId: appointmentId,
        serviceIds: [],
        description: '',
        // Đã bỏ employeeId vì thợ tự thực hiện
        itemList: {}
    });

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    // ================= CALL API KHỞI TẠO =================
    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                // Chỉ lấy Dịch vụ, Danh mục và Phụ tùng (Bỏ nhân viên)
                const [svcRes, catRes, itemRes] = await Promise.all([
                    serviceApi.getServiceList(),
                    categoryApi.getAllCategory(),
                    itemApi.getItem4Rep({})
                ]);

                setServices(Array.isArray(svcRes) ? svcRes : (svcRes?.data || []));
                setCategories(catRes?.content || catRes?.data?.content || (Array.isArray(catRes) ? catRes : []));

                const itemsData = itemRes?.content || itemRes?.data?.content || itemRes || [];
                setFilteredItems(itemsData);
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu:", error);
                Swal.fire('Lỗi', 'Không thể tải dữ liệu khởi tạo.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchMasterData();
    }, []);

    // Debounce tìm kiếm phụ tùng
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            try {
                const payload = {
                    categoryId: selectedItemCategory !== '' ? selectedItemCategory : null,
                    searchName: itemSearchText
                };
                const res = await itemApi.getItem4Rep(payload);
                setFilteredItems(res?.content || []);
            } catch (error) {
                console.error("Lỗi khi tìm kiếm phụ tùng:", error);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [selectedItemCategory, itemSearchText]);

    // ================= XỬ LÝ LOGIC DỊCH VỤ =================
    // Logic kiểm tra xem có dịch vụ nào liên quan đến phụ tùng (ID = 3) để hiện bảng kho
    const isPartsService = diagnoseForm.serviceIds.some(id => id.toString() === "3");

    const handleAddService = () => {
        if (!selectedServiceToAdd) return;

        if (diagnoseForm.serviceIds.includes(selectedServiceToAdd)) {
            Swal.fire({ icon: 'warning', title: 'Trùng lặp', text: 'Dịch vụ này đã có trong danh sách!', timer: 1500 });
            return;
        }

        setDiagnoseForm(prev => ({
            ...prev,
            serviceIds: [...prev.serviceIds, selectedServiceToAdd]
        }));
        setSelectedServiceToAdd('');
    };

    const handleRemoveService = (idToRemove) => {
        setDiagnoseForm(prev => {
            const newServiceIds = prev.serviceIds.filter(id => id !== idToRemove);
            const stillHasPartsService = newServiceIds.some(id => id.toString() === "3");

            return {
                ...prev,
                serviceIds: newServiceIds,
                itemList: stillHasPartsService ? prev.itemList : {}
            };
        });
    };

    // ================= XỬ LÝ LOGIC PHỤ TÙNG =================
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

    // ================= SUBMIT =================
    const handleSubmitDiagnosis = async (e) => {
        e.preventDefault();

        if (diagnoseForm.serviceIds.length === 0) {
            Swal.fire('Chú ý', 'Bạn cần chọn ít nhất 1 dịch vụ để tiếp tục!', 'warning');
            return;
        }

        const payload = {
            appointmentId: parseInt(diagnoseForm.appointmentId),
            serviceIds: diagnoseForm.serviceIds.map(id => parseInt(id)),
            description: diagnoseForm.description,
            itemList: diagnoseForm.itemList
        };

        const result = await Swal.fire({
            title: 'Xác nhận thực hiện?',
            text: "Hệ thống sẽ cập nhật dịch vụ và chuyển trạng thái sang 'Đang sửa'.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#22c55e',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Xác nhận bắt đầu sửa',
            cancelButtonText: 'Hủy',
        });

        if (!result.isConfirmed) return;

        try {
            setSubmitting(true);
            console.log(payload)
            // SỬA TẠI ĐÂY: Gọi API dành cho thợ (Hàm POST mới chúng ta đã tạo)
            await appointmentApi.updateMechanicToFixingV2(payload);

            await Swal.fire({
                icon: 'success', title: 'Thành công!',
                text: 'Dữ liệu đã được cập nhật, chúc bạn làm việc hiệu quả!',
                timer: 2000, showConfirmButton: false
            });

            navigate('/mechanic/myShift');

        } catch (error) {
            console.error(error?.error);
            Swal.fire('Lỗi hệ thống', error.response || 'Không thể lưu dữ liệu lúc này', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <FaSpinner className="animate-spin text-4xl text-blue-600" />
            </div>
        );
    }

    return (
        <div className="w-full p-4 md:p-6 lg:p-8 bg-gray-100 min-h-screen font-sans">
            <div className="flex flex-col gap-6 max-w-6xl mx-auto">

                {/* Header Section */}
                <div className="flex items-center justify-between bg-white p-5 rounded-sm shadow-md border-l-8 border-l-blue-600">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2.5 bg-gray-100 text-gray-600 rounded-sm hover:bg-gray-200 transition shadow-sm">
                            <FaArrowLeft />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                                <FaClipboardList className="text-blue-600" />
                                Tiếp nhận sửa chữa #{appointmentId}
                            </h1>
                            <p className="text-gray-500 text-sm font-medium">Kỹ thuật viên cập nhật dịch vụ thực tế</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmitDiagnosis} className="flex flex-col gap-6">

                    {/* KHỐI 1: NỘI DUNG SỬA CHỮA */}
                    <div className="bg-white p-6 rounded-sm shadow-md border border-gray-200">
                        <h3 className="font-black text-gray-800 text-lg uppercase mb-6 border-b pb-3 flex items-center gap-2">
                            <div className="w-2 h-6 bg-blue-600"></div> Chi tiết công việc
                        </h3>

                        <div className="flex flex-col gap-6">
                            {/* Mô tả kết luận của thợ */}
                            <div className="flex flex-col gap-2">
                                <label className="font-bold text-gray-700 text-xs uppercase tracking-widest">Ghi chú kỹ thuật thực tế <span className="text-red-500">*</span></label>
                                <textarea
                                    required rows="4"
                                    placeholder="Mô tả cụ thể tình trạng xe sau khi tháo lắp và phương án sửa chữa..."
                                    value={diagnoseForm.description}
                                    onChange={e => setDiagnoseForm({ ...diagnoseForm, description: e.target.value })}
                                    className="border-2 border-gray-200 rounded-sm p-4 outline-none focus:border-blue-500 bg-gray-50 transition-all font-medium"
                                />
                            </div>

                            {/* Chọn dịch vụ */}
                            <div className="flex flex-col gap-2">
                                <label className="font-bold text-gray-700 text-xs uppercase tracking-widest">Thêm dịch vụ thực hiện <span className="text-red-500">*</span></label>
                                <div className="flex gap-3">
                                    <select
                                        value={selectedServiceToAdd}
                                        onChange={e => setSelectedServiceToAdd(e.target.value)}
                                        className="border-2 border-gray-200 rounded-sm p-3 flex-1 outline-none bg-white focus:border-blue-500 transition-all font-bold text-gray-700"
                                    >
                                        <option value="">-- Chọn dịch vụ từ danh sách --</option>
                                        {services.map((svc) => (
                                            <option key={svc.id} value={svc.id}>{svc.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleAddService}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-sm font-black transition-all shadow-md uppercase text-sm"
                                    >
                                        Thêm
                                    </button>
                                </div>

                                {/* Chips hiển thị dịch vụ đã chọn */}
                                {diagnoseForm.serviceIds.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-2 p-4 bg-blue-50 rounded-sm border-2 border-blue-100 min-h-[60px]">
                                        {diagnoseForm.serviceIds.map(id => {
                                            const sName = services.find(s => s.id.toString() === id.toString())?.name;
                                            return (
                                                <div key={id} className="bg-white border-2 border-blue-400 text-blue-800 px-4 py-2 rounded-sm text-sm font-black flex items-center gap-3 shadow-sm uppercase tracking-wide">
                                                    <span>{sName}</span>
                                                    <button type="button" onClick={() => handleRemoveService(id)} className="text-red-500 hover:scale-125 transition-transform">
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* KHỐI 2: KHO PHỤ TÙNG (Chỉ hiện khi chọn DV Thay thế phụ tùng ID=3) */}
                    {isPartsService && (
                        <div className="bg-white rounded-sm shadow-md border border-gray-200 flex flex-col overflow-hidden">
                            <div className="p-5 border-b-2 border-gray-100 flex flex-col lg:flex-row gap-4 justify-between items-center bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="bg-orange-500 p-2.5 rounded-sm text-white shadow-sm"><FaWrench size={18} /></div>
                                    <div>
                                        <h3 className="font-black text-gray-900 uppercase text-lg leading-none">Vật tư & Phụ tùng</h3>
                                        <p className="text-xs text-gray-500 font-bold mt-1">Lựa chọn linh kiện thay thế từ kho chi nhánh</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full lg:w-auto">
                                    <div className="relative flex-1 lg:w-64">
                                        <input
                                            type="text" placeholder="Mã hoặc tên phụ tùng..." value={itemSearchText}
                                            onChange={e => setItemSearchText(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-sm text-sm font-bold outline-none focus:border-blue-500 transition-all"
                                        />
                                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                    <div className="relative flex-1 lg:w-56">
                                        <select
                                            value={selectedItemCategory} onChange={e => setSelectedItemCategory(e.target.value)}
                                            className="w-full pl-10 pr-8 py-3 bg-white border-2 border-gray-200 rounded-sm text-sm font-bold outline-none appearance-none focus:border-blue-500 transition-all"
                                        >
                                            <option value="">Tất cả loại</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                        <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50/50">
                                {filteredItems.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400 font-bold uppercase tracking-widest">
                                        Không tìm thấy linh kiện phù hợp
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {filteredItems.map((itemObj) => {
                                            const item = itemObj.itemSimpleDTO;
                                            const stock = itemObj.stockQuantity;
                                            const qtyInCart = diagnoseForm.itemList[item.id] || 0;
                                            const isOutOfStock = stock <= 0;
                                            const isSelected = qtyInCart > 0;

                                            return (
                                                <div key={item.id}
                                                    className={`bg-white border-2 rounded-sm overflow-hidden flex flex-col transition-all duration-200
                                                        ${isSelected ? 'border-blue-600 shadow-lg scale-[1.02]' : 'border-gray-200 hover:border-blue-300 shadow-sm'}`}
                                                >
                                                    <div className="h-40 bg-gray-50 flex items-center justify-center p-4 border-b">
                                                        {item.imageUrl ? (
                                                            <img src={item.imageUrl} alt={item.name} className="max-h-full object-contain" />
                                                        ) : (
                                                            <FaWrench className="text-gray-200 text-6xl" />
                                                        )}
                                                    </div>
                                                    <div className="p-4 flex flex-col flex-1">
                                                        <h3 className="font-black text-gray-800 text-sm mb-1 uppercase line-clamp-2 min-h-[40px]">{item.name}</h3>
                                                        <div className="flex justify-between items-center mb-4">
                                                            <span className="text-red-600 font-black text-base">{formatPrice(item.price)}</span>
                                                            <span className={`text-[10px] px-2 py-1 rounded-sm font-black text-white ${isOutOfStock ? 'bg-red-500' : 'bg-green-600'}`}>
                                                                KHO: {stock}
                                                            </span>
                                                        </div>
                                                        <div className="mt-auto flex items-center justify-between gap-2 bg-gray-100 p-2 rounded-sm">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleItemQuantityChange(item.id, -1, stock)}
                                                                disabled={qtyInCart === 0}
                                                                className="w-8 h-8 bg-white text-gray-700 flex items-center justify-center rounded-sm shadow-sm hover:bg-red-500 hover:text-white transition-colors"
                                                            >
                                                                <FaMinus size={10} />
                                                            </button>
                                                            <span className="font-black text-blue-700 text-lg">{qtyInCart}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleItemQuantityChange(item.id, 1, stock)}
                                                                disabled={isOutOfStock || qtyInCart >= stock}
                                                                className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center rounded-sm shadow-sm hover:bg-blue-700 transition-colors"
                                                            >
                                                                <FaPlus size={10} />
                                                            </button>
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

                    {/* NÚT THAO TÁC CUỐI TRANG */}
                    <div className="bg-white p-6 rounded-sm shadow-md border border-gray-200 flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/mechanic/appointmentManagement')}
                            className="px-8 py-3 rounded-sm font-black text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors uppercase text-sm"
                        >
                            Quay lại danh sách
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`px-10 py-3 rounded-sm font-black text-white transition-all uppercase text-sm shadow-lg 
                                ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 active:scale-95'}`}
                        >
                            {submitting ? 'Đang gửi dữ liệu...' : 'Hoàn tất & Bắt đầu sửa'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MechanicDiagnosisPage;