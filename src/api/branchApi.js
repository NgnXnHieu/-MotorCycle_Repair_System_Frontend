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
    },

    //Lấy ra các branch có vị trí gần nhất
    getNearBranches: (form) => {
        return axiosClient.post(`/branches/nearBranches`, form)
    },

    //Lấy ra thông tin branch của nhân viên hiện tại
    getMyBranch: () => {
        return axiosClient.get(`/branches/myBranch`);
    },

    getFiltedBranches: (form) => {
        return axiosClient.post(`/branches/filtedBranches`, form, {
            params: {
                page: form.page,
                size: form.size
            }
        })
    },

    createBranch: (form) => {
        return axiosClient.post(`/branches`, form)
    },

    updateBranch: (id, form) => {
        return axiosClient.put(`/branches/${id}`, form)
    },

    deleteBranch: (id) => {
        return axiosClient.delete(`/branches/${id}`)
    },
}