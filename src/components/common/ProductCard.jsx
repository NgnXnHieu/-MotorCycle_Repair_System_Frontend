import { Package } from 'lucide-react'
import { format } from '../../utils/format'

export default function ProductCard({ image, name, price, actionText, actionIcon: ActionIcon, onAction }) {
    return (
        <div className="bg-white rounded-none border border-slate-200 shadow-md flex flex-col group h-full overflow-hidden transition-all duration-400 ease-out hover:shadow-xl hover:shadow-amber-500/40 hover:border-amber-500 hover:-translate-y-1.5 relative z-10">

            {/* PHẦN ẢNH */}
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

                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 transition-opacity duration-400 group-hover:opacity-100" />
            </div>

            {/* PHẦN THÔNG TIN */}
            {/* Đã tăng padding ngang thành px-6 để tạo cảm giác ô rộng hơn */}
            <div className="px-6 py-5 flex-grow flex flex-col gap-3">

                {/* 1 & 2. Tên sản phẩm: Đổi sang màu xanh tím than (blue-900) và dùng font-bold để nổi bật hơn */}
                <h4 className="font-bold text-lg text-blue-900 line-clamp-2 leading-snug transition-colors duration-300 group-hover:text-amber-600">
                    {name}
                </h4>

                {/* 3. Giá tiền: Đổi sang màu đỏ rực (red-600) */}
                <p className="mt-auto text-xl font-bold text-red-600 tracking-tight">
                    {format.formatCurrency(price)}
                    <span className="text-sm font-medium text-red-500 ml-1 underline decoration-red-300 decoration-1 underline-offset-2">đ</span>
                </p>

                {/* Nút hành động */}
                <button
                    onClick={onAction}
                    className="cursor-pointer mt-3 w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-none font-semibold tracking-wide shadow-md shadow-slate-900/10 transition-all duration-300 hover:bg-amber-500 hover:shadow-lg hover:shadow-amber-500/40 active:scale-95 group/btn shrink-0"
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