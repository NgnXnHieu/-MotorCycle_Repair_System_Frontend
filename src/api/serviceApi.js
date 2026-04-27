import axiosClient from "./axiosClient";

export const serviceApi = {
    getServicePage: (params) => {
        return axiosClient.get(`/services/page`, { params });
    },

    getServiceList: () => {
        return axiosClient.get(`/services`);
    },

    create: (form) => {
        return axiosClient.post(`/services`, form);
    },

    update: (id, form) => {
        return axiosClient.put(`/services/${id}`, form);
    },

    delete: (id) => {
        return axiosClient.delete(`/services/${id}`);
    },

    getById: (id) => {
        return axiosClient.get(`/services/${id}`);
    },

}