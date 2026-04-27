import axiosClient from "./axiosClient";

export const contentApi = {

    //Lấy ra tất cả content của menu theo id
    getByMenuId: (id) => {
        return axiosClient.get(`/contents/menu/${id}`)
    },

    //Cập nhật content
    update: (id, form) => {
        return axiosClient.put(`/contents/${id}`, form)
    },

    //Lấy ra list content theo pageCode
    getContentList: (pageCode) => {
        return axiosClient.get(`/contents/menu/contentList`, {
            params: {
                pageCode: pageCode
            }
        })
    }
}