import axiosClient from "./axiosClient";

export const serviceApi = {
    getServicePage: () => {
        return axiosClient.get(`/services/page`);
    }
}