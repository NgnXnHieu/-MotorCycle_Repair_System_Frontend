import axiosClient from "./axiosClient";

export const chatAIApi = {
    sendQuestion: (message) => {
        return axiosClient.post(`/chat`, message)
    }
}