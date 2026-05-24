'use strict';
const Bookmark = require('../models/Bookmark');
const User = require('../models/User');
const { generateTags, generateSummary, expandQuery, computeGraphLayout, tagSimilarity } = require('../services/aiService');
const { sendBookmarkAddedEmail } = require('../services/emailService');

// ─────────────────────────────────────────────
// CREATE BOOKMARK  (auto-tag + auto-summary)
// ─────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { title, url, description, tags } = req.body;

    if (!title || !url) {
      return res.status(400).json({ message: 'Title and URL are required' });
    }

    let finalTags = tags?.length
      ? tags.map(t => t.toLowerCase().trim()).filter(Boolean)
      : generateTags(title, url, description);

    if (!finalTags.length) {
      finalTags = generateTags(title, url, description);
    }

    const aiSummary = generateSummary(title, url, description);

    const bookmark = await Bookmark.create({
      title: title.trim(),
      url: url.trim(),
      description: description?.trim() || '',
      tags: finalTags,
      aiSummary,
      favorite: false,
      createdBy: req.user.id,
    });

    // Send bookmark email if user preference is on (fire-and-forget)
    try {
      const user = await User.findById(req.user.id).select('email username notificationPreferences');
      const wantsEmail = user?.notificationPreferences?.bookmarkEmails !== false;
      if (user && wantsEmail) {
        sendBookmarkAddedEmail({
          toEmail:  user.email,
          username: user.username,
          bookmark,
        }).catch(err => console.error('[create bookmark] email failed:', err.message));
      }
    } catch (emailErr) {
      console.error('[create bookmark] could not fetch user for email:', emailErr.message);
    }

    res.json(bookmark);
  } catch (err) {
    console.error('[create bookmark]', err);
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// GET ALL  (semantic search)
// ─────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const { q } = req.query;
    const baseFilter = { createdBy: req.user.id };

    if (!q) {
      const bookmarks = await Bookmark.find(baseFilter).sort({ createdAt: -1 });
      return res.json(bookmarks);
    }

    const expanded = expandQuery(q);
    const orConditions = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { aiSummary: { $regex: q, $options: 'i' } },
    ];
    for (const term of expanded) {
      orConditions.push({ tags: { $regex: term, $options: 'i' } });
      orConditions.push({ title: { $regex: term, $options: 'i' } });
    }

    const bookmarks = await Bookmark.find({ ...baseFilter, $or: orConditions }).sort({ createdAt: -1 });

    const scored = bookmarks.map(bm => {
      let score = 0;
      const titleLower = bm.title.toLowerCase();
      const qLower = q.toLowerCase();
      if (titleLower.includes(qLower)) score += 10;
      if (bm.tags.some(t => t.toLowerCase() === qLower)) score += 8;
      if (bm.tags.some(t => t.toLowerCase().includes(qLower))) score += 5;
      score += expanded.filter(t => bm.tags.includes(t)).length * 3;
      return { bm, score };
    });

    scored.sort((a, b) => b.score - a.score);
    res.json(scored.map(({ bm }) => bm));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// GET ONE
// ─────────────────────────────────────────────
exports.getOne = async (req, res) => {
  try {
    const bookmark = await Bookmark.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!bookmark) return res.status(404).json({ message: 'Bookmark not found' });
    res.json(bookmark);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const current = await Bookmark.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!current) return res.status(404).json({ message: 'Not found' });

    const updates = { ...req.body };
    const newTitle = updates.title || current.title;
    const newUrl = updates.url || current.url;
    const newDesc = updates.description || current.description;

    if (!updates.tags && (updates.title || updates.url || updates.description)) {
      updates.tags = generateTags(newTitle, newUrl, newDesc);
      updates.aiSummary = generateSummary(newTitle, newUrl, newDesc);
    }

    const bookmark = await Bookmark.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      updates,
      { new: true }
    );
    res.json(bookmark);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    await Bookmark.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    res.json({ message: 'Bookmark deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// RELATED
// ─────────────────────────────────────────────
exports.related = async (req, res) => {
  try {
    const bm = await Bookmark.findById(req.params.id);
    if (!bm) return res.status(404).json({ message: 'Not found' });

    const all = await Bookmark.find({ _id: { $ne: bm._id }, createdBy: req.user.id });

    const scored = all
      .map(other => ({ other, score: tagSimilarity(bm.tags, other.tags) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ other }) => other);

    if (scored.length === 0) {
      const fallback = await Bookmark.find({
        _id: { $ne: bm._id },
        createdBy: req.user.id,
        tags: { $in: bm.tags },
      }).limit(5);
      return res.json(fallback);
    }

    res.json(scored);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// GRAPH DATA
// ─────────────────────────────────────────────
exports.getGraph = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ createdBy: req.user.id });
    const { nodes, edges } = computeGraphLayout(bookmarks);
    res.json({ nodes, edges, total: bookmarks.length });
  } catch (err) {
    console.error('[graph]', err);
    res.status(500).json({ message: err.message, nodes: [], edges: [] });
  }
};
