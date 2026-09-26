"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const validators_1 = require("../validators");
const router = (0, express_1.Router)();
// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const parseResult = validators_1.registerSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({ error: parseResult.error.errors[0].message });
        }
        const { fullName, username, email, password } = parseResult.data;
        // Check unique username
        const usernameCheck = await (0, db_1.query)('SELECT id FROM profiles WHERE LOWER(username) = LOWER($1)', [username]);
        if (usernameCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Username is already taken. Please choose another.' });
        }
        // Check unique email
        const emailCheck = await (0, db_1.query)('SELECT id FROM profiles WHERE LOWER(email) = LOWER($1)', [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ error: 'An account with this email address already exists.' });
        }
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        // Insert user profile
        const insertRes = await (0, db_1.query)(`INSERT INTO profiles (username, full_name, email, password_hash, role, experience_level, daily_goal_minutes, primary_goal)
       VALUES ($1, $2, $3, $4, 'student', 'Beginner', 30, 'Learning fundamentals')
       RETURNING id, username, email, role, full_name, experience_level, daily_goal_minutes, primary_goal`, [username, fullName, email, passwordHash]);
        const newUser = insertRes.rows[0];
        // Create welcome notification
        await (0, db_1.query)(`INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, 'Welcome to CodeSphere!', 'We are thrilled to have you! Explore languages and set your daily goal.', 'success')`, [newUser.id]);
        const token = (0, auth_1.generateToken)(newUser);
        return res.status(201).json({
            message: 'Registration successful',
            token,
            user: newUser,
        });
    }
    catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ error: 'Internal server error during registration' });
    }
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const parseResult = validators_1.loginSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({ error: parseResult.error.errors[0].message });
        }
        const { loginIdentifier, password } = parseResult.data;
        // Support email or username lookup securely without exposing user existence
        const userRes = await (0, db_1.query)(`SELECT id, username, email, password_hash, role, full_name, experience_level, daily_goal_minutes, primary_goal, leaderboard_visibility
       FROM profiles 
       WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1)`, [loginIdentifier]);
        if (userRes.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email/username or password' });
        }
        const user = userRes.rows[0];
        const passwordValid = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!passwordValid) {
            return res.status(401).json({ error: 'Invalid email/username or password' });
        }
        // Remove password hash before returning
        delete user.password_hash;
        const token = (0, auth_1.generateToken)(user);
        return res.json({
            message: 'Login successful',
            token,
            user,
        });
    }
    catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Internal server error during login' });
    }
});
// GET /api/auth/me
router.get('/me', auth_1.requireAuth, async (req, res) => {
    try {
        const userRes = await (0, db_1.query)(`SELECT id, username, email, role, full_name, experience_level, learning_goals, daily_goal_minutes, primary_goal, target_languages, leaderboard_visibility, avatar_url, bio, created_at
       FROM profiles WHERE id = $1`, [req.user.id]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: 'User profile not found' });
        }
        return res.json({ user: userRes.rows[0] });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});
// POST /api/auth/onboarding
router.post('/onboarding', auth_1.requireAuth, async (req, res) => {
    try {
        const parseResult = validators_1.onboardingSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({ error: parseResult.error.errors[0].message });
        }
        const { experienceLevel, targetLanguages, dailyGoalMinutes, primaryGoal } = parseResult.data;
        await (0, db_1.query)(`UPDATE profiles
       SET experience_level = $1,
           target_languages = $2,
           daily_goal_minutes = $3,
           primary_goal = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`, [experienceLevel, JSON.stringify(targetLanguages), dailyGoalMinutes, primaryGoal, req.user.id]);
        return res.json({ message: 'Onboarding settings saved successfully' });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to save onboarding options' });
    }
});
// PUT /api/auth/profile
router.put('/profile', auth_1.requireAuth, async (req, res) => {
    try {
        const { fullName, bio, dailyGoalMinutes, leaderboardVisibility, primaryGoal } = req.body;
        await (0, db_1.query)(`UPDATE profiles
       SET full_name = COALESCE($1, full_name),
           bio = COALESCE($2, bio),
           daily_goal_minutes = COALESCE($3, daily_goal_minutes),
           leaderboard_visibility = COALESCE($4, leaderboard_visibility),
           primary_goal = COALESCE($5, primary_goal),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6`, [fullName, bio, dailyGoalMinutes, leaderboardVisibility, primaryGoal, req.user.id]);
        return res.json({ message: 'Profile updated successfully' });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to update profile' });
    }
});
exports.default = router;
