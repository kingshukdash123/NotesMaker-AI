import { CheckSquare, Tag, LayoutDashboard, FileText, List } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import MarkdownRenderer from './common/MarkdownRenderer';

export default function SummaryOverview({ result }) {
  const { isDark } = useTheme();

  if (!result || !result.lecture_outline) {
    return (
      <div className={`max-w-3xl mx-auto text-center py-16 px-6 rounded-2xl border my-8 space-y-4 shadow-sm ${
        isDark ? 'bg-black border-zinc-800' : 'bg-white border-orange-200/90'
      }`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto border ${
          isDark ? 'bg-zinc-950 border-zinc-900 text-orange-400' : 'bg-orange-100 border-orange-300 text-orange-600'
        }`}>
          <LayoutDashboard className="w-6 h-6" />
        </div>
        <h3 className={`text-base font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
          No lecture summary available
        </h3>
        <p className={`text-xs max-w-md mx-auto leading-relaxed ${isDark ? 'text-zinc-400' : 'text-orange-800'}`}>
          Please enter a YouTube video URL and generate study notes first, or load the demo test notes to preview this dashboard.
        </p>
      </div>
    );
  }

  const outline = result.lecture_outline;

  return (
    <div className="max-w-6xl mx-auto my-2 sm:my-6 space-y-4 sm:space-y-6 px-1 sm:px-0">
      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
        
        {/* Left Side: Overview and Topic Hierarchy */}
        <div className="space-y-4 sm:space-y-6 xl:col-span-2">
          {/* Lecture Abstract / Executive Summary */}
          <div className={`rounded-2xl p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4 border ${
            isDark ? 'border-zinc-800 bg-black' : 'border-orange-200/90 bg-white'
          }`}>
            <div className={`flex items-center gap-2 pb-3 border-b ${
              isDark ? 'border-zinc-900 text-orange-400' : 'border-orange-100 text-orange-600 font-bold'
            }`}>
              <FileText className="w-4 h-4" />
              <h3 className="text-sm font-bold">Lecture Abstract & Summary</h3>
            </div>
            <div className={`text-xs sm:text-sm leading-relaxed font-normal ${
              isDark ? 'text-zinc-300' : 'text-orange-950'
            }`}>
              <MarkdownRenderer content={outline.overview || 'No abstract summary available.'} />
            </div>
          </div>

          {/* Curriculum Syllabus & Topic Hierarchy */}
          {outline.topic_hierarchy && outline.topic_hierarchy.length > 0 && (
            <div className={`rounded-2xl p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4 border ${
              isDark ? 'border-zinc-800 bg-black' : 'border-orange-200/90 bg-white'
            }`}>
              <div className={`flex items-center gap-2 pb-3 border-b ${
                isDark ? 'border-zinc-900 text-orange-400' : 'border-orange-100 text-orange-600 font-bold'
              }`}>
                <List className="w-4 h-4" />
                <h3 className="text-sm font-bold">Curriculum Topic Hierarchy</h3>
              </div>
              
              <div className="space-y-4 sm:space-y-5 pt-2">
                {outline.topic_hierarchy.map((topic, index) => (
                  <div key={index} className="flex gap-3 sm:gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full text-[10px] font-mono font-bold flex items-center justify-center border shrink-0 ${
                        isDark 
                          ? 'bg-zinc-950 border-zinc-900 text-orange-400' 
                          : 'bg-orange-100 border-orange-300 text-orange-700'
                      }`}>
                        {index + 1}
                      </div>
                      {index < outline.topic_hierarchy.length - 1 && (
                        <div className={`w-0.5 flex-1 my-1.5 ${
                          isDark ? 'bg-zinc-900' : 'bg-orange-200/80'
                        }`}></div>
                      )}
                    </div>
                    
                    <div className="flex-1 pb-2 space-y-2">
                      <div className={`text-xs sm:text-sm font-bold leading-snug ${
                        isDark ? 'text-zinc-100' : 'text-orange-950'
                      }`}>
                        <MarkdownRenderer content={topic.title} />
                      </div>
                      {topic.bullets && topic.bullets.length > 0 && (
                        <ul className={`list-disc pl-4 space-y-1.5 text-xs ${
                          isDark ? 'text-zinc-300' : 'text-orange-950'
                        }`}>
                          {topic.bullets.map((bullet, bIdx) => (
                            <li key={bIdx} className="leading-relaxed">
                              <MarkdownRenderer content={bullet} />
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

        {/* Right Side: Learning Objectives and Concepts */}
        <div className="space-y-6">
          {/* Learning Objectives */}
          {outline.learning_objectives && outline.learning_objectives.length > 0 && (
            <div className={`rounded-2xl p-6 shadow-sm space-y-4 border ${
              isDark ? 'border-zinc-800 bg-black' : 'border-orange-200/90 bg-white'
            }`}>
              <div className={`flex items-center gap-2 pb-3 border-b ${
                isDark ? 'border-zinc-900 text-orange-400' : 'border-orange-100 text-orange-600 font-bold'
              }`}>
                <CheckSquare className="w-4 h-4" />
                <h3 className="text-sm font-bold">Learning Objectives</h3>
              </div>
              
              <div className="space-y-3 pt-1">
                {outline.learning_objectives.map((objective, index) => (
                  <div key={index} className="flex items-start gap-2.5">
                    <input 
                      type="checkbox" 
                      readOnly 
                      checked 
                      className={`mt-0.5 accent-orange-500 cursor-default shrink-0 w-3.5 h-3.5 rounded ${
                        isDark ? 'border-zinc-900 bg-zinc-950' : 'border-orange-300 bg-orange-50'
                      }`}
                    />
                    <span className={`text-xs leading-relaxed font-medium ${
                      isDark ? 'text-zinc-300' : 'text-orange-950'
                    }`}>
                      {objective}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Concepts */}
          {outline.concepts && outline.concepts.length > 0 && (
            <div className={`rounded-2xl p-6 shadow-sm space-y-4 border ${
              isDark ? 'border-zinc-800 bg-black' : 'border-orange-200/90 bg-white'
            }`}>
              <div className={`flex items-center gap-2 pb-3 border-b ${
                isDark ? 'border-zinc-900 text-orange-400' : 'border-orange-100 text-orange-600 font-bold'
              }`}>
                <Tag className="w-4 h-4" />
                <h3 className="text-sm font-bold">Core Synthesized Concepts</h3>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-1">
                {outline.concepts.map((concept, index) => (
                  <span 
                    key={index}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border shadow-xs select-none ${
                      isDark 
                        ? 'bg-orange-950/20 text-orange-300 border-orange-900/40' 
                        : 'bg-orange-100 border-orange-300 text-orange-900'
                    }`}
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
