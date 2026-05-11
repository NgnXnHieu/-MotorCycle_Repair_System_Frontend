import React, { useState, useEffect } from 'react';
import {
    X, Timer, AlertCircle, RefreshCcw,
    Banknote, Hash, ShieldAlert, CheckCircle2
} from 'lucide-react';

export default function PaymentQRCodeModal({
    isOpen,
    onClose,
    paymentData,
    onSuccess
}) {
    // Thời gian đếm ngược (tính bằng giây)
    const [timeLeft, setTimeLeft] = useState(0);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        // Chỉ chạy khi Modal đang mở và có dữ liệu endTime
        if (!isOpen || !paymentData?.endTime) return;

        // Hàm tính toán thời gian còn lại (giây)
        const calculateTimeLeft = () => {
            // Chuyển đổi chuỗi LocalDateTime từ Backend (VD: "2026-05-11T19:00:00") sang Timestamp
            const end = new Date(paymentData.endTime).getTime();
            const now = new Date().getTime();

            // Tính khoảng cách thời gian bằng giây, SAU ĐÓ TRỪ ĐI 20 GIÂY YÊU CẦU
            const diffInSeconds = Math.floor((end - now) / 1000) - 20;

            // Nếu diff <= 0 nghĩa là đã hết hạn
            return diffInSeconds > 0 ? diffInSeconds : 0;
        };

        // Khởi tạo ngay lần đầu tiên mở form
        const initialTime = calculateTimeLeft();
        setTimeLeft(initialTime);
        setIsExpired(initialTime <= 0);

        if (initialTime <= 0) return;

        // Cập nhật lại mỗi giây (Dùng cách trừ thời gian thực để không bị trễ nếu browser chuyển tab)
        const timerId = setInterval(() => {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);

            if (remaining <= 0) {
                clearInterval(timerId);
                setIsExpired(true);
            }
        }, 1000);

        return () => clearInterval(timerId); // Cleanup
    }, [isOpen, paymentData]);

    // Format thời gian thành MM:SS
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Format tiền tệ Việt Nam
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    };

    if (!isOpen || !paymentData) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose} // SỰ KIỆN ĐÓNG FORM KHI CLICK RA NGOÀI (BACKDROP)
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()} // CHẶN SỰ KIỆN CLICK Ở BÊN TRONG KHÔNG LAN RA NGOÀI FORM
            >

                {/* --- HEADER --- */}
                <div className="bg-indigo-600 p-5 flex justify-between items-center text-white relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>

                    <h2 className="text-xl font-black tracking-tight flex items-center gap-2 relative z-10">
                        <Banknote size={24} />
                        Thanh toán chuyển khoản
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 bg-indigo-500 hover:bg-indigo-400 rounded-full transition-colors relative z-10"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {/* --- BODY --- */}
                <div className="p-6 sm:p-8 flex flex-col items-center">

                    {/* Thông tin đơn hàng */}
                    <div className="w-full bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
                        <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-200 border-dashed">
                            <span className="text-sm font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                <Hash size={16} /> Mã đơn:
                            </span>
                            <span className="text-base font-black text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">
                                {paymentData.orderCode}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-500 uppercase">Tổng tiền:</span>
                            <span className="text-2xl font-black text-indigo-600">
                                {formatCurrency(paymentData.amount)}
                            </span>
                        </div>
                    </div>

                    {/* Khu vực chứa Mã QR */}
                    <div className="w-full flex justify-center mb-6 relative">
                        {isExpired ? (
                            <div className="w-64 h-64 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-6 text-center shadow-inner">
                                <ShieldAlert size={48} className="text-slate-400 mb-3" />
                                <h3 className="text-lg font-bold text-slate-800 mb-1">Mã QR đã hết hiệu lực</h3>
                                <p className="text-sm text-slate-500 font-medium">
                                    Vui lòng đóng cửa sổ này và tạo lại yêu cầu thanh toán mới.
                                </p>
                            </div>
                        ) : (
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                <img
                                    src={paymentData.qrUrl}
                                    alt="VietQR Code"
                                    className="relative w-64 h-64 object-contain rounded-2xl shadow-lg border-2 border-white bg-white"
                                />
                            </div>
                        )}
                    </div>

                    {/* Đồng hồ đếm ngược */}
                    <div className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 font-bold transition-colors ${isExpired
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : timeLeft <= 60
                            ? 'bg-orange-50 text-orange-600 border-orange-200 animate-pulse'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                        }`}>
                        {isExpired ? (
                            <>
                                <AlertCircle size={20} />
                                Đã quá thời gian thanh toán an toàn
                            </>
                        ) : (
                            <>
                                <Timer size={20} className={timeLeft <= 60 ? 'animate-bounce' : ''} />
                                Hiệu lực thanh toán còn: <span className="text-xl tracking-wider">{formatTime(timeLeft)}</span>
                            </>
                        )}
                    </div>

                </div>

                {/* --- FOOTER --- */}
                <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
                    {isExpired ? (
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
                        >
                            <RefreshCcw size={18} />
                            Đóng
                        </button>
                    ) : (
                        <p className="text-xs text-slate-500 text-center font-medium leading-relaxed">
                            Mở ứng dụng ngân hàng và <strong>Quét mã QR</strong>.<br />
                            Hệ thống sẽ tự động xác nhận sau khi chuyển khoản thành công.
                        </p>
                    )}
                </div>

            </div>
        </div>
    );
}