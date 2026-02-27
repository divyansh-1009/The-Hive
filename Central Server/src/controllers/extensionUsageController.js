const ExtensionUsage = require('../models/extensionUsage');

exports.submit = async (req, res) => {
  try {
    const { deviceId, site, state, timestamp } = req.body;

    if (!deviceId || !site || !state || !timestamp) {
      return res.status(400).json({ error: 'deviceId, site, state, and timestamp are required.' });
    }

    if (state !== 'active' && state !== 'closed') {
      return res.status(400).json({ error: 'state must be "active" or "closed".' });
    }

    const record = await ExtensionUsage.insertEvent({
      userId: req.user.id,
      deviceId,
      site,
      state,
      timestamp,
    });

    return res.status(201).json({ status: 'received', id: record.id });
  } catch (err) {
    console.error('Extension usage submit error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
