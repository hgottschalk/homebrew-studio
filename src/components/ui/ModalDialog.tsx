'use client';

import React, { useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';

interface ModalDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  maxWidthClass?: string;
  children: React.ReactNode;
}

export function ModalDialog({
  open,
  onClose,
  title,
  description,
  icon: HeaderIcon,
  maxWidthClass = 'max-w-3xl',
  children,
}: ModalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={onClose}
      onClick={handleBackdropClick}
      className={`app-modal ${maxWidthClass}`}
    >
      {open && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2.5">
              {HeaderIcon && (
                <div className="p-2 rounded-xl bg-[#3B82F6]/15 text-[#3B82F6]">
                  <HeaderIcon className="w-4 h-4" aria-hidden="true" />
                </div>
              )}
              <div>
                <h2 id={titleId} className="text-base font-bold text-white">
                  {title}
                </h2>
                {description && (
                  <p id={descId} className="text-xs text-slate-300 mt-0.5">
                    {description}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={`Close ${title} dialog`}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="p-5 max-h-[80dvh] overflow-y-auto space-y-4">
            {children}
          </div>
        </div>
      )}
    </dialog>
  );
}
