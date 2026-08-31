import { useState } from 'react';
import { Quote } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const QUOTES = [
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", author: "Brian Herbert" },
  { text: "Spoon feeding in the long run teaches us nothing but the shape of the spoon.", author: "E.M. Forster" },
  { text: "You don't understand anything until you learn it more than one way.", author: "Marvin Minsky" },
  { text: "Real learning comes when the competitive spirit has ceased.", author: "Jiddu Krishnamurti" }
];

export default function MotivationalQuote() {
  const { isDark } = useTheme();
  const [dailyQuote] = useState(() => {
    const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % QUOTES.length;
    return QUOTES[dayIndex];
  });

  return (
    <div className={`glass-panel border rounded-2xl p-5 relative overflow-hidden flex items-start gap-4 transition duration-300 ${
      isDark ? 'border-zinc-800 hover:border-zinc-700/80' : 'border-orange-200/90 hover:border-orange-300 shadow-sm'
    }`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
        isDark 
          ? 'bg-orange-950/20 border-orange-900/30 text-orange-500' 
          : 'bg-orange-100 border-orange-300 text-orange-600 shadow-xs'
      }`}>
        <Quote className={`w-4 h-4 rotate-180 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
      </div>
      <div className="space-y-1 min-w-0">
        <p className={`text-xs sm:text-sm font-medium italic leading-relaxed pr-6 ${
          isDark ? 'text-zinc-200' : 'text-orange-950'
        }`}>
          "{dailyQuote.text}"
        </p>
        <span className={`text-[10px] font-bold tracking-wider block uppercase ${
          isDark ? 'text-zinc-500' : 'text-orange-700'
        }`}>
          — {dailyQuote.author}
        </span>
      </div>
    </div>
  );
}
