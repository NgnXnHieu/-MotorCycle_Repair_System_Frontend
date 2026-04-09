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

            // SỬ DỤNG .includes() ĐỂ AN TOÀN HƠN (Đề phòng trường hợp URL bị thay đổi đôi chút)
            if (originalRequest.url.includes('/refreshToken') || originalRequest.url.includes('/login')) {
                console.log("Refresh token thất bại hoặc chưa đăng nhập. Về trang Login...");
                window.location.href = '/login';
                return Promise.reject(error);
            }

            // Nếu đang có 1 request khác đang đi refresh token rồi, 
            // các request lỗi 401 tiếp theo sẽ bị cho vào hàng đợi.
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    // Nếu bạn dùng Header Bearer token, bạn sẽ set ở đây:
                    // if (token) { originalRequest.headers['Authorization'] = 'Bearer ' + token; }

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
                // Gọi API cấp lại token từ file authApi (ĐÃ ĐƯỢC FIX SỬ DỤNG AXIOS GỐC)
                const res = await authApi.refreshToken();
                console.log("Refresh Token thành công!");

                // NẾU BẠN CÓ TRẢ VỀ TOKEN TỪ BODY: const newToken = res.data.accessToken;
                // NẾU BẠN CHỈ DÙNG COOKIE, CÓ THỂ BỎ QUA BIẾN NÀY
                const newToken = null;

                // Refresh thành công: Báo cho hàng đợi tiếp tục chạy và truyền token mới vào
                processQueue(null, newToken);

                // Gọi lại request ban đầu vừa bị fail
                return axiosClient(originalRequest);

            } catch (refreshError) {
                // Refresh thất bại (VD: Cookie Refresh Token hết hạn 30 ngày)
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