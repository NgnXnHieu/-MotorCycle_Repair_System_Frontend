import { useState, useRef, useEffect } from 'react';
import { chatAIApi } from '../../api/chatAIApi';
import ReactMarkdown from 'react-markdown'; // 1. Bổ sung import

export default function ChatBotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'Chào bạn! Tôi là AI hỗ trợ của MotorCare. Tôi có thể giúp gì cho bạn hôm nay?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Tự động cuộn xuống tin nhắn mới nhất
    const messagesEndRef = useRef(null);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userText = input.trim();
        setMessages(prev => [...prev, { role: 'user', content: userText }]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await chatAIApi.sendQuestion({ message: userText });
            const aiReply = response?.reply || 'Tôi đã nhận được tin nhắn nhưng chưa có câu trả lời.';
            setMessages(prev => [...prev, { role: 'ai', content: aiReply }]);
        } catch (error) {
            console.error("Lỗi khi gọi AI:", error);
            setMessages(prev => [...prev, { role: 'ai', content: 'Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau!' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Khung Chat */}
            {isOpen && (
                <div className="bg-white rounded-2xl shadow-2xl w-[350px] h-[450px] mb-4 flex flex-col border border-gray-200 overflow-hidden transition-all duration-300">
                    {/* Header */}
                    <div className="bg-blue-600 text-white p-4 flex justify-between items-center rounded-t-2xl">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <h3 className="font-semibold">MotorCare AI Assistant</h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white hover:text-gray-200 focus:outline-none"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Nội dung chat */}
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`max-w-[85%] rounded-xl p-3 text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white self-end rounded-tr-sm'
                                        : 'bg-white border border-gray-200 text-gray-800 self-start rounded-tl-sm shadow-sm'
                                    }`}
                            >
                                {msg.role === 'ai' ? (
                                    <div className="flex flex-col gap-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:my-1 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:my-1 [&>p]:m-0 [&>strong]:font-bold">
                                        <ReactMarkdown>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="bg-white border border-gray-200 text-gray-500 self-start rounded-xl rounded-tl-sm p-3 shadow-sm flex items-center gap-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    {/* Form nhập tin nhắn */}
                    <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Nhập câu hỏi..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                            </svg>
                        </button>
                    </form>
                </div>
            )
            }

            {/* Icon Chat (Nút mở/đóng) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 focus:outline-none z-50 ${isOpen ? 'rotate-12' : ''}`}
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                )}
            </button>
        </div >
    );
}