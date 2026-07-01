import type { SearchResult } from '../../bun/search';
import { HighlightMatch } from './HighlightMatch';

interface SearchResultItemProps {
  result: SearchResult;
  query: string;
  isActive: boolean;
  onNavigate: () => void;
}

export default function SearchResultItem({
  result: r,
  query,
  isActive,
  onNavigate,
}: SearchResultItemProps) {
  return (
    <button
      onClick={onNavigate}
      className={`w-full text-left px-3 py-2 border-b border-gray-700/50 last:border-0 transition-colors ${
        isActive ? 'bg-indigo-900/30' : 'hover:bg-gray-750'
      }`}
    >
      <div className="min-w-0">
        {(r.sectionTitle || r.moduleName) && (
          <p className="text-[10px] text-gray-500 truncate mb-0.5">
            {r.moduleName}
            {r.sectionTitle && (
              <>
                <span className="text-gray-600"> &rsaquo; </span>
                {HighlightMatch(r.sectionTitle, query)}
              </>
            )}
          </p>
        )}
        <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
          {HighlightMatch(r.snippet, query)}
        </p>
      </div>
    </button>
  );
}
