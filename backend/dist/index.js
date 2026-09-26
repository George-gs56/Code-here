"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./db");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const languages_routes_1 = __importDefault(require("./routes/languages.routes"));
const lessons_routes_1 = __importDefault(require("./routes/lessons.routes"));
const assessment_routes_1 = __importDefault(require("./routes/assessment.routes"));
const challenges_routes_1 = __importDefault(require("./routes/challenges.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const leaderboard_routes_1 = __importDefault(require("./routes/leaderboard.routes"));
const achievements_routes_1 = __importDefault(require("./routes/achievements.routes"));
const notifications_routes_1 = __importDefault(require("./routes/notifications.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
dotenv_1.default.config();
exports.app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Security and utility middleware
exports.app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
exports.app.use((0, cors_1.default)({ origin: true, credentials: true }));
exports.app.use(express_1.default.json({ limit: '10mb' }));
exports.app.use((0, morgan_1.default)('dev'));
// API Routes
exports.app.use('/api/auth', auth_routes_1.default);
exports.app.use('/api/languages', languages_routes_1.default);
exports.app.use('/api/lessons', lessons_routes_1.default);
exports.app.use('/api/assessments', assessment_routes_1.default);
exports.app.use('/api/challenges', challenges_routes_1.default);
exports.app.use('/api/dashboard', dashboard_routes_1.default);
exports.app.use('/api/leaderboard', leaderboard_routes_1.default);
exports.app.use('/api/achievements', achievements_routes_1.default);
exports.app.use('/api/notifications', notifications_routes_1.default);
exports.app.use('/api/admin', admin_routes_1.default);
// Health check endpoint
exports.app.get('/api/health', (req, res) => {
    return res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
// Error handling fallback
exports.app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
});
// Initialize database and start server if executed directly
if (require.main === module) {
    (0, db_1.getDb)()
        .then(() => {
        exports.app.listen(PORT, () => {
            console.log(`🚀 CodeSphere REST API Backend running on http://localhost:${PORT}`);
        });
    })
        .catch((err) => {
        console.error('Failed to start CodeSphere backend:', err);
    });
}
