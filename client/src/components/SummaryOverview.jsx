import React from 'react';
import { Clock, User, Award, BookOpen, CheckSquare, Tag, LayoutDashboard, AlertCircle, FileText, List } from 'lucide-react';

export default function SummaryOverview({ result, metadata }) {
  if (!result || !result.lecture_outline) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16 px-6 rounded-xl bg-zinc-950 border border-zinc-800 my-8 space-y-4 shadow-md">
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-850 text-zinc-400 flex items-center justify-center mx-auto shadow-inner">
          <LayoutDashboard className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-zinc-200">
          No lecture summary available
        </h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
          Please enter a YouTube video URL and generate study notes first, or load the demo test notes to preview this dashboard.
        </p>
      </div>
    );
  }

  const outline = result.lecture_outline;
  
  // Helper to format duration
  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}h ${m}m ${s}s`;
    }
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-6xl mx-auto my-6 space-y-6 px-2 sm:px-0">
      
      {/* 1. Header Overview Card */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col md:flex-row gap-6 shadow-xl">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-bl from-white/[0.03] to-transparent rounded-full blur-[40px] pointer-events-none"></div>
        
        {/* Left: Thumbnail Preview */}
        {metadata?.thumbnail && (
          <div className="w-full md:w-56 shrink-0 aspect-video md:aspect-auto md:h-32 rounded-xl overflow-hidden border border-zinc-800 shadow-md">
            <img 
              src={metadata.thumbnail} 
              alt={metadata.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        {/* Right: Core Meta Details */}
        <div className="flex-1 space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-400">
                {outline.lecture_type || 'Lecture Summary'}
              </span>
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                outline.difficulty?.toLowerCase() === 'advanced'
                  ? 'bg-rose-950/20 border-rose-800/50 text-rose-400'
                  : outline.difficulty?.toLowerCase() === 'intermediate'
                  ? 'bg-amber-950/20 border-amber-800/50 text-amber-400'
                  : 'bg-emerald-950/20 border-emerald-800/50 text-emerald-400'
              }`}>
                {outline.difficulty || 'General'}
              </span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-black text-zinc-50 leading-tight">
              {outline.title || metadata?.title || 'Untitled Lecture Summary'}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-zinc-900 text-zinc-400">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-zinc-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-zinc-500">Instructor/Author</p>
                <p className="text-xs font-semibold text-zinc-300 truncate">{metadata?.author || metadata?.channel || 'Unknown'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-500">Duration</p>
                <p className="text-xs font-semibold text-zinc-300">{formatDuration(metadata?.length)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-zinc-500 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-500">Difficulty</p>
                <p className="text-xs font-semibold text-zinc-300">{outline.difficulty || 'Intermediate'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-zinc-500 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-500">Source Type</p>
                <p className="text-xs font-semibold text-zinc-300">Video Transcript</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Overview and Topic Hierarchy (Takes 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Lecture Abstract / Executive Summary */}
          <div className="border border-zinc-800 bg-zinc-950 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-900">
              <FileText className="w-4 h-4 text-zinc-400" />
              <h3 className="text-sm font-bold text-zinc-200">Lecture Abstract & Summary</h3>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal whitespace-pre-wrap">
              {outline.overview || 'No abstract summary available.'}
            </p>
          </div>

          {/* Curriculum Syllabus & Topic Hierarchy */}
          {outline.topic_hierarchy && outline.topic_hierarchy.length > 0 && (
            <div className="border border-zinc-800 bg-zinc-950 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-900">
                <List className="w-4 h-4 text-zinc-400" />
                <h3 className="text-sm font-bold text-zinc-200">Curriculum Topic Hierarchy</h3>
              </div>
              
              <div className="space-y-4 pt-2">
                {outline.topic_hierarchy.map((topic, index) => (
                  <div key={index} className="flex gap-4 group">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold flex items-center justify-center text-zinc-400 group-hover:border-zinc-700 transition">
                        {index + 1}
                      </div>
                      {index < outline.topic_hierarchy.length - 1 && (
                        <div className="w-0.5 flex-1 bg-zinc-900 my-1 group-hover:bg-zinc-850 transition"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 pb-3 space-y-2">
                      <h4 className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-zinc-50 transition">
                        {topic.title}
                      </h4>
                      {topic.bullets && topic.bullets.length > 0 && (
                        <ul className="list-disc pl-4 space-y-1.5 text-xs text-zinc-400">
                          {topic.bullets.map((bullet, bIdx) => (
                            <li key={bIdx} className="leading-relaxed hover:text-zinc-300 transition">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Learning Objectives and Concepts (Takes 1 column) */}
        <div className="space-y-6">
          
          {/* Learning Objectives */}
          {outline.learning_objectives && outline.learning_objectives.length > 0 && (
            <div className="border border-zinc-800 bg-zinc-950 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-900">
                <CheckSquare className="w-4 h-4 text-zinc-400" />
                <h3 className="text-sm font-bold text-zinc-200">Learning Objectives</h3>
              </div>
              
              <div className="space-y-3 pt-1">
                {outline.learning_objectives.map((objective, index) => (
                  <div key={index} className="flex items-start gap-2.5 group">
                    <input 
                      type="checkbox" 
                      readOnly 
                      checked 
                      className="mt-0.5 accent-zinc-200 cursor-default shrink-0 w-3.5 h-3.5 rounded border-zinc-800 bg-zinc-900"
                    />
                    <span className="text-xs text-zinc-300 leading-relaxed font-medium hover:text-zinc-200 transition">
                      {objective}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Concepts Pills */}
          {outline.concepts && outline.concepts.length > 0 && (
            <div className="border border-zinc-800 bg-zinc-950 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-900">
                <Tag className="w-4 h-4 text-zinc-400" />
                <h3 className="text-sm font-bold text-zinc-200">Core Synthesized Concepts</h3>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-1">
                {outline.concepts.map((concept, index) => (
                  <span 
                    key={index}
                    className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-300 border border-zinc-800 transition cursor-default shadow-sm"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}
          
        </div>
      </div>
      
    </div>
  );
}
