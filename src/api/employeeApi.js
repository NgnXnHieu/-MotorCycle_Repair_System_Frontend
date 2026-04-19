import axiosClient from "./axiosClient";
export const employeeApi = {
    //lấy ra danh sách tất cả employee của branch hiện tại
    getEmployeesOfBranch: () => {
        return axiosClient.get(`/employee/branch`)
    },

    //Lấy ra thông tin employee cùng branch
    getProfile: () => {
        return axiosClient.get(`/employee/profile`)
    },

}