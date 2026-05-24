import React, { useMemo, useState, useCallback } from 'react';
import ReactFlow, {
  Background, Controls, MiniMap, useNodesState, useEdgesState,
  Handle, Position, MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useGetGraphQuery } from '../app/api';
import { GitBranch, Brain, Layers, ZoomIn, Info, X } from 'lucide-react';

// ── Cluster palette ───────────────────────────
const CLUSTER_COLORS = {
  frontend:  { bg: 'rgba(139,92,246,0.35)', border: 'rgba(139,92,246,0.8)', glow: '#8b5cf6', label: 'Frontend',  dot: '#8b5cf6' },
  backend:   { bg: 'rgba(37,99,235,0.35)',  border: 'rgba(37,99,235,0.8)',  glow: '#3b82f6', label: 'Backend',   dot: '#3b82f6' },
  devops:    { bg: 'rgba(5,150,105,0.35)',  border: 'rgba(5,150,105,0.8)',  glow: '#10b981', label: 'DevOps',    dot: '#10b981' },
  database:  { bg: 'rgba(245,158,11,0.35)', border: 'rgba(245,158,11,0.8)', glow: '#f59e0b', label: 'Database',  dot: '#f59e0b' },
  security:  { bg: 'rgba(239,68,68,0.35)',  border: 'rgba(239,68,68,0.8)',  glow: '#ef4444', label: 'Security',  dot: '#ef4444' },
  ai:        { bg: 'rgba(236,72,153,0.35)', border: 'rgba(236,72,153,0.8)', glow: '#ec4899', label: 'AI / ML',   dot: '#ec4899' },
  general:   { bg: 'rgba(100,116,139,0.3)', border: 'rgba(100,116,139,0.6)', glow: '#64748b', label: 'General', dot: '#64748b' },
};

// ── Custom node component ─────────────────────
function BookmarkNode({ data, selected }) {
  const colors = CLUSTER_COLORS[data.cluster] || CLUSTER_COLORS.general;
  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: colors.glow, width: 6, height: 6, border: 'none' }} />
      <div
        style={{
          background: selected ? colors.border : colors.bg,
          border: `1.5px solid ${selected ? '#fff' : colors.border}`,
          borderRadius: 12,
          padding: '10px 14px',
          width: 190,
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          boxShadow: selected ? `0 0 24px ${colors.glow}` : `0 0 14px ${colors.glow}44`,
          transition: 'all 0.2s',
          cursor: 'pointer',
          fontFamily: 'Syne, sans-serif',
          position: 'relative',
        }}
      >
        {/* Cluster dot */}
        <div style={{
          position: 'absolute', top: 6, right: 6,
          width: 7, height: 7, borderRadius: '50%',
          background: colors.glow, opacity: 0.8,
        }} />

        {/* Title */}
        <p style={{
          fontSize: 11, color: '#f1f5f9', fontWeight: 600,
          lineHeight: 1.35, wordBreak: 'break-word',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
          marginBottom: 6,
        }}>{data.label}</p>

        {/* Tags preview */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
          {data.tags?.slice(0, 3).map(t => (
            <span key={t} style={{
              background: 'rgba(255,255,255,0.08)', color: '#cbd5e1',
              borderRadius: 10, padding: '1px 6px', fontSize: 9,
              border: '1px solid rgba(255,255,255,0.12)',
            }}>{t}</span>
          ))}
        </div>

        {/* Cluster label */}
        <p style={{ fontSize: 9, color: colors.glow, marginTop: 5, opacity: 0.8, letterSpacing: '0.05em' }}>
          {data.clusterLabel?.toUpperCase()}
        </p>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: colors.glow, width: 6, height: 6, border: 'none' }} />
    </>
  );
}

const nodeTypes = { bookmarkNode: BookmarkNode };

// ── Tooltip panel ─────────────────────────────
function NodeTooltip({ node, onClose }) {
  if (!node) return null;
  const colors = CLUSTER_COLORS[node.data.cluster] || CLUSTER_COLORS.general;
  return (
    <div className="absolute top-4 right-4 z-20 glass p-4 w-64 fade-in-fast"
      style={{ border: `1px solid ${colors.border}` }}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-slate-100 font-semibold text-sm leading-snug flex-1 pr-2">{node.data.label}</p>
        <button onClick={onClose} className="text-slate-500 hover:text-white flex-shrink-0 mt-0.5">
          <X size={13} />
        </button>
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {node.data.tags?.map(t => (
          <span key={t} className="tag" style={{ fontSize: '0.68rem' }}>{t}</span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors.glow }} />
        <span style={{ color: colors.glow, fontSize: 11 }}>{colors.label}</span>
      </div>
    </div>
  );
}

// ── Main graph page ───────────────────────────
export default function Graph() {
  const { data, isLoading } = useGetGraphQuery();
  const [selectedNode, setSelectedNode] = useState(null);
  const [showLegend, setShowLegend] = useState(true);

  const { nodes: initNodes, edges: initEdges } = useMemo(() => {
    if (!data?.nodes?.length) return { nodes: [], edges: [] };

    const nodes = data.nodes.map(n => ({
      id: String(n.id),
      type: 'bookmarkNode',
      data: n.data,
      position: n.position,
    }));

    const edges = data.edges.map(e => ({
      ...e,
      id: String(e.id),
      source: String(e.source),
      target: String(e.target),
      markerEnd: e.animated ? { type: MarkerType.ArrowClosed, color: 'rgba(139,92,246,0.5)', width: 12, height: 12 } : undefined,
    }));

    return { nodes, edges };
  }, [data]);

  const [nodes, , onNodesChange] = useNodesState(initNodes);
  const [edges, , onEdgesChange] = useEdgesState(initEdges);

  const handleNodeClick = useCallback((_, node) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
  }, []);

  // Cluster stats
  const clusterCounts = useMemo(() => {
    const counts = {};
    (data?.nodes || []).forEach(n => {
      const c = n.data?.cluster || 'general';
      counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }, [data]);

  const isolatedCount = useMemo(() => {
    if (!data) return 0;
    const connected = new Set();
    data.edges?.forEach(e => { connected.add(String(e.source)); connected.add(String(e.target)); });
    return (data.nodes?.length || 0) - connected.size;
  }, [data]);

  return (
    <div className="space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold gradient-text flex items-center gap-3">
            <GitBranch size={24} /> Knowledge Graph
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            AI-clustered semantic map of your bookmarks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowLegend(v => !v)}
            className="btn-ghost text-sm flex items-center gap-1.5">
            <Layers size={13} /> {showLegend ? 'Hide' : 'Show'} Legend
          </button>
        </div>
      </div>

      {/* Main graph canvas */}
      <div className="glass overflow-hidden relative" style={{ height: '65vh' }}>
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center pulse-glow"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                <Brain size={26} color="white" />
              </div>
              <p className="text-slate-300 font-medium">Building knowledge graph...</p>
              <p className="text-slate-500 text-sm">Clustering by technology domain</p>
            </div>
          </div>
        ) : nodes.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-3">
              <GitBranch size={48} className="text-violet-500/40 mx-auto" />
              <p className="text-slate-300 font-medium">No graph data yet</p>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">
                Add bookmarks with overlapping topics — the AI will find connections and cluster them by domain.
              </p>
            </div>
          </div>
        ) : (
          <>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.2}
              maxZoom={2.5}
              defaultEdgeOptions={{ type: 'smoothstep' }}
            >
              <Background
                variant="dots"
                color="rgba(139,92,246,0.15)"
                gap={20}
                size={1}
              />
              <Controls
                showInteractive={false}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 4,
                  background: 'rgba(10,12,24,0.95)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  borderRadius: 8, padding: 4,
                }}
              />
              <MiniMap
                style={{ background: 'rgba(8,11,20,0.95)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8 }}
                nodeColor={n => {
                  const c = n.data?.cluster || 'general';
                  return CLUSTER_COLORS[c]?.glow || '#64748b';
                }}
                maskColor="rgba(8,11,20,0.7)"
              />
            </ReactFlow>

            {/* Node tooltip panel */}
            {selectedNode && (
              <NodeTooltip node={selectedNode} onClose={() => setSelectedNode(null)} />
            )}
          </>
        )}
      </div>

      {/* Stats + legend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stats */}
        <div className="glass p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Info size={12} /> Graph Statistics
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Nodes', value: data?.total || 0, color: '#8b5cf6' },
              { label: 'Connections', value: data?.edges?.length || 0, color: '#3b82f6' },
              { label: 'Isolated', value: isolatedCount, color: '#64748b' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold font-display" style={{ color }}>{value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="glass p-4 fade-in">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Layers size={12} /> Clusters
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CLUSTER_COLORS).filter(([k]) => k !== 'general' || (clusterCounts['general'] || 0) > 0).map(([key, cfg]) => {
                const count = clusterCounts[key] || 0;
                if (count === 0) return null;
                return (
                  <div key={key} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.glow }} />
                    <span style={{ color: '#f1f5f9' }}>{cfg.label}</span>
                    <span style={{ color: cfg.glow, fontWeight: 700 }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Tip */}
      <div className="glass p-3 flex items-center gap-3 text-xs text-slate-500">
        <ZoomIn size={13} className="text-violet-400 flex-shrink-0" />
        <span>Click a node to inspect · scroll to zoom · drag to pan · connected nodes share common tags</span>
      </div>
    </div>
  );
}
