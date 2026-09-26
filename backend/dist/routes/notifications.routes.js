"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/notifications - List user notifications
router.get('/', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const notifRes = await (0, db_1.query)(`SELECT id, title, message, type, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 30`, [userId]);
        return res.json({ notifications: notifRes.rows });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});
// PUT /api/notifications/read-all - Mark all notifications read
router.put('/read-all', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        await (0, db_1.query)('UPDATE notifications SET is_read = true WHERE user_id = $1', [userId]);
        return res.json({ message: 'All notifications marked as read' });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to mark notifications read' });
    }
});
exports.default = router;
