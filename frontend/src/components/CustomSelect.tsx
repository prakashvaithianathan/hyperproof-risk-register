import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badgeClass?: string;
  dotColor?: string;
}

interface CustomSelectProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  label?: string;
  className?: string;
  minWidth?: string;
}

export function CustomSelect<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  label,
  className = '',
  minWidth = 'min-w-[170px]',
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      {label && (
        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          {label}
        </span>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-800 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-hyperproof-500/20 focus:border-hyperproof-500 ${minWidth} ${
          isOpen ? 'ring-2 ring-hyperproof-500/20 border-hyperproof-500 shadow-md' : ''
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.dotColor && (
            <span className={`w-2 h-2 rounded-full shrink-0 ${selectedOption.dotColor}`} />
          )}
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-hyperproof-600' : ''
          }`}
        />
      </button>

      {/* Dropdown menu popup */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 z-50 w-full min-w-[200px] bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-900/10 py-1.5 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
          <div className="max-h-60 overflow-y-auto px-1 space-y-0.5">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                    isSelected
                      ? 'bg-hyperproof-50 text-hyperproof-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {option.dotColor && (
                      <span className={`w-2 h-2 rounded-full shrink-0 ${option.dotColor}`} />
                    )}
                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                    <span className="truncate">{option.label}</span>
                  </div>

                  {isSelected && <Check className="w-3.5 h-3.5 text-hyperproof-600 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
