import React from 'react';

interface LinkifiedTextProps {
  text: string;
  className?: string;
}

/**
 * Component that renders text with URLs as clickable links
 */
const LinkifiedText: React.FC<LinkifiedTextProps> = ({ text, className = '' }) => {
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  
  const parts = text.split(urlRegex);
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (urlRegex.test(part)) {
          // Reset regex lastIndex since we're testing in a loop
          urlRegex.lastIndex = 0;
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline hover:text-blue-600 break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        // Reset regex lastIndex
        urlRegex.lastIndex = 0;
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
};

export default LinkifiedText;
