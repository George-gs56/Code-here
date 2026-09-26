"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/lessons/:id - Fetch lesson details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const lessonRes = await (0, db_1.query)(`SELECT les.id, les.course_id, les.title, les.slug, les.content, les.code_example, les.estimated_minutes, les.display_order, les.knowledge_check,
              c.title AS course_title, c.level AS course_level, l.name AS language_name, l.slug AS language_slug
       FROM lessons les
       JOIN courses c ON c.id = les.course_id
       JOIN languages l ON l.id = c.language_id
       WHERE les.id = $1 AND les.is_published = true`, [id]);
        if (lessonRes.rows.length === 0) {
            return res.status(404).json({ error: 'Lesson not found' });
        }
        const lesson = lessonRes.rows[0];
        // Find previous and next lessons in course
        const siblingLessons = await (0, db_1.query)(`SELECT id, title, slug, display_order FROM lessons WHERE course_id = $1 ORDER BY display_order ASC`, [lesson.course_id]);
        const siblings = siblingLessons.rows;
        const currentIndex = siblings.findIndex((s) => s.id === lesson.id);
        const prevLesson = currentIndex > 0 ? siblings[currentIndex - 1] : null;
        const nextLesson = currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;
        // Fetch user progress if auth header exists
        let userProgress = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.split(' ')[1];
                const jwt = require('jsonwebtoken');
                const JWT_SECRET = process.env.JWT_SECRET || 'codesphere_super_secret_jwt_key_2026_change_in_production';
                const decoded = jwt.verify(token, JWT_SECRET);
                const progressRes = await (0, db_1.query)('SELECT status, completion_percentage, completed_at FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2', [decoded.id, id]);
                if (progressRes.rows.length > 0) {
                    userProgress = progressRes.rows[0];
                }
            }
            catch (e) {
                // Guest mode
            }
        }
        return res.json({
            lesson,
            prevLesson,
            nextLesson,
            userProgress,
        });
    }
    catch (err) {
        console.error('Error fetching lesson:', err);
        return res.status(500).json({ error: 'Failed to fetch lesson' });
    }
});
// POST /api/lessons/:id/complete - Mark lesson as completed
router.post('/:id/complete', auth_1.requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        // Check lesson exists
        const lessonRes = await (0, db_1.query)('SELECT id, title, course_id FROM lessons WHERE id = $1', [id]);
        if (lessonRes.rows.length === 0) {
            return res.status(404).json({ error: 'Lesson not found' });
        }
        const lesson = lessonRes.rows[0];
        // Upsert lesson_progress
        await (0, db_1.query)(`INSERT INTO lesson_progress (user_id, lesson_id, status, completion_percentage, completed_at, updated_at)
       VALUES ($1, $2, 'completed', 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, lesson_id) 
       DO UPDATE SET status = 'completed', completion_percentage = 100, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP`, [userId, id]);
        // Record learning activity
        await (0, db_1.query)(`INSERT INTO learning_activity (user_id, activity_type, reference_id, duration_seconds)
       VALUES ($1, 'lesson_completed', $2, 900)`, [userId, id]);
        // Award "First Step" Achievement if this is first completed lesson
        const completedCountRes = await (0, db_1.query)(`SELECT COUNT(*) FROM lesson_progress WHERE user_id = $1 AND status = 'completed'`, [userId]);
        const completedCount = parseInt(completedCountRes.rows[0].count) || 0;
        const newAchievements = [];
        if (completedCount >= 1) {
            const achRes = await (0, db_1.query)(`SELECT id, title FROM achievements WHERE achievement_type = 'lesson_completed' AND threshold <= $1`, [completedCount]);
            for (const ach of achRes.rows) {
                const insRes = await (0, db_1.query)(`INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id`, [userId, ach.id]);
                if (insRes.rows.length > 0) {
                    newAchievements.push(ach.title);
                }
            }
        }
        // Add Notification
        await (0, db_1.query)(`INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, 'Lesson Completed!', $2, 'success')`, [userId, `Great job! You completed "${lesson.title}".`]);
        return res.json({
            message: 'Lesson marked as completed',
            completedCount,
            newAchievements,
        });
    }
    catch (err) {
        console.error('Error completing lesson:', err);
        return res.status(500).json({ error: 'Failed to mark lesson as completed' });
    }
});
exports.default = router;
