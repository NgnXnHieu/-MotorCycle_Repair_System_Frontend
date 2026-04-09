import { Outlet } from 'react-router-dom'

export default function StaffLayout() {
    return (
        <div className="min-h-screen flex bg-gray-100">
            {/* Sidebar bên trái */}
            <aside className="w-64 bg-gray-900 text-white p-4 flex flex-col hidden md:flex">
                <div className="text-2xl font-bold mb-8">Admin Panel</div>
                <nav>
                    <ul className="space-y-2">
                        <li className="hover:bg-gray-700 p-2 rounded cursor-pointer">Dashboard</li>
                        <li className="hover:bg-gray-700 p-2 rounded cursor-pointer">Quản lý xe</li>
                        {/* Thêm các menu khác */}
                    </ul>
                </nav>
            </aside>

            {/* Khu vực nội dung bên phải */}
            <div className="flex-1 flex flex-col">
                {/* Header nhỏ cho Admin */}
                <header className="bg-white shadow p-4 flex justify-end">
                    <span>Xin chào, Admin!</span>
                </header>

                {/* Nội dung trang Admin nhét vào đây */}
                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}