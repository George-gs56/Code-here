"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const validators_1 = require("../validators");
const codeExecutor_1 = require("../services/codeExecutor");
const router = (0, express_1.Router)();
// GET /api/challenges - List practice challenges
router.get('/', async (req, res) => {
    try {
        const { language, difficulty, topic } = req.query;
        let sql = `
      SELECT ch.id, ch.title, ch.slug, ch.difficulty, ch.topic, ch.is_published,
             l.name AS language_name, l.slug AS language_slug, l.icon AS language_icon
      FROM challenges ch
      JOIN languages l ON l.id = ch.language_id
      WHERE ch.is_published = true`;
        const params = [];
        if (language) {
            params.push(language);
            sql += ` AND l.slug = $${params.length}`;
        }
        if (difficulty) {
            params.push(difficulty);
            sql += ` AND ch.difficulty = $${params.length}`;
        }
        if (topic) {
            params.push(topic);
            sql += ` AND ch.topic = $${params.length}`;
        }
        sql += ` ORDER BY ch.title ASC`;
        const challengesRes = await (0, db_1.query)(sql, params);
        return res.json({ challenges: challengesRes.rows });
    }
    catch (err) {
        console.error('Error fetching challenges:', err);
        return res.status(500).json({ error: 'Failed to fetch coding challenges' });
    }
});
// GET /api/challenges/:id - Get challenge details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const chRes = await (0, db_1.query)(`SELECT ch.id, ch.title, ch.slug, ch.description, ch.difficulty, ch.topic, ch.starter_code, ch.test_cases, ch.hints,
              l.name AS language_name, l.slug AS language_slug
       FROM challenges ch
       JOIN languages l ON l.id = ch.language_id
       WHERE ch.id = $1 AND ch.is_published = true`, [id]);
        if (chRes.rows.length === 0) {
            return res.status(404).json({ error: 'Challenge not found' });
        }
        const challenge = chRes.rows[0];
        // Fetch user attempt history if logged in
        let userSubmissions = [];
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.split(' ')[1];
                const jwt = require('jsonwebtoken');
                const JWT_SECRET = process.env.JWT_SECRET || 'codesphere_super_secret_jwt_key_2026_change_in_production';
                const decoded = jwt.verify(token, JWT_SECRET);
                const subRes = await (0, db_1.query)(`SELECT id, submitted_code, status, result_summary, created_at
           FROM challenge_submissions
           WHERE user_id = $1 AND challenge_id = $2
           ORDER BY created_at DESC LIMIT 5`, [decoded.id, id]);
                userSubmissions = subRes.rows;
            }
            catch (e) {
                // Guest mode
            }
        }
        return res.json({ challenge, userSubmissions });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch challenge details' });
    }
});
// POST /api/challenges/:id/submit - Submit solution
router.post('/:id/submit', auth_1.requireAuth, async (req, res) => {
    try {
        const parseResult = validators_1.submitChallengeSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({ error: parseResult.error.errors[0].message });
        }
        const { challengeId, code } = parseResult.data;
        const userId = req.user.id;
        // Fetch challenge details with test cases and language info
        const chRes = await (0, db_1.query)(`SELECT ch.id, ch.title, ch.test_cases, ch.language_id, l.slug AS language_slug
       FROM challenges ch
       JOIN languages l ON l.id = ch.language_id
       WHERE ch.id = $1`, [challengeId]);
        if (chRes.rows.length === 0) {
            return res.status(404).json({ error: 'Challenge not found' });
        }
        const challenge = chRes.rows[0];
        const testCases = challenge.test_cases || [];
        // Real Code Execution & Validation
        const execResult = (0, codeExecutor_1.executeUserCode)(code, testCases, challenge.language_slug);
        const status = execResult.status; // 'passed' | 'failed'
        // Find next challenge in the same language/track for auto-progression
        let nextChallengeId = null;
        if (status === 'passed') {
            const nextChRes = await (0, db_1.query)(`SELECT id FROM challenges
         WHERE language_id = $1 AND is_published = true AND id != $2
         ORDER BY id ASC LIMIT 1`, [challenge.language_id, challengeId]);
            if (nextChRes.rows.length > 0) {
                nextChallengeId = nextChRes.rows[0].id;
            }
        }
        // Insert submission record
        const subRes = await (0, db_1.query)(`INSERT INTO challenge_submissions (user_id, challenge_id, submitted_code, status, result_summary)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`, [userId, challengeId, code, status, JSON.stringify({ testResults: execResult.testResults, outputConsole: execResult.outputConsole })]);
        // Record activity if passed
        if (status === 'passed') {
            await (0, db_1.query)(`INSERT INTO learning_activity (user_id, activity_type, reference_id, duration_seconds)
         VALUES ($1, 'coding_practice', $2, 600)`, [userId, challengeId]);
        }
        // Award Achievement if first challenge solved & passed
        const newAchievements = [];
        if (status === 'passed') {
            const achRes = await (0, db_1.query)(`SELECT id, title FROM achievements WHERE achievement_type = 'challenge_solved' AND threshold = 1`);
            if (achRes.rows.length > 0) {
                const insRes = await (0, db_1.query)(`INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id`, [userId, achRes.rows[0].id]);
                if (insRes.rows.length > 0) {
                    newAchievements.push(achRes.rows[0].title);
                }
            }
        }
        return res.json({
            submissionId: subRes.rows[0].id,
            status,
            message: execResult.message,
            outputConsole: execResult.outputConsole,
            testResults: execResult.testResults,
            nextChallengeId,
            newAchievements,
        });
    }
    catch (err) {
        console.error('Error submitting challenge:', err);
        return res.status(500).json({ error: 'Failed to submit challenge solution' });
    }
});
exports.default = router;
