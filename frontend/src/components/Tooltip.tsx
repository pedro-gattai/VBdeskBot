import { useState } from 'react';
import type { FC, ReactNode } from 'react';
import './Tooltip.css';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      className="tooltip-wrapper"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <span className={`tooltip-content tooltip-${position}`} role="tooltip">
          {content}
          <span className="tooltip-arrow"></span>
        </span>
      )}
    </span>
  );
};
