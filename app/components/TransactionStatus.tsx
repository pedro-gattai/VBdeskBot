"use client";

import { useState, useEffect } from "react";

interface TransactionStatusProps {
  status: 'idle' | 'pending' | 'confirmed' | 'error';
  txId?: string;
  message?: string;
  errorMessage?: string;
  onDismiss?: () => void;
}

export function TransactionStatus({
  status,
  txId,
  message,
  errorMessage,
  onDismiss,
}: TransactionStatusProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (status !== 'idle') {
      setIsVisible(true);
    }
  }, [status]);

  if (!isVisible) return null;

  const getContent = () => {
    switch (status) {
      case 'pending':
        return {
          icon: '⏳',
          title: 'Transaction Pending',
          message: message || 'Waiting for confirmation...',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          textColor: 'text-blue-300',
        };
      case 'confirmed':
        return {
          icon: '✅',
          title: 'Transaction Confirmed',
          message: message || 'Your transaction succeeded!',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
          textColor: 'text-green-300',
          txLink: txId ? `https://explorer.solana.com/tx/${txId}?cluster=devnet` : null,
        };
      case 'error':
        return {
          icon: '❌',
          title: 'Transaction Failed',
          message: errorMessage || 'Something went wrong. Please try again.',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          textColor: 'text-red-300',
        };
      default:
        return null;
    }
  };

  const content = getContent();
  if (!content) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 max-w-md p-4 rounded-lg border ${content.bgColor} ${content.borderColor} shadow-lg z-50`}
      role="status"
      aria-live="polite"
    >
      <div className="flex gap-3">
        <span className="text-2xl flex-shrink-0">{content.icon}</span>
        <div className="flex-1">
          <h3 className={`font-semibold ${content.textColor}`}>{content.title}</h3>
          <p className={`text-sm ${content.textColor} opacity-90 mt-1`}>
            {content.message}
          </p>
          {(content as any).txLink && (
            <a
              href={(content as any).txLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-xs font-semibold ${content.textColor} hover:underline mt-2 inline-block`}
            >
              View on Explorer →
            </a>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={() => {
              setIsVisible(false);
              onDismiss();
            }}
            className={`flex-shrink-0 text-lg ${content.textColor} hover:opacity-70 transition`}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
