'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown } from 'lucide-react';

export interface ActionMenuItem {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  icon?: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
  variant?: 'default' | 'accent' | 'danger';
  dividerBefore?: boolean;
}

interface ActionMenuProps {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  items: ActionMenuItem[];
  align?: 'left' | 'right';
  buttonClassName?: string;
}

export function ActionMenu({
  label,
  icon: TriggerIcon,
  badge,
  items,
  align = 'left',
  buttonClassName,
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const menuId = useId();
  const buttonId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Focus active item when menu opens or activeIndex changes
  useEffect(() => {
    if (open) {
      const target = itemRefs.current[activeIndex];
      target?.focus();
    }
  }, [open, activeIndex]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const openMenuAt = (index: number) => {
    setActiveIndex(index);
    setOpen(true);
  };

  const closeMenuAndFocusTrigger = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openMenuAt(0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      openMenuAt(Math.max(0, items.length - 1));
    } else if (e.key === 'Escape' && open) {
      e.preventDefault();
      setOpen(false);
    }
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeMenuAndFocusTrigger();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(items.length - 1);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        ref={triggerRef}
        id={buttonId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => {
          if (open) {
            setOpen(false);
          } else {
            openMenuAt(0);
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        className={
          buttonClassName ||
          'inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer'
        }
      >
        {TriggerIcon && (
          <TriggerIcon className="w-3.5 h-3.5 text-[#3B82F6]" aria-hidden="true" />
        )}
        <span>{label}</span>
        {badge !== undefined && (
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/20 text-[#10B981]">
            {badge}
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-labelledby={buttonId}
          onKeyDown={handleMenuKeyDown}
          className={`absolute z-50 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl shadow-black/70 p-1.5 focus:outline-none ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <React.Fragment key={item.id}>
                {item.dividerBefore && (
                  <div
                    role="separator"
                    className="my-1 border-t border-slate-800"
                  />
                )}
                <button
                  ref={(el) => {
                    itemRefs.current[idx] = el;
                  }}
                  type="button"
                  role="menuitem"
                  tabIndex={activeIndex === idx ? 0 : -1}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => {
                    setOpen(false);
                    item.onSelect();
                  }}
                  className={`w-full text-left flex items-start justify-between gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                    activeIndex === idx
                      ? 'bg-[#3B82F6]/20 text-white'
                      : item.variant === 'danger'
                        ? 'text-rose-300 hover:bg-rose-500/15'
                        : item.variant === 'accent'
                          ? 'text-[#10B981] hover:bg-[#10B981]/15'
                          : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    {Icon && (
                      <Icon
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          item.variant === 'accent'
                            ? 'text-[#10B981]'
                            : item.variant === 'danger'
                              ? 'text-rose-400'
                              : 'text-[#3B82F6]'
                        }`}
                        aria-hidden="true"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold leading-tight">
                        {item.label}
                      </div>
                      {item.description && (
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>
                  {item.shortcut && (
                    <kbd className="text-[10px] font-mono text-slate-300 bg-slate-950 border border-slate-700 px-1.5 py-0.5 rounded shrink-0">
                      {item.shortcut}
                    </kbd>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
