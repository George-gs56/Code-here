import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { getDb } from './db';

import authRoutes from './routes/auth.routes';
import languagesRoutes from './routes/languages.routes';
import lessonsRoutes from './routes/lessons.routes';
import assessmentRoutes from './routes/assessment.routes';
import challengesRoutes from './routes/challenges.routes';
import dashboardRoutes from './routes/dashboard.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import achievementsRoutes from './routes/achievements.routes';
import notificationsRoutes from './routes/notifications.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 5000;

// Security and utility middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/languages', languagesRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  return res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling fallback
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  return res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server if executed directly
if (require.main === module) {
  getDb()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 CodeSphere REST API Backend running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to start CodeSphere backend:', err);
    });
}
