import { ArrowRight, ShoppingCart, Package } from 'lucide-react'

export default function ProductCard({ image, name, price, actionText, actionIcon: ActionIcon }) {
    return (
        // Thêm h-full để đảm bảo mọi thẻ trên cùng 1 hàng đều cao bằng nhau
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 flex flex-col gap-4 group h-full">

            {/* Ảnh placeholder */}
            <div className="bg-gray-100 aspect-square rounded-xl flex items-center justify-center text-gray-400 border border-gray-200 overflow-hidden shrink-0">
                {image ? (
                    <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                    <Package className="h-16 w-16 stroke-1" />
                )}
            </div>

            {/* Thông tin - THAY ĐỔI CHÍNH Ở ĐÂY */}
            <div className="flex-grow flex flex-col">
                {/* Tên sản phẩm */}
                <h4 className="font-bold text-lg text-gray-900 line-clamp-2">{name}</h4>

                {/* Giá tiền: 
                    1. mt-auto: Luôn tự động đẩy xuống dưới cùng
                    2. text-xl: Giảm size nhỏ hơn 1 chút so với 2xl cũ
                    3. text-red-600: Đổi thành màu đỏ
                    4. pt-2: Giữ 1 khoảng cách an toàn với tên sản phẩm 
                */}
                <p className="mt-auto pt-2 text-xl font-extrabold text-red-600">
                    {price.toLocaleString('vi-VN')}đ
                </p>
            </div>

            {/* Nút hành động */}
            <button className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-3 rounded-xl font-semibold hover:bg-blue-600 hover:text-white transition-all group/btn shrink-0">
                <span>{actionText}</span>
                {ActionIcon && <ActionIcon className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />}
            </button>

        </div>
    )
}