import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import type { PluggableList } from 'unified';

import { components } from '../../sections/lessonHelpers';
import { useLessonViewStore } from '../../stores/lessonViewStore';

interface LessonContentHeaderProps {
  rehypePlugins: PluggableList;
}

export default function LessonContentHeader({ rehypePlugins }: LessonContentHeaderProps) {
  const h1 = useLessonViewStore((s) => s.h1);
  const meta = useLessonViewStore((s) => s.meta);

  return (
    <>
      {h1 && (
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          rehypePlugins={rehypePlugins}
          components={components}
        >
          {`# ${h1}`}
        </ReactMarkdown>
      )}
      {meta.length > 0 && (
        <div className="lesson-meta">
          {meta.map((m, i) => {
            const isDesc = m.key === 'description';
            return (
              <span key={m.key} style={isDesc ? { flexBasis: '100%' } : undefined}>
                {!isDesc && i > 0 && <span className="meta-divider" />}
                <span className={`meta-item${isDesc ? ' meta-description' : ''}`}>
                  <span className="meta-icon">{m.icon}</span>
                  <span className="meta-label">{m.label}</span>
                  <span className="meta-value">{m.value}</span>
                </span>
              </span>
            );
          })}
        </div>
      )}
    </>
  );
}
