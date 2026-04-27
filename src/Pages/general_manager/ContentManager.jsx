import React, { useState, useEffect } from 'react';
import { Edit, Type, Link as LinkIcon, Palette, Layers, Image as ImageIcon, Settings } from 'lucide-react';
import { menuApi } from '../../api/menuApi';
import { contentApi } from '../../api/contentApi';
import { LayoutList } from 'lucide-react';

export default function ContentManager() {
    const [menus, setMenus] = useState([]);
    const [selectedMenu, setSelectedMenu] = useState(null);
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(false);

    // State quản lý Modal chỉnh sửa
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editType, setEditType] = useState(''); // 'MENU' hoặc 'CONTENT'
    const [formData, setFormData] = useState({});

    // State để chứa file ảnh khi người dùng upload
    const [selectedFile, setSelectedFile] = useState(null);

    // State để lưu đường dẫn xem trước ảnh
    const [previewUrl, setPreviewUrl] = useState(null);

    // LOGIC TẠO PREVIEW URL
    useEffect(() => {
        if (!selectedFile) {
            setPreviewUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(selectedFile);
        setPreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [selectedFile]);

    // 1. Tải danh sách Menu
    useEffect(() => {
        const fetchMenus = async () => {
            try {
                const res = await menuApi.getMenus();
                const menuList = res.content || res.data?.content || [];
                setMenus(menuList);
                if (menuList.length > 0) {
                    handleSelectMenu(menuList[0]);
                }
            } catch (error) {
                console.error("Lỗi tải menu:", error);
            }
        };
        fetchMenus();
    }, []);

    // 2. Hàm khi click chọn 1 Menu
    const handleSelectMenu = async (menu) => {
        setSelectedMenu(menu);
        setLoading(true);
        try {
            const res = await contentApi.getByMenuId(menu.id);
            setContents(res.content || res.data?.content || []);
        } catch (error) {
            console.error("Lỗi tải contents:", error);
        } finally {
            setLoading(false);
        }
    };

    // 3. Mở Modal chỉnh sửa
    const openEditModal = (type, item) => {
        setEditType(type);
        setFormData(item);
        setSelectedFile(null);
        setIsModalOpen(true);
    };

    // 4. Xử lý lưu dữ liệu
    const handleSave = async (e) => {
        e.preventDefault();

        const isConfirm = window.confirm("Bạn có chắc chắn muốn lưu các thay đổi này không?");
        if (!isConfirm) return;

        try {
            if (editType === 'MENU') {
                await menuApi.update(formData.id, formData);
                setMenus(menus.map(m => m.id === formData.id ? formData : m));
                setSelectedMenu(formData);
                alert("✅ Cập nhật thông tin Trang (Menu) thành công!");

            } else if (editType === 'CONTENT') {
                const submitData = new FormData();
                const contentUpdateFormBlob = new Blob(
                    [JSON.stringify(formData)],
                    { type: 'application/json' }
                );
                submitData.append('contentUpdateForm', contentUpdateFormBlob);

                if (formData.contentType === 'IMAGE' && selectedFile) {
                    submitData.append('file', selectedFile);
                }

                const response = await contentApi.update(formData.id, submitData);
                const updatedContent = response.data || response;

                setContents(contents.map(c => c.id === updatedContent.id ? updatedContent : c));
                alert("✅ Cập nhật Nội dung thành công!");
            }

            setIsModalOpen(false);
            setSelectedFile(null);
        } catch (error) {
            console.error("Lỗi cập nhật:", error);
            const errorMsg = error.response?.data?.message || "Đã xảy ra lỗi không xác định từ máy chủ!";
            alert(`❌ Cập nhật thất bại:\n${errorMsg}`);
        }
    };

    // PHÂN LOẠI CONTENT ĐỂ HIỂN THỊ
    const textContents = contents.filter(c => c.contentType === 'TEXT');
    const imageContents = contents.filter(c => c.contentType === 'IMAGE');
    const componentContents = contents.filter(c => c.contentType === 'COMPONENT');

    return (
        <div className="p-6 bg-gray-50 min-h-[calc(100vh-64px)] font-sans">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Tiêu đề trang */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Settings className="text-blue-600" /> Quản lý Giao diện & Nội dung
                    </h1>
                    <p className="text-gray-500 mt-1">Chọn một trang bên dưới để tùy chỉnh nội dung hiển thị.</p>
                </div>

                {/* Tabs Menu */}
                <div className="flex overflow-x-auto gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
                    {menus.map((menu) => (
                        <button
                            key={menu.id}
                            onClick={() => handleSelectMenu(menu)}
                            className={`cursor-pointer whitespace-nowrap px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${selectedMenu?.id === menu.id
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                        >
                            {menu.title}
                        </button>
                    ))}
                </div>

                {/* Khu vực Detail */}
                <div className="relative min-h-[400px]">
                    {loading ? (
                        <div className="absolute inset-0 flex justify-center items-center bg-gray-50/50 backdrop-blur-sm z-10 text-blue-600 font-medium">
                            Đang tải dữ liệu...
                        </div>
                    ) : selectedMenu ? (
                        <div className="space-y-8 animate-fade-in">
                            {/* Card Menu */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                                        Cấu hình trang: {selectedMenu.title}
                                    </h2>
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                        <span className="bg-gray-100 px-2 py-1 rounded">Code: <strong className="text-gray-700">{selectedMenu.pageCode}</strong></span>
                                        <span>Đường dẫn: <strong className="text-blue-600">{selectedMenu.url || 'Không có'}</strong></span>
                                        <span>Mô tả: {selectedMenu.description}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => openEditModal('MENU', selectedMenu)}
                                    className="cursor-pointer flex-shrink-0 flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-5 py-2.5 rounded-xl font-semibold transition-colors"
                                >
                                    <Edit size={18} /> Sửa thông tin trang
                                </button>
                            </div>

                            {/* --- KHU VỰC: NỘI DUNG VĂN BẢN --- */}
                            {textContents.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-3 mb-4 border-b pb-2">
                                        <Type className="text-green-600" size={24} />
                                        <h3 className="text-lg font-bold text-gray-800">Nội dung Văn bản</h3>
                                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">{textContents.length}</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {textContents.map((content) => (
                                            <div key={content.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-green-300 transition-all group flex flex-col h-full">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1 rounded-full uppercase">
                                                        {content.sectionCode}
                                                    </span>
                                                    <button onClick={() => openEditModal('CONTENT', content)} className="cursor-pointer p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                                                        <Edit size={18} />
                                                    </button>
                                                </div>
                                                <h4 className="font-bold text-gray-900 text-base mb-1">{content.contentKey}</h4>
                                                <p className="text-xs text-gray-500 mb-3">{content.description}</p>

                                                {/* Nổi bật nội dung Text */}
                                                <div className="mt-auto p-3 bg-green-50 border border-green-100 rounded-xl">
                                                    <p className="text-gray-800 font-medium line-clamp-3" title={content.contentValue}>
                                                        {content.contentValue}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* --- KHU VỰC: HÌNH ẢNH --- */}
                            {imageContents.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-3 mb-4 border-b pb-2">
                                        <ImageIcon className="text-blue-600" size={24} />
                                        <h3 className="text-lg font-bold text-gray-800">Quản lý Hình ảnh</h3>
                                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{imageContents.length}</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {imageContents.map((content) => (
                                            <div key={content.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all group flex flex-col h-full">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1 rounded-full uppercase">
                                                        {content.sectionCode}
                                                    </span>
                                                    <button onClick={() => openEditModal('CONTENT', content)} className="cursor-pointer p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                        <Edit size={18} />
                                                    </button>
                                                </div>
                                                <h4 className="font-bold text-gray-900 text-base mb-1">{content.contentKey}</h4>
                                                <p className="text-xs text-gray-500 mb-3">{content.description}</p>

                                                {/* Hiển thị trực tiếp Hình ảnh */}
                                                <div className="mt-auto h-32 w-full bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden relative group-hover:border-blue-300 transition-colors">
                                                    {content.contentValue && content.contentValue.startsWith('http') ? (
                                                        <img src={content.contentValue} alt={content.contentKey} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-sm text-gray-400">Chưa có ảnh</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* --- KHU VỰC: COMPONENT GIAO DIỆN --- */}
                            {componentContents.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-3 mb-4 border-b pb-2">
                                        <Layers className="text-purple-600" size={24} />
                                        <h3 className="text-lg font-bold text-gray-800">Khối Giao diện (Component)</h3>
                                        <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">{componentContents.length}</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {componentContents.map((content) => (
                                            <div key={content.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-purple-300 transition-all group flex flex-col h-full">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1 rounded-full uppercase">
                                                        {content.sectionCode}
                                                    </span>
                                                    <button onClick={() => openEditModal('CONTENT', content)} className="cursor-pointer p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                                                        <Edit size={18} />
                                                    </button>
                                                </div>
                                                <h4 className="font-bold text-gray-900 text-base mb-1">{content.contentKey}</h4>
                                                <p className="text-xs text-gray-500 mb-3">{content.description}</p>

                                                {/* Nổi bật Màu sắc (Color) */}
                                                <div className="mt-auto flex items-center gap-3 bg-purple-50 p-3 rounded-xl border border-purple-100">
                                                    <div
                                                        className="w-8 h-8 rounded-full border-2 border-white shadow-md flex-shrink-0"
                                                        style={{ backgroundColor: content.color || '#cccccc' }}
                                                    ></div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-purple-500 font-semibold uppercase">Màu sắc chủ đạo</span>
                                                        <span className="text-sm font-mono font-bold text-gray-800">{content.color || 'Chưa thiết lập'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="flex flex-col justify-center items-center h-64 text-gray-400">
                            <LayoutList size={48} className="mb-3 text-gray-300" />
                            <p>Chưa có dữ liệu. Vui lòng chọn một trang phía trên.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ====== MODAL CHỈNH SỬA (GIỮ NGUYÊN) ====== */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden shadow-2xl animate-fade-in-up">

                        {/* HEADER */}
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <h3 className="text-lg font-bold text-gray-800">
                                Cập nhật {editType === 'MENU' ? 'thông tin Trang' : 'Nội dung'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="cursor-pointer text-gray-400 hover:text-red-500 font-bold text-xl transition-colors">&times;</button>
                        </div>

                        {/* FORM */}
                        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">

                            {/* PHẦN BODY */}
                            <div className="p-6 space-y-4 overflow-y-auto flex-1">
                                {/* FORM MENU */}
                                {editType === 'MENU' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Tiêu đề (Title)</label>
                                            <input type="text" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Đường dẫn (URL)</label>
                                            <input type="text" value={formData.url || ''} onChange={e => setFormData({ ...formData, url: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                                        </div>
                                    </>
                                )}

                                {/* FORM CONTENT */}
                                {editType === 'CONTENT' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                {formData.contentType === 'IMAGE' ? 'Cập nhật Hình ảnh' :
                                                    formData.contentType === 'COMPONENT' ? 'Cấu hình Component' : 'Nội dung Văn bản'}
                                            </label>

                                            {/* XỬ LÝ ẨN/HIỆN THEO CONTENT TYPE */}
                                            {formData.contentType === 'TEXT' && (
                                                <textarea
                                                    value={formData.contentValue || ''}
                                                    onChange={e => setFormData({ ...formData, contentValue: e.target.value })}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[100px]"
                                                    required
                                                />
                                            )}

                                            {formData.contentType === 'IMAGE' && (
                                                <div className="space-y-3">
                                                    <div className="w-full h-40 bg-gray-100 rounded-lg border-2 border-dashed border-gray-200 overflow-hidden flex flex-col items-center justify-center relative">
                                                        {previewUrl ? (
                                                            <>
                                                                <img src={previewUrl} alt="Preview" className="max-h-full object-contain" />
                                                                <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] px-2 py-1 rounded-md font-bold shadow-sm">ẢNH MỚI CHỌN</div>
                                                            </>
                                                        ) : formData.contentValue && formData.contentValue.startsWith('http') ? (
                                                            <>
                                                                <img src={formData.contentValue} alt="Current" className="max-h-full object-contain " />
                                                                <div className="absolute top-2 right-2 bg-gray-500 text-white text-[10px] px-2 py-1 rounded-md font-bold shadow-sm">ẢNH HIỆN TẠI</div>
                                                            </>
                                                        ) : (
                                                            <div className="text-gray-400 flex flex-col items-center">
                                                                <ImageIcon size={32} />
                                                                <span className="text-xs mt-2">Chưa có ảnh nào</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={e => setSelectedFile(e.target.files[0])}
                                                        className="cursor-pointer w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                        required={!formData.contentValue}
                                                    />
                                                    <p className="text-[11px] text-gray-400 italic">* Lưu ý: Ảnh xem trước chỉ hiển thị tạm thời trên trình duyệt của bạn.</p>
                                                </div>
                                            )}

                                            {formData.contentType === 'COMPONENT' && (
                                                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-start gap-3">
                                                    <Layers className="text-purple-500 mt-0.5 flex-shrink-0" size={20} />
                                                    <div className="text-sm text-purple-800">
                                                        <p className="font-semibold mb-1">Mục này là một Khối Giao diện (Component).</p>
                                                        <p className="text-purple-600">Phần văn bản và hình ảnh đã được lập trình sẵn. Bạn có thể thay đổi màu sắc cấu hình ở bên dưới.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Link chuyển hướng (Khi click vào)</label>
                                            <input type="text" value={formData.link || ''} onChange={e => setFormData({ ...formData, link: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="VD: /bookingPage hoặc https://..." />
                                        </div>
                                    </>
                                )}

                                {/* CHUNG */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Màu sắc (Color HEX)</label>
                                        <div className="flex gap-2 relative">
                                            <input type="color" value={formData.color || '#000000'} onChange={e => setFormData({ ...formData, color: e.target.value })} className="cursor-pointer h-[42px] w-[42px] p-1 border border-gray-300 rounded-lg flex-shrink-0" />
                                            <input type="text" value={formData.color || ''} onChange={e => setFormData({ ...formData, color: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase font-mono text-sm" placeholder="#FFFFFF" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Thứ tự hiển thị</label>
                                        <input type="number" value={formData.orderIndex || 0} onChange={e => setFormData({ ...formData, orderIndex: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Ghi chú / Mô tả</label>
                                    <input type="text" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Giải thích chức năng của trường này..." />
                                </div>
                            </div>

                            {/* PHẦN FOOTER (NÚT LƯU) */}
                            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-200 shrink-0">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="cursor-pointer px-5 py-2.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl font-semibold transition-colors">Hủy bỏ</button>
                                <button type="submit" className="cursor-pointer px-5 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-colors shadow-lg shadow-blue-500/30">Lưu thay đổi</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}