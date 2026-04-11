export const format = {
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount);
    },
}