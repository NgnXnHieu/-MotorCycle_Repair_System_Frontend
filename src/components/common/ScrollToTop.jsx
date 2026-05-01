import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export default function ScrollToTop() {
    const { pathname } = useLocation();
    const action = useNavigationType();

    useEffect(() => {
        // action === "POP" nghĩa là người dùng vừa bấm nút "Back" hoặc "Forward" của trình duyệt,
        // hoặc gọi navigate(-1). Lúc này ta KHÔNG cuộn, để trình duyệt tự phục hồi vị trí cũ.
        // Chỉ cuộn lên top khi action là "PUSH" (chuyển trang mới) hoặc "REPLACE".
        if (action !== "POP") {
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: 'instant' // Chuyển ngay lập tức để tránh UI bị giật
            });
        }
    }, [pathname, action]);

    return null;
}