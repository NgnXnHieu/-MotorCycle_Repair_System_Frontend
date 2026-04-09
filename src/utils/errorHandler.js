/**
 * Hàm trích xuất thông báo lỗi từ Axios Error Object
 * @param {Object} error - Object lỗi trả về từ block catch của Axios
 * @param {String} fallbackMessage - Lời nhắn dự phòng nếu không tìm thấy lỗi cụ thể
 * @returns {String} - Câu thông báo lỗi đã được làm sạch để hiển thị cho user
 */
export const getErrorMessage = (error, fallbackMessage = "Đã có lỗi xảy ra, vui lòng thử lại sau.") => {
    // 1. Trường hợp Backend có trả về Response (Lỗi 400, 401, 403, 404, 500...)
    if (error.response) {
        const backendData = error.response.data;

        // Nếu backend trả về Text thuần
        if (typeof backendData === 'string' && backendData.trim() !== '') {
            return backendData;
        }
        // Nếu backend trả về JSON có trường message
        else if (backendData && backendData.message) {
            return backendData.message;
        }
        // Nếu không có cả 2, trả về mã lỗi chung chung
        else {
            return `Lỗi máy chủ: Mã ${error.response.status}`;
        }
    }
    // 2. Trường hợp Request đã gửi nhưng không nhận được phản hồi (Mất mạng, sập server)
    else if (error.request) {
        return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng!";
    }
    // 3. Lỗi do bản thân code Frontend (Lỗi cú pháp, cấu hình sai...)
    else {
        return error.message || fallbackMessage;
    }
};