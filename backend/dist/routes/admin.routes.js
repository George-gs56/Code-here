"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const sync_1 = require("csv-parse/sync");
const router = (0, express_1.Router)();
// Apply auth and admin middleware to all routes in this router
router.use(auth_1.requireAuth);
router.use(auth_1.requireAdmin);
// Helper function to record audit logs
async function logAdminAction(adminUserId, action, targetType, targetId, details) {
    try {
        await (0, db_1.query)(`INSERT INTO admin_audit_log (admin_user_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`, [adminUserId, action, targetType, targetId || null, JSON.stringify(details || {})]);
    }
    catch (err) {
        console.error('Failed to log admin audit action:', err);
    }
}
// GET /api/admin/stats - Overview statistics
router.get('/stats', async (req, res) => {
    try {
        const usersCountRes = await (0, db_1.query)('SELECT COUNT(*) FROM profiles');
        const totalUsers = parseInt(usersCountRes.rows[0].count) || 0;
        const lessonsCompletedRes = await (0, db_1.query)(`SELECT COUNT(*) FROM lesson_progress WHERE status = 'completed'`);
        const totalLessonsCompleted = parseInt(lessonsCompletedRes.rows[0].count) || 0;
        const attemptsRes = await (0, db_1.query)(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE passed = true) AS passed FROM assessment_attempts WHERE status = 'submitted'`);
        const totalAttempts = parseInt(attemptsRes.rows[0].total) || 0;
        const passedAttempts = parseInt(attemptsRes.rows[0].passed) || 0;
        const overallPassRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;
        // Question bank coverage per language
        const questionCoverageRes = await (0, db_1.query)(`SELECT l.name AS language_name, l.slug AS language_slug, COUNT(qb.id) AS question_count
       FROM languages l
       LEFT JOIN question_bank qb ON qb.language_id = l.id AND qb.is_active = true
       GROUP BY l.id
       ORDER BY question_count ASC`);
        return res.json({
            stats: {
                totalUsers,
                totalLessonsCompleted,
                totalAttempts,
                overallPassRate,
            },
            questionCoverage: questionCoverageRes.rows,
        });
    }
    catch (err) {
        console.error('Error fetching admin stats:', err);
        return res.status(500).json({ error: 'Failed to fetch admin overview stats' });
    }
});
// GET /api/admin/questions - List question bank with pagination and coverage
router.get('/questions', async (req, res) => {
    try {
        const { languageSlug } = req.query;
        let sql = `
      SELECT qb.id, qb.topic, qb.difficulty, qb.question_text, qb.options, qb.correct_option, qb.explanation, qb.is_active,
             l.name AS language_name, l.slug AS language_slug
      FROM question_bank qb
      JOIN languages l ON l.id = qb.language_id`;
        const params = [];
        if (languageSlug) {
            params.push(languageSlug);
            sql += ` WHERE l.slug = $1`;
        }
        sql += ` ORDER BY qb.created_at DESC LIMIT 100`;
        const questionsRes = await (0, db_1.query)(sql, params);
        return res.json({ questions: questionsRes.rows });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch question bank' });
    }
});
// POST /api/admin/questions - Add single question
router.post('/questions', async (req, res) => {
    try {
        const { languageId, topic, difficulty, questionText, options, correctOption, explanation } = req.body;
        if (!languageId || !topic || !questionText || !options || options.length !== 4 || correctOption === undefined) {
            return res.status(400).json({ error: 'Missing required question fields or options must be array of 4 items' });
        }
        const insRes = await (0, db_1.query)(`INSERT INTO question_bank (language_id, topic, difficulty, question_text, options, correct_option, explanation, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING id`, [languageId, topic, difficulty || 'Beginner', questionText, JSON.stringify(options), correctOption, explanation || '']);
        await logAdminAction(req.user.id, 'CREATE_QUESTION', 'question_bank', insRes.rows[0].id, { questionText });
        return res.status(201).json({ message: 'Question created successfully', questionId: insRes.rows[0].id });
    }
    catch (err) {
        console.error('Error adding question:', err);
        return res.status(500).json({ error: 'Failed to add question to question bank' });
    }
});
// POST /api/admin/questions/import-csv - Bulk CSV Question Import
router.post('/questions/import-csv', async (req, res) => {
    try {
        const { csvText } = req.body;
        if (!csvText || typeof csvText !== 'string') {
            return res.status(400).json({ error: 'Valid csvText string is required' });
        }
        // Parse CSV rows
        const records = (0, sync_1.parse)(csvText, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });
        let importedCount = 0;
        const errors = [];
        // Pre-fetch language slug map
        const langMapRes = await (0, db_1.query)('SELECT id, slug FROM languages');
        const langSlugToIdMap = new Map();
        for (const l of langMapRes.rows) {
            langSlugToIdMap.set(l.slug.toLowerCase(), l.id);
        }
        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            const rowNum = i + 1;
            const slug = (row.language_slug || row.language || '').toLowerCase();
            const langId = langSlugToIdMap.get(slug);
            if (!langId) {
                errors.push(`Row ${rowNum}: Unknown language slug "${slug}"`);
                continue;
            }
            const questionText = row.question_text || row.question;
            const option0 = row.option_0 || row.option0;
            const option1 = row.option_1 || row.option1;
            const option2 = row.option_2 || row.option2;
            const option3 = row.option_3 || row.option3;
            const correctIndex = parseInt(row.correct_option_index || row.correct_option || '0');
            const topic = row.topic || 'General';
            const difficulty = row.difficulty || 'Beginner';
            const explanation = row.explanation || '';
            if (!questionText || !option0 || !option1 || !option2 || !option3) {
                errors.push(`Row ${rowNum}: Incomplete question text or options`);
                continue;
            }
            const options = [option0, option1, option2, option3];
            await (0, db_1.query)(`INSERT INTO question_bank (language_id, topic, difficulty, question_text, options, correct_option, explanation, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)`, [langId, topic, difficulty, questionText, JSON.stringify(options), correctIndex, explanation]);
            importedCount++;
        }
        await logAdminAction(req.user.id, 'BULK_IMPORT_QUESTIONS', 'question_bank', undefined, { importedCount, errors });
        return res.json({
            message: `Successfully imported ${importedCount} questions`,
            importedCount,
            errors,
        });
    }
    catch (err) {
        console.error('CSV import error:', err);
        return res.status(500).json({ error: 'Failed to parse and import CSV question bank' });
    }
});
// GET /api/admin/users - Search and manage registered user accounts
router.get('/users', async (req, res) => {
    try {
        const { search } = req.query;
        let sql = `
      SELECT p.id, p.username, p.full_name, p.email, p.role, p.experience_level, p.created_at,
             COUNT(DISTINCT lp.lesson_id) AS lessons_completed,
             COUNT(DISTINCT aa.id) AS assessment_attempts
      FROM profiles p
      LEFT JOIN lesson_progress lp ON lp.user_id = p.id AND lp.status = 'completed'
      LEFT JOIN assessment_attempts aa ON aa.user_id = p.id AND aa.status = 'submitted'`;
        const params = [];
        if (search) {
            params.push(`%${search}%`);
            sql += ` WHERE p.username ILIKE $1 OR p.email ILIKE $1 OR p.full_name ILIKE $1`;
        }
        sql += ` GROUP BY p.id ORDER BY p.created_at DESC LIMIT 50`;
        const usersRes = await (0, db_1.query)(sql, params);
        return res.json({ users: usersRes.rows });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch user accounts' });
    }
});
// PUT /api/admin/users/:id/role - Assign user role (student <-> admin)
router.put('/users/:id/role', async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const { role } = req.body;
        if (role !== 'student' && role !== 'admin') {
            return res.status(400).json({ error: 'Role must be student or admin' });
        }
        await (0, db_1.query)('UPDATE profiles SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [role, targetUserId]);
        await logAdminAction(req.user.id, 'CHANGE_USER_ROLE', 'profiles', targetUserId, { newRole: role });
        return res.json({ message: `User role updated to ${role}` });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to update user role' });
    }
});
// GET /api/admin/audit-logs - View administrative operation audit history
router.get('/audit-logs', async (req, res) => {
    try {
        const logsRes = await (0, db_1.query)(`SELECT al.id, al.action, al.target_type, al.target_id, al.details, al.created_at,
              p.username AS admin_username, p.email AS admin_email
       FROM admin_audit_log al
       JOIN profiles p ON p.id = al.admin_user_id
       ORDER BY al.created_at DESC LIMIT 50`);
        return res.json({ auditLogs: logsRes.rows });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});
exports.default = router;
