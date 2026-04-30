import { Package } from 'lucide-react'
import { format } from '../../utils/format'

export default function ProductCard({ image, name, price, actionText, actionIcon: ActionIcon, onAction }) {
    return (
        // 1. WRAPPER: 
        // - Đổi border-slate-100 thành border-slate-200 để viền rõ nét hơn trên nền trắng.
        // - Thêm shadow-sm (bóng đổ nhẹ) làm mặc định để thẻ tách khỏi nền.
        // - Tăng cường hover:shadow-xl và hover:border-slate-300 để tạo cảm giác tương tác mạnh.
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col group h-full overflow-hidden transition-all duration-400 ease-out hover:shadow-xl hover:shadow-slate-300/60 hover:border-slate-300 hover:-translate-y-1.5 relative z-10">

            {/* 2. PHẦN ẢNH: 
                - Chuyển nền chứa ảnh sang bg-slate-100/50 (tối hơn một chút so với bg-slate-50 cũ) 
                  để làm nổi bật các phụ tùng có nền trắng/trong suốt. 
            */}
            <div className="relative w-full aspect-[4/3] bg-slate-100/50 flex items-center justify-center text-slate-400 overflow-hidden shrink-0 border-b border-slate-100">
                {image ? (
                    <img
                        src={image}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                ) : (
                    <Package className="h-12 w-12 stroke-1 opacity-70" />
                )}

                {/* Lớp phủ (Overlay) Gradient từ dưới lên giúp mép ảnh và viền cắt mượt mà hơn */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 transition-opacity duration-400 group-hover:opacity-100" />
            </div>

            {/* 3. PHẦN THÔNG TIN */}
            <div className="p-5 flex-grow flex flex-col gap-3">

                {/* Tên sản phẩm */}
                <h4 className="font-semibold text-lg text-slate-800 line-clamp-2 leading-snug transition-colors duration-300 group-hover:text-black">
                    {name}
                </h4>

                {/* Giá tiền */}
                <p className="mt-auto text-xl font-bold text-slate-900 tracking-tight">
                    {format.formatCurrency(price)}
                    <span className="text-sm font-medium text-slate-500 ml-1 underline decoration-slate-300 decoration-1 underline-offset-2">đ</span>
                </p>

                {/* Nút hành động: 
                    - Thêm bóng đổ nhỏ (shadow-md) cho chính cái nút để nó nổi khối. 
                    - Sử dụng active:scale-95 để tạo cảm giác bấm vật lý chân thực.
                */}
                <button
                    onClick={onAction}
                    className="cursor-pointer mt-3 w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-xl font-semibold tracking-wide shadow-md shadow-slate-900/10 transition-all duration-300 hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/30 active:scale-95 group/btn shrink-0"
                >
                    <span>{actionText}</span>
                    {ActionIcon && (
                        <ActionIcon className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1.5" />
                    )}
                </button>
            </div>

        </div>
    )
}