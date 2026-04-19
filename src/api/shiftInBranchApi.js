import axiosClient from "./axiosClient";

export const shiftInBranchApi = {
    //Lấy ra tất cả các ca của chi nhánh X
    getShiftByBranch: () => {
        return axiosClient.get(`/shiftsInBranch/allShifts`)
    },
}