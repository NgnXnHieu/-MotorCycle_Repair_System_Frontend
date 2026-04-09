import axiosClient from "./axiosClient";
export const servicePackageApi = {
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
    }
}