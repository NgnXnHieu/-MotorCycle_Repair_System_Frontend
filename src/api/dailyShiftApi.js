import axiosClient from "./axiosClient";

export const dailyShiftApi = {
    getTodayShift: (form) => {
        return axiosClient.post(`/dailyShiftCapacity/shiftOfDay`, form)
    }
}