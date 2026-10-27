'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Calendar,
  Filter,
  X,
  Download,
  Eye,
  RotateCcw,
  Check,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FacetedOption {
  label: string;
  value: string;
  count?: number;
}

export interface FacetConfig {
  key: string;
  title: string;
  options: FacetedOption[];
  multiSelect?: boolean;
}

export interface PresetTab {
  id: string;
  label: string;
  count?: number;
}

export interface ColumnItem {
  id: string;
  label: string;
  isVisible: boolean;
}

interface SharedTableFilterBarProps {
  searchPlaceholder?: string;
  presetTabs?: PresetTab[];
  activePresetTab?: string;
  onPresetTabChange?: (tabId: string) => void;
  facets?: FacetConfig[];
  columns?: ColumnItem[];
  onToggleColumn?: (columnId: string) => void;
  onExportCSV?: () => void;
  onResetFilters?: () => void;
  extraActions?: React.ReactNode;
  showDateRange?: boolean;
}

export function SharedTableFilterBar({
  searchPlaceholder = 'Search clients, mobile, notes...',
  presetTabs,
  activePresetTab,
  onPresetTabChange,
  facets = [],
  columns = [],
  onToggleColumn,
  onExportCSV,
  onResetFilters,
  extraActions,
  showDateRange = true,
}: SharedTableFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Local search query for immediate typing, debounced to URL
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '');
  const [openFacetKey, setOpenFacetKey] = useState<string | null>(null);
  const [openColumnsMenu, setOpenColumnsMenu] = useState(false);
  const [openDateMenu, setOpenDateMenu] = useState(false);

  // Sync state when URL changes externally
  useEffect(() => {
    setSearchValue(searchParams.get('q') || '');
  }, [searchParams]);

  // Debounce search update to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQ = searchParams.get('q') || '';
      if (searchValue.trim() !== currentQ) {
        updateQueryParam('q', searchValue.trim());
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  // Helper to push URL query updates
  const updateQueryParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  // Helper for multi-select facet toggle
  const toggleFacetValue = (facetKey: string, val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const existing = params.get(facetKey);
    let values = existing ? existing.split(',').filter(Boolean) : [];

    if (values.includes(val)) {
      values = values.filter((v) => v !== val);
    } else {
      values.push(val);
    }

    if (values.length > 0) {
      params.set(facetKey, values.join(','));
    } else {
      params.delete(facetKey);
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  // Check if facet value is selected
  const isFacetValueSelected = (facetKey: string, val: string) => {
    const existing = searchParams.get(facetKey);
    if (!existing) return false;
    return existing.split(',').includes(val);
  };

  // Count active filters
  const dateParam = searchParams.get('dateRange');
  let activeFilterCount = 0;
  if (searchParams.get('q')) activeFilterCount++;
  if (dateParam && dateParam !== 'all') activeFilterCount++;
  facets.forEach((f) => {
    const val = searchParams.get(f.key);
    if (val) activeFilterCount += val.split(',').length;
  });

  const handleResetAll = () => {
    setSearchValue('');
    if (onResetFilters) {
      onResetFilters();
    }
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  };

  const activeDatePreset = searchParams.get('dateRange') || 'all';

  return (
    <div className="space-y-3 mb-4">
      {/* Top Bar: Preset Tabs + Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Preset Tabs */}
        {presetTabs && presetTabs.length > 0 && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto text-xs font-medium">
            {presetTabs.map((tab) => {
              const isActive = activePresetTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onPresetTabChange?.(tab.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-md transition-all whitespace-nowrap flex items-center gap-1.5',
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={cn(
                        'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                        isActive
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Extra Action Buttons */}
        {extraActions && <div className="flex items-center gap-2 self-end sm:self-auto">{extraActions}</div>}
      </div>

      {/* Main Filter Bar */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm flex flex-wrap items-center gap-2.5">
        {/* 1. Global Search Input */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          {searchValue && (
            <button
              onClick={() => {
                setSearchValue('');
                updateQueryParam('q', null);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 2. Date Range Picker Dropdown */}
        {showDateRange && (
          <div className="relative">
            <button
              onClick={() => {
                setOpenDateMenu(!openDateMenu);
                setOpenFacetKey(null);
                setOpenColumnsMenu(false);
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                activeDatePreset !== 'all'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              )}
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {activeDatePreset === 'all'
                  ? 'Date Range'
                  : activeDatePreset === 'today'
                  ? 'Today'
                  : activeDatePreset === 'thisWeek'
                  ? 'This Week'
                  : activeDatePreset === 'thisMonth'
                  ? 'This Month'
                  : 'Custom Range'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {openDateMenu && (
              <div className="absolute left-0 mt-2 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 p-1.5 space-y-1">
                {[
                  { id: 'all', label: 'All Dates' },
                  { id: 'today', label: 'Today' },
                  { id: 'thisWeek', label: 'This Week' },
                  { id: 'thisMonth', label: 'This Month' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      updateQueryParam('dateRange', item.id === 'all' ? null : item.id);
                      setOpenDateMenu(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors text-left',
                      activeDatePreset === item.id
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <span>{item.label}</span>
                    {activeDatePreset === item.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. Faceted Filter Dropdowns */}
        {facets.map((facet) => {
          const selectedVals = (searchParams.get(facet.key) || '').split(',').filter(Boolean);
          const hasSelection = selectedVals.length > 0;
          const isOpen = openFacetKey === facet.key;

          return (
            <div key={facet.key} className="relative">
              <button
                onClick={() => {
                  setOpenFacetKey(isOpen ? null : facet.key);
                  setOpenDateMenu(false);
                  setOpenColumnsMenu(false);
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                  hasSelection
                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>{facet.title}</span>
                {hasSelection && (
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {selectedVals.length}
                  </span>
                )}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isOpen && (
                <div className="absolute left-0 mt-2 w-56 max-h-72 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 p-2 space-y-1">
                  <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                    <span>{facet.title}</span>
                    {hasSelection && (
                      <button
                        onClick={() => updateQueryParam(facet.key, null)}
                        className="text-blue-600 hover:underline capitalize font-normal"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {facet.options.map((opt) => {
                    const isSelected = isFacetValueSelected(facet.key, opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => toggleFacetValue(facet.key, opt.value)}
                        className={cn(
                          'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors text-left',
                          isSelected
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 font-semibold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div
                            className={cn(
                              'w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px]',
                              isSelected
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-slate-300 dark:border-slate-700'
                            )}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </div>
                          <span className="truncate">{opt.label}</span>
                        </div>
                        {opt.count !== undefined && (
                          <span className="text-[10px] text-slate-400">{opt.count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* 4. Active Filters Reset */}
        {activeFilterCount > 0 && (
          <button
            onClick={handleResetAll}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors font-medium"
            title="Reset All Filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ({activeFilterCount})</span>
          </button>
        )}

        {/* Right side controls */}
        <div className="ml-auto flex items-center gap-2">
          {/* Column Visibility Selector */}
          {columns.length > 0 && (
            <div className="relative">
              <button
                onClick={() => {
                  setOpenColumnsMenu(!openColumnsMenu);
                  setOpenFacetKey(null);
                  setOpenDateMenu(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                title="Toggle Columns"
              >
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden md:inline">Columns</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {openColumnsMenu && (
                <div className="absolute right-0 mt-2 w-52 max-h-80 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 p-2 space-y-1">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1 pb-1 mb-1 border-b border-slate-100 dark:border-slate-800">
                    Visible Columns
                  </div>
                  {columns.map((col) => (
                    <button
                      key={col.id}
                      onClick={() => onToggleColumn?.(col.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors text-left',
                        col.isVisible
                          ? 'text-slate-900 dark:text-slate-100 font-medium'
                          : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                      )}
                    >
                      <span>{col.label}</span>
                      <div
                        className={cn(
                          'w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px]',
                          col.isVisible
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 dark:border-slate-700'
                        )}
                      >
                        {col.isVisible && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Export CSV CTA */}
          {onExportCSV && (
            <button
              onClick={onExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm active:scale-95"
              title="Export filtered data to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
