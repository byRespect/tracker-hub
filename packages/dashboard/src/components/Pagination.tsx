
import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { PaginationMeta } from '../types';

interface Props {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  showLimitSelector?: boolean;
}

export const Pagination: React.FC<Props> = ({
  pagination,
  onPageChange,
  onLimitChange,
  showLimitSelector = true
}) => {
  const { page, limit, total, totalPages } = pagination;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (page > 3) {
        pages.push('...');
      }

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }

      if (page < totalPages - 2) {
        pages.push('...');
      }

      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (total === 0) return null;

  return (
    <div className="w-full bg-[#0f172a]/80 backdrop-blur-md border-t border-slate-800">
      <div className="flex flex-col sm:flex-row items-center justify-between p-3 sm:px-4 sm:py-2 gap-3 sm:gap-0">

        {/* Left Side: Info & Limit Selector */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Showing {startItem}-{endItem} of {total} items</span>
            <span className="sm:hidden font-medium text-slate-400">{total} Items</span>
          </div>

          {showLimitSelector && onLimitChange && (
            <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg border border-slate-800 px-2 py-1">
              <span className="hidden sm:inline text-[10px] uppercase font-bold tracking-wider">Rows:</span>
              <select
                value={limit}
                onChange={(e) => onLimitChange(Number(e.target.value))}
                className="bg-transparent text-slate-300 text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          )}
        </div>

        {/* Right Side: Navigation Controls */}
        <div className="flex items-center justify-center w-full sm:w-auto gap-1 bg-slate-900/40 p-1 rounded-lg border border-slate-800/50">
          <button
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            className="p-1.5 rounded-md hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-400 hover:text-white transition-colors"
            title="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="p-1.5 rounded-md hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-400 hover:text-white transition-colors"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Desktop: Numbered List */}
          <div className="hidden sm:flex items-center gap-1 mx-2">
            {getPageNumbers().map((pageNum, index) => (
              <React.Fragment key={index}>
                {pageNum === '...' ? (
                  <span className="px-2 text-slate-600 text-[10px]">...</span>
                ) : (
                  <button
                    onClick={() => onPageChange(pageNum as number)}
                    className={`min-w-[28px] h-7 rounded-md text-xs font-medium transition-all ${pageNum === page
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                  >
                    {pageNum}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Mobile: Simple Counter */}
          <div className="sm:hidden px-4 text-xs font-medium text-slate-300 min-w-[80px] text-center">
            {page} / {totalPages}
          </div>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="p-1.5 rounded-md hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-400 hover:text-white transition-colors"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
            className="p-1.5 rounded-md hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-400 hover:text-white transition-colors"
            title="Last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
