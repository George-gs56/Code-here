"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
// GET /api/languages - Get all languages with real statistics & user progress
router.get('/', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        let userId = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.split(' ')[1];
                const jwt = require('jsonwebtoken');
                const JWT_SECRET = process.env.JWT_SECRET || 'codesphere_super_secret_jwt_key_2026_change_in_production';
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.id;
            }
            catch (e) {
                // Guest request
            }
        }
        const languagesRes = await (0, db_1.query)(`SELECT 
        l.id, l.name, l.slug, l.description, l.icon, l.category, l.difficulty, l.is_published, l.display_order,
        COUNT(DISTINCT les.id) AS lesson_count,
        COUNT(DISTINCT c.id) AS course_count,
        COUNT(DISTINCT ch.id) AS challenge_count,
        COUNT(DISTINCT a.id) AS assessment_count
       FROM languages l
       LEFT JOIN courses c ON c.language_id = l.id
       LEFT JOIN lessons les ON les.course_id = c.id
       LEFT JOIN challenges ch ON ch.language_id = l.id
       LEFT JOIN assessments a ON a.language_id = l.id
       WHERE l.is_published = true
       GROUP BY l.id
       ORDER BY l.display_order ASC`);
        const languages = languagesRes.rows;
        // Fetch user lesson completion percentages if logged in
        if (userId) {
            const userProgressRes = await (0, db_1.query)(`SELECT c.language_id, 
                COUNT(DISTINCT les.id) AS total_lessons,
                COUNT(DISTINCT lp.lesson_id) FILTER (WHERE lp.status = 'completed') AS completed_lessons
         FROM courses c
         JOIN lessons les ON les.course_id = c.id
         LEFT JOIN lesson_progress lp ON lp.lesson_id = les.id AND lp.user_id = $1
         GROUP BY c.language_id`, [userId]);
            const progressMap = {};
            for (const row of userProgressRes.rows) {
                const total = parseInt(row.total_lessons) || 0;
                const completed = parseInt(row.completed_lessons) || 0;
                progressMap[row.language_id] = total > 0 ? Math.round((completed / total) * 100) : 0;
            }
            for (const lang of languages) {
                lang.progress_percentage = progressMap[lang.id] || 0;
            }
        }
        else {
            for (const lang of languages) {
                lang.progress_percentage = 0;
            }
        }
        return res.json({ languages });
    }
    catch (err) {
        console.error('Error fetching languages:', err);
        return res.status(500).json({ error: 'Failed to fetch programming languages' });
    }
});
// GET /api/languages/:slug - Get single language details
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const langRes = await (0, db_1.query)('SELECT * FROM languages WHERE slug = $1 AND is_published = true', [slug]);
        if (langRes.rows.length === 0) {
            return res.status(404).json({ error: 'Language not found' });
        }
        return res.json({ language: langRes.rows[0] });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch language details' });
    }
});
// GET /api/languages/:slug/courses - Get structured curriculum with courses and lessons
router.get('/:slug/courses', async (req, res) => {
    try {
        const { slug } = req.params;
        const authHeader = req.headers.authorization;
        let userId = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.split(' ')[1];
                const jwt = require('jsonwebtoken');
                const JWT_SECRET = process.env.JWT_SECRET || 'codesphere_super_secret_jwt_key_2026_change_in_production';
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.id;
            }
            catch (e) {
                // Guest request
            }
        }
        const langRes = await (0, db_1.query)('SELECT id, name, slug FROM languages WHERE slug = $1', [slug]);
        if (langRes.rows.length === 0) {
            return res.status(404).json({ error: 'Language not found' });
        }
        const language = langRes.rows[0];
        const coursesRes = await (0, db_1.query)(`SELECT id, title, description, level, display_order 
       FROM courses 
       WHERE language_id = $1 AND is_published = true 
       ORDER BY display_order ASC`, [language.id]);
        const courses = coursesRes.rows;
        for (const course of courses) {
            const lessonsRes = await (0, db_1.query)(`SELECT id, title, slug, estimated_minutes, display_order 
         FROM lessons 
         WHERE course_id = $1 AND is_published = true 
         ORDER BY display_order ASC`, [course.id]);
            const lessons = lessonsRes.rows;
            if (userId) {
                const progressRes = await (0, db_1.query)(`SELECT lesson_id, status, completion_percentage 
           FROM lesson_progress 
           WHERE user_id = $1 AND lesson_id IN (SELECT id FROM lessons WHERE course_id = $2)`, [userId, course.id]);
                const statusMap = {};
                for (const p of progressRes.rows) {
                    statusMap[p.lesson_id] = { status: p.status, percentage: p.completion_percentage };
                }
                for (const les of lessons) {
                    les.status = statusMap[les.id]?.status || 'unstarted';
                    les.completion_percentage = statusMap[les.id]?.percentage || 0;
                }
            }
            else {
                for (const les of lessons) {
                    les.status = 'unstarted';
                    les.completion_percentage = 0;
                }
            }
            course.lessons = lessons;
        }
        return res.json({ language, courses });
    }
    catch (err) {
        console.error('Error fetching curriculum:', err);
        return res.status(500).json({ error: 'Failed to fetch course curriculum' });
    }
});
exports.default = router;
