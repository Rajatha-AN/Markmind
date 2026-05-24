import React, { useState, useCallback, useRef } from 'react';
import {
  useGetBookmarksQuery, useCreateBookmarkMutation,
  useUpdateBookmarkMutation, useDeleteBookmarkMutation,
} from '../app/api';
import {
  Plus, Search, Star, Trash2, ExternalLink, X, Sparkles,
  Tag, Brain, Loader2, CheckCircle, Filter, SortAsc,
  BookOpen, Zap, ChevronDown, RotateCcw,
} from 'lucide-react';

// ── Cluster color config (mirrors backend) ────
const CLUSTER_TAG_MAP = {
  frontend:  ['react','vue','angular','svelte','nextjs','html','css','tailwind','jsx','frontend','ui','ux','typescript','redux','hooks','webpack','vite'],
  backend:   ['nodejs','express','api','graphql','rest','server','backend','python','django','flask','java','microservices'],
  devops:    ['docker','kubernetes','deployment','devops','ci/cd','nginx','aws','gcp','azure','vercel','netlify','containers'],
  database:  ['mongodb','postgresql','mysql','sqlite','redis','database','sql','nosql','mongoose','firebase'],
  security:  ['auth','jwt','oauth','security','authentication','authorization','bcrypt','token','session','password'],
  ai:        ['ai','ml','machine learning','neural','nlp','pytorch','tensorflow','sklearn'],
};

function detectTagCluster(tag) {
  const t = tag.toLowerCase();
  for (const [cluster, tags] of Object.entries(CLUSTER_TAG_MAP)) {
    if (tags.includes(t)) return cluster;
  }
  return null;
}

function TagChip({ tag, onClick }) {
  const cluster = detectTagCluster(tag);
  const cls = cluster ? `tag tag-${cluster}` : 'tag';
  return (
    <span className={cls} onClick={onClick} style={onClick ? { cursor: 'pointer' } : {}}>
      {tag}
    </span>
  );
}

// ── Skeleton ─────────────────────────────────
function CardSkeleton() {
  return (
    <div className="glass p-5 space-y-3">
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-5/6" />
      <div className="flex gap-2 mt-2">
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-12 rounded-full" />
        <div className="skeleton h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}

// ── Add bookmark modal ────────────────────────
function AddModal({ onClose }) {
  const [form, setForm] = useState({ title: '', url: '', description: '', tags: '' });
  const [create, { isLoading, isSuccess }] = useCreateBookmarkMutation();
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!form.title.trim() || !form.url.trim()) {
      setLocalError('Title and URL are required');
      return;
    }
    try {
      await create({
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      }).unwrap();
      setTimeout(onClose, 400);
    } catch (err) {
      setLocalError(err?.data?.message || 'Failed to save bookmark');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div className="glass w-full max-w-md p-6 fade-in">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-lg gradient-text flex items-center gap-2">
              <Brain size={18} /> Add Bookmark
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">AI will auto-generate tags & summary</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Title *</label>
            <input className="input-field" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="React JWT Authentication Guide" required />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">URL *</label>
            <input className="input-field" type="url" value={form.url}
              onChange={e => setForm({ ...form, url: e.target.value })}
              placeholder="https://example.com/article" required />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">
              Description <span className="text-slate-600">(optional — improves AI tags)</span>
            </label>
            <textarea className="input-field" rows={2} value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="What is this resource about?" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block flex items-center gap-1.5">
              Tags
              <span className="ai-badge"><Sparkles size={9} /> Auto-generated if empty</span>
            </label>
            <input className="input-field" value={form.tags}
              onChange={e => setForm({ ...form, tags: e.target.value })}
              placeholder="react, tutorial, web (or leave blank)" />
          </div>

          {localError && (
            <p className="text-red-400 text-sm flex items-center gap-1">
              <X size={13} /> {localError}
            </p>
          )}

          {isSuccess && (
            <p className="text-emerald-400 text-sm flex items-center gap-1">
              <CheckCircle size={13} /> Saved with AI tags!
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={isLoading}>
              {isLoading
                ? <><Loader2 size={14} className="spin" /> Processing...</>
                : <><Brain size={14} /> Save + Auto-Tag</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit modal ────────────────────────────────
function EditModal({ bookmark, onClose }) {
  const [form, setForm] = useState({
    title: bookmark.title,
    url: bookmark.url,
    description: bookmark.description || '',
    tags: bookmark.tags?.join(', ') || '',
  });
  const [update, { isLoading }] = useUpdateBookmarkMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await update({
      id: bookmark._id,
      ...form,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }).unwrap();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div className="glass w-full max-w-md p-6 fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg gradient-text">Edit Bookmark</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[['title','Title',true],['url','URL',true],['description','Description',false]].map(([key, label, req]) => (
            <div key={key}>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">{label}</label>
              <input className="input-field" value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                required={req} />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Tags (comma separated)</label>
            <input className="input-field" value={form.tags}
              onChange={e => setForm({ ...form, tags: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Bookmark card ─────────────────────────────
function BookmarkCard({ bookmark, searchQuery, onTagClick }) {
  const [update] = useUpdateBookmarkMutation();
  const [remove] = useDeleteBookmarkMutation();
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    await remove(bookmark._id);
  };

  // Highlight matching text
  const highlight = (text) => {
    if (!searchQuery || !text) return text;
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} className="search-highlight">{part}</mark>
        : part
    );
  };

  const domain = (() => {
    try { return new URL(bookmark.url).hostname.replace(/^www\./, ''); }
    catch { return ''; }
  })();

  return (
    <>
      <div className="glass p-5 fade-in bookmark-card group flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <a href={bookmark.url} target="_blank" rel="noopener noreferrer"
              className="text-slate-100 font-semibold text-sm hover:text-violet-300 transition-colors flex items-start gap-1 group/link leading-snug">
              <span className="flex-1">{highlight(bookmark.title)}</span>
              <ExternalLink size={11} className="flex-shrink-0 mt-0.5 opacity-0 group-hover/link:opacity-100 transition-opacity text-violet-400" />
            </a>
            {domain && <p className="text-slate-600 text-xs mt-0.5 truncate">{domain}</p>}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={() => update({ id: bookmark._id, favorite: !bookmark.favorite })}
              className={`p-1.5 rounded-lg transition-colors ${bookmark.favorite ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400'}`}
              title={bookmark.favorite ? 'Unfavorite' : 'Favorite'}>
              <Star size={13} fill={bookmark.favorite ? 'currentColor' : 'none'} />
            </button>
            <button onClick={() => setShowEdit(true)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-violet-400 transition-colors" title="Edit">
              <BookOpen size={13} />
            </button>
            <button onClick={handleDelete}
              className={`p-1.5 rounded-lg transition-colors ${confirmDelete ? 'text-red-400 bg-red-400/10' : 'text-slate-600 hover:text-red-400'}`}
              title={confirmDelete ? 'Click again to confirm' : 'Delete'}
              onBlur={() => setConfirmDelete(false)}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* AI Summary */}
        {bookmark.aiSummary && (
          <p className="text-slate-400 text-xs leading-relaxed mb-3 line-clamp-2 flex-1">
            {highlight(bookmark.aiSummary)}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2 gap-2">
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {bookmark.tags?.slice(0, 5).map(t => (
              <TagChip key={t} tag={t} onClick={() => onTagClick?.(t)} />
            ))}
            {bookmark.tags?.length > 5 && (
              <span className="tag text-slate-500">+{bookmark.tags.length - 5}</span>
            )}
          </div>
          <span className="ai-badge flex-shrink-0">
            <Brain size={9} /> AI
          </span>
        </div>
      </div>

      {showEdit && <EditModal bookmark={bookmark} onClose={() => setShowEdit(false)} />}
    </>
  );
}

// ── Main page ─────────────────────────────────
export default function Bookmarks() {
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [activeTag, setActiveTag] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const inputRef = useRef(null);

  const { data: bookmarks, isLoading, isFetching } = useGetBookmarksQuery(search);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(q.trim());
    setActiveTag('');
  };

  const handleTagClick = useCallback((tag) => {
    setQ(tag);
    setSearch(tag);
    setActiveTag(tag);
    inputRef.current?.focus();
  }, []);

  const handleClear = () => {
    setQ('');
    setSearch('');
    setActiveTag('');
  };

  // Client-side sort (search results already relevance-sorted from server)
  const sorted = React.useMemo(() => {
    if (!bookmarks) return [];
    if (search) return bookmarks; // keep relevance order
    const clone = [...bookmarks];
    if (sortBy === 'newest') return clone.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortBy === 'oldest') return clone.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sortBy === 'az') return clone.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === 'favorites') return clone.sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
    return clone;
  }, [bookmarks, sortBy, search]);

  const totalTags = React.useMemo(() => {
    const map = {};
    (bookmarks || []).forEach(b => b.tags?.forEach(t => { map[t] = (map[t] || 0) + 1; }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [bookmarks]);

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold gradient-text flex items-center gap-2">
            <BookOpen size={22} /> Bookmarks
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isLoading ? '...' : `${bookmarks?.length || 0} saved`}
            {search && <span className="text-violet-400 ml-1">· semantic results for "{search}"</span>}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Add Bookmark
        </button>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            ref={inputRef}
            className="input-field pl-9 pr-3"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search — 'auth' finds jwt, login, security..."
          />
          {isFetching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-400 spin" />}
        </div>
        <button type="submit" className="btn-primary flex items-center gap-1.5">
          <Zap size={13} /> Search
        </button>
        {search && (
          <button type="button" onClick={handleClear} className="btn-ghost flex items-center gap-1">
            <RotateCcw size={13} /> Clear
          </button>
        )}
      </form>

      {/* Top tags quick-filter */}
      {totalTags.length > 0 && !search && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-500 flex items-center gap-1"><Filter size={11} /> Filter:</span>
          {totalTags.map(([tag, count]) => (
            <button key={tag} onClick={() => handleTagClick(tag)}
              className={`tag transition-all ${activeTag === tag ? 'ring-1 ring-violet-400' : ''}`}>
              {tag}
              <span className="ml-1 text-slate-500 text-xs">{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Sort control */}
      {!search && (bookmarks?.length || 0) > 1 && (
        <div className="flex items-center gap-2">
          <SortAsc size={13} className="text-slate-500" />
          <span className="text-xs text-slate-500">Sort:</span>
          {[['newest','Newest'],['oldest','Oldest'],['az','A → Z'],['favorites','Favorites']].map(([val, label]) => (
            <button key={val} onClick={() => setSortBy(val)}
              className={`text-xs px-3 py-1 rounded-full transition-all ${sortBy === val
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                : 'text-slate-500 hover:text-slate-300'}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : sorted.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(b => (
            <BookmarkCard key={b._id} bookmark={b} searchQuery={search} onTagClick={handleTagClick} />
          ))}
        </div>
      ) : (
        <div className="glass p-16 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
            {search ? <Search size={28} className="text-violet-400" /> : <Brain size={28} className="text-violet-400" />}
          </div>
          <h3 className="text-slate-200 font-semibold mb-2">
            {search ? `No results for "${search}"` : 'No bookmarks yet'}
          </h3>
          <p className="text-slate-400 text-sm">
            {search
              ? 'Try a broader term — search understands synonyms like "auth" → jwt, login, security'
              : 'Add your first bookmark and let AI tag it automatically!'}
          </p>
          {!search && (
            <button onClick={() => setShowAdd(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Brain size={14} /> Add AI-powered Bookmark
            </button>
          )}
        </div>
      )}

      {showAdd && <AddModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
