import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useGetDashboardQuery, useGetBookmarksQuery } from '../app/api';
import { Bookmark, Star, Tag, ExternalLink, Brain, Zap, ArrowRight, TrendingUp } from 'lucide-react';

// ── Cluster colors ────────────────────────────
const CLUSTER_TAG_MAP = {
  frontend:  { tags: ['react','vue','angular','html','css','tailwind','jsx','frontend','typescript'], color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  backend:   { tags: ['nodejs','express','api','graphql','backend','python','django'], color: '#3b82f6', bg: 'rgba(37,99,235,0.15)' },
  devops:    { tags: ['docker','kubernetes','deployment','devops','aws','containers'], color: '#10b981', bg: 'rgba(5,150,105,0.15)' },
  database:  { tags: ['mongodb','postgresql','mysql','redis','database','sql'], color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  security:  { tags: ['auth','jwt','oauth','security','authentication'], color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  ai:        { tags: ['ai','ml','machine learning','neural','nlp','pytorch'], color: '#ec4899', bg: 'rgba(236,72,153,0.15)' },
};

function getTagStyle(tag) {
  const t = tag.toLowerCase();
  for (const [, { tags, color, bg }] of Object.entries(CLUSTER_TAG_MAP)) {
    if (tags.includes(t)) return { color, bg, border: `${color}50` };
  }
  return { color: '#a78bfa', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)' };
}

function StatCard({ icon: Icon, label, value, color, subtitle }) {
  return (
    <div className="glass p-6 fade-in glass-hover">
      <div className="flex items-center justify-between mb-3">
        <p className="text-slate-400 text-sm font-medium">{label}</p>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}22`, border: `1px solid ${color}33` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <p className="font-display text-3xl font-bold" style={{ color }}>{value}</p>
      {subtitle && <p className="text-slate-600 text-xs mt-1">{subtitle}</p>}
    </div>
  );
}

function SkeletonCard() {
  return <div className="glass p-6 h-28 skeleton" />;
}

export default function Dashboard() {
  const user = useSelector(s => s.auth.user);
  const { data, isLoading } = useGetDashboardQuery();
  const { data: allBookmarks } = useGetBookmarksQuery('');

  // Compute domain distribution
  const domainStats = React.useMemo(() => {
    const map = {};
    (allBookmarks || []).forEach(b => {
      try {
        const host = new URL(b.url).hostname.replace(/^www\./, '');
        const parts = host.split('.');
        const domain = parts.slice(-2).join('.');
        map[domain] = (map[domain] || 0) + 1;
      } catch {}
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [allBookmarks]);

  // AI tag insights
  const tagInsights = React.useMemo(() => {
    const clusterTotals = {};
    (allBookmarks || []).forEach(b => {
      b.tags?.forEach(t => {
        const tl = t.toLowerCase();
        for (const [cluster, { tags }] of Object.entries(CLUSTER_TAG_MAP)) {
          if (tags.includes(tl)) {
            clusterTotals[cluster] = (clusterTotals[cluster] || 0) + 1;
          }
        }
      });
    });
    return Object.entries(clusterTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [allBookmarks]);

  return (
    <div className="space-y-8 fade-in">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-3xl font-bold gradient-text">
          Welcome back, {user?.username}
        </h1>
        <p className="text-slate-400 mt-1 flex items-center gap-2">
          <Brain size={14} className="text-violet-400" />
          AI-powered knowledge management
        </p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={Bookmark} label="Total Bookmarks" value={data?.total || 0}
            color="#8b5cf6" subtitle="Across all topics" />
          <StatCard icon={Star} label="Favorites" value={data?.favorites || 0}
            color="#f59e0b" subtitle="Starred resources" />
          <StatCard icon={Tag} label="Unique Tags" value={data?.topTags?.length || 0}
            color="#3b82f6" subtitle="AI-generated" />
        </div>
      )}

      {/* AI Insights bar */}
      {tagInsights.length > 0 && (
        <div className="glass p-4 fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} className="text-violet-400" />
            <h3 className="text-sm font-semibold text-slate-300">AI Knowledge Profile</h3>
            <span className="ml-auto ai-badge"><Brain size={9} /> Auto-detected</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {tagInsights.map(([cluster, count]) => {
              const info = CLUSTER_TAG_MAP[cluster];
              return (
                <div key={cluster} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: info.bg, border: `1px solid ${info.color}33` }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: info.color }} />
                  <span className="text-sm font-medium capitalize" style={{ color: info.color }}>{cluster}</span>
                  <span className="text-xs" style={{ color: `${info.color}99` }}>{count} tags</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent bookmarks */}
        <div className="glass p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-bold text-slate-200 flex items-center gap-2">
              <Bookmark size={16} className="text-violet-400" /> Recent Bookmarks
            </h2>
            <Link to="/bookmarks" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="space-y-2">
            {data?.recent?.length ? data.recent.map(b => (
              <div key={b._id} className="flex items-start justify-between p-3 rounded-xl group transition-colors hover:bg-white/[0.03]">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-slate-200 text-sm font-medium truncate leading-snug">{b.title}</p>
                  <p className="text-slate-600 text-xs truncate mt-0.5">{b.url}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {b.tags?.slice(0, 4).map(t => {
                      const style = getTagStyle(t);
                      return (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
                          {t}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <a href={b.url} target="_blank" rel="noopener noreferrer"
                  className="flex-shrink-0 p-1.5 rounded-lg text-slate-600 hover:text-violet-400 opacity-0 group-hover:opacity-100 transition-all">
                  <ExternalLink size={13} />
                </a>
              </div>
            )) : (
              <div className="text-center py-8">
                <Brain size={28} className="text-violet-500/30 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No bookmarks yet.</p>
                <Link to="/bookmarks" className="text-violet-400 text-sm hover:underline mt-1 inline-block">
                  Add your first bookmark →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right column: tags + domains */}
        <div className="space-y-4">
          {/* Top tags */}
          <div className="glass p-5">
            <h2 className="font-display text-base font-bold text-slate-200 mb-3 flex items-center gap-2">
              <Tag size={15} className="text-blue-400" /> Top Tags
            </h2>
            {data?.topTags?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {data.topTags.map(({ tag, count }) => {
                  const style = getTagStyle(tag);
                  return (
                    <div key={tag} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                      style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                      <span className="text-xs font-medium" style={{ color: style.color }}>{tag}</span>
                      <span className="text-xs font-bold" style={{ color: `${style.color}99` }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Tags appear as you add bookmarks.</p>
            )}
          </div>

          {/* Top domains */}
          {domainStats.length > 0 && (
            <div className="glass p-5">
              <h2 className="font-display text-base font-bold text-slate-200 mb-3 flex items-center gap-2">
                <TrendingUp size={15} className="text-emerald-400" /> Top Sources
              </h2>
              <div className="space-y-2">
                {domainStats.map(([domain, count]) => (
                  <div key={domain} className="flex items-center justify-between">
                    <span className="text-slate-300 text-xs truncate">{domain}</span>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <div className="h-1.5 rounded-full bg-violet-500/30 overflow-hidden" style={{ width: 40 }}>
                        <div className="h-full rounded-full bg-violet-500"
                          style={{ width: `${Math.min(100, (count / (domainStats[0]?.[1] || 1)) * 100)}%` }} />
                      </div>
                      <span className="text-slate-500 text-xs w-4 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="glass p-5">
            <h2 className="font-display text-base font-bold text-slate-200 mb-3">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { to: '/bookmarks', label: 'Add bookmark', icon: Bookmark, color: '#8b5cf6' },
                { to: '/graph', label: 'View graph', icon: ArrowRight, color: '#3b82f6' },
                { to: '/spaces', label: 'Collaborate', icon: Zap, color: '#10b981' },
              ].map(({ to, label, icon: Icon, color }) => (
                <Link key={to} to={to}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-white/[0.04] group">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}22` }}>
                    <Icon size={13} style={{ color }} />
                  </div>
                  <span className="text-slate-300 text-sm group-hover:text-white transition-colors">{label}</span>
                  <ArrowRight size={11} className="ml-auto text-slate-600 group-hover:text-slate-400 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
