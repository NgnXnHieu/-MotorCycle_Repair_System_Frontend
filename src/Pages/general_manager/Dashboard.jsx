import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, PenTool, Users, Settings } from 'lucide-react';
import { repairOrderApi } from '../../api/repairOrderApi';
import { branchApi } from '../../api/branchApi';

const Dashboard = () => {
    const [filter, setFilter] = useState({
        branch: 'ALL',
        startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const [branches, setBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // State lưu dữ liệu thực tế từ API
    const [stats, setStats] = useState({ revenue: 0, repairs: 0, customers: 0, parts: 0 });
    const [chartData, setChartData] = useState([]);

    // Hàm chuyển đổi YYYY-MM-DD sang dd-MM-yyyy cho Backend Spring Boot
    const formatDateForApi = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}-${month}-${year}`;
    };

    //Lấy thông tin Branches
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const res = await branchApi.getBranchList();
                // Giả sử API trả về mảng trực tiếp: [{id: 1, name: 'Chi nhánh A'}, ...]
                setBranches(res.data || res);
                // console.log(res)
            } catch (error) {
                console.error("Không thể lấy danh sách chi nhánh:", error);
            }
        };
        fetchBranches();
    }, []);

    // Gọi API mỗi khi filter thay đổi
    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                const apiParams = {
                    startDay: formatDateForApi(filter.startDate),
                    endDay: formatDateForApi(filter.endDate)
                };

                if (filter.branch === 'ALL') {
                    // 1. CHỌN TẤT CẢ HỆ THỐNG (GBM)
                    const res = await repairOrderApi.getDashboard4GBM(apiParams);
                    const data = res.data || res; // Tùy thuộc vào axiosClient interceptor của bạn có trả về res.data sẵn không

                    // Tính tổng doanh thu từ mảng branchRevenueReport
                    const totalRevenue = data.branchRevenueReport.reduce((sum, item) => sum + item.totalRevenue, 0);

                    setStats({
                        revenue: totalRevenue,
                        repairs: data.totalRepairs,
                        customers: data.totalCustomers,
                        parts: data.totalItemQuantity
                    });

                    // console.log(data)

                    // Format data cho Chart: X = tên chi nhánh, Y = doanh thu
                    const formattedChartData = data.branchRevenueReport.map(item => ({
                        name: item.branchName,
                        revenue: item.totalRevenue
                    }));
                    setChartData(formattedChartData);
                    console.log(formattedChartData)

                } else {
                    // 2. CHỌN 1 CHI NHÁNH CỤ THỂ (BM)
                    apiParams.branchId = filter.branch;

                    // Dùng Promise.all để gọi 2 API song song, tối ưu hiệu năng
                    const [statsRes, chartRes] = await Promise.all([
                        repairOrderApi.getDashboard4BM(apiParams),
                        repairOrderApi.getChartData4BM(apiParams)
                    ]);

                    const sData = statsRes.data || statsRes;
                    const cData = chartRes.data || chartRes;

                    setStats({
                        revenue: sData.branchRevenueReport.totalRevenue,
                        repairs: sData.totalRepairs,
                        customers: sData.totalCustomers,
                        parts: sData.totalItemQuantity
                    });

                    // Format data cho Chart: X = thời gian, Y = doanh thu
                    // Đổi 'time' thành 'name', 'totalAmount' thành 'revenue' để chart Recharts dùng chung 1 cấu trúc
                    const formattedChartData = cData.map(item => ({
                        name: item.time,
                        revenue: item.totalAmount
                    }));
                    setChartData(formattedChartData);
                    console.log(formattedChartData)


                }
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu Dashboard:", error);
                // Có thể thêm Toast/Notification báo lỗi tại đây
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [filter]); // Chạy lại mỗi khi filter (branch, startDate, endDate) thay đổi

    const handleFilterChange = (e) => {
        setFilter({ ...filter, [e.target.name]: e.target.value });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">

                {/* Thanh Bộ Lọc */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chi nhánh</label>
                        <select
                            name="branch"
                            value={filter.branch}
                            onChange={handleFilterChange}
                            className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500"
                        >
                            <option value="ALL">Tất cả hệ thống</option>
                            {/* 3. ĐIỀN DỮ LIỆU ĐỘNG TẠI ĐÂY */}
                            {branches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                        <input
                            type="date"
                            name="startDate"
                            value={filter.startDate}
                            onChange={handleFilterChange}
                            className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="flex-1 min-w-[150px]">
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
                    {filter.branch === "ALL" && <StatCard title="Tổng Khách Hàng" value={stats.customers} icon={<Users />} color="text-amber-600" bg="bg-amber-100" />}
                    <StatCard title="Phụ Tùng Đã Bán" value={stats.parts} icon={<Settings />} color="text-red-600" bg="bg-red-100" />
                </div>

                {/* Biểu Đồ */}
                <div className={`bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                    <h3 className="text-lg font-bold text-gray-800 mb-6">
                        {filter.branch === 'ALL' ? 'Doanh Thu Theo Các Chi Nhánh' : 'Biểu Đồ Doanh Thu Theo Tháng'}
                    </h3>

                    {/* Đã thêm w-full vào đây */}
                    <div className="h-80 w-full">
                        {/* Đã thêm minWidth và minHeight vào đây */}
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

export default Dashboard;