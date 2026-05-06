import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaWrench, FaSearch, FaFilter, FaSpinner, FaTimes, FaPlus, FaMinus, FaArrowLeft
} from 'react-icons/fa';
import Swal from 'sweetalert2';

// Import API (Đảm bảo đường dẫn import đúng với dự án của bạn)
import { appointmentApi } from '../../api/appointmentApi';
import { employeeApi } from '../../api/employeeApi';
import { serviceApi } from '../../api/serviceApi';
import { categoryApi } from '../../api/categoryApi';
import { itemApi } from '../../api/itemApi';

const DiagnosisPage = () => {
    const { appointmentId } = useParams();
    console.log(appointmentId)
    const navigate = useNavigate();

    // ================= STATES =================
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Master Data
    const [services, setServices] = useState([]);
    const [employees, setEmployees] = useState([]);
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
        employeeId: '',
        itemList: {}
    });

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    // ================= CALL API KHỞI TẠO =================
    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [empRes, svcRes, catRes, itemRes] = await Promise.all([
                    employeeApi.getEmployeesOfBranch(),
                    serviceApi.getServiceList(),
                    categoryApi.getAllCategory(),
                    itemApi.getItem4Rep({})
                ]);

                setEmployees(Array.isArray(empRes) ? empRes : (empRes?.data || []));
                setServices(Array.isArray(svcRes) ? svcRes : (svcRes?.data || []));
                setCategories(catRes?.content || catRes?.data?.content || (Array.isArray(catRes) ? catRes : []));

                const itemsData = itemRes?.content || itemRes?.data?.content || itemRes || [];
                setFilteredItems(itemsData);
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu:", error);
                Swal.fire('Lỗi', 'Không thể tải dữ liệu master. Vui lòng thử lại!', 'error');
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
    const isPartsService = diagnoseForm.serviceIds.some(id => {
        const svc = services.find(s => s.id.toString() === id.toString());
        return svc && (svc.name.toLowerCase().includes('thay linh kiện') || svc.id === 3);
    });

    const handleAddService = () => {
        if (!selectedServiceToAdd) return;

        if (diagnoseForm.serviceIds.includes(selectedServiceToAdd)) {
            Swal.fire({ icon: 'warning', title: 'Trùng lặp', text: 'Dịch vụ này đã được chọn!', timer: 1500 });
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

            const stillHasPartsService = newServiceIds.some(id => {
                const svc = services.find(s => s.id.toString() === id.toString());
                return svc && (svc.name.toLowerCase().includes('thay linh kiện') || svc.id === 3);
            });

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
            Swal.fire('Thiếu thông tin', 'Vui lòng chọn ít nhất 1 dịch vụ!', 'warning');
            return;
        }

        const payload = {
            appointmentId: parseInt(diagnoseForm.appointmentId),
            serviceIds: diagnoseForm.serviceIds.map(id => parseInt(id)),
            description: diagnoseForm.description,
            employeeId: parseInt(diagnoseForm.employeeId),
            itemList: diagnoseForm.itemList
        };

        const result = await Swal.fire({
            title: 'Xác nhận chuẩn đoán?',
            text: "Lưu kết luận và phân công thợ này?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Đồng ý, lưu lại!',
        });

        if (!result.isConfirmed) return;

        try {
            setSubmitting(true);
            await appointmentApi.updateToWaiting(payload);

            await Swal.fire({
                icon: 'success', title: 'Thành công!',
                text: 'Đã cập nhật chuẩn đoán thành công!',
                timer: 2000, showConfirmButton: false
            });

            // SỬA TẠI ĐÂY: Chuyển đích danh về trang Quản lý thay vì dùng navigate(-1)
            navigate('/receptionist/appointmentManagement');

        } catch (error) {
            console.error(error?.response);
            Swal.fire('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra khi lưu', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <FaSpinner className="animate-spin text-4xl text-[#5b9b8b]" />
            </div>
        );
    }

    return (
        // SỬA: Thay max-w-7xl bằng w-full và thêm padding phù hợp để co giãn theo Sidebar cha
        <div className="w-full p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen font-sans">
            <div className="flex flex-col gap-6">

                {/* Header */}
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition">
                        <FaArrowLeft />
                    </button>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                            <FaWrench size={20} />
                        </div>
                        Kết Luận Tình Trạng Phiếu #{appointmentId}
                    </h1>
                </div>

                <form id="diagnosisForm" onSubmit={handleSubmitDiagnosis} className="flex flex-col gap-6">

                    {/* ================= KHỐI 1: THÔNG TIN XỬ LÝ (FORM) ================= */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-5">
                        <h3 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3">Thông tin xử lý</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Cột full: Mô tả */}
                            <div className="flex flex-col gap-2 md:col-span-2">
                                <label className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Mô tả chi tiết <span className="text-red-500">*</span></label>
                                <textarea
                                    required rows="3"
                                    placeholder="Ghi rõ các vấn đề kỹ thuật phát hiện được..."
                                    value={diagnoseForm.description}
                                    onChange={e => setDiagnoseForm({ ...diagnoseForm, description: e.target.value })}
                                    className="border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/50 bg-gray-50 focus:bg-white transition-all"
                                />
                            </div>

                            {/* Cột 1: Thợ */}
                            <div className="flex flex-col gap-2">
                                <label className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Phân công Thợ <span className="text-red-500">*</span></label>
                                <select
                                    required
                                    value={diagnoseForm.employeeId}
                                    onChange={e => setDiagnoseForm({ ...diagnoseForm, employeeId: e.target.value })}
                                    className="border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/50 bg-gray-50 focus:bg-white transition-all"
                                >
                                    <option value="">-- Chọn nhân viên kỹ thuật --</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>#{emp.id} - {emp.full_name} - {emp.phone}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Cột 2: Gói dịch vụ */}
                            <div className="flex flex-col gap-2">
                                <label className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Gói Dịch Vụ <span className="text-red-500">*</span></label>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedServiceToAdd}
                                        onChange={e => setSelectedServiceToAdd(e.target.value)}
                                        className="border border-gray-200 rounded-xl p-3 flex-1 outline-none bg-gray-50 focus:bg-white transition-all"
                                    >
                                        <option value="">-- Chọn dịch vụ --</option>
                                        {services.map((svc) => (
                                            <option key={svc.id} value={svc.id}>{svc.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleAddService}
                                        className="bg-[#5b9b8b] hover:bg-[#487a6d] text-white px-5 rounded-xl font-bold transition-colors shadow-sm"
                                    >
                                        Thêm
                                    </button>
                                </div>

                                {/* List Dịch vụ đã chọn */}
                                {diagnoseForm.serviceIds.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100 min-h-[44px]">
                                        {diagnoseForm.serviceIds.map(id => {
                                            const sName = services.find(s => s.id.toString() === id.toString())?.name;
                                            return (
                                                <div key={id} className="bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm">
                                                    <span>{sName}</span>
                                                    <button type="button" onClick={() => handleRemoveService(id)} className="text-blue-400 hover:text-red-500 transition-colors">
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

                    {/* ================= KHỐI 2: KHO PHỤ TÙNG (HIỂN THỊ DƯỚI FORM) ================= */}
                    {isPartsService && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                            {/* Filter Header */}
                            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
                                <div className="flex items-center gap-2">
                                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><FaWrench size={16} /></div>
                                    <h3 className="font-bold text-gray-900 text-lg">Danh Sách Phụ Tùng</h3>
                                    <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium ml-2">
                                        Đã chọn: {Object.keys(diagnoseForm.itemList).length} món
                                    </span>
                                </div>
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <div className="relative flex-1 sm:w-[250px]">
                                        <input
                                            type="text" placeholder="Tìm kiếm linh kiện..." value={itemSearchText}
                                            onChange={e => setItemSearchText(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
                                        />
                                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                    <div className="relative w-full sm:w-[200px]">
                                        <select
                                            value={selectedItemCategory} onChange={e => setSelectedItemCategory(e.target.value)}
                                            className="w-full pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none appearance-none focus:ring-2 focus:ring-blue-500/30"
                                        >
                                            <option value="">Tất cả danh mục</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                        <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Danh sách lưới (Grid) */}
                            <div className="p-6 bg-gray-50/30">
                                {filteredItems.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-3">
                                        <FaWrench size={40} className="opacity-20" />
                                        <p className="font-medium text-lg">Không tìm thấy linh kiện nào.</p>
                                    </div>
                                ) : (
                                    // SỬA: Chuyển sang dùng auto-fill và minmax để tự động co giãn ô khi Sidebar đóng/mở
                                    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
                                        {filteredItems.map((itemObj) => {
                                            const item = itemObj.itemSimpleDTO;
                                            const stock = itemObj.stockQuantity;
                                            const qtyInCart = diagnoseForm.itemList[item.id] || 0;
                                            const isOutOfStock = stock <= 0;
                                            const isSelected = qtyInCart > 0;

                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`bg-white rounded-2xl overflow-hidden flex flex-col relative group transition-all duration-300
                                                        ${isOutOfStock ? 'opacity-75 grayscale bg-gray-50 border-gray-200 border' :
                                                            isSelected ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-gray-200 border hover:shadow-xl hover:border-blue-300'}`}
                                                >
                                                    {/* Ảnh phụ tùng */}
                                                    <div className="relative h-36 bg-gray-50 flex items-center justify-center p-3 overflow-hidden border-b border-gray-100">
                                                        {isOutOfStock && (
                                                            <div className="absolute top-2 right-2 bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-black uppercase px-2 py-1 rounded shadow-sm z-10">
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
                                                            <FaWrench className={`text-gray-200 text-5xl transition-transform duration-500 group-hover:scale-110 ${isOutOfStock ? 'opacity-50' : ''}`} />
                                                        )}
                                                    </div>

                                                    {/* Thông tin phụ tùng */}
                                                    <div className="p-4 flex flex-col flex-1">
                                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 line-clamp-1">
                                                            {item.categoryDTO?.name || 'Chưa phân loại'}
                                                        </span>
                                                        <h3 className={`text-sm font-bold leading-snug mb-1 line-clamp-2 ${isOutOfStock ? 'text-gray-500' : 'text-gray-800'}`} title={item.name}>
                                                            {item.name}
                                                        </h3>
                                                        <div className="text-xs font-medium text-gray-500 mb-3">
                                                            Kho: <span className={isOutOfStock ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}>{stock}</span>
                                                        </div>

                                                        {/* Giá & Nút Add/Minus */}
                                                        <div className="mt-auto pt-2 flex items-center justify-between border-t border-gray-50">
                                                            <span className={`text-[15px] font-black ${isOutOfStock ? 'text-gray-400' : 'text-red-600'}`}>
                                                                {formatPrice(item.price || 0)}
                                                            </span>

                                                            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleItemQuantityChange(item.id, -1, stock)}
                                                                    disabled={qtyInCart === 0}
                                                                    className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${qtyInCart === 0 ? 'text-gray-300' : 'bg-white text-gray-700 shadow-sm hover:bg-gray-200 hover:text-blue-600'}`}
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
                                                                    className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${isOutOfStock || qtyInCart >= stock ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'}`}
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

                    {/* ================= NÚT SUBMIT (BỎ STICKY) ================= */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 flex justify-end gap-3 mt-4">
                        <button
                            type="button"
                            // SỬA TẠI ĐÂY: Chuyển đích danh về trang Quản lý
                            onClick={() => navigate('/receptionist/appointmentManagement')}
                            className="px-6 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`px-8 py-3 rounded-xl font-bold text-white transition-all ${submitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30'}`}
                        >
                            {submitting ? 'Đang xử lý...' : 'Xác nhận Lưu Kết Luận'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DiagnosisPage;