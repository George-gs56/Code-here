"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/dashboard/stats - Fetch live student statistics & chart metrics
router.get('/stats', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        // 1. Lessons completed
        const lessonsRes = await (0, db_1.query)(`SELECT COUNT(*) FROM lesson_progress WHERE user_id = $1 AND status = 'completed'`, [userId]);
        const lessonsCompleted = parseInt(lessonsRes.rows[0].count) || 0;
        // 2. Total enrolled languages (languages with at least 1 lesson accessed)
        const enrolledRes = await (0, db_1.query)(`SELECT COUNT(DISTINCT c.language_id) 
       FROM lesson_progress lp
       JOIN lessons les ON les.id = lp.lesson_id
       JOIN courses c ON c.id = les.course_id
       WHERE lp.user_id = $1`, [userId]);
        const totalEnrolledLanguages = parseInt(enrolledRes.rows[0].count) || 0;
        // 3. Challenges solved
        const challengesRes = await (0, db_1.query)(`SELECT COUNT(DISTINCT challenge_id) FROM challenge_submissions WHERE user_id = $1 AND status = 'passed'`, [userId]);
        const challengesSolved = parseInt(challengesRes.rows[0].count) || 0;
        // 4. Assessment stats
        const assessmentsRes = await (0, db_1.query)(`SELECT COUNT(*) AS total_attempts,
              COUNT(*) FILTER (WHERE passed = true) AS tests_passed,
              AVG(score) AS avg_score
       FROM assessment_attempts
       WHERE user_id = $1 AND status = 'submitted'`, [userId]);
        const totalTestsAttempted = parseInt(assessmentsRes.rows[0]?.total_attempts) || 0;
        const testsPassed = parseInt(assessmentsRes.rows[0]?.tests_passed) || 0;
        const avgTestScore = parseFloat(assessmentsRes.rows[0]?.avg_score || '0').toFixed(1);
        // 5. Total learning time (seconds from learning_activity)
        const timeRes = await (0, db_1.query)(`SELECT SUM(duration_seconds) FROM learning_activity WHERE user_id = $1`, [userId]);
        const totalTimeSeconds = parseInt(timeRes.rows[0].sum) || 0;
        // 6. Current learning streak calculation
        const streakRes = await (0, db_1.query)(`SELECT DISTINCT DATE(created_at) AS activity_date
       FROM learning_activity
       WHERE user_id = $1
       ORDER BY activity_date DESC`, [userId]);
        let streak = 0;
        if (streakRes.rows.length > 0) {
            const dates = streakRes.rows.map((r) => new Date(r.activity_date));
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let checkDate = today;
            let dateIdx = 0;
            // Check if today or yesterday is present
            const firstActivity = dates[0];
            firstActivity.setHours(0, 0, 0, 0);
            const diffDays = Math.round((today.getTime() - firstActivity.getTime()) / (1000 * 3600 * 24));
            if (diffDays <= 1) {
                streak = 1;
                let prevDate = firstActivity;
                for (let i = 1; i < dates.length; i++) {
                    const d = dates[i];
                    d.setHours(0, 0, 0, 0);
                    const gap = Math.round((prevDate.getTime() - d.getTime()) / (1000 * 3600 * 24));
                    if (gap === 1) {
                        streak += 1;
                        prevDate = d;
                    }
                    else {
                        break;
                    }
                }
            }
        }
        // 7. Continue Learning section
        const continueRes = await (0, db_1.query)(`SELECT l.id AS language_id, l.name AS language_name, l.slug AS language_slug, l.icon AS language_icon,
              les.id AS last_lesson_id, les.title AS last_lesson_title, lp.completion_percentage, lp.updated_at
       FROM lesson_progress lp
       JOIN lessons les ON les.id = lp.lesson_id
       JOIN courses c ON c.id = les.course_id
       JOIN languages l ON l.id = c.language_id
       WHERE lp.user_id = $1
       ORDER BY lp.updated_at DESC
       LIMIT 4`, [userId]);
        // 8. Recent Activity feed
        const activityFeedRes = await (0, db_1.query)(`SELECT 'lesson' AS type, les.title AS title, lp.completed_at AS date
       FROM lesson_progress lp
       JOIN lessons les ON les.id = lp.lesson_id
       WHERE lp.user_id = $1 AND lp.status = 'completed'
       UNION ALL
       SELECT 'assessment' AS type, CONCAT(l.name, ' Assessment (Score: ', aa.score, '/10)') AS title, aa.submitted_at AS date
       FROM assessment_attempts aa
       JOIN assessments a ON a.id = aa.assessment_id
       JOIN languages l ON l.id = a.language_id
       WHERE aa.user_id = $1 AND aa.status = 'submitted'
       ORDER BY date DESC
       LIMIT 6`, [userId]);
        // 9. Recharts Datasets
        // A. Test Scores Over Time
        const scoreOverTimeRes = await (0, db_1.query)(`SELECT DATE(submitted_at) AS date, score, l.name AS language
       FROM assessment_attempts aa
       JOIN assessments a ON a.id = aa.assessment_id
       JOIN languages l ON l.id = a.language_id
       WHERE aa.user_id = $1 AND aa.status = 'submitted'
       ORDER BY aa.submitted_at ASC
       LIMIT 10`, [userId]);
        // B. Learning Time by Language
        const timeByLanguageRes = await (0, db_1.query)(`SELECT l.name AS language, SUM(la.duration_seconds) / 60 AS minutes
       FROM learning_activity la
       LEFT JOIN assessments a ON a.id = la.reference_id
       LEFT JOIN languages l ON l.id = a.language_id
       WHERE la.user_id = $1
       GROUP BY l.name`, [userId]);
        return res.json({
            stats: {
                totalEnrolledLanguages,
                lessonsCompleted,
                challengesSolved,
                totalTestsAttempted,
                testsPassed,
                avgTestScore,
                currentStreak: streak,
                totalLearningTimeMinutes: Math.round(totalTimeSeconds / 60),
            },
            continueLearning: continueRes.rows,
            recentActivity: activityFeedRes.rows,
            charts: {
                scoreOverTime: scoreOverTimeRes.rows,
                timeByLanguage: timeByLanguageRes.rows.filter((r) => r.language !== null),
            },
        });
    }
    catch (err) {
        console.error('Error fetching dashboard stats:', err);
        return res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
});
exports.default = router;
