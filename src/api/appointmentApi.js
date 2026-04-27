import axiosClient from "./axiosClient";

export const appointmentApi = {
    getMyHistory: (filterForm) => {
        return axiosClient.post(`/appointments/myHistory`, filterForm, {
            params: {
                page: filterForm.page,
                size: filterForm.size
            }
        })
    },

    createBooking: (form) => {
        return axiosClient.post(`/appointments/customerNoAcc`, form)
    },

    createEmergencyBooking: (form) => {
        return axiosClient.post(`/appointments/emergencyBooking`, form)
    },

    //Lấy ra các appointment cho Receptionists
    getAppointmentsForReps: (form) => {
        return axiosClient.post(`/appointments/filtedAppointment`, form)
    },


    //Lấy ra các emergency cho Reps
    getEmergencysForReps: (form) => {
        return axiosClient.post(`/appointments/filtedEmergency`, form)
    },

    //Lấy ra các trạng thái Enum
    getStatuses: () => {
        return axiosClient.get(`/appointments/statuses`)
    },

    //Cập nhật trạng thái từ BOOKED sang DIAGNOSING 
    updateToDiagnosing: (id) => {
        return axiosClient.post(`/appointments/statuses/${id}`)
    },

    //Update từ DIAGNOSING to WAITING 
    updateToWaiting: (form) => {
        return axiosClient.post(`/appointments/diagnosingStatus`, form)
    },


    //API cập nhật trạng thái appointment khẩn cấp từ Request sang Accept cho Reps
    updateRequestToAccept: (id) => {
        return axiosClient.post(`/appointments/resquestedAppointment/${id}`)
    },

    //API cập nhật trạng thái appointment khẩn cấp từ Accept sang Waiting cho Reps
    updateAcceptToWaiting: (id, form) => {
        return axiosClient.post(`/appointments/acceptedAppointment/${id}`, form)
    },

    //API lấy ra danh sách appointment cùng repairorder, servicedetail cho mechanic
    getAppointmentMechanic: (form) => {
        return axiosClient.get(`/appointments/mechanics/appointments`, { params: form })
    },

    //Lấy ra các statuses cho Mechanic
    getStatusesMechanic: () => {
        return axiosClient.get(`/appointments/mechanics/statuses`)
    },

    //Cập nhật trạng thái cho Mechanic waiting -> fixing
    updateMechanicToFixing: (id) => {
        return axiosClient.post(`/appointments/mechanics/appointments/${id}/waitingStatus`)
    },

    //Cập nhật trạng thái cho Mechanic fixing -> finished
    updateMechanicToFinished: (id) => {
        return axiosClient.post(`/appointments/mechanics/appointments/${id}/fixingStatus`)
    }
}