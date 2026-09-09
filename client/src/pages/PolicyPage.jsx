import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldCheck,
  FileText,
  AlertTriangle,
  Cookie,
  CreditCard,
  Search,
  X,
  ExternalLink,
  Clock,
  BookOpen,
  Mail,
  ArrowLeft,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getLegalPolicy } from '../services/firebase/legalPoliciesService';
import {
  LEGAL_POLICY_SLUGS,
  LEGAL_POLICY_LABELS,
  LEGAL_POLICY_ICONS,
  GRIEVANCE_EMAIL,
  COMPANY_NAME,
} from '../constants';
import DocSectionCard from '../components/common/DocSectionCard';
import StickyToc from '../components/common/StickyToc';
import TabPillSwitcher from '../components/common/TabPillSwitcher';
import DocPageHeader from '../components/common/DocPageHeader';

// ─── Icon Map ───────────────────────────────────────────────────────────────
const ICON_MAP = {
  ShieldCheck,
  FileText,
  AlertTriangle,
  Cookie,
  CreditCard,
};

// ─── Markdown-like body renderer (supports **bold**, bullet lines, table rows) ──
function PolicyBody({ body }) {
  if (!body) return null;

  const lines = body.split('\n');

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;

        // Table row: | col | col |
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
          const cells = line.split('|').filter((c) => c.trim() !== '');
          const isSeparator = cells.every((c) => /^[-:\s]+$/.test(c));
          if (isSeparator) return null;
          return (
            <div key={i} className="flex gap-0 text-xs">
              {cells.map((cell, ci) => (
                <div key={ci} className="flex-1 border border-current/10 px-3 py-1.5">
                  <InlineFormat text={cell.trim()} />
                </div>
              ))}
            </div>
          );
        }

        // Bullet point
        if (line.trim().startsWith('- ')) {
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
              <InlineFormat text={line.trim().slice(2)} />
            </div>
          );
        }

        // Numbered list: "1. "
        if (/^\d+\.\s/.test(line.trim())) {
          const num = line.trim().match(/^(\d+)\./)[1];
          return (
            <div key={i} className="flex gap-3 items-start">
              <span className="shrink-0 w-5 h-5 rounded-full bg-orange-500/15 text-orange-500 text-[10px] font-bold flex items-center justify-center mt-0.5">
                {num}
              </span>
              <InlineFormat text={line.trim().replace(/^\d+\.\s/, '')} />
            </div>
          );
        }

        return (
          <p key={i}>
            <InlineFormat text={line} />
          </p>
        );
      })}
    </div>
  );
}

// Inline bold (**text**) and code (`text`) formatting
function InlineFormat({ text }) {
  if (!text) return null;
  // Split by **...**
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold">{part}</strong>
        ) : (
          // Split by `...`
          part.split(/`(.+?)`/g).map((sub, si) =>
            si % 2 === 1 ? (
              <code key={si} className="font-mono text-xs bg-orange-500/10 text-orange-400 px-1 py-0.5 rounded">
                {sub}
              </code>
            ) : (
              <span key={si}>{sub}</span>
            )
          )
        )
      )}
    </>
  );
}

// ─── PolicyPage ──────────────────────────────────────────────────────────────
export default function PolicyPage({ slug: initialSlug = 'privacy' }) {
  const { isDark } = useTheme();
  const { setActiveSection } = useApp();
  const { currentUser } = useAuth();

  // Normalise slug — 'legal' defaults to 'privacy' tab
  const [activeSlug, setActiveSlug] = useState(
    initialSlug === 'legal' ? 'privacy' : (LEGAL_POLICY_SLUGS.includes(initialSlug) ? initialSlug : 'privacy')
  );
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionId, setActiveSectionId] = useState('');
  const contentRef = useRef(null);

  // Fetch policy from Firestore (or fallback)
  const fetchPolicy = useCallback(async (slug) => {
    setLoading(true);
    setSearchQuery('');
    setActiveSectionId('');
    try {
      const data = await getLegalPolicy(slug);
      setPolicy(data);
      if (data?.sections?.length > 0) {
        setActiveSectionId(data.sections[0].id);
      }
    } catch {
      setPolicy(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicy(activeSlug);
  }, [activeSlug, fetchPolicy]);

  // Sync initial slug prop changes (e.g. from router or browser navigation)
  useEffect(() => {
    const normalised = initialSlug === 'legal' ? 'privacy' : initialSlug;
    if (LEGAL_POLICY_SLUGS.includes(normalised) && normalised !== activeSlug) {
      setActiveSlug(normalised);
    }
    if (initialSlug === 'legal') {
      window.history.replaceState(null, '', '/privacy');
      setActiveSection('privacy');
    }
  }, [initialSlug, activeSlug, setActiveSection]);

  const handleTabChange = (slug) => {
    setActiveSlug(slug);
    setActiveSection(slug);
    const targetUrl = `/${slug}`;
    if (window.location.pathname !== targetUrl) {
      window.history.pushState(null, '', targetUrl);
    }
  };

  // ─── Filtered sections by search ────────────────────────────────────────
  const filteredSections = policy?.sections?.filter((sec) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      sec.heading.toLowerCase().includes(q) ||
      sec.body.toLowerCase().includes(q)
    );
  }) ?? [];

  // ─── Format effective date ───────────────────────────────────────────────
  const formatDate = (date) => {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  // ─── Colours ─────────────────────────────────────────────────────────────
  const bg = isDark ? 'bg-zinc-950' : 'bg-white';
  const cardBg = isDark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-xs';
  const textPrimary = isDark ? 'text-zinc-50' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const textMuted = isDark ? 'text-zinc-500' : 'text-zinc-500';
  const inputBg = isDark ? 'bg-zinc-900 border-zinc-800 placeholder-zinc-600' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-zinc-400';

  return (
    <div className={`flex-1 min-h-full overflow-y-auto custom-scrollbar ${bg}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6">

        {/* ── Page Header using Reusable DocPageHeader ── */}
        <DocPageHeader
          title="Legal Center"
          subtitle={`All ${COMPANY_NAME} legal documents, policies, and terms — always up to date.`}
          backAction={!currentUser && (
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                setActiveSection('dashboard');
                if (window.location.pathname !== '/') {
                  window.history.pushState(null, '', '/');
                }
              }}
              className={`inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer transition hover:text-orange-500 ${textMuted}`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </a>
          )}
        />

        {/* ── Tab Switcher using Reusable TabPillSwitcher ── */}
        <TabPillSwitcher
          tabs={LEGAL_POLICY_SLUGS.map((slug) => ({
            id: slug,
            label: LEGAL_POLICY_LABELS[slug],
            icon: ICON_MAP[LEGAL_POLICY_ICONS[slug]],
          }))}
          activeTab={activeSlug}
          onTabChange={handleTabChange}
        />

        {/* ── Effective Date & Search Row ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {policy?.effectiveDate && (
            <div className={`flex items-center gap-1.5 text-xs shrink-0 ${textMuted}`}>
              <Clock className="w-3.5 h-3.5" />
              <span>Effective {formatDate(policy.effectiveDate)}</span>
            </div>
          )}
          <div className="sm:ml-auto relative w-full sm:w-64">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${textMuted}`} />
            <input
              type="text"
              placeholder={`Search ${LEGAL_POLICY_LABELS[activeSlug]}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full border rounded-xl pl-8 pr-8 py-2 text-xs focus:outline-none focus:border-orange-500 transition ${inputBg} ${textPrimary}`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="btn-icon absolute right-2 top-1/2 -translate-y-1/2 !p-1 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Main Two-Column Layout ── */}
        <div className="flex gap-6 items-start">

          {/* Left: Sticky Table of Contents (Desktop only) */}
          <StickyToc
            sections={filteredSections.map((s) => ({ id: s.id, title: s.heading }))}
            activeSectionId={activeSectionId}
            onSelectSection={setActiveSectionId}
            title="Contents"
            isLoading={loading}
          />

          {/* Right: Policy Content */}
          <div ref={contentRef} className="flex-1 min-w-0 space-y-4">
            {loading ? (
              /* Skeleton loader */
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`rounded-xl border p-6 space-y-3 ${cardBg}`}>
                  <div className={`h-5 w-1/3 rounded animate-pulse ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`} />
                  <div className="space-y-2">
                    {[80, 95, 70, 88].map((w, j) => (
                      <div key={j} className={`h-3 rounded animate-pulse ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`} style={{ width: `${w}%` }} />
                    ))}
                  </div>
                </div>
              ))
            ) : filteredSections.length === 0 ? (
              <div className={`rounded-xl border p-10 text-center ${cardBg}`}>
                <BookOpen className={`w-8 h-8 mx-auto mb-3 ${textMuted}`} />
                <p className={`text-sm font-medium ${textSecondary}`}>
                  {searchQuery ? `No sections match "${searchQuery}"` : 'No content available.'}
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="btn-secondary mt-3 px-3 py-1.5 text-xs font-semibold cursor-pointer"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              filteredSections.map((sec) => (
                <DocSectionCard
                  key={sec.id}
                  id={sec.id}
                  title={sec.heading}
                  isActive={activeSectionId === sec.id}
                  onClick={() => setActiveSectionId(sec.id)}
                >
                  <div className={textSecondary}>
                    <PolicyBody body={sec.body} />
                  </div>
                </DocSectionCard>
              ))
            )}

            {/* ── Grievance & Contact Card ── */}
            {!loading && (
              <div className={`rounded-xl border p-6 space-y-3 mt-2 ${isDark
                  ? 'bg-orange-500/5 border-orange-500/20'
                  : 'bg-zinc-50 border-zinc-200'
                }`}>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-orange-500 shrink-0" />
                  <h3 className={`text-sm font-bold ${textPrimary}`}>Questions or Grievances?</h3>
                </div>
                <p className={`text-xs ${textSecondary}`}>
                  For policy-related questions, data requests, DMCA notices, or grievance redressal, our team typically responds within 30 days as required by applicable law.
                </p>
                <a
                  href={`mailto:${GRIEVANCE_EMAIL}`}
                  className="btn-secondary text-xs font-semibold px-3.5 py-2 inline-flex items-center gap-2 !rounded-xl"
                >
                  <span>{GRIEVANCE_EMAIL}</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </div>
            )}

            {/* Bottom spacer */}
            <div className="h-8" />
          </div>
        </div>
      </div>
    </div>
  );
}
