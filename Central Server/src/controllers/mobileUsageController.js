const UsageReport = require('../models/usageReport');

exports.submit = async (req, res) => {
  try {
    const { deviceId, date, apps } = req.body;

    if (!deviceId || !date || !Array.isArray(apps)) {
      return res.status(400).json({ error: 'deviceId, date, and apps[] are required.' });
    }

    const record = await UsageReport.upsert({
      userId: req.user.id,
      deviceId,
      date,
      apps,
    });

    return res.status(201).json({ status: 'received', id: record.id });
  } catch (err) {
    console.error('Mobile usage submit error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
