'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  UploadCloud,
  CheckSquare,
  BookOpen,
  BarChart3,
  Settings,
  ShieldAlert,
  Building2,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'New Proofreading', href: '/upload', icon: UploadCloud },
    { name: 'Review Workspace', href: '/workspace', icon: CheckSquare },
    { name: 'Terminology', href: '/terminology', icon: BookOpen },
    { name: 'Reports & History', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            য
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-tight leading-tight">
              Jajabor AI Proofread
            </h1>
            <p className="text-xs text-teal-400 font-medium">NESFIC 2026 &bull; Stream 1</p>
          </div>
        </div>
        <div className="mt-3 px-2.5 py-1.5 bg-slate-800/80 rounded border border-slate-700/60 text-[11px] text-slate-300 flex items-center space-x-1.5">
          <Building2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span className="truncate">Directorate of Printing &amp; Stationery</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-350 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 mr-3 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Demo Role / Security Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center space-x-2 text-xs text-slate-400 mb-2">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-medium text-slate-300">Prototype Environment</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Logged in as: <strong className="text-slate-200">Proofreader (Demo)</strong>
        </p>
        <p className="text-[10px] text-slate-500 mt-1">
          Challenge ID: NESFIC-D-38
        </p>
      </div>
    </aside>
  );
}
