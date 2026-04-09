import axiosClient from "./axiosClient";

export const categoryApi = {
    getAllCategory: () => {
        return axiosClient.get('/categories');
    }
}