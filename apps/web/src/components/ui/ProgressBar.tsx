'use client';

import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showLabel = true,
  size = 'md',
  className = '',
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between mb-1.5">
          <span className="text-sm text-gray-400">Finding best rate...</span>
          <span className="text-sm font-medium text-emerald-400">{clampedProgress}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-700 rounded-full ${heights[size]} overflow-hidden`}>
        <div
          className={`bg-gradient-to-r from-emerald-500 to-emerald-400 ${heights[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};
