import { Router, Request, Response } from 'express';
import { query } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/achievements - Fetch all achievements and user earned status
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const achRes = await query(
      `SELECT a.id, a.title, a.description, a.icon, a.achievement_type, a.threshold,
              ua.earned_at
       FROM achievements a
       LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = $1
       ORDER BY a.threshold ASC`,
      [userId]
    );

    const achievements = achRes.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      icon: row.icon,
      type: row.achievement_type,
      threshold: row.threshold,
      isEarned: row.earned_at !== null,
      earnedAt: row.earned_at,
    }));

    return res.json({ achievements });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

export default router;
