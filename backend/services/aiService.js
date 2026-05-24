'use strict';
/**
 * MarkMind Free AI Service
 * All intelligence is LOCAL — zero paid API calls.
 * Uses: natural (TF-IDF, tokenization, stemming), compromise (NLP), keyword extraction
 */

const natural = require('natural');

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// ─────────────────────────────────────────────
// STOP WORDS  (expanded)
// ─────────────────────────────────────────────
const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'by','from','up','about','into','through','during','is','are','was','were',
  'be','been','being','have','has','had','do','does','did','will','would',
  'could','should','may','might','must','can','this','that','these','those',
  'i','you','he','she','it','we','they','my','your','his','her','its','our',
  'what','which','who','how','when','where','why','all','both','each','more',
  'most','other','some','such','no','not','only','same','so','than','too',
  'very','just','as','if','then','because','while','although','after','before',
  'get','use','make','go','know','take','see','come','think','look','want',
  'give','find','tell','ask','seem','feel','try','leave','put','add','show',
  'here','there','also','now','new','old','good','great','best','top','free',
  'guide','tutorial','introduction','overview','using','based','part','like',
  'way','time','read','need','start','help','tips','learn','check','post',
  'article','blog','page','site','web','app','build','work','set','run',
  'create','list','full','simple','easy','quick','step','steps','world',
  'lets','lets','via','well','even','vs','vs.','am','vs',
]);

// ─────────────────────────────────────────────
// TECH SYNONYM MAP  (semantic expansion)
// ─────────────────────────────────────────────
const SYNONYM_MAP = {
  // Frontend
  'react': ['reactjs', 'react.js', 'frontend', 'jsx', 'hooks'],
  'reactjs': ['react', 'frontend'],
  'vue': ['vuejs', 'vue.js', 'frontend'],
  'angular': ['angularjs', 'frontend', 'typescript'],
  'frontend': ['react', 'vue', 'angular', 'ui', 'browser'],
  'html': ['markup', 'web', 'frontend'],
  'css': ['styling', 'styles', 'frontend'],
  'tailwind': ['css', 'styling', 'frontend'],
  'jsx': ['react', 'frontend'],
  'hooks': ['react', 'useState', 'useEffect'],

  // Backend
  'node': ['nodejs', 'node.js', 'backend', 'javascript'],
  'nodejs': ['node', 'backend', 'javascript'],
  'express': ['nodejs', 'backend', 'api'],
  'backend': ['node', 'server', 'api', 'express'],
  'server': ['backend', 'nodejs', 'api'],
  'rest': ['api', 'backend', 'http'],
  'graphql': ['api', 'query', 'schema'],
  'api': ['rest', 'backend', 'endpoint'],

  // Auth / Security
  'auth': ['authentication', 'jwt', 'login', 'security'],
  'authentication': ['auth', 'jwt', 'login', 'security'],
  'jwt': ['auth', 'token', 'security', 'authentication'],
  'oauth': ['auth', 'authentication', 'security'],
  'login': ['auth', 'authentication', 'security'],
  'security': ['auth', 'jwt', 'protection', 'https'],
  'password': ['security', 'auth', 'bcrypt'],
  'token': ['jwt', 'auth', 'security'],
  'session': ['auth', 'cookie', 'security'],

  // DevOps / Infra
  'docker': ['container', 'containers', 'devops', 'deployment'],
  'containers': ['docker', 'kubernetes', 'devops'],
  'kubernetes': ['k8s', 'containers', 'devops', 'orchestration'],
  'deployment': ['devops', 'ci/cd', 'production'],
  'devops': ['deployment', 'docker', 'ci/cd', 'pipeline'],
  'aws': ['cloud', 'devops', 'deployment'],
  'nginx': ['server', 'proxy', 'deployment'],

  // Database
  'mongodb': ['database', 'nosql', 'db', 'mongo'],
  'mongo': ['mongodb', 'database', 'nosql'],
  'sql': ['database', 'mysql', 'postgresql'],
  'postgresql': ['sql', 'database', 'postgres'],
  'mysql': ['sql', 'database'],
  'database': ['mongodb', 'sql', 'db'],
  'redis': ['cache', 'database', 'nosql'],

  // JS ecosystem
  'javascript': ['js', 'es6', 'nodejs', 'frontend'],
  'typescript': ['ts', 'javascript', 'types'],
  'python': ['django', 'flask', 'ml', 'data'],
  'npm': ['package', 'javascript', 'nodejs'],
  'webpack': ['bundler', 'javascript', 'frontend'],
  'vite': ['bundler', 'frontend', 'build'],

  // ML / AI
  'machine learning': ['ml', 'ai', 'data science', 'neural'],
  'ml': ['machine learning', 'ai', 'neural networks'],
  'ai': ['machine learning', 'ml', 'deep learning'],
  'neural': ['ml', 'ai', 'deep learning'],
  'nlp': ['ai', 'ml', 'language'],

  // Concepts
  'testing': ['test', 'jest', 'unit test', 'quality'],
  'performance': ['optimization', 'speed', 'caching'],
  'optimization': ['performance', 'caching', 'speed'],
  'caching': ['redis', 'performance', 'optimization'],
  'microservices': ['architecture', 'docker', 'api'],
  'architecture': ['design', 'patterns', 'microservices'],
};

// ─────────────────────────────────────────────
// URL  → meaningful keywords
// ─────────────────────────────────────────────
const URL_TECH_MAP = {
  'github.com': ['github', 'opensource', 'code'],
  'stackoverflow.com': ['stackoverflow', 'programming', 'qa'],
  'medium.com': ['article', 'blog'],
  'dev.to': ['devto', 'article', 'developer'],
  'npmjs.com': ['npm', 'package', 'javascript'],
  'reactjs.org': ['react', 'frontend', 'javascript'],
  'react.dev': ['react', 'frontend', 'javascript'],
  'nodejs.org': ['nodejs', 'backend', 'javascript'],
  'vuejs.org': ['vue', 'frontend', 'javascript'],
  'angular.io': ['angular', 'frontend', 'typescript'],
  'mongodb.com': ['mongodb', 'database', 'nosql'],
  'docker.com': ['docker', 'containers', 'devops'],
  'aws.amazon.com': ['aws', 'cloud', 'devops'],
  'vercel.com': ['deployment', 'frontend', 'hosting'],
  'netlify.com': ['deployment', 'frontend', 'hosting'],
  'tailwindcss.com': ['tailwind', 'css', 'frontend'],
  'typescriptlang.org': ['typescript', 'javascript', 'types'],
  'kubernetes.io': ['kubernetes', 'devops', 'containers'],
  'redis.io': ['redis', 'cache', 'database'],
  'postgresql.org': ['postgresql', 'database', 'sql'],
  'graphql.org': ['graphql', 'api', 'query'],
  'expressjs.com': ['express', 'nodejs', 'backend'],
  'next.js.org': ['nextjs', 'react', 'frontend'],
  'nextjs.org': ['nextjs', 'react', 'frontend'],
  'docs.python.org': ['python', 'backend', 'programming'],
  'pytorch.org': ['pytorch', 'ml', 'ai'],
  'tensorflow.org': ['tensorflow', 'ml', 'ai'],
  'freecodecamp.org': ['tutorial', 'javascript', 'web'],
};

// ─────────────────────────────────────────────
// TECH KEYWORD BOOSTS  (domain signals)
// ─────────────────────────────────────────────
const TECH_SIGNALS = [
  // Frontend
  'react','vue','angular','svelte','nextjs','nuxt','gatsby','astro',
  'html','css','tailwind','sass','webpack','vite','babel','typescript',
  'jsx','tsx','redux','zustand','hooks','component','spa','pwa',
  // Backend
  'nodejs','express','fastapi','django','flask','rails','spring','laravel',
  'graphql','rest','api','grpc','websocket','microservices',
  // Auth
  'jwt','oauth','session','authentication','authorization','bcrypt','passport',
  // DB
  'mongodb','postgresql','mysql','sqlite','redis','elasticsearch','firebase',
  'prisma','mongoose','sequelize','typeorm','nosql','sql','database',
  // DevOps
  'docker','kubernetes','nginx','apache','terraform','ansible','jenkins',
  'github','gitlab','ci/cd','deployment','aws','gcp','azure','vercel','netlify',
  // Languages
  'javascript','python','rust','golang','java','php','ruby','kotlin','swift',
  // Concepts
  'algorithm','datastructure','testing','performance','security','caching',
  'architecture','design','pattern','async','parallel','concurrent',
  // AI/ML
  'machine learning','neural','ai','nlp','pytorch','tensorflow','sklearn',
];

const TECH_SET = new Set(TECH_SIGNALS);

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function cleanToken(word) {
  return word.toLowerCase().replace(/[^a-z0-9.#+/-]/g, '').trim();
}

function extractFromUrl(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    const domain = u.hostname.replace(/^www\./, '');
    const domainTags = URL_TECH_MAP[domain] || [];

    // Pull path segments
    const pathWords = u.pathname
      .split(/[/\-_.~]/)
      .map(cleanToken)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w));

    return [...new Set([...domainTags, ...pathWords])];
  } catch {
    return [];
  }
}

function tokenizeText(text) {
  if (!text) return [];
  // Also split on camelCase and dashes
  const expanded = text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_.]/g, ' ');
  return tokenizer.tokenize(expanded)
    .map(cleanToken)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

// ─────────────────────────────────────────────
// SMART AUTO-TAGGER
// ─────────────────────────────────────────────
function generateTags(title = '', url = '', description = '') {
  const allWords = [];

  // Weight: title = 3x, description = 2x, url = 1x
  const titleTokens = tokenizeText(title);
  const descTokens = tokenizeText(description);
  const urlTokens = extractFromUrl(url);

  allWords.push(...titleTokens, ...titleTokens, ...titleTokens);
  allWords.push(...descTokens, ...descTokens);
  allWords.push(...urlTokens);

  // TF-IDF on combined corpus
  const tfidf = new natural.TfIdf();
  const combined = `${title} ${description} ${url}`;
  tfidf.addDocument(combined.toLowerCase());

  // Build frequency map
  const freq = {};
  for (const w of allWords) {
    if (!STOP_WORDS.has(w) && w.length > 1) {
      freq[w] = (freq[w] || 0) + 1;
    }
  }

  // Score each unique word
  const scored = Object.entries(freq).map(([word, count]) => {
    let score = count;

    // Boost tech keywords heavily
    if (TECH_SET.has(word)) score += 8;

    // Boost words found in title
    if (titleTokens.includes(word)) score += 5;

    // TF-IDF boost
    let tfidfScore = 0;
    tfidf.tfidfs(word, (i, measure) => { tfidfScore = measure; });
    score += tfidfScore * 2;

    // Penalize very short words unless they're known tech (js, ts, ai, ml)
    if (word.length <= 2 && !['js', 'ts', 'ai', 'ml', 'ui', 'ux', 'db'].includes(word)) {
      score -= 3;
    }

    return { word, score };
  });

  // Sort by score, take top 6
  const sorted = scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  let tags = sorted.slice(0, 6).map(({ word }) => word);

  // Ensure at least 4 tags by adding url-derived ones
  if (tags.length < 4) {
    for (const t of urlTokens) {
      if (!tags.includes(t) && tags.length < 6) tags.push(t);
    }
  }

  // Last resort fallback
  if (tags.length === 0) {
    const fallback = title.toLowerCase().split(/\s+/)
      .filter(w => !STOP_WORDS.has(w) && w.length > 2)
      .slice(0, 4);
    tags = fallback.length ? fallback : ['bookmark'];
  }

  return [...new Set(tags)].slice(0, 6);
}

// ─────────────────────────────────────────────
// SMART SUMMARY  (extractive, local)
// ─────────────────────────────────────────────
function generateSummary(title = '', url = '', description = '') {
  if (!description && !title) return 'A saved resource.';

  const domain = (() => {
    try { return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, ''); }
    catch { return ''; }
  })();

  // If description is rich enough, extract best 1–2 sentences
  if (description && description.length > 60) {
    const sentences = description
      .replace(/\n+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.length > 20 && s.length < 300);

    if (sentences.length >= 2) {
      // Score sentences by keyword overlap with title
      const titleWords = new Set(tokenizeText(title));
      const scored = sentences.map(s => ({
        s,
        score: tokenizeText(s).filter(w => titleWords.has(w)).length,
      }));
      scored.sort((a, b) => b.score - a.score);
      const best = scored.slice(0, 2).map(({ s }) => s).join(' ');
      if (best.length > 20) return best;
    }

    if (sentences[0]) return sentences[0];
  }

  // Build summary from title + domain context
  const tags = generateTags(title, url, description);
  const topTags = tags.slice(0, 3).join(', ');

  const domainPart = domain ? ` from ${domain}` : '';
  if (topTags) {
    return `A resource about ${topTags}${domainPart}. ${description ? description.slice(0, 120) + '...' : ''}`.trim();
  }

  return description
    ? description.slice(0, 200) + (description.length > 200 ? '...' : '')
    : `Resource: ${title}${domainPart}.`;
}

// ─────────────────────────────────────────────
// SEMANTIC SEARCH  (expand query → synonyms + stems)
// ─────────────────────────────────────────────
function expandQuery(query) {
  const q = query.toLowerCase().trim();
  const tokens = q.split(/\s+/);
  const expanded = new Set(tokens);

  for (const token of tokens) {
    // Add stems
    const stem = stemmer.stem(token);
    if (stem && stem !== token) expanded.add(stem);

    // Add synonyms
    if (SYNONYM_MAP[token]) {
      SYNONYM_MAP[token].forEach(s => expanded.add(s));
    }

    // Partial/prefix matches on SYNONYM_MAP keys
    for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
      if (key.startsWith(token) || token.startsWith(key)) {
        expanded.add(key);
        synonyms.forEach(s => expanded.add(s));
      }
    }
  }

  return [...expanded];
}

// ─────────────────────────────────────────────
// GRAPH CLUSTERS  (for colored visualization)
// ─────────────────────────────────────────────
const CLUSTER_COLORS = {
  frontend:  { bg: 'rgba(139,92,246,0.35)', border: 'rgba(139,92,246,0.8)', glow: '#8b5cf6', label: 'Frontend' },
  backend:   { bg: 'rgba(37,99,235,0.35)',  border: 'rgba(37,99,235,0.8)',  glow: '#3b82f6', label: 'Backend' },
  devops:    { bg: 'rgba(5,150,105,0.35)',  border: 'rgba(5,150,105,0.8)',  glow: '#10b981', label: 'DevOps' },
  database:  { bg: 'rgba(245,158,11,0.35)', border: 'rgba(245,158,11,0.8)', glow: '#f59e0b', label: 'Database' },
  security:  { bg: 'rgba(239,68,68,0.35)',  border: 'rgba(239,68,68,0.8)',  glow: '#ef4444', label: 'Security' },
  ai:        { bg: 'rgba(236,72,153,0.35)', border: 'rgba(236,72,153,0.8)', glow: '#ec4899', label: 'AI / ML' },
  general:   { bg: 'rgba(100,116,139,0.3)', border: 'rgba(100,116,139,0.6)', glow: '#64748b', label: 'General' },
};

const CLUSTER_TAG_MAP = {
  frontend:  ['react','vue','angular','svelte','nextjs','html','css','tailwind','jsx','frontend','ui','ux','sass','webpack','vite','redux','hooks','component','pwa','spa','gatsby','nuxt','typescript'],
  backend:   ['nodejs','express','api','graphql','rest','server','backend','python','django','flask','rails','java','php','microservices','grpc','websocket'],
  devops:    ['docker','kubernetes','deployment','devops','ci/cd','nginx','aws','gcp','azure','vercel','netlify','terraform','ansible','pipeline','github','gitlab','containers'],
  database:  ['mongodb','postgresql','mysql','sqlite','redis','database','sql','nosql','mongoose','sequelize','prisma','elasticsearch','firebase','db'],
  security:  ['auth','jwt','oauth','security','authentication','authorization','bcrypt','ssl','https','token','session','password','encryption'],
  ai:        ['ai','ml','machine learning','neural','nlp','pytorch','tensorflow','sklearn','deep learning','llm','embedding','data science'],
};

function detectCluster(tags) {
  const tagSet = new Set(tags.map(t => t.toLowerCase()));
  const scores = {};

  for (const [cluster, clusterTags] of Object.entries(CLUSTER_TAG_MAP)) {
    scores[cluster] = clusterTags.filter(t => tagSet.has(t)).length;
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : 'general';
}

// ─────────────────────────────────────────────
// GRAPH LAYOUT  (force-directed approximation)
// ─────────────────────────────────────────────
function computeGraphLayout(bookmarks) {
  if (!bookmarks.length) return { nodes: [], edges: [] };

  // Build adjacency (shared tags)
  const sharedTags = {};
  const bookmarkMap = {};

  for (const bm of bookmarks) {
    bookmarkMap[bm._id.toString()] = bm;
  }

  const edgeList = [];
  for (let i = 0; i < bookmarks.length; i++) {
    for (let j = i + 1; j < bookmarks.length; j++) {
      const a = bookmarks[i];
      const b = bookmarks[j];
      const shared = a.tags.filter(t => b.tags.includes(t));
      if (shared.length > 0) {
        const weight = shared.length;
        edgeList.push({ source: a._id.toString(), target: b._id.toString(), weight, shared });
      }
    }
  }

  // Group by cluster
  const clusterGroups = {};
  for (const bm of bookmarks) {
    const cluster = detectCluster(bm.tags);
    if (!clusterGroups[cluster]) clusterGroups[cluster] = [];
    clusterGroups[cluster].push(bm._id.toString());
  }

  // Position: clusters on a ring, nodes within cluster on sub-ring
  const clusterNames = Object.keys(clusterGroups);
  const W = 900, H = 700;
  const cx = W / 2, cy = H / 2;
  const clusterR = Math.min(cx, cy) * 0.6;

  const positions = {};

  clusterNames.forEach((clusterName, ci) => {
    const ids = clusterGroups[clusterName];
    const clusterAngle = (2 * Math.PI * ci) / clusterNames.length - Math.PI / 2;
    const clusterCx = cx + clusterR * Math.cos(clusterAngle);
    const clusterCy = cy + clusterR * Math.sin(clusterAngle);

    // Nodes within cluster arranged in a mini circle
    const nodeR = Math.max(60, ids.length * 25);
    ids.forEach((id, ni) => {
      const nodeAngle = (2 * Math.PI * ni) / Math.max(ids.length, 1);
      positions[id] = {
        x: clusterCx + nodeR * Math.cos(nodeAngle) + (Math.random() - 0.5) * 20,
        y: clusterCy + nodeR * Math.sin(nodeAngle) + (Math.random() - 0.5) * 20,
        cluster: clusterName,
      };
    });
  });

  // Build nodes
  const nodes = bookmarks.map(bm => {
    const id = bm._id.toString();
    const cluster = positions[id]?.cluster || 'general';
    const colors = CLUSTER_COLORS[cluster] || CLUSTER_COLORS.general;

    return {
      id,
      type: 'default',
      data: {
        label: bm.title,
        tags: bm.tags,
        cluster,
        clusterLabel: colors.label,
      },
      position: { x: positions[id]?.x || 100, y: positions[id]?.y || 100 },
      style: {
        background: colors.bg,
        border: `1.5px solid ${colors.border}`,
        borderRadius: '12px',
        color: '#f1f5f9',
        fontSize: '11px',
        padding: '10px 14px',
        width: 190,
        textAlign: 'center',
        backdropFilter: 'blur(8px)',
        boxShadow: `0 0 16px ${colors.glow}44`,
        fontFamily: 'Syne, sans-serif',
      },
    };
  });

  // Build edges with weight-based styling
  const edges = edgeList.map(({ source, target, weight, shared }) => {
    const maxW = Math.min(weight * 1.2, 4);
    const opacity = Math.min(0.3 + weight * 0.2, 0.9);
    const sCluster = positions[source]?.cluster || 'general';
    const tCluster = positions[target]?.cluster || 'general';
    const sameCluster = sCluster === tCluster;
    const colors = CLUSTER_COLORS[sCluster] || CLUSTER_COLORS.general;

    return {
      id: `${source}-${target}`,
      source,
      target,
      animated: weight >= 2,
      label: weight >= 2 ? shared.slice(0, 2).join(', ') : undefined,
      labelStyle: { fill: '#94a3b8', fontSize: 9, fontFamily: 'Syne' },
      labelBgStyle: { fill: 'rgba(8,11,20,0.8)', fillOpacity: 0.9, borderRadius: 4 },
      style: {
        stroke: sameCluster ? colors.glow : 'rgba(148,163,184,0.4)',
        strokeWidth: maxW,
        opacity,
      },
    };
  });

  return { nodes, edges };
}

// ─────────────────────────────────────────────
// SIMILARITY SCORE  (Jaccard on tags + stems)
// ─────────────────────────────────────────────
function tagSimilarity(tagsA, tagsB) {
  if (!tagsA.length || !tagsB.length) return 0;
  const stemA = new Set(tagsA.map(t => stemmer.stem(t)));
  const stemB = new Set(tagsB.map(t => stemmer.stem(t)));
  const intersection = [...stemA].filter(t => stemB.has(t)).length;
  const union = new Set([...stemA, ...stemB]).size;
  return union === 0 ? 0 : intersection / union;
}

module.exports = {
  generateTags,
  generateSummary,
  expandQuery,
  computeGraphLayout,
  tagSimilarity,
  detectCluster,
  CLUSTER_COLORS,
};
