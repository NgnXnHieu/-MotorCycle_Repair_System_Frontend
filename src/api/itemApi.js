import axiosClient from './axiosClient';

export const itemApi = {
    // Lấy danh sách phụ tùng (Sẽ gọi vào http://localhost:8080/api/items)
    getAllItems: (params) => {
        return axiosClient.get('/items', { params: params });
    },

    getFiltedItem: (filterForm) => {
        // Truyền page và size lên params (URL), các cái khác nằm trong data (Body)
        return axiosClient.post('/items/filtedItem', filterForm, {
            params: {
                page: filterForm.page,
                size: filterForm.size
            }
        });
    },

    getItemByID: (id) => {
        return axiosClient.get(`/items/${id}`)
    },

    getRelatedItems: (categoryId, itemId) => {
        return axiosClient.get('/items/relatedItems', {
            params: {
                categoryId: categoryId,
                itemId: itemId
            }
        });
    },

    //Thêm sản phẩm vào danh sách yêu thích
    addToFavouriteList: (id) => {
        return axiosClient.post(`/favouriteItem/${id}`)
    },

    //Xóa sản phẩm khỏi danh sách yêu thích
    removeToFavouriteList: (id) => {
        return axiosClient.delete(`/favouriteItem/${id}`)
    },

    //Lấy ra danh sách yêu thích
    getMyFavouriteList: () => {
        return axiosClient.get(`/favouriteItem/myFavouriteList`)
    },

    //Lấy ra các item(có thể lọc) for receptionist
    getItem4Rep: (form) => {
        return axiosClient.post(`/items/item4Rep`, form, {
            params: {
                page: form.page,
                size: form.size
            }
        })
    },

};