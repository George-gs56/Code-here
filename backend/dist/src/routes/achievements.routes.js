"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/achievements - Fetch all achievements and user earned status
router.get('/', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const achRes = await (0, db_1.query)(`SELECT a.id, a.title, a.description, a.icon, a.achievement_type, a.threshold,
              ua.earned_at
       FROM achievements a
       LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = $1
       ORDER BY a.threshold ASC`, [userId]);
        const achievements = achRes.rows.map((row) => ({
            id: row.id,
            title: row.title,
            description: row.description,
            icon: row.icon,
            type: row.achievement_type,
            threshold: row.threshold,
            isEarned: row.earned_at !== null,
            earnedAt: row.earned_at,
        }));
        return res.json({ achievements });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch achievements' });
    }
});
exports.default = router;
