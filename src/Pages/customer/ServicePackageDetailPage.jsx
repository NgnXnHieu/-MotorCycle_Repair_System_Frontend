import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, CalendarDays, ShieldCheck,
    CheckCircle2, Tag, Heart, Info, ListTree,
    Clock, Repeat, Zap
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { servicePackageApi } from '../../api/servicePackageApi';

export default function ServicePackageDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Khởi tạo State
    const [servicePackage, setServicePackage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [relatedPackages, setRelatedPackages] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {

                const packageData = await servicePackageApi.getById(id);
                console.log(packageData)
                setServicePackage(packageData);

                // 2. GỌI API LẤY GÓI LIÊN QUAN (Mở comment khi ráp API thật)
                try {
                    const relatedResponse = await servicePackageApi.getRelatedPackages(id);
                    console.log(relatedResponse)
                    const relatedList = relatedResponse;
                    setRelatedPackages(relatedList);


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

    // Biến lưu trữ ảnh (Hỗ trợ cả trường hợp BE trả về imageUrl hoặc image)
    const displayImage = servicePackage.imageUrl || servicePackage.image;

    return (
        <div className="min-h-screen bg-gray-50 pb-16 font-sans">
            <div className="bg-white border-b border-gray-200 py-4 mb-8">
                <div className="max-w-6xl mx-auto px-4 flex items-center gap-2 text-sm text-gray-500 font-medium">
                    <button onClick={() => navigate(-1)} className="hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer">
                        <ArrowLeft size={16} /> Quay lại
                    </button>
                    <span className="text-gray-300">|</span>
                    <span
                        onClick={() => navigate("/servicePackagePage")}
                        className="hover:text-blue-600 cursor-pointer">Gói dịch vụ</span>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-800 font-bold truncate max-w-[200px] sm:max-w-none">{servicePackage.name}</span>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 space-y-8">

                <div className="bg-white rounded-[2rem] shadow-md border border-slate-200 overflow-hidden flex flex-col md:flex-row">

                    {/* CỘT TRÁI: ẢNH TRÀN VIỀN (ĐÃ XÓA PADDING VÀ BỎ KHUNG BO GÓC DƯ THỪA) */}
                    {/* 1. Xóa p-8
        2. Thêm min-h-[300px] để trên Mobile ảnh không bị bẹp
        3. Thêm shrink-0 để cột này không bị co lại khi chữ bên cột phải quá dài */}
                    <div className="md:w-5/12 relative bg-slate-100 flex-shrink-0 border-b md:border-b-0 md:border-r border-slate-100 min-h-[300px] md:min-h-full">

                        {/* Tag nổi trên ảnh */}
                        <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-black text-indigo-700 shadow-md border border-white/50 flex items-center gap-1.5 z-20">
                            <Tag size={14} /> GÓI DỊCH VỤ
                        </div>

                        {displayImage ? (
                            <img
                                src={displayImage}
                                alt={servicePackage.name}
                                // Đặt absolute inset-0 để ảnh phủ kín 100% không gian của cột trái
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105 z-10"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-slate-300">
                                <ShieldCheck size={80} strokeWidth={1.5} />
                            </div>
                        )}

                        {/* Hiệu ứng Gradient mờ dưới đáy để tăng độ sâu */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-15 pointer-events-none"></div>
                    </div>

                    {/* CỘT PHẢI: THÔNG TIN MUA HÀNG */}
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
                            <button className="flex-1 bg-white border-2 border-blue-600 text-blue-600 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors shadow-sm cursor-pointer">
                                <Heart size={20} /> Lưu gói
                            </button>

                            <button className="flex-[2] font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 cursor-pointer">
                                <CalendarDays size={20} /> Đăng ký ngay
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. KHỐI THÔNG TIN CHI TIẾT */}
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

                {/* 3. KHỐI CÁC GÓI DỊCH VỤ KHÁC (ĐÃ CẬP NHẬT ẢNH) */}
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
                                                <img
                                                    src={pkgImg}
                                                    alt={pkg.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
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
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    console.log("Lưu gói", pkg.id);
                                                }}
                                                className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                                            >
                                                <Heart size={18} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full text-center py-8 text-gray-400 font-medium">
                                Không có gói dịch vụ nào khác.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}