import axiosClient from "./axiosClient";
export const servicePackageApi = {

    getAll: (params) => {
        return axiosClient.get(`/servicePackages`, { params: params });
    },

    getFiltedAll: (filterform) => {
        return axiosClient.post(`/servicePackages/filtedServicePackage`, filterform, {
            params: {
                page: filterform.page,
                size: filterform.size
            }
        })
    },

    getById: (id) => {
        return axiosClient.get(`/servicePackages/${id}`);
    },

    getRelatedPackages: (id) => {
        return axiosClient.get(`/servicePackages/${id}/relatedList`)
    },


    //Thêm  mới
    create: (form) => {
        return axiosClient.post(`/servicePackages`, form)
    },

    //Update  
    update: (id, form) => {
        return axiosClient.post(`/servicePackages/${id}`, form)
    },

    //Xóa 
    delete: (id) => {
        return axiosClient.delete(`/servicePackages/${id}`)
    }
}