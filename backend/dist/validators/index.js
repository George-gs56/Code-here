"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitChallengeSchema = exports.submitAssessmentSchema = exports.onboardingSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2, 'Full name must be at least 2 characters'),
    username: zod_1.z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: zod_1.z.string(),
    terms: zod_1.z.boolean().refine((val) => val === true, 'You must accept the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});
exports.loginSchema = zod_1.z.object({
    loginIdentifier: zod_1.z.string().min(1, 'Email or username is required'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.onboardingSchema = zod_1.z.object({
    experienceLevel: zod_1.z.enum(['Beginner', 'Intermediate', 'Advanced']),
    targetLanguages: zod_1.z.array(zod_1.z.string()).min(1, 'Select at least one language'),
    dailyGoalMinutes: zod_1.z.number().min(5).max(300),
    primaryGoal: zod_1.z.string().min(1, 'Primary goal is required'),
});
exports.submitAssessmentSchema = zod_1.z.object({
    attemptId: zod_1.z.string().uuid(),
    answers: zod_1.z.array(zod_1.z.object({
        questionId: zod_1.z.string().uuid(),
        selectedOption: zod_1.z.number().int().min(0).max(3).nullable(),
    })).length(10, 'Must submit answers for all 10 questions'),
});
exports.submitChallengeSchema = zod_1.z.object({
    challengeId: zod_1.z.string().uuid(),
    code: zod_1.z.string().min(1, 'Code cannot be empty'),
});
