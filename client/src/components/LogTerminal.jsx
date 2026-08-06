import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Search, Trash2, Copy, Check, ChevronDown, Lock, Unlock } from 'lucide-react';

export default function LogTerminal({ logs = [], isOpen, onClose, onClear }) {
  const [filter, setFilter] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, isOpen]);

  const filteredLogs = logs.filter((line) =>
    line.toLowerCase().includes(filter.toLowerCase())
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLogStyle = (line) => {
    if (line.includes('ERROR') || line.includes('FAILED') || line.includes('Exception')) {
      return 'text-red-400 bg-red-950/20';
    }
    if (line.includes('WARNING')) {
      return 'text-orange-400';
    }
    if (line.includes('COMPLETED') || line.includes('completed') || line.includes('success')) {
      return 'text-orange-400 font-semibold';
    }
    if (line.includes('[SYSTEM]')) {
      return 'text-cyan-400 italic';
    }
    if (line.includes('Task')) {
      return 'text-zinc-300';
    }
    return 'text-zinc-400';
  };

  return (
    <div className={`bg-black border-zinc-800 shadow-2xl flex flex-col transition-all duration-300 overflow-hidden
      /* Phone & Tablet: Fixed to lower panel */
      fixed bottom-0 left-0 right-0 z-30 w-full h-[25vh] border-t rounded-t-xl rounded-b-none
      /* Windows / Desktop: Fixed to right side in position */
      lg:fixed lg:top-[76px] lg:right-6 lg:bottom-auto lg:left-auto lg:z-30 lg:w-[420px] xl:w-[480px] lg:h-[calc(100vh-150px)] lg:rounded-xl lg:border
      /* Open/Close states */
      ${isOpen 
        ? 'translate-x-0 opacity-100 pointer-events-auto visible' 
        : 'translate-x-full opacity-0 pointer-events-none invisible lg:translate-x-12'
      }`}>
      {/* Terminal Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-950 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-700"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-700"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-700"></div>
          </div>
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs font-mono font-bold text-zinc-200">
            Console
            {/* ({logs.length}) */}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Search Filter */}
          <div className="relative flex items-center">
            <Search className="w-3 h-3 text-zinc-500 absolute left-2 pointer-events-none" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter logs..."
              className="bg-zinc-900 text-[11px] text-zinc-200 pl-6 pr-2 py-0.5 rounded border border-zinc-800 focus:outline-none focus:border-zinc-500 w-22 sm:w-32"
            />
          </div>

          {/* Auto-scroll Toggle */}
          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1 rounded text-xs transition ${autoScroll ? 'bg-zinc-800 text-zinc-200 border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            title={autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
          >
            {autoScroll ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>

          {/* Copy Logs */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded transition"
            title="Copy Logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-orange-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Clear Logs */}
          <button
            type="button"
            onClick={onClear}
            className="p-1 text-zinc-400 hover:text-orange-500 hover:bg-zinc-900 rounded transition"
            title="Clear Terminal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Close / Minimize */}
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded transition"
            title="Close Terminal"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal Output Body */}
      <div className="p-3.5 overflow-y-auto font-mono text-[11px] space-y-1 flex-1 bg-black text-zinc-300">
        {filteredLogs.length === 0 ? (
          <div className="text-zinc-600 italic py-8 text-center">
            No log messages yet. Initiate note generation to stream logs.
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div
              key={index}
              className={`leading-relaxed px-1 py-0.5 rounded ${getLogStyle(log)}`}
            >
              {log}
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
