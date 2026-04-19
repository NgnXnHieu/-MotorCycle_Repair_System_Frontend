import axiosClient from "./axiosClient";

export const accountApi = {
    changePassword: (form) => {
        return axiosClient.put("/accounts/password", form);
    },

    changeAvatar: (file) => {
        return axiosClient.put("/accounts/avatar", file);
    },
}