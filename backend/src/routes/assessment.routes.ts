import { Router, Request, Response } from 'express';
import { query } from '../db';
import { requireAuth } from '../middleware/auth';
import { submitAssessmentSchema } from '../validators';

const router = Router();

// GET /api/assessments - List all available language assessments with user pass/fail status
router.get('/', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    let userId: string | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'codesphere_super_secret_jwt_key_2026_change_in_production';
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
        userId = decoded.id;
      } catch (e) {
        // Guest mode
      }
    }

    const assessmentsRes = await query(
      `SELECT a.id, a.title, a.description, a.question_count, a.passing_score, a.time_limit_minutes,
              l.name AS language_name, l.slug AS language_slug, l.icon AS language_icon
       FROM assessments a
       JOIN languages l ON l.id = a.language_id
       WHERE a.is_published = true
       ORDER BY l.display_order ASC`
    );

    const assessments = assessmentsRes.rows;

    if (userId) {
      for (const ass of assessments) {
        const attemptsRes = await query(
          `SELECT score, passed, created_at, status 
           FROM assessment_attempts 
           WHERE user_id = $1 AND assessment_id = $2 AND status = 'submitted'
           ORDER BY score DESC, created_at DESC`,
          [userId, ass.id]
        );

        if (attemptsRes.rows.length > 0) {
          ass.attemptCount = attemptsRes.rows.length;
          ass.bestScore = attemptsRes.rows[0].score;
          ass.hasPassed = attemptsRes.rows.some((att) => att.passed);
          ass.lastAttemptStatus = attemptsRes.rows[0].passed ? 'PASSED' : 'FAILED';
        } else {
          ass.attemptCount = 0;
          ass.bestScore = null;
          ass.hasPassed = false;
          ass.lastAttemptStatus = 'NOT_ATTEMPTED';
        }
      }
    } else {
      for (const ass of assessments) {
        ass.attemptCount = 0;
        ass.bestScore = null;
        ass.hasPassed = false;
        ass.lastAttemptStatus = 'NOT_ATTEMPTED';
      }
    }

    return res.json({ assessments });
  } catch (err) {
    console.error('Error fetching assessments:', err);
    return res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

// GET /api/assessments/language/:slug - Get assessment configuration for a language
router.get('/language/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const assRes = await query(
      `SELECT a.id, a.title, a.description, a.question_count, a.passing_score, a.time_limit_minutes,
              l.name AS language_name, l.slug AS language_slug, l.icon AS language_icon, l.id AS language_id
       FROM assessments a
       JOIN languages l ON l.id = a.language_id
       WHERE l.slug = $1 AND a.is_published = true`,
      [slug]
    );

    if (assRes.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment for specified language not found' });
    }

    return res.json({ assessment: assRes.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch assessment configuration' });
  }
});

// POST /api/assessments/:id/start - Start or restart test with FRESH 10 questions
router.post('/:id/start', requireAuth, async (req: Request, res: Response) => {
  try {
    const assessmentId = req.params.id;
    const userId = req.user!.id;

    // Verify assessment exists
    const assRes = await query('SELECT * FROM assessments WHERE id = $1 AND is_published = true', [assessmentId]);
    if (assRes.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    const assessment = assRes.rows[0];

    // Check previous attempt history for this user on this assessment
    const previousAttemptsRes = await query(
      `SELECT id, attempt_number, score, passed, status
       FROM assessment_attempts
       WHERE user_id = $1 AND assessment_id = $2
       ORDER BY attempt_number DESC
       LIMIT 1`,
      [userId, assessmentId]
    );

    const latestAttempt = previousAttemptsRes.rows[0];
    let attemptNumber = 1;
    let previousAttemptId: string | null = null;
    let excludedQuestionIds: string[] = [];

    if (latestAttempt) {
      attemptNumber = latestAttempt.attempt_number + 1;
      previousAttemptId = latestAttempt.id;

      // CRITICAL RETEST LOGIC: Get all question_ids served in previous attempt(s)
      const prevQuestionsRes = await query(
        `SELECT DISTINCT question_id 
         FROM assessment_attempt_questions aaq
         JOIN assessment_attempts aa ON aa.id = aaq.attempt_id
         WHERE aa.user_id = $1 AND aa.assessment_id = $2`,
        [userId, assessmentId]
      );
      excludedQuestionIds = prevQuestionsRes.rows.map((r) => r.question_id);
    }

    // Query active questions for language, excluding previously served questions
    let questionsQuery = `SELECT id, topic, difficulty, question_text, options 
                          FROM question_bank 
                          WHERE language_id = $1 AND is_active = true`;
    const queryParams: any[] = [assessment.language_id];

    if (excludedQuestionIds.length > 0) {
      questionsQuery += ` AND id != ALL($2)`;
      queryParams.push(excludedQuestionIds);
    }

    questionsQuery += ` ORDER BY RANDOM() LIMIT 10`;

    let eligibleQuestionsRes = await query(questionsQuery, queryParams);

    // Fallback: If not enough unused questions, fallback to excluding only the immediately preceding attempt
    if (eligibleQuestionsRes.rows.length < 10 && previousAttemptId) {
      const immediatePrevQuestionsRes = await query(
        `SELECT DISTINCT question_id FROM assessment_attempt_questions WHERE attempt_id = $1`,
        [previousAttemptId]
      );
      const immediateExcluded = immediatePrevQuestionsRes.rows.map((r) => r.question_id);

      const fallbackQuery = `SELECT id, topic, difficulty, question_text, options 
                             FROM question_bank 
                             WHERE language_id = $1 AND is_active = true AND id != ALL($2)
                             ORDER BY RANDOM() LIMIT 10`;
      eligibleQuestionsRes = await query(fallbackQuery, [assessment.language_id, immediateExcluded]);
    }

    // Check if question count is still less than 10
    if (eligibleQuestionsRes.rows.length < 10) {
      return res.status(422).json({
        error: `Insufficient eligible questions in question bank (${eligibleQuestionsRes.rows.length}/10 available). Please contact an administrator to add more questions.`,
      });
    }

    const selectedQuestions = eligibleQuestionsRes.rows;

    // Create new assessment_attempts record
    const attemptInsertRes = await query(
      `INSERT INTO assessment_attempts (user_id, assessment_id, attempt_number, status, started_at, previous_attempt_id)
       VALUES ($1, $2, $3, 'in_progress', CURRENT_TIMESTAMP, $4)
       RETURNING id, attempt_number, status, started_at`,
      [userId, assessmentId, attemptNumber, previousAttemptId]
    );

    const newAttempt = attemptInsertRes.rows[0];

    // Insert 10 assessment_attempt_questions
    const sanitizedQuestions = [];

    for (let i = 0; i < selectedQuestions.length; i++) {
      const q = selectedQuestions[i];
      await query(
        `INSERT INTO assessment_attempt_questions (attempt_id, question_id, question_order)
         VALUES ($1, $2, $3)`,
        [newAttempt.id, q.id, i + 1]
      );

      // Strip correct_option and explanation from response payload for pre-submission security!
      sanitizedQuestions.push({
        id: q.id,
        order: i + 1,
        topic: q.topic,
        difficulty: q.difficulty,
        questionText: q.question_text,
        options: q.options,
      });
    }

    return res.status(201).json({
      attemptId: newAttempt.id,
      attemptNumber: newAttempt.attempt_number,
      assessment: {
        id: assessment.id,
        title: assessment.title,
        questionCount: 10,
        passingScore: 7,
        timeLimitMinutes: assessment.time_limit_minutes,
      },
      questions: sanitizedQuestions,
    });
  } catch (err) {
    console.error('Error starting assessment:', err);
    return res.status(500).json({ error: 'Failed to start assessment' });
  }
});

// POST /api/assessments/:id/submit - Server-side grading & pass/fail result calculation
router.post('/:id/submit', requireAuth, async (req: Request, res: Response) => {
  try {
    const parseResult = submitAssessmentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { attemptId, answers } = parseResult.data;
    const userId = req.user!.id;

    // Fetch attempt and verify ownership & status
    const attemptRes = await query(
      `SELECT aa.id, aa.user_id, aa.assessment_id, aa.status, aa.started_at, aa.attempt_number,
              a.passing_score, a.title AS assessment_title, l.name AS language_name
       FROM assessment_attempts aa
       JOIN assessments a ON a.id = aa.assessment_id
       JOIN languages l ON l.id = a.language_id
       WHERE aa.id = $1 AND aa.user_id = $2`,
      [attemptId, userId]
    );

    if (attemptRes.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment attempt not found or unauthorized' });
    }

    const attempt = attemptRes.rows[0];

    // Enforce single submission rule
    if (attempt.status !== 'in_progress') {
      return res.status(400).json({ error: 'This assessment attempt has already been submitted and graded' });
    }

    // Fetch correct options and explanations for all questions in this attempt
    const questionsRes = await query(
      `SELECT qb.id, qb.question_text, qb.options, qb.correct_option, qb.explanation, qb.topic, aaq.question_order
       FROM assessment_attempt_questions aaq
       JOIN question_bank qb ON qb.id = aaq.question_id
       WHERE aaq.attempt_id = $1
       ORDER BY aaq.question_order ASC`,
      [attemptId]
    );

    const questionMap = new Map<string, any>();
    for (const q of questionsRes.rows) {
      questionMap.set(q.id, q);
    }

    let totalScore = 0;
    const detailedResults = [];

    // Map answer selections and compute total correct score out of 10
    for (const userAns of answers) {
      const q = questionMap.get(userAns.questionId);
      if (!q) continue;

      const isCorrect = userAns.selectedOption !== null && userAns.selectedOption === q.correct_option;
      if (isCorrect) {
        totalScore += 1;
      }

      // Update answer in assessment_attempt_questions
      await query(
        `UPDATE assessment_attempt_questions
         SET selected_option = $1, is_correct = $2
         WHERE attempt_id = $3 AND question_id = $4`,
        [userAns.selectedOption, isCorrect, attemptId, q.id]
      );

      detailedResults.push({
        questionId: q.id,
        order: q.question_order,
        topic: q.topic,
        questionText: q.question_text,
        options: q.options,
        selectedOption: userAns.selectedOption,
        correctOption: q.correct_option,
        isCorrect,
        explanation: q.explanation,
      });
    }

    // Mandatory Assessment Rules: Score >= 7 -> PASS; Score < 7 -> FAIL
    const passed = totalScore >= 7;

    // Calculate duration
    const startedAt = new Date(attempt.started_at).getTime();
    const now = Date.now();
    const timeTakenSeconds = Math.max(1, Math.round((now - startedAt) / 1000));

    // Update assessment_attempts
    await query(
      `UPDATE assessment_attempts
       SET status = 'submitted',
           score = $1,
           passed = $2,
           submitted_at = CURRENT_TIMESTAMP,
           time_taken_seconds = $3
       WHERE id = $4`,
      [totalScore, passed, timeTakenSeconds, attemptId]
    );

    // Record learning activity
    await query(
      `INSERT INTO learning_activity (user_id, activity_type, reference_id, duration_seconds)
       VALUES ($1, 'assessment_attempt', $2, $3)`,
      [userId, attempt.assessment_id, timeTakenSeconds]
    );

    // Handle notifications & achievements
    const newAchievements: string[] = [];

    if (passed) {
      // Award "Assessment Champion" achievement
      const achRes = await query(`SELECT id, title FROM achievements WHERE achievement_type = 'assessment_passed' AND threshold = 1`);
      if (achRes.rows.length > 0) {
        const insRes = await query(
          `INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id`,
          [userId, achRes.rows[0].id]
        );
        if (insRes.rows.length > 0) {
          newAchievements.push(achRes.rows[0].title);
        }
      }

      await query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, 'Assessment Passed! 🎉', $2, 'success')`,
        [userId, `Congratulations! You passed the ${attempt.language_name} Assessment with a score of ${totalScore}/10.`]
      );
    } else {
      await query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, 'Assessment Not Passed', $2, 'warning')`,
        [userId, `You scored ${totalScore}/10 on the ${attempt.language_name} Assessment. Retake it to get 10 new fresh questions.`]
      );
    }

    return res.json({
      attemptId,
      score: totalScore,
      totalQuestions: 10,
      passingScore: 7,
      passed,
      status: passed ? 'PASSED' : 'FAILED',
      timeTakenSeconds,
      newAchievements,
      detailedResults,
    });
  } catch (err) {
    console.error('Error submitting assessment:', err);
    return res.status(500).json({ error: 'Failed to submit and grade assessment' });
  }
});

// GET /api/assessments/attempts/:id - Fetch attempt result details
router.get('/attempts/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const attemptId = req.params.id;
    const userId = req.user!.id;

    const attemptRes = await query(
      `SELECT aa.id, aa.attempt_number, aa.status, aa.score, aa.passed, aa.started_at, aa.submitted_at, aa.time_taken_seconds,
              a.title AS assessment_title, a.passing_score, l.name AS language_name, l.slug AS language_slug
       FROM assessment_attempts aa
       JOIN assessments a ON a.id = aa.assessment_id
       JOIN languages l ON l.id = a.language_id
       WHERE aa.id = $1 AND aa.user_id = $2`,
      [attemptId, userId]
    );

    if (attemptRes.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt result not found' });
    }

    const attempt = attemptRes.rows[0];

    const questionsRes = await query(
      `SELECT qb.id, qb.question_text, qb.options, qb.correct_option, qb.explanation, qb.topic, aaq.question_order, aaq.selected_option, aaq.is_correct
       FROM assessment_attempt_questions aaq
       JOIN question_bank qb ON qb.id = aaq.question_id
       WHERE aaq.attempt_id = $1
       ORDER BY aaq.question_order ASC`,
      [attemptId]
    );

    return res.json({
      attempt,
      questions: questionsRes.rows,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch attempt details' });
  }
});

// GET /api/assessments/my-results - User's assessment history
router.get('/my-results', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const historyRes = await query(
      `SELECT aa.id, aa.attempt_number, aa.status, aa.score, aa.passed, aa.submitted_at, aa.time_taken_seconds,
              a.title AS assessment_title, l.name AS language_name, l.slug AS language_slug, l.icon AS language_icon
       FROM assessment_attempts aa
       JOIN assessments a ON a.id = aa.assessment_id
       JOIN languages l ON l.id = a.language_id
       WHERE aa.user_id = $1 AND aa.status = 'submitted'
       ORDER BY aa.submitted_at DESC`,
      [userId]
    );

    return res.json({ history: historyRes.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch assessment history' });
  }
});

export default router;
