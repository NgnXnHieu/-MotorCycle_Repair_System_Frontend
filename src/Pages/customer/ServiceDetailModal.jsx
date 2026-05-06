import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, X, Package, ShieldCheck } from 'lucide-react';

const ServiceDetailModal = ({ isOpen, onClose, serviceData }) => {
    const navigate = useNavigate();

    // Xử lý đóng Modal bằng phím Escape (Chuyển từ file cũ sang đây)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Nếu không mở hoặc không có data thì không render gì cả
    if (!isOpen || !serviceData) return null;

    // Trích xuất dữ liệu
    const serviceInfo = serviceData?.serviceDetialDTO || serviceData?.serviceDetailDTO;
    const itemsInfo = serviceData?.itemDetailDTOS || [];

    if (!serviceInfo) return null;

    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={onClose} // Nhấn ra ngoài Modal để đóng
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
                        onClick={onClose}
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
    );
};

export default ServiceDetailModal;