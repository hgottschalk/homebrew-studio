'use client';

import React from 'react';
import { BrewMetrics, BjcpStyleItem } from '@/types/brewing';
import { sgToPlato } from '@/lib/calculations';
import {
  Droplets,
  Flame,
  Sparkles,
  Scale,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface SrmGlassPreviewProps {
  metrics: BrewMetrics;
  bjcpStyle?: BjcpStyleItem;
}

function RangeStatusBadge({
  value,
  min,
  max,
  format = (v) => String(v),
}: {
  value: number;
  min: number;
  max: number;
  format?: (val: number) => string;
}) {
  const inRange = value >= min && value <= max;
  const label = inRange
    ? 'In Style'
    : value < min
      ? 'Below Style'
      : 'Above Style';
  return (
    <div className="flex items-center justify-between gap-2 text-[11px] mt-1.5 pt-1.5 border-t border-slate-800/80">
      <span className="text-slate-300 truncate">
        BJCP: {format(min)}–{format(max)}
      </span>
      <span
        className={`shrink-0 whitespace-nowrap font-semibold px-1.5 py-0.5 rounded ${
          inRange
            ? 'bg-emerald-500/15 text-emerald-300'
            : 'bg-amber-500/15 text-amber-300'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export function SrmGlassPreview({ metrics, bjcpStyle }: SrmGlassPreviewProps) {
  const ogPlato = sgToPlato(metrics.og).toFixed(1);
  const fgPlato = sgToPlato(metrics.fg).toFixed(1);

  const getBuGuDescription = (ratio: number) => {
    if (ratio < 0.35) return 'Sweet / Malt-Dominant';
    if (ratio < 0.55) return 'Balanced Malt';
    if (ratio < 0.75) return 'Balanced Hoppy';
    if (ratio < 1.0) return 'Assertively Hoppy';
    return 'Extra Bitter / West Coast';
  };

  return (
    <section
      aria-label="Live Recipe Vital Statistics and SRM Color Preview"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"
    >
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Visual Pint Glass */}
        <div className="relative flex flex-col items-center shrink-0">
          <div
            role="img"
            aria-label={`Beer color preview: ${metrics.srm} SRM (${metrics.ebc} EBC)`}
            className="relative w-24 h-36 rounded-b-2xl rounded-t-md border-2 border-white/25 overflow-hidden shadow-inner flex flex-col"
          >
            {/* Foam Head */}
            <div className="h-6 w-full bg-gradient-to-b from-amber-50 via-amber-50/95 to-amber-100/90 border-b border-amber-200/50 relative z-10" />
            {/* Liquid Beer Body */}
            <div
              className="flex-1 w-full transition-colors duration-500 relative"
              style={{
                backgroundColor: metrics.srmHex,
              }}
            >
              {/* Glass highlight */}
              <div className="absolute inset-y-0 left-2 w-2 bg-gradient-to-r from-white/25 to-transparent rounded-full my-2" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/10" />
            </div>
          </div>
          <div className="mt-2 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              {metrics.srm} SRM / {metrics.ebc} EBC
            </span>
            {bjcpStyle && (
              <div className="text-[11px] text-slate-300">
                Target: {bjcpStyle.srmMin}–{bjcpStyle.srmMax} SRM
              </div>
            )}
          </div>
        </div>

        {/* Live Vital Statistics Grid */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3.5 w-full">
          {/* ABV */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>Est. ABV</span>
                <Flame className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {metrics.abv.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-300 mt-1">
                Alt (High-Grav): {metrics.abvAlternate.toFixed(1)}%
              </div>
            </div>
            {bjcpStyle && (
              <RangeStatusBadge
                value={metrics.abv}
                min={bjcpStyle.abvMin}
                max={bjcpStyle.abvMax}
                format={(v) => `${v.toFixed(1)}%`}
              />
            )}
          </div>

          {/* Original Gravity */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>Original Gravity</span>
                <Droplets
                  className="w-4 h-4 text-[#3B82F6]"
                  aria-hidden="true"
                />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {metrics.og.toFixed(3)}
              </div>
              <div className="text-[11px] text-slate-300 mt-1">
                {ogPlato} °P • Pre-Boil {metrics.preBoilGravity.toFixed(3)}
              </div>
            </div>
            {bjcpStyle && (
              <RangeStatusBadge
                value={metrics.og}
                min={bjcpStyle.ogMin}
                max={bjcpStyle.ogMax}
                format={(v) => v.toFixed(3)}
              />
            )}
          </div>

          {/* Final Gravity */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>Final Gravity</span>
                <Scale className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {metrics.fg.toFixed(3)}
              </div>
              <div className="text-[11px] text-slate-300 mt-1">
                {fgPlato} °P • Apparent Atten.{' '}
                {metrics.og > 1
                  ? Math.round(
                      ((metrics.og - metrics.fg) / (metrics.og - 1)) * 100
                    )
                  : 0}
                %
              </div>
            </div>
            {bjcpStyle && (
              <RangeStatusBadge
                value={metrics.fg}
                min={bjcpStyle.fgMin}
                max={bjcpStyle.fgMax}
                format={(v) => v.toFixed(3)}
              />
            )}
          </div>

          {/* Bitterness IBU */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>Bitterness</span>
                <Sparkles
                  className="w-4 h-4 text-emerald-400"
                  aria-hidden="true"
                />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {metrics.ibu.toFixed(1)}{' '}
                <span className="text-sm font-normal text-slate-300">IBU</span>
              </div>
              <div className="text-[11px] text-slate-300 mt-1">
                BU:GU {metrics.buGuRatio} (
                {getBuGuDescription(metrics.buGuRatio)})
              </div>
            </div>
            {bjcpStyle && (
              <RangeStatusBadge
                value={metrics.ibu}
                min={bjcpStyle.ibuMin}
                max={bjcpStyle.ibuMax}
                format={(v) => `${v}`}
              />
            )}
          </div>

          {/* Diastatic Power & Mash pH */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 col-span-2 sm:col-span-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>Mash pH &amp; Enzymes</span>
                {metrics.hasSufficientDiastaticPower ? (
                  <CheckCircle2
                    className="w-4 h-4 text-emerald-400"
                    aria-hidden="true"
                  />
                ) : (
                  <AlertTriangle
                    className="w-4 h-4 text-amber-400"
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {metrics.estimatedMashPh.toFixed(2)}{' '}
                <span className="text-sm font-normal text-slate-300">pH</span>
              </div>
              <div className="text-[11px] mt-1">
                {metrics.hasSufficientDiastaticPower ? (
                  <span className="text-emerald-300">
                    {metrics.averageDiastaticPower} °Lintner (Self-Converting)
                  </span>
                ) : (
                  <span className="text-amber-300">
                    Low Enzymes ({metrics.averageDiastaticPower} °L &lt; 35 °L)
                  </span>
                )}
              </div>
            </div>
            {bjcpStyle && (
              <RangeStatusBadge
                value={metrics.srm}
                min={bjcpStyle.srmMin}
                max={bjcpStyle.srmMax}
                format={(v) => `${v}`}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
