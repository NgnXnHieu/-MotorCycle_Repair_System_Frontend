import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 0; i < totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 2) {
                pages.push(0, 1, 2, 3, '...', totalPages - 1);
            } else if (currentPage >= totalPages - 3) {
                pages.push(0, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1);
            } else {
                pages.push(0, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages - 1);
            }
        }
        return pages;
    };

    return (
        <div className="flex justify-center items-center gap-3 mt-12 mb-4">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 text-slate-500 bg-white shadow-sm transition-all duration-300 ease-in-out hover:bg-slate-50 hover:text-indigo-600 hover:border-slate-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
                <ChevronLeft size={20} strokeWidth={2.5} />
            </button>

            {getPageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                    {page === '...' ? (
                        <span className="px-2 py-2 text-slate-400 font-bold tracking-widest">...</span>
                    ) : (
                        <button
                            onClick={() => onPageChange(page)}
                            className={`w-11 h-11 rounded-xl font-bold text-sm transition-all duration-300 ease-in-out shadow-sm active:scale-95 ${currentPage === page
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-600/20 hover:bg-indigo-700'
                                : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md'
                                }`}
                        >
                            {page + 1}
                        </button>
                    )}
                </React.Fragment>
            ))}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 text-slate-500 bg-white shadow-sm transition-all duration-300 ease-in-out hover:bg-slate-50 hover:text-indigo-600 hover:border-slate-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
                <ChevronRight size={20} strokeWidth={2.5} />
            </button>
        </div>
    );
}