import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export default function useSmartScroll(isLoading) {
    const location = useLocation();
    const action = useNavigationType();

    useEffect(() => {
        // Chỉ cuộn lại khi ĐÃ GỌI API XONG (!isLoading) và đang ấn BACK (action === 'POP')
        if (!isLoading && action === "POP") {
            const savedPosition = sessionStorage.getItem(`scroll-${location.pathname}`);
            if (savedPosition) {
                // Đợi React vẽ DOM thêm chút nữa cho chắc
                requestAnimationFrame(() => {
                    window.scrollTo(0, parseInt(savedPosition, 10));
                });
            }
        }

        // Nếu là chuyển sang trang MỚI (PUSH), thì cuộn lên đầu sau khi API load xong
        if (!isLoading && action === "PUSH") {
            window.scrollTo(0, 0);
        }
    }, [isLoading, location.pathname, action]);

    // Liên tục lưu vị trí khi cuộn chuột
    useEffect(() => {
        const saveScroll = () => {
            sessionStorage.setItem(`scroll-${location.pathname}`, window.scrollY.toString());
        };
        window.addEventListener('scroll', saveScroll);
        return () => window.removeEventListener('scroll', saveScroll);
    }, [location.pathname]);
}