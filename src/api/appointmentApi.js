import axiosClient from "./axiosClient";

export const appointmentApi = {
    getMyHistory: (filterForm) => {
        return axiosClient.post(`/appointments/myHistory`, filterForm, {
            params: {
                page: filterForm.page,
                size: filterForm.size
            }
        })
    },

    createBooking: (form) => {
        return axiosClient.post(`/appointments/customerNoAcc`, form)
    },

    createEmergencyBooking: (form) => {
        return axiosClient.post(`/appointments/emergencyBooking`, form)
    }
}