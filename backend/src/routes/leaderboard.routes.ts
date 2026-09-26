import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// GET /api/leaderboard - Opt-in Weekly Leaderboard Rankings
router.get('/', async (req: Request, res: Response) => {
  try {
    const leaderboardRes = await query(
      `SELECT p.id, p.username, p.full_name, p.experience_level, p.avatar_url,
              COUNT(DISTINCT lp.lesson_id) * 10 AS lesson_points,
              COUNT(DISTINCT cs.challenge_id) * 25 AS challenge_points,
              COALESCE(SUM(aa.score), 0) * 5 AS assessment_points,
              (COUNT(DISTINCT lp.lesson_id) * 10 + COUNT(DISTINCT cs.challenge_id) * 25 + COALESCE(SUM(aa.score), 0) * 5) AS total_points
       FROM profiles p
       LEFT JOIN lesson_progress lp ON lp.user_id = p.id AND lp.status = 'completed'
       LEFT JOIN challenge_submissions cs ON cs.user_id = p.id AND cs.status = 'passed'
       LEFT JOIN assessment_attempts aa ON aa.user_id = p.id AND aa.status = 'submitted'
       WHERE p.leaderboard_visibility = true
       GROUP BY p.id
       ORDER BY total_points DESC
       LIMIT 50`
    );

    const rankings = leaderboardRes.rows.map((row, index) => ({
      rank: index + 1,
      id: row.id,
      displayName: row.full_name || row.username,
      username: row.username,
      experienceLevel: row.experience_level,
      totalPoints: parseInt(row.total_points) || 0,
      lessonPoints: parseInt(row.lesson_points) || 0,
      challengePoints: parseInt(row.challenge_points) || 0,
      assessmentPoints: parseInt(row.assessment_points) || 0,
    }));

    return res.json({
      period: 'Weekly Current Cycle',
      rankings,
    });
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    return res.status(500).json({ error: 'Failed to fetch leaderboard rankings' });
  }
});

export default router;
