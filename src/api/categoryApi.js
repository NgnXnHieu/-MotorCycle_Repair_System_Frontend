import axiosClient from "./axiosClient";

export const categoryApi = {
    getAllCategory: () => {
        return axiosClient.get('/categories');
    },

    create: (form) => {
        return axiosClient.post(`/categories`, form)
    },

    update: (id, form) => {
        return axiosClient.put(`/categories/${id}`, form)
    },

    delete: (id) => {
        return axiosClient.delete(`/categories/${id}`)
    },

    getById: (id) => {
        return axiosClient.get(`/categories/${id}`)
    },
}