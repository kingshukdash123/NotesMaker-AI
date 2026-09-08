import { CheckCircle2 } from 'lucide-react';

export default function FeatureRow({ children, isDark }) {
  return (
    <li className={`flex items-start gap-2.5 text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
      <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${isDark ? 'text-orange-400' : 'text-orange-500'}`} />
      <span>{children}</span>
    </li>
  );
}
