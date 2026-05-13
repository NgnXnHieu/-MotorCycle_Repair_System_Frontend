import axiosClient from "./axiosClient";
export const paymentApi = {
    //Thanh toán chuyển khoản cho repairOrder
    generateQR: (orderId) => {
        return axiosClient.post(`/payment/generate-QR`, null, {
            params: {
                orderId: orderId
            }
        })
    },

    //Kiểm tra trạng thái order (trả về true hoặc false)
    checkStatus: (orderId) => {
        return axiosClient.get(`/repairOrder/status/${orderId}`)
    },

    //Thanh toán tiền mặt cho repairOrder
    payByCash: (orderId) => {
        return axiosClient.get(`/repairOrder/payment/cash/${orderId}`)
    },

    //Tạo mã thanh toán chuyển khoản cho servicePackage
    generateQRForServicePackage: (id) => {
        return axiosClient.get(`/payment/generate-QR/servicePackage/${id}`)
    }
}