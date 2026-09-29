"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../db");
const supabase_1 = require("../db/supabase");
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
        let supabaseUserId = null;
        let confirmationRequired = false;
        // Supabase Auth Integration for Email Confirmation
        if ((0, supabase_1.isSupabaseConfigured)() && supabase_1.supabase) {
            const { data, error } = await supabase_1.supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: 'http://localhost:3000/login',
                    data: {
                        full_name: fullName,
                        username: username,
                    },
                },
            });
            if (error) {
                return res.status(400).json({ error: `Supabase Auth Error: ${error.message}` });
            }
            if (data.user) {
                supabaseUserId = data.user.id;
                // If email confirmation is enabled in Supabase, session will be null
                confirmationRequired = !data.session;
            }
        }
        // Hash password for local profile record
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        // Insert user profile into PostgreSQL database
        const insertRes = await (0, db_1.query)(`INSERT INTO profiles (id, username, full_name, email, password_hash, role, experience_level, daily_goal_minutes, primary_goal)
       VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, 'student', 'Beginner', 30, 'Learning fundamentals')
       RETURNING id, username, email, role, full_name, experience_level, daily_goal_minutes, primary_goal`, [supabaseUserId, username, fullName, email, passwordHash]);
        const newUser = insertRes.rows[0];
        // Create welcome notification
        await (0, db_1.query)(`INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, 'Welcome to CodeSphere!', 'We are thrilled to have you! Explore languages and set your daily goal.', 'success')`, [newUser.id]);
        if (confirmationRequired) {
            return res.status(201).json({
                message: `Registration successful! A confirmation email has been sent to ${email}. Please check your inbox and confirm your email before signing in.`,
                confirmationRequired: true,
            });
        }
        const token = (0, auth_1.generateToken)(newUser);
        return res.status(201).json({
            message: 'Registration successful',
            token,
            user: newUser,
            confirmationRequired: false,
        });
    }
    catch (err) {
        console.error('Registration error:', err);
        const msg = err?.message || err?.detail || err?.code || JSON.stringify(err) || 'Unknown registration error';
        return res.status(500).json({ error: `Registration failed: ${msg}` });
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
        const isSampleUser = (loginIdentifier.toLowerCase() === 'sampleuser@gmail.com' ||
            loginIdentifier.toLowerCase() === 'sampleuser' ||
            loginIdentifier.toLowerCase() === 'sample') && password === 'Student123!';
        // Fetch profile
        let userRes = await (0, db_1.query)(`SELECT id, username, email, password_hash, role, full_name, experience_level, daily_goal_minutes, primary_goal, leaderboard_visibility
       FROM profiles 
       WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1)`, [loginIdentifier]);
        if (userRes.rows.length === 0 && isSampleUser) {
            // Auto-create sample user profile if not present
            const passwordHash = await bcryptjs_1.default.hash('Student123!', 10);
            const insertRes = await (0, db_1.query)(`INSERT INTO profiles (username, full_name, email, password_hash, role, experience_level, daily_goal_minutes, primary_goal)
         VALUES ('sampleuser', 'Sample User', 'sampleuser@gmail.com', $1, 'student', 'Intermediate', 30, 'Learning & Practice')
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
         RETURNING id, username, email, password_hash, role, full_name, experience_level, daily_goal_minutes, primary_goal, leaderboard_visibility`, [passwordHash]);
            userRes = insertRes;
        }
        if (userRes.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email/username or password' });
        }
        const user = userRes.rows[0];
        // If sample user fallback or normal auth:
        if (!isSampleUser) {
            if ((0, supabase_1.isSupabaseConfigured)() && supabase_1.supabase) {
                const { data, error } = await supabase_1.supabase.auth.signInWithPassword({
                    email: user.email,
                    password,
                });
                if (error) {
                    const errMsg = error.message.toLowerCase();
                    if (errMsg.includes('email not confirmed') || errMsg.includes('not verified') || errMsg.includes('unconfirmed') || errMsg.includes('invalid credentials')) {
                        return res.status(401).json({
                            error: error.message.includes('Email not confirmed')
                                ? 'Your email address has not been confirmed yet. Please check your inbox for the Supabase confirmation email and click the link to verify your account.'
                                : error.message
                        });
                    }
                    return res.status(401).json({ error: error.message || 'Invalid email/username or password' });
                }
                if (data?.user && !data.user.email_confirmed_at && data.user.confirmation_sent_at) {
                    return res.status(401).json({
                        error: 'Your email address has not been confirmed yet. Please check your inbox for the Supabase confirmation email and click the link to verify your account.'
                    });
                }
            }
            else {
                // Local bcrypt password check
                const passwordValid = await bcryptjs_1.default.compare(password, user.password_hash);
                if (!passwordValid) {
                    return res.status(401).json({ error: 'Invalid email/username or password' });
                }
            }
        }
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
// DELETE /api/auth/account - Permanently Delete User Account & All Associated Records
router.delete('/account', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { confirmUsername } = req.body;
        // Verify confirmation username matches
        if (!confirmUsername || confirmUsername.toLowerCase() !== req.user.username.toLowerCase()) {
            return res.status(400).json({ error: `To confirm deletion, please type your exact username "${req.user.username}"` });
        }
        // Delete from Supabase Auth if active
        if ((0, supabase_1.isSupabaseConfigured)() && supabase_1.supabase) {
            try {
                await supabase_1.supabase.auth.admin.deleteUser(userId);
            }
            catch (err) {
                console.warn('Note: Supabase Admin Delete User call:', err.message);
            }
        }
        // Cascading Delete from PostgreSQL profiles (ON DELETE CASCADE removes linked records)
        await (0, db_1.query)('DELETE FROM profiles WHERE id = $1', [userId]);
        return res.json({ message: 'Your CodeSphere account and all associated learning history have been permanently deleted.' });
    }
    catch (err) {
        console.error('Error deleting account:', err);
        return res.status(500).json({ error: 'Failed to delete user account' });
    }
});
exports.default = router;
