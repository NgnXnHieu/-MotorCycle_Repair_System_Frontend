import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, PenTool, Users, Settings } from 'lucide-react';
import { repairOrderApi } from '../../api/repairOrderApi';
// Không cần import branchApi nữa

const DashboardBM = () => {
    // State chỉ còn giữ bộ lọc Ngày
    const [filter, setFilter] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const [isLoading, setIsLoading] = useState(false);

    // State lưu dữ liệu
    const [stats, setStats] = useState({ revenue: 0, repairs: 0, customers: 0, parts: 0 });
    const [chartData, setChartData] = useState([]);

    // Hàm chuyển đổi YYYY-MM-DD sang dd-MM-yyyy cho Backend
    const formatDateForApi = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}-${month}-${year}`;
    };

    // Gọi API mỗi khi ngày tháng thay đổi
    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                const apiParams = {
                    startDay: formatDateForApi(filter.startDate),
                    endDay: formatDateForApi(filter.endDate)
                };

                // Dùng Promise.all để gọi 2 API song song, tối ưu hiệu năng
                const [statsRes, chartRes] = await Promise.all([
                    repairOrderApi.getDashboard4BM(apiParams),
                    repairOrderApi.getChartData4BM(apiParams)
                ]);

                const sData = statsRes.data || statsRes;
                const cData = chartRes.data || chartRes;

                // Gán dữ liệu cho 4 thẻ thống kê
                // Dùng optional chaining (?.) phòng trường hợp backend chưa có dữ liệu trả về null
                setStats({
                    revenue: sData.branchRevenueReport?.totalRevenue || 0,
                    repairs: sData.totalRepairs || 0,
                    customers: sData.totalCustomers || 0,
                    parts: sData.totalItemQuantity || 0
                });

                // Format data cho Chart: X = thời gian, Y = doanh thu
                const formattedChartData = cData.map(item => ({
                    name: item.time,
                    revenue: item.totalAmount
                }));
                setChartData(formattedChartData);

            } catch (error) {
                console.error("Lỗi khi tải dữ liệu Dashboard BM:", error?.response);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [filter]); // Chạy lại khi startDate hoặc endDate thay đổi

    const handleFilterChange = (e) => {
        setFilter({ ...filter, [e.target.name]: e.target.value });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">

                {/* Thanh Bộ Lọc - Chỉ còn Ngày bắt đầu và kết thúc */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                        <input
                            type="date"
                            name="startDate"
                            value={filter.startDate}
                            onChange={handleFilterChange}
                            className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                        <input
                            type="date"
                            name="endDate"
                            value={filter.endDate}
                            onChange={handleFilterChange}
                            className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* 4 Thẻ Thống Kê */}
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                    <StatCard title="Tổng Doanh Thu" value={formatCurrency(stats.revenue)} icon={<DollarSign />} color="text-green-600" bg="bg-green-100" />
                    <StatCard title="Lượt Sửa Xe" value={stats.repairs} icon={<PenTool />} color="text-blue-600" bg="bg-blue-100" />
                    <StatCard title="Tổng Khách Hàng" value={stats.customers} icon={<Users />} color="text-amber-600" bg="bg-amber-100" />
                    <StatCard title="Phụ Tùng Đã Bán" value={stats.parts} icon={<Settings />} color="text-red-600" bg="bg-red-100" />
                </div>

                {/* Biểu Đồ */}
                <div className={`bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                    <h3 className="text-lg font-bold text-gray-800 mb-6">
                        Biểu Đồ Doanh Thu Theo Tháng
                    </h3>

                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={320}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(value) => value >= 1000000 ? `${value / 1000000}M` : value}
                                />
                                <Tooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: '#F3F4F6' }} />
                                <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={50} animationDuration={1000} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, color, bg }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
            </div>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${color} ${bg}`}>
                {icon}
            </div>
        </div>
    </div>
);

export default DashboardBM;