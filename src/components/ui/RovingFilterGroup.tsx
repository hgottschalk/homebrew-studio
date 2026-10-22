'use client';

import React, { useRef } from 'react';

export interface FilterOption<T extends string = string> {
  value: T;
  label: string;
}

interface RovingFilterGroupProps<T extends string = string> {
  ariaLabel: string;
  options: FilterOption<T>[];
  value: T;
  onChange: (nextValue: T) => void;
  accentColor?: 'blue' | 'emerald' | 'purple';
}

export function RovingFilterGroup<T extends string = string>({
  ariaLabel,
  options,
  value,
  onChange,
  accentColor = 'blue',
}: RovingFilterGroupProps<T>) {
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeStyles = {
    blue: 'bg-[#3B82F6] text-white font-semibold shadow-sm',
    emerald: 'bg-[#10B981] text-slate-950 font-semibold shadow-sm',
    purple: 'bg-purple-500 text-white font-semibold shadow-sm',
  }[accentColor];

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    let nextIndex: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % options.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + options.length) % options.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = options.length - 1;
    }

    if (nextIndex !== null) {
      const nextOption = options[nextIndex];
      onChange(nextOption.value);
      itemRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex flex-wrap items-center gap-1.5"
    >
      {options.map((opt, idx) => {
        const isChecked = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isChecked}
            tabIndex={isChecked ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`px-3 py-1.5 rounded-full text-xs transition-colors cursor-pointer ${
              isChecked
                ? activeStyles
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
