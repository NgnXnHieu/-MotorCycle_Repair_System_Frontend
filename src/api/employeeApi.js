import axiosClient from "./axiosClient";
export const employeeApi = {
    //lấy ra danh sách tất cả employee của branch hiện tại
    getEmployeesOfBranch: () => {
        return axiosClient.get(`/employee/branch`)
    },

    //Lấy ra thông tin employee của tài khoản hiện tại
    getProfile: () => {
        return axiosClient.get(`/employee/profile`)
    },

    //Lấy ra tất cả các role để update cho GBM (Machanic, Rep, BM)
    getRole4GBM: () => {
        return axiosClient.get(`/employee/role4GBM`)
    },

    //Lấy ra tất cả các role 
    getRoles: () => {
        return axiosClient.get(`/employee/role`)
    },


    //Lấy ra các role Mechanic, Reps
    getRole4BM: () => {
        return axiosClient.get(`/employee/role4BM`)
    },

    //Lấy ra tất cả employee đã được lọc
    getFiltedEmployee: (form) => {
        return axiosClient.get(`/employee/filtedEmployee`, form)
    },

    //Lấy ra tất cả employee đã được lọc cho BM
    getFiltedEmployee4BM: (form) => {
        return axiosClient.get(`/employee/filtedEmployee4BM`, form)
    },

    //Tạo thêm nhân viên mới
    createEmployee: (form) => {
        return axiosClient.post(`/accounts/employee`, form)
    },

    //Update thông tin nhân viên
    updateEmployeeDetail: (id, form) => {
        return axiosClient.put(`/employee/${id}`, form)
    },

    //Lấy ra thông tin chi tiết employee
    getById: (id) => {
        return axiosClient.get(`/employee/${id}`)
    }

}