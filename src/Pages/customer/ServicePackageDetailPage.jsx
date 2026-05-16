import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, CalendarDays, ShieldCheck,
    CheckCircle2, Tag, Heart, Info, ListTree,
    Clock, Repeat, Zap, HelpCircle // Thêm icon HelpCircle cho Modal xác nhận
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { servicePackageApi } from '../../api/servicePackageApi';
import Swal from 'sweetalert2';
import { paymentApi } from '../../api/paymentApi';
import PaymentQRCodeModal from './PaymentQRCodeModal';

export default function ServicePackageDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Khởi tạo State ban đầu
    const [servicePackage, setServicePackage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [relatedPackages, setRelatedPackages] = useState([]);

    // STATE CHO THANH TOÁN
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // MỚI: State mở form xác nhận
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const packageData = await servicePackageApi.getById(id);
                setServicePackage(packageData);

                try {
                    const relatedResponse = await servicePackageApi.getRelatedPackages(id);
                    setRelatedPackages(relatedResponse);
                } catch (relatedErr) {
                    console.error("Lỗi khi tải gói liên quan:", relatedErr);
                    setRelatedPackages([]);
                }

            } catch (err) {
                console.error("Lỗi tải chi tiết gói dịch vụ:", err);
                setError("Không thể tải thông tin gói dịch vụ lúc này.");
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchData();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [id]);

    // HÀM MỚI: XỬ LÝ KHI NGƯỜI DÙNG BẤM "XÁC NHẬN" TRONG MODAL
    const handleConfirmRegister = async () => {
        setIsGeneratingQR(true);
        try {
            // Gọi API tạo QR
            const response = await paymentApi.generateQRForServicePackage(id);
            // console.log(response)

            setPaymentInfo({
                ...response,
                orderId: response.orderCode,
                customerPackageId: response.customerPackageId
            });

            // Đóng modal xác nhận và Mở modal QR code
            setIsConfirmModalOpen(false);
            setIsModalOpen(true);
        } catch (err) {
            console.error("Lỗi tạo mã thanh toán:", err);
            alert("Không thể tạo mã thanh toán lúc này. Vui lòng thử lại sau!");
            setIsConfirmModalOpen(false); // Đóng modal nếu lỗi
        } finally {
            setIsGeneratingQR(false);
        }
    };

    const handlePaymentSuccess = () => {
        setIsModalOpen(false); // Đóng Modal QR code

        // Hiển thị thông báo bằng SweetAlert2
        Swal.fire({
            title: 'Thanh toán thành công!',
            text: 'Gói dịch vụ của bạn đã được kích hoạt.',
            icon: 'success',
            confirmButtonText: 'Xác nhận',
            confirmButtonColor: '#4f46e5', // Màu xanh indigo cho tone-sur-tone với web của bạn
            allowOutsideClick: false // Không cho bấm ra ngoài để đóng, bắt buộc bấm nút Xác nhận
        }).then((result) => {
            if (result.isConfirmed) {
                // Hành động sau khi khách hàng bấm nút "Xác nhận" trên thông báo
                // Ví dụ: Chuyển hướng về trang danh sách gói của tôi
                navigate("/myServicePackagesPage");
            }
        });
    };

    const formatPrice = (priceStr) => {
        const numericPrice = Number(priceStr);
        if (isNaN(numericPrice)) return priceStr;
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numericPrice);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-3">
                    <Zap className="animate-spin text-blue-600" size={32} />
                    <span className="text-gray-500 font-bold">Đang tải dữ liệu gói dịch vụ...</span>
                </div>
            </div>
        );
    }

    if (error || !servicePackage) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
                <p className="text-red-500 font-bold text-lg">{error || "Không tìm thấy gói dịch vụ"}</p>
                <button onClick={() => navigate(-1)} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl">Quay lại</button>
            </div>
        );
    }

    const displayImage = servicePackage.imageUrl || servicePackage.image;

    return (
        <div className="min-h-screen bg-gray-50 pb-16 font-sans">
            <div className="bg-white border-b border-gray-200 py-4 mb-8">
                <div className="max-w-6xl mx-auto px-4 flex items-center gap-2 text-sm text-gray-500 font-medium">
                    <button onClick={() => navigate(-1)} className="hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer">
                        <ArrowLeft size={16} /> Quay lại
                    </button>
                    <span className="text-gray-300">|</span>
                    <span onClick={() => navigate("/servicePackagePage")} className="hover:text-blue-600 cursor-pointer">Gói dịch vụ</span>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-800 font-bold truncate max-w-[200px] sm:max-w-none">{servicePackage.name}</span>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 space-y-8">
                <div className="bg-white rounded-[2rem] shadow-md border border-slate-200 overflow-hidden flex flex-col md:flex-row">

                    <div className="md:w-5/12 relative bg-slate-100 flex-shrink-0 border-b md:border-b-0 md:border-r border-slate-100 min-h-[300px] md:min-h-full">
                        <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-black text-indigo-700 shadow-md border border-white/50 flex items-center gap-1.5 z-20">
                            <Tag size={14} /> GÓI DỊCH VỤ
                        </div>

                        {displayImage ? (
                            <img src={displayImage} alt={servicePackage.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105 z-10" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-slate-300">
                                <ShieldCheck size={80} strokeWidth={1.5} />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-15 pointer-events-none"></div>
                    </div>

                    <div className="md:w-7/12 p-8 lg:p-10 flex flex-col justify-center">
                        <div className="mb-6">
                            <h1 className="text-3xl font-black text-gray-900 leading-tight mb-3">{servicePackage.name}</h1>
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1.5 text-sm font-bold text-green-600">
                                    <CheckCircle2 size={16} /> Đang áp dụng
                                </span>
                                <span className="text-gray-300">|</span>
                                <span className="text-gray-500 text-sm font-medium flex items-center gap-1">
                                    Mã gói: PKG-{servicePackage.id?.toString().padStart(4, '0')}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 mt-4">
                                <div className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-blue-200">
                                    <Clock size={14} /> Thời hạn: {servicePackage.duration}
                                </div>
                                <div className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-indigo-200">
                                    <Repeat size={14} /> Số lần sử dụng: {servicePackage.usageTimes} lần
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 mb-8 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-semibold">Giá đăng ký gói:</span>
                                <span className="text-3xl font-black text-red-600">
                                    {formatPrice(servicePackage.price)}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                            {/* NÚT NÀY BÂY GIỜ CHỈ ĐỂ MỞ MODAL XÁC NHẬN */}
                            <button
                                onClick={() => setIsConfirmModalOpen(true)}
                                className="flex-[2] font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md text-white cursor-pointer bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                            >
                                <CalendarDays size={20} /> Đăng ký ngay
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 lg:p-10">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                        <Info className="text-blue-600" size={24} />
                        <h2 className="text-2xl font-black text-gray-900">Quyền lợi gói dịch vụ</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-1 space-y-4">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start gap-3">
                                <Clock size={20} className="text-blue-500 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase">Thời hạn hiệu lực</p>
                                    <p className="text-base font-bold text-gray-800 mt-1">{servicePackage.duration}</p>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start gap-3">
                                <ShieldCheck size={20} className="text-blue-500 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase">Số lần sử dụng</p>
                                    <p className="text-base font-bold text-gray-800 mt-1">Tối đa {servicePackage.usageTimes} lần</p>
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-2 text-gray-600 leading-relaxed text-justify space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                            <p className="whitespace-pre-line">{servicePackage.description || "Chưa có mô tả chi tiết cho gói dịch vụ này."}</p>
                        </div>
                    </div>
                </div>

                <div className="pt-8">
                    <div className="flex items-center gap-2 mb-6">
                        <ListTree className="text-blue-600" size={24} />
                        <h2 className="text-2xl font-black text-gray-900">Các gói dịch vụ khác</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {relatedPackages.length > 0 ? (
                            relatedPackages.map((pkg) => {
                                const pkgImg = pkg.imageUrl || pkg.image;
                                return (
                                    <div
                                        key={pkg.id}
                                        onClick={() => navigate(`/servicePackageDetailPage/${pkg.id}`)}
                                        className="bg-white group rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col"
                                    >
                                        <div className="aspect-[4/3] bg-gray-50 rounded-xl mb-4 overflow-hidden flex items-center justify-center relative">
                                            {pkgImg ? (
                                                <img src={pkgImg} alt={pkg.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <ShieldCheck size={40} className="text-gray-300 group-hover:scale-110 transition-transform duration-500" />
                                            )}
                                        </div>
                                        <h3 className="font-bold text-gray-800 text-sm md:text-base line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                                            {pkg.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 mb-3">{pkg.usageTimes} lần • {pkg.duration}</p>
                                        <div className="mt-auto flex items-center justify-between">
                                            <span className="font-black text-red-600">{formatPrice(pkg.price)}</span>
                                            <button onClick={(e) => { e.stopPropagation(); console.log("Lưu gói", pkg.id); }} className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-600 hover:text-white transition-colors">
                                                <Heart size={18} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full text-center py-8 text-gray-400 font-medium">Không có gói dịch vụ nào khác.</div>
                        )}
                    </div>
                </div>

            </div>

            {/* MỚI: MODAL XÁC NHẬN ĐĂNG KÝ */}
            {isConfirmModalOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => !isGeneratingQR && setIsConfirmModalOpen(false)} // Bấm ra ngoài để đóng (trừ khi đang loading)
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()} // Chặn sự kiện click bên trong Modal
                    >
                        <div className="p-6">
                            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-5 mx-auto">
                                <HelpCircle className="text-blue-600" size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                                Xác nhận đăng ký
                            </h3>
                            <p className="text-center text-gray-500 mb-6 leading-relaxed">
                                Bạn có chắc chắn muốn đăng ký gói dịch vụ <strong className="text-gray-800">{servicePackage.name}</strong> với giá <strong className="text-red-600">{formatPrice(servicePackage.price)}</strong> không?
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsConfirmModalOpen(false)}
                                    disabled={isGeneratingQR}
                                    className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={handleConfirmRegister}
                                    disabled={isGeneratingQR}
                                    className="flex-1 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                                >
                                    {isGeneratingQR ? (
                                        <><Zap className="animate-spin" size={18} /> Đang xử lý...</>
                                    ) : (
                                        "Xác nhận"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL QR CODE THANH TOÁN (Giữ nguyên) */}
            <PaymentQRCodeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                paymentData={paymentInfo}
                onSuccess={handlePaymentSuccess}
            />
        </div>
    );
}