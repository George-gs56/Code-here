import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  terms: z.boolean().refine((val) => val === true, 'You must accept the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  loginIdentifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const onboardingSchema = z.object({
  experienceLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  targetLanguages: z.array(z.string()).min(1, 'Select at least one language'),
  dailyGoalMinutes: z.number().min(5).max(300),
  primaryGoal: z.string().min(1, 'Primary goal is required'),
});

export const submitAssessmentSchema = z.object({
  attemptId: z.string().uuid(),
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      selectedOption: z.number().int().min(0).max(3).nullable(),
    })
  ).length(10, 'Must submit answers for all 10 questions'),
});

export const submitChallengeSchema = z.object({
  challengeId: z.string().uuid(),
  code: z.string().min(1, 'Code cannot be empty'),
});
