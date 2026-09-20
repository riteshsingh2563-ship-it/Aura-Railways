'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Train, Loader2 } from 'lucide-react';

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

  // Sync when prop changes
  useEffect(() => {
    if (value) {
      setInputValue(`${value.name} (${value.code})`);
    } else if (!isOpen) {
      setInputValue('');
    }
  }, [value, isOpen]);

  // Debounced station search
  useEffect(() => {
    if (!isOpen || inputValue.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    // Don't search if the input matches already selected station
    if (value && inputValue === `${value.name} (${value.code})`) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const query = inputValue.replace(/\([A-Z0-9]+\)/, '').trim();
        const res = await fetch(`/api/stations/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSuggestions(json.data);
        }
      } catch (err) {
        console.error('Station search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

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
    onChange(stn);
    setInputValue(`${stn.name} (${stn.code})`);
    setIsOpen(false);
    setSuggestions([]);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
        {label}
      </label>
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
            setInputValue(e.target.value);
            setIsOpen(true);
            if (value && e.target.value !== `${value.name} (${value.code})`) {
              onChange(null);
            }
          }}
          className="w-full pl-9 pr-8 py-2.5 rounded-xl glass-input text-sm placeholder-slate-500 font-medium"
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl glass-panel border border-cyan-500/20 shadow-2xl divide-y divide-white/5">
          {suggestions.map((stn) => (
            <button
              key={stn.code}
              type="button"
              onClick={() => handleSelect(stn)}
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
          ))}
        </div>
      )}
    </div>
  );
};
