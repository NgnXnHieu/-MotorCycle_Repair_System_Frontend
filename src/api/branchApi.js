import axiosClient from "./axiosClient";

export const branchApi = {
    getAllBranch: (page = 0, size = 20) => {
        return axiosClient.get(`/branches`, {
            params: {
                page, size
            }
        })
    },

    getById: (id) => {
        return axiosClient.get(`/branches/${id}`)
    }
}