import axiosClient from "./axiosClient";

export const vehicleApi = {
    //Lấy danh sách xe của tài khoản hiện tại
    getMyVehicles: () => {
        return axiosClient.get("/customers/vehicles")
    },

    createVehicle: (formData) => {
        return axiosClient.post("/vehicles", formData)
    },

    updateVehicle: (id, formData) => {
        return axiosClient.put(`/vehicles/${id}`, formData)
    },

    getAppointmentHistory: (id, filterForm) => {
        return axiosClient.post(`/vehicles/${id}/appointments`, filterForm, {
            params: {
                page: filterForm.page,
                size: filterForm.size
            }
        })
    },

    getById: (id) => {
        return axiosClient.get(`/vehicles/${id}`);
    }
};