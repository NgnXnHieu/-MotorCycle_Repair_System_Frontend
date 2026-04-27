import axiosClient from "./axiosClient";

export const repairOrderApi = {
    //Lấy thông  tin doanh thu cho GBM
    getDashboard4GBM: (form) => {
        return axiosClient.get(`/repairOrder/dashboard4GBM`, { params: form })
    },

    //Lấy thông  tin doanh thu cho 1 chi nhánh 
    getDashboard4BM: (form) => {
        return axiosClient.get(`/repairOrder/dashboard4GBM/branch`, { params: form })
    },

    //Lấy thông tin data cho chart của 1 chi nhánh
    getChartData4BM: (form) => {
        return axiosClient.get(`/repairOrder/dashboard4GBM/branch/chartData`, { params: form })

    },

    //Lấy thông  tin doanh thu chi nhánh cho BM
    getDashboard4BM: (form) => {
        return axiosClient.get(`/repairOrder/dashboard4BM`, { params: form })
    },

    //Lấy thông tin data cho chart chi nhánh cho BM
    getChartData4BM: (form) => {
        return axiosClient.get(`/repairOrder/dashboard4GBM/chartData`, { params: form })
    },
}