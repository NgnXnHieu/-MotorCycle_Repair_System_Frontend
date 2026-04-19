import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from "../Pages/public/Home"
import Login from '../Pages/public/Login'
import PublicLayout from '../layouts/PublicLayout'
import StaffLayout from '../layouts/StaffLayout'
import Register from '../Pages/public/Register'
import VehicleManagement from '../Pages/customer/VehicleManagement'
import VehicleDetail from '../Pages/customer/VehicleDetail'
import SparePartsPage from '../Pages/customer/SparePartsPage'
import ItemDetailPage from '../Pages/customer/ItemDetailPage'
import ServicePackagePage from '../Pages/customer/ServicePackagePage'
import ServicePackageDetailPage from '../Pages/customer/ServicePackageDetailPage'
import MyServicePackagesPage from '../Pages/customer/MyServicePackagesPage'
import MyAppointmentHistory from '../Pages/customer/MyAppointmentHistory'
import BranchPage from '../Pages/customer/BranchPage'
import BookingPage from '../Pages/customer/BookingPage'
import ServicePage from '../Pages/customer/ServicePage'
import FavouritePage from '../Pages/customer/FavouritePage'
import EmergencyBooking from '../Pages/customer/EmergencyBooking'
import EmployeeSidebar from "../layouts/EmployeeSidebar"
import AppointmentManagement from '../Pages/receptionist/AppointmentManagement'
import WalkInBooking from '../Pages/receptionist/WalkInBooking'
import EmployeeProfile from '../Pages/staffPage/EmployeeProfile'
import GenaralBranchSidebar from '../layouts/GenaralBranchSidebar'
import BranchManagement from '../Pages/general_manager/branchManager'
// import Dashboard from '../pages/admin/Dashboard'

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Nhóm 1: Các trang dùng Public Layout (Có Navbar trên cùng) */}
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/vehicleManagement" element={<VehicleManagement />} />
                    <Route path="/vehicleDetail/:id" element={<VehicleDetail />} />
                    <Route path="/sparePartsPage" element={<SparePartsPage />} />
                    <Route path="/itemDetailPage/:id" element={<ItemDetailPage />} />
                    <Route path="/servicePackagePage" element={<ServicePackagePage />} />
                    <Route path="/servicePackageDetailPage/:id" element={<ServicePackageDetailPage />} />
                    <Route path="/myServicePackagesPage" element={<MyServicePackagesPage />} />
                    <Route path="/myAppointmentHistory" element={<MyAppointmentHistory />} />
                    <Route path="/branchPage" element={<BranchPage />} />
                    <Route path="/bookingPage" element={<BookingPage />} />
                    <Route path="/servicePage" element={<ServicePage />} />
                    <Route path="/favouritePage" element={<FavouritePage />} />
                    <Route path="/emergencyBooking" element={<EmergencyBooking />} />
                </Route>

                {/* Nhóm 2: Các trang dùng Staff Layout (Có Sidebar bên trái) */}
                <Route element={<StaffLayout />}>
                    <Route path="admin/sparePartsPage" element={<SparePartsPage />} />
                    {/* Sau này thêm route cho thợ, quản lý nhánh... vào đây */}
                </Route>

                {/* Giao diện bên nhân viên tư vấn (Receptionist)  */}
                <Route element={<EmployeeSidebar />}>
                    <Route path="receptionist/sparePartsPage" element={<SparePartsPage />} />
                    <Route path="receptionist/appointmentManagement" element={<AppointmentManagement />} />
                    <Route path="receptionist/walkInBooking" element={<WalkInBooking />} />
                    <Route path="receptionist/employeeProfile" element={<EmployeeProfile />} />

                </Route>

                <Route element={<GenaralBranchSidebar />}>
                    <Route path='generalManager/employeeProfile' element={<EmployeeProfile />} />
                    <Route path='generalManager/branchManagement' element={<BranchManagement />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}