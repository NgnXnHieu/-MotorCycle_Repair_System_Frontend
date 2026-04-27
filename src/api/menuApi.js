import axiosClient from "./axiosClient";

export const menuApi = {
    //Lấy ra tất cả các menu
    getMenus: () => {
        return axiosClient.get(`/menus`)
    },

    //Lấy ra menu theo id
    getMenuById: (id) => {
        return axiosClient.get(`/menus/${id}`)
    },

    //Lấy ra menu theo id
    update: (id, form) => {
        return axiosClient.put(`/menus/${id}`, form)
    },
}