import React from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPaginationRange = (current, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    
    if (current <= 4) {
      return [1, 2, 3, 4, 5, 'ELLIPSIS_RIGHT', total];
    }
    
    if (current >= total - 3) {
      return [1, 'ELLIPSIS_LEFT', total - 4, total - 3, total - 2, total - 1, total];
    }
    
    return [1, 'ELLIPSIS_LEFT', current - 1, current, current + 1, 'ELLIPSIS_RIGHT', total];
  };

  const paginationRange = getPaginationRange(currentPage, totalPages);

  return (
    <div className="flex items-center justify-center py-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        {paginationRange.map((pageItem) => (
          typeof pageItem === 'string' && pageItem.startsWith('ELLIPSIS') ? (
            <span key={pageItem} className="px-1 text-slate-400">...</span>
          ) : (
            <button
              key={pageItem}
              onClick={() => onPageChange(pageItem)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                currentPage === pageItem
                  ? 'bg-[#1b2b4d] text-white'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {pageItem}
            </button>
          )
        ))}

        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

export default Pagination;
