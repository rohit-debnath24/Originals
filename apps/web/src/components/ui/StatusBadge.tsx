'use client';

import React from 'react';

type StatusType = 'pending' | 'processing' | 'success' | 'error';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

const statusConfig: Record<StatusType, { bg: string; text: string; dot: string }> = {
  pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  processing: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  success: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  error: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const normalizedStatus = normalizeStatus(status);
  const config = statusConfig[normalizedStatus];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
        ${config.bg} ${config.text} ${className}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {formatStatus(status)}
    </span>
  );
};

function normalizeStatus(status: string): StatusType {
  const lower = status.toLowerCase();
  if (['completed', 'success', 'active'].includes(lower)) return 'success';
  if (['failed', 'error', 'expired'].includes(lower)) return 'error';
  if (['processing', 'usdc_pending', 'usdc_received', 'inr_sending', 'computing', 'locked'].includes(lower)) return 'processing';
  return 'pending';
}

function formatStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
