const Bookmark = require('../models/Bookmark');

exports.getStats = async (req, res) => {
  try {
    const total = await Bookmark.countDocuments({ createdBy: req.user.id });
    const favorites = await Bookmark.countDocuments({ createdBy: req.user.id, favorite: true });
    const recent = await Bookmark.find({ createdBy: req.user.id }).sort({ createdAt: -1 }).limit(5);
    const tagMap = {};
    const allBms = await Bookmark.find({ createdBy: req.user.id });
    allBms.forEach(b => b.tags.forEach(t => { tagMap[t] = (tagMap[t] || 0) + 1; }));
    const topTags = Object.entries(tagMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([tag, count]) => ({ tag, count }));
    res.json({ total, favorites, recent, topTags });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
