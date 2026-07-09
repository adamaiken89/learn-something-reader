import { useState } from 'react';

interface ClozeBlankProps {
  answer: string;
}

export default function ClozeBlank({ answer }: ClozeBlankProps) {
  const [revealed, setRevealed] = useState(false);

  if (revealed) {
    return (
      <span className="cloze-blank revealed">
        <span>{answer}</span>
      </span>
    );
  }

  return (
    <span
      className="cloze-blank cloze-blank-hidden"
      onClick={() => setRevealed(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') setRevealed(true);
      }}
      title="Click to reveal"
    >
      <span className="cloze-placeholder">&nbsp;</span>
    </span>
  );
}
