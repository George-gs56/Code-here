import { Router, Request, Response } from 'express';
import { query } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/notifications - List user notifications
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const notifRes = await query(
      `SELECT id, title, message, type, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 30`,
      [userId]
    );

    return res.json({ notifications: notifRes.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PUT /api/notifications/read-all - Mark all notifications read
router.put('/read-all', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    await query('UPDATE notifications SET is_read = true WHERE user_id = $1', [userId]);
    return res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to mark notifications read' });
  }
});

export default router;
