import React, { useState, useEffect } from 'react';
import { serviceApi } from '../../api/serviceApi';
import { Wrench } from 'lucide-react';

export default function ServicePage() {
    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                setIsLoading(true);
                const response = await serviceApi.getServicePage();

                if (response && response.content) {
                    setServices(response.content);
                }
            } catch (err) {
                console.error("Lỗi khi lấy danh sách dịch vụ:", err);
                setError("Không thể tải danh sách dịch vụ lúc này. Vui lòng thử lại sau.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchServices();
    }, []);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-[60vh] text-red-500 font-medium text-lg">
                {error}
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gray-50 min-h-screen">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                    Dịch Vụ Chăm Sóc Xe
                </h1>
                <p className="mt-4 text-lg text-gray-600">
                    Khám phá các dịch vụ chuyên nghiệp mà chúng tôi cung cấp để xế yêu của bạn luôn trong tình trạng hoàn hảo.
                </p>
            </div>

            {services.length === 0 ? (
                <div className="text-center text-gray-500 py-10 bg-white rounded-xl border border-gray-100">
                    Hiện tại chưa có dịch vụ nào được cập nhật.
                </div>
            ) : (
                /* Đổi thành flex-col để xếp dọc các thẻ, tạo khoảng cách bằng space-y-6 */
                <div className="flex flex-col space-y-6">
                    {services.map((service) => (
                        <div
                            key={service.id}
                            // md:flex-row giúp thẻ nằm ngang trên màn hình to, và tự gập lại thành dọc trên mobile
                            className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden transition-all duration-300 flex flex-col md:flex-row group"
                        >
                            {/* Khu vực Ảnh: Chiếm khoảng 1/3 chiều rộng trên Desktop */}
                            <div className="md:w-1/3 lg:w-1/4 h-56 md:h-auto bg-gray-100 relative flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {service.imageUrl ? (
                                    <img
                                        src={service.imageUrl}
                                        alt={service.name}
                                        // Thêm hiệu ứng zoom nhẹ khi hover cho mượt mà
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                        <Wrench className="w-12 h-12 mb-2 opacity-50" />
                                        <span className="text-sm font-medium">Chưa cập nhật ảnh</span>
                                    </div>
                                )}
                            </div>

                            {/* Khu vực Nội dung */}
                            <div className="p-6 md:p-8 flex flex-col justify-center flex-grow">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                                    {/* Tên dịch vụ */}
                                    <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                                        {service.name}
                                    </h3>

                                    {/* Khu vực hiển thị giá: Nằm bên phải tên dịch vụ */}
                                    <div className="flex-shrink-0">
                                        {service.price && service.price > 0 ? (
                                            <div className="text-blue-600 font-extrabold text-xl bg-blue-50 px-4 py-1.5 rounded-lg inline-block">
                                                {formatPrice(service.price)}
                                            </div>
                                        ) : (
                                            <div className="text-green-600 font-medium text-sm bg-green-50 px-4 py-2 rounded-lg inline-block border border-green-100">
                                                Liên hệ báo giá
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Mô tả: Bỏ line-clamp để hiển thị đầy đủ thông tin hơn do đã có không gian ngang */}
                                <p className="text-gray-600 leading-relaxed">
                                    {service.decription}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}