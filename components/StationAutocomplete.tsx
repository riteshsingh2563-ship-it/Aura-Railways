'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Train, Loader2, X } from 'lucide-react';

export interface StationItem {
  code: string;
  name: string;
  city?: string | null;
}

interface StationAutocompleteProps {
  label: string;
  placeholder: string;
  value: StationItem | null;
  onChange: (station: StationItem | null) => void;
  className?: string;
}

export const StationAutocomplete: React.FC<StationAutocompleteProps> = ({
  label,
  placeholder,
  value,
  onChange,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState(value ? `${value.name} (${value.code})` : '');
  const [suggestions, setSuggestions] = useState<StationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastSelectedCodeRef = useRef<string | null>(value?.code || null);

  // Sync ONLY when value changes externally (e.g. Swap button or preset route click)
  useEffect(() => {
    if (value?.code !== lastSelectedCodeRef.current) {
      lastSelectedCodeRef.current = value?.code || null;
      if (value) {
        setInputValue(`${value.name} (${value.code})`);
      } else {
        setInputValue('');
      }
    }
  }, [value]);

  // Debounced station search while typing
  useEffect(() => {
    const cleanQuery = inputValue.replace(/\([A-Za-z0-9\s-]+\)/, '').trim();
    if (!isOpen || cleanQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    // If input already exactly matches current selected station, skip API call
    if (value && inputValue === `${value.name} (${value.code})`) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stations/search?q=${encodeURIComponent(cleanQuery)}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSuggestions(json.data);
        }
      } catch (err) {
        console.error('Station search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [inputValue, isOpen, value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (stn: StationItem) => {
    lastSelectedCodeRef.current = stn.code;
    onChange(stn);
    setInputValue(`${stn.name} (${stn.code})`);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleClear = () => {
    lastSelectedCodeRef.current = null;
    onChange(null);
    setInputValue('');
    setSuggestions([]);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </label>
        {value && (
          <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800">
            {value.code}
          </span>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-400">
          <MapPin className="w-4 h-4" />
        </div>

        <input
          type="text"
          value={inputValue}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            const val = e.target.value;
            setInputValue(val);
            setIsOpen(true);
            if (val.trim().length === 0) {
              lastSelectedCodeRef.current = null;
              onChange(null);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (suggestions.length > 0) {
                handleSelect(suggestions[0]);
              } else if (inputValue.trim().length > 0) {
                const raw = inputValue.replace(/\([A-Za-z0-9\s-]+\)/, '').trim();
                handleSelect({ code: raw.toUpperCase(), name: raw });
              }
            }
          }}
          onBlur={() => {
            // Small delay to allow suggestion onMouseDown to execute first
            setTimeout(() => {
              if (!value && inputValue.trim().length > 0) {
                if (suggestions.length > 0) {
                  handleSelect(suggestions[0]);
                } else {
                  const raw = inputValue.replace(/\([A-Za-z0-9\s-]+\)/, '').trim();
                  lastSelectedCodeRef.current = raw.toUpperCase();
                  onChange({ code: raw.toUpperCase(), name: raw });
                }
              }
            }, 200);
          }}
          className="w-full pl-9 pr-14 py-2.5 rounded-xl glass-input text-sm font-medium"
        />

        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1">
          {loading && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
          {inputValue && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-white"
              title="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && inputValue.trim().length >= 2 && !loading && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl glass-panel border border-cyan-500/20 shadow-2xl divide-y divide-white/5">
          {suggestions.length > 0 ? (
            suggestions.map((stn) => (
              <button
                key={stn.code}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevents onBlur from running before click
                  handleSelect(stn);
                }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-cyan-950/40 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Train className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 shrink-0" />
                  <div className="truncate">
                    <p className="text-sm font-semibold text-slate-100 group-hover:text-cyan-200 truncate">
                      {stn.name}
                    </p>
                    {stn.city && (
                      <p className="text-[11px] text-slate-400">{stn.city}</p>
                    )}
                  </div>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 border border-white/10 text-cyan-300 ml-2">
                  {stn.code}
                </span>
              </button>
            ))
          ) : (
            <div className="p-3 text-center space-y-1">
              <p className="text-xs font-semibold text-slate-300">
                No active station found for &quot;{inputValue}&quot;
              </p>
              {/rajdhani|vande|express|shatabdi|mail|superfast|garib/i.test(inputValue) ? (
                <p className="text-[11px] text-amber-300 font-medium">
                  &quot;{inputValue}&quot; is a train name. Use the Train Tracker tab to search by train name.
                </p>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Try entering city name (e.g. Raipur, Delhi, Varanasi) or code (e.g. R, NDLS, BSB).
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
