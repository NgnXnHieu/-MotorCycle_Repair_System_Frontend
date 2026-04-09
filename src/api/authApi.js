// src/api/authApi.js
import axios from 'axios'; // BƯỚC 1: Import axios nguyên bản
import axiosClient from './axiosClient';

export const authApi = {
    // Gửi data (username, password, phone, full_name) để đăng ký
    register: (data) => {
        return axiosClient.post('/accounts/register', data);
    },

    // Gửi data (username, password) để đăng nhập
    login: (data) => {
        return axiosClient.post('/login', data);
    },

    // (Tùy chọn) Hàm gọi API để lấy thông tin user đang đăng nhập dựa vào Cookie
    getProfile: () => {
        return axiosClient.get('/customers/profile', { _noRedirect: true });
    },

    // Gọi api refresh token
    refreshToken: () => {
        // BƯỚC 2: SỬ DỤNG AXIOS GỐC THAY VÌ axiosClient
        // Lưu ý: Vì axios gốc không có baseURL, bạn phải truyền full đường dẫn
        return axios.post('http://localhost:8080/api/refreshToken', {}, {
            // BƯỚC 3: Rất quan trọng - Phải có dòng này để trình duyệt gửi kèm Refresh Token (nếu bạn lưu ở Cookie)
            withCredentials: true
        });
    },

    // Gọi API đăng xuất, xóa thông tin cookie 
    logout: () => {
        return axiosClient.post('/logout');
    }
};