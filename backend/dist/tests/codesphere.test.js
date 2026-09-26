"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../index");
const db_1 = require("../db");
const seed_1 = require("../db/seed");
let studentToken = '';
let adminToken = '';
let studentUserId = '';
let assessmentId = '';
(0, vitest_1.beforeAll)(async () => {
    await (0, db_1.getDb)();
    await (0, seed_1.runSeed)();
    // Login Student
    const studentRes = await (0, supertest_1.default)(index_1.app)
        .post('/api/auth/login')
        .send({ loginIdentifier: 'User@codesphere.com', password: 'Student123!' });
    studentToken = studentRes.body.token;
    studentUserId = studentRes.body.user.id;
    // Login Admin
    const adminRes = await (0, supertest_1.default)(index_1.app)
        .post('/api/auth/login')
        .send({ loginIdentifier: 'admin@codesphere.com', password: 'Admin123!' });
    adminToken = adminRes.body.token;
    // Fetch a valid assessment ID
    const assRes = await (0, supertest_1.default)(index_1.app).get('/api/assessments');
    assessmentId = assRes.body.assessments[0].id;
});
(0, vitest_1.describe)('1. Authentication Tests', () => {
    (0, vitest_1.it)('should register a new student user successfully', async () => {
        const res = await (0, supertest_1.default)(index_1.app).post('/api/auth/register').send({
            fullName: 'Alice Test',
            username: 'alicetest',
            email: 'alice@codesphere.com',
            password: 'Password123!',
            confirmPassword: 'Password123!',
            terms: true,
        });
        (0, vitest_1.expect)(res.status).toBe(201);
        (0, vitest_1.expect)(res.body.token).toBeDefined();
        (0, vitest_1.expect)(res.body.user.username).toBe('alicetest');
    });
    (0, vitest_1.it)('should reject duplicate username registration', async () => {
        const res = await (0, supertest_1.default)(index_1.app).post('/api/auth/register').send({
            fullName: 'Alice Duplicate',
            username: 'alicetest',
            email: 'alice2@codesphere.com',
            password: 'Password123!',
            confirmPassword: 'Password123!',
            terms: true,
        });
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body.error).toContain('already taken');
    });
    (0, vitest_1.it)('should reject registration when passwords do not match', async () => {
        const res = await (0, supertest_1.default)(index_1.app).post('/api/auth/register').send({
            fullName: 'Bob Mismatch',
            username: 'bobmismatch',
            email: 'bob@codesphere.com',
            password: 'Password123!',
            confirmPassword: 'DifferentPassword!',
            terms: true,
        });
        (0, vitest_1.expect)(res.status).toBe(400);
    });
    (0, vitest_1.it)('should allow login with valid username and password', async () => {
        const res = await (0, supertest_1.default)(index_1.app).post('/api/auth/login').send({
            loginIdentifier: 'User',
            password: 'Student123!',
        });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.token).toBeDefined();
    });
    (0, vitest_1.it)('should reject access to protected routes without token', async () => {
        const res = await (0, supertest_1.default)(index_1.app).get('/api/auth/me');
        (0, vitest_1.expect)(res.status).toBe(401);
    });
});
(0, vitest_1.describe)('2. Mandatory Assessment Engine & Retest Deduplication Tests', () => {
    let attempt1Id = '';
    let attempt1Questions = [];
    (0, vitest_1.it)('should generate exactly 10 questions and conceal correct answers before submission', async () => {
        const res = await (0, supertest_1.default)(index_1.app)
            .post(`/api/assessments/${assessmentId}/start`)
            .set('Authorization', `Bearer ${studentToken}`);
        (0, vitest_1.expect)(res.status).toBe(201);
        (0, vitest_1.expect)(res.body.questions.length).toBe(10);
        (0, vitest_1.expect)(res.body.assessment.passingScore).toBe(7);
        attempt1Id = res.body.attemptId;
        attempt1Questions = res.body.questions;
        // Verify correct_option and explanation are stripped for security
        (0, vitest_1.expect)(res.body.questions[0].correctOption).toBeUndefined();
        (0, vitest_1.expect)(res.body.questions[0].explanation).toBeUndefined();
    });
    (0, vitest_1.it)('should evaluate server-side grading and apply 7/10 pass threshold rule (Score 6 FAILS)', async () => {
        // Select 6 correct and 4 wrong answers to trigger FAIL result
        const answers = [];
        for (let i = 0; i < attempt1Questions.length; i++) {
            const q = attempt1Questions[i];
            // Fetch correct option directly from DB to simulate precise test grading
            const qDb = await (0, db_1.query)('SELECT correct_option FROM question_bank WHERE id = $1', [q.id]);
            const correctOpt = qDb.rows[0].correct_option;
            const selected = i < 6 ? correctOpt : (correctOpt + 1) % 4;
            answers.push({ questionId: q.id, selectedOption: selected });
        }
        const res = await (0, supertest_1.default)(index_1.app)
            .post(`/api/assessments/${assessmentId}/submit`)
            .set('Authorization', `Bearer ${studentToken}`)
            .send({ attemptId: attempt1Id, answers });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.score).toBe(6);
        (0, vitest_1.expect)(res.body.passed).toBe(false);
        (0, vitest_1.expect)(res.body.status).toBe('FAILED');
    });
    (0, vitest_1.it)('should prevent submitting or grading the same attempt twice', async () => {
        const answers = attempt1Questions.map((q) => ({ questionId: q.id, selectedOption: 0 }));
        const res = await (0, supertest_1.default)(index_1.app)
            .post(`/api/assessments/${assessmentId}/submit`)
            .set('Authorization', `Bearer ${studentToken}`)
            .send({ attemptId: attempt1Id, answers });
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body.error).toContain('already been submitted');
    });
    (0, vitest_1.it)('CRITICAL RETEST DEDUPLICATION: retest attempt must serve 10 fresh questions excluding attempt 1 questions', async () => {
        const res = await (0, supertest_1.default)(index_1.app)
            .post(`/api/assessments/${assessmentId}/start`)
            .set('Authorization', `Bearer ${studentToken}`);
        (0, vitest_1.expect)(res.status).toBe(201);
        (0, vitest_1.expect)(res.body.questions.length).toBe(10);
        const attempt2QuestionIds = res.body.questions.map((q) => q.id);
        const attempt1QuestionIds = attempt1Questions.map((q) => q.id);
        // Verify ZERO overlap between attempt 1 and attempt 2 questions!
        const overlap = attempt2QuestionIds.filter((id) => attempt1QuestionIds.includes(id));
        (0, vitest_1.expect)(overlap.length).toBe(0);
    });
    (0, vitest_1.it)('should evaluate server-side grading and apply 7/10 pass threshold rule (Score 8 PASSES)', async () => {
        const startRes = await (0, supertest_1.default)(index_1.app)
            .post(`/api/assessments/${assessmentId}/start`)
            .set('Authorization', `Bearer ${studentToken}`);
        const newAttemptId = startRes.body.attemptId;
        const questions = startRes.body.questions;
        const answers = [];
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const qDb = await (0, db_1.query)('SELECT correct_option FROM question_bank WHERE id = $1', [q.id]);
            const correctOpt = qDb.rows[0].correct_option;
            const selected = i < 8 ? correctOpt : (correctOpt + 1) % 4;
            answers.push({ questionId: q.id, selectedOption: selected });
        }
        const res = await (0, supertest_1.default)(index_1.app)
            .post(`/api/assessments/${assessmentId}/submit`)
            .set('Authorization', `Bearer ${studentToken}`)
            .send({ attemptId: newAttemptId, answers });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.score).toBe(8);
        (0, vitest_1.expect)(res.body.passed).toBe(true);
        (0, vitest_1.expect)(res.body.status).toBe('PASSED');
    });
});
(0, vitest_1.describe)('3. Learning Progress & Dashboard Tests', () => {
    (0, vitest_1.it)('should persist lesson completion in database', async () => {
        const lessonsRes = await (0, db_1.query)('SELECT id FROM lessons LIMIT 1');
        const lessonId = lessonsRes.rows[0].id;
        const res = await (0, supertest_1.default)(index_1.app)
            .post(`/api/lessons/${lessonId}/complete`)
            .set('Authorization', `Bearer ${studentToken}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.message).toContain('completed');
        // Check DB
        const dbCheck = await (0, db_1.query)('SELECT status FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2', [studentUserId, lessonId]);
        (0, vitest_1.expect)(dbCheck.rows[0].status).toBe('completed');
    });
    (0, vitest_1.it)('should return real live stats on student dashboard endpoint', async () => {
        const res = await (0, supertest_1.default)(index_1.app)
            .get('/api/dashboard/stats')
            .set('Authorization', `Bearer ${studentToken}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.stats.lessonsCompleted).toBeGreaterThanOrEqual(1);
        (0, vitest_1.expect)(res.body.stats.avgTestScore).toBeDefined();
    });
});
(0, vitest_1.describe)('4. Role-Based Administration Tests', () => {
    (0, vitest_1.it)('should reject student access to admin routes with 403 Forbidden', async () => {
        const res = await (0, supertest_1.default)(index_1.app)
            .get('/api/admin/stats')
            .set('Authorization', `Bearer ${studentToken}`);
        (0, vitest_1.expect)(res.status).toBe(403);
    });
    (0, vitest_1.it)('should allow admin access to admin statistics dashboard', async () => {
        const res = await (0, supertest_1.default)(index_1.app)
            .get('/api/admin/stats')
            .set('Authorization', `Bearer ${adminToken}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.stats.totalUsers).toBeGreaterThanOrEqual(2);
    });
});
