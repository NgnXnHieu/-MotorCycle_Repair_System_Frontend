import axiosClient from "./axiosClient";
export const customerApi = {
    getProfile: () => {
        return axiosClient.get(`/customers/profile`)
    },

    getMyVehicles: () => {
        return axiosClient.get(`/customers/vehicles`);
    },

    getVehiclesById: (id) => {
        return axiosClient.get(`/customers/vehicles/${id}`);
    }
}