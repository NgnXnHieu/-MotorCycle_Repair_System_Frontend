import axiosClient from "./axiosClient";

export const customerPackageApi = {
    getFiltedAll: (filterForm) => {
        return axiosClient.post(`/customerPackages/myServicePackage`, filterForm, {
            params: {
                page: filterForm.page,
                size: filterForm.size
            }
        })
    }
}