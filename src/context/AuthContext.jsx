// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi'; // 

// 1. Tạo ra cái Loa
export const AuthContext = createContext();

// 2. Tạo ra trạm phát sóng (Bọc lấy toàn bộ App)
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    // Hàm gọi API lấy thông tin người dùng (sẽ dùng chung cho toàn web)
    const fetchProfile = async () => {
        try {
            // LƯU Ý: authApi.getProfile() phải là hàm gọi xuống API lấy thông tin User (vd: /auth/me) của Backend nhé
            const data = await authApi.getProfile();
            _noRedirect: true
            setUser(data);
        } catch (error) {
            console.log("Chưa đăng nhập hoặc token hết hạn");
            setUser(null);
        }
    };

    // Vừa vào web là tự động kiểm tra xem Cookie có còn hạn không
    useEffect(() => {
        fetchProfile();
    }, []);

    return (
        // Phát sóng dữ liệu 'user' và hàm 'fetchProfile' cho bất kỳ component nào cần
        <AuthContext.Provider value={{ user, fetchProfile, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};