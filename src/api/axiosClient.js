import axios from 'axios';
import { authApi } from './authApi';

const axiosClient = axios.create({
    baseURL: 'http://localhost:8080/api',
    // Cho phép trình duyệt tự động gửi và nhận Cookies kèm theo request
    withCredentials: true,
});

// Các biến để xử lý trường hợp gọi nhiều API cùng lúc khi token vừa hết hạn
let isRefreshing = false;
let failedQueue = [];

// Hàm xử lý các request đang xếp hàng chờ refresh token
const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            // Truyền token mới vào để các request đang chờ có thể sử dụng
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

axiosClient.interceptors.response.use(
    (response) => {
        return response.data;
    },
    async (error) => {
        const originalRequest = error.config;

        // Nếu lỗi 401 (Unauthorized) và request này chưa từng được retry
        if (error.response && error.response.status === 401 && !originalRequest._retry) {

            // 1. NẾU LÀ LỖI TỪ API ĐĂNG NHẬP: KHÔNG LÀM GÌ CẢ (Chỉ trả lỗi về cho màn hình Login.jsx xử lý)
            if (originalRequest.url.includes('/login')) {
                return Promise.reject(error);
            }

            // 2. NẾU LÀ LỖI TỪ API REFRESH TOKEN (Nghĩa là token hết hạn không thể cứu vãn): Đá về trang Login
            if (originalRequest.url.includes('/refreshToken')) {
                console.log("Refresh token thất bại (hết hạn). Về trang Login...");
                window.location.href = '/login';
                return Promise.reject(error);
            }

            // Nếu đang có 1 request khác đang đi refresh token rồi, 
            // các request lỗi 401 tiếp theo sẽ bị cho vào hàng đợi.
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    // Khi hàng đợi được thả, gọi lại request gốc
                    return axiosClient(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            // Đánh dấu request này đang tiến hành retry
            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Gọi API cấp lại token từ file authApi
                const res = await authApi.refreshToken();
                console.log("Refresh Token thành công!");

                const newToken = null;

                // Refresh thành công: Báo cho hàng đợi tiếp tục chạy
                processQueue(null, newToken);

                // Gọi lại request ban đầu vừa bị fail
                return axiosClient(originalRequest);

            } catch (refreshError) {
                // Refresh thất bại
                processQueue(refreshError, null);
                console.log("Phiên đăng nhập hết hạn hoàn toàn. Vui lòng đăng nhập lại.");

                if (!originalRequest._noRedirect) {
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }
                return Promise.reject(refreshError);
            } finally {
                // Chạy xong hết thì xả cờ
                isRefreshing = false;
            }
        }

        // Nếu là các lỗi khác (400, 403, 404, 500...) thì cứ ném lỗi ra như bình thường
        return Promise.reject(error);
    }
);

export default axiosClient;