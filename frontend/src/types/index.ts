export interface User {
  id: string;
  username: string;
  email: string;
  role: 'student' | 'admin';
  full_name: string;
  experience_level?: string;
  learning_goals?: string[];
  daily_goal_minutes?: number;
  primary_goal?: string;
  target_languages?: string[];
  leaderboard_visibility?: boolean;
  avatar_url?: string;
  bio?: string;
  created_at?: string;
}

export interface Language {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  is_published: boolean;
  display_order: number;
  lesson_count?: number;
  course_count?: number;
  challenge_count?: number;
  assessment_count?: number;
  progress_percentage?: number;
}

export interface Course {
  id: string;
  language_id: string;
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  display_order: number;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  slug: string;
  content: string;
  code_example?: string;
  estimated_minutes: number;
  display_order: number;
  knowledge_check?: KnowledgeCheckItem[];
  status?: 'unstarted' | 'in_progress' | 'completed';
  completion_percentage?: number;
  course_title?: string;
  course_level?: string;
  language_name?: string;
  language_slug?: string;
}

export interface KnowledgeCheckItem {
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  question_count: number;
  passing_score: number;
  time_limit_minutes: number;
  language_name?: string;
  language_slug?: string;
  language_icon?: string;
  attemptCount?: number;
  bestScore?: number | null;
  hasPassed?: boolean;
  lastAttemptStatus?: 'NOT_ATTEMPTED' | 'PASSED' | 'FAILED';
}

export interface AssessmentQuestion {
  id: string;
  order: number;
  topic: string;
  difficulty: string;
  questionText: string;
  options: string[];
  selectedOption?: number | null;
  correctOption?: number;
  isCorrect?: boolean;
  explanation?: string;
}

export interface AssessmentAttemptResult {
  attemptId: string;
  score: number;
  totalQuestions: number;
  passingScore: number;
  passed: boolean;
  status: 'PASSED' | 'FAILED';
  timeTakenSeconds: number;
  newAchievements?: string[];
  detailedResults?: AssessmentQuestion[];
  attempt?: any;
  questions?: AssessmentQuestion[];
}

export interface Challenge {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  starter_code: string;
  test_cases: { input: string; expected: string }[];
  hints: string[];
  language_name?: string;
  language_slug?: string;
  language_icon?: string;
}

export interface DashboardStats {
  totalEnrolledLanguages: number;
  lessonsCompleted: number;
  challengesSolved: number;
  totalTestsAttempted: number;
  testsPassed: number;
  avgTestScore: string;
  currentStreak: number;
  totalLearningTimeMinutes: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: string;
  threshold: number;
  isEarned: boolean;
  earnedAt?: string;
}

export interface LeaderboardUser {
  rank: number;
  id: string;
  displayName: string;
  username: string;
  experienceLevel: string;
  totalPoints: number;
  lessonPoints: number;
  challengePoints: number;
  assessmentPoints: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}
