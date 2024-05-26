const db = require('../config/db');

const getUserProfile = (req, res) => {
    if (req.session.auth && req.session.user) {
        const userId = req.session.user.id;
        db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch user data' });
            }
            if (row) {
                return res.json({
                    display_name: row.display_name,
                    email: row.email,
                    streak: row.streak || 0
                });
            } else {
                return res.status(404).json({ error: 'User not found' });
            }
        });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

module.exports = { getUserProfile };
