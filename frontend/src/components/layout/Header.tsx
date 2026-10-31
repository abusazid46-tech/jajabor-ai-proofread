'use client';

import React from 'react';
import { ShieldCheck, Cpu, Languages, Sparkles } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({
  title = 'Quality Assurance Platform',
  subtitle = 'Assam Information, Printing & Stationery Department',
}: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs">
      <div>
        <h2 className="text-lg font-semibold text-slate-800 tracking-tight leading-tight">
          {title}
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center space-x-3">
        {/* Language Badge */}
        <div className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 rounded-full border border-slate-200 text-xs text-slate-700">
          <Languages className="w-3.5 h-3.5 text-teal-600" />
          <span className="font-medium">Assamese / English</span>
        </div>

        {/* Engine status indicator */}
        <div className="flex items-center space-x-1.5 px-3 py-1 bg-teal-50 border border-teal-200 rounded-full text-xs text-teal-800">
          <Cpu className="w-3.5 h-3.5 text-teal-600" />
          <span className="font-medium">Deterministic Rule Engine</span>
        </div>

        {/* Demo Indicator */}
        <div className="flex items-center space-x-1 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-800 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
          <span>Demo Mode</span>
        </div>
      </div>
    </header>
  );
}
