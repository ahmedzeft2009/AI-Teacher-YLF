/* ============================================================
   AI TEACHER HUB — server.js (OPENROUTER VERSION)
   Node.js + Express backend
   - Hides API key from frontend
   - /ask-ai endpoint
   - Lesson context injection
   - Rate limiting & validation
   ============================================================ */

// ── Load env variables from .env file ──
require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const path         = require('path');
const rateLimit    = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const db   = require('./db');
const auth = require('./auth');

const app  = express();
const PORT = process.env.PORT || 3000;

// ──────────────────────────────────────────────────────────────
// CONFIGURATION
// ──────────────────────────────────────────────────────────────

// OpenRouter API Key
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// تشخيص فوري وقت تشغيل السيرفر — يوضح فورًا لو مفتاح الـ API مش متحمّل صح من .env
if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'PUT_YOUR_API_KEY_HERE') {
  console.warn('⚠️  تحذير: OPENROUTER_API_KEY مش موجود أو لسه Placeholder — تأكد من ملف .env بجانب server.js.');
} else {
  console.log(`✅ OPENROUTER_API_KEY محمّل بنجاح (${OPENROUTER_API_KEY.slice(0, 8)}...، طوله ${OPENROUTER_API_KEY.length} حرف)`);
}

// Model (OpenRouter supports many models)
const AI_MODEL = 'openai/gpt-4o-mini';
const AI_MAX_TOKENS = 1500;

// ──────────────────────────────────────────────────────────────
// MIDDLEWARE
// ──────────────────────────────────────────────────────────────

// ملحوظة: الحد اتزوّد عشان الصور بصيغة base64 بتاخد مساحة أكبر بكتير من النصوص.
// الصورة بتتصغّر في المتصفح قبل الإرسال (script.js) فمتوسط حجمها post-resize بيكون صغير،
// لكن سايبين هامش أمان يوصل لـ 8MB.
app.use(express.json({ limit: '8mb' }));

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGIN || '*'
    : '*'
}));

app.use(express.static(path.join(__dirname)));
app.use(cookieParser());
app.use(auth.attachUser); // بيحط req.user لو المستخدم مسجّل دخول، من غير ما يمنع أي طلب

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'تجاوزت الحد المسموح من الطلبات. انتظر دقيقة.' }
});

app.use('/ask-ai', limiter);

const plannerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 8,
  message: { error: 'تجاوزت الحد المسموح من طلبات توليد الجدول. انتظر دقيقة.' }
});

app.use('/generate-study-plan', plannerLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'محاولات كتير قوي. استنى شوية وحاول تاني.' }
});

app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login', authLimiter);

// ──────────────────────────────────────────────────────────────
// AUTH ROUTES
// ──────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post('/api/auth/register', async (req, res) => {
  const { email, password, full_name, role, grade, school_name, school_id } = req.body || {};

  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const cleanName  = typeof full_name === 'string' ? full_name.trim().slice(0, 100) : '';

  if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
    return res.status(400).json({ error: 'اكتب بريد إلكتروني صحيح' });
  }
  if (!cleanName || cleanName.length < 2) {
    return res.status(400).json({ error: 'اكتب الاسم كامل' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'كلمة السر لازم تكون 6 حروف/أرقام على الأقل' });
  }
  if (!auth.VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: 'اختار نوع حساب صحيح' });
  }
  const cleanGrade = (role === 'student' && typeof grade === 'string') ? grade.trim().slice(0, 20) : null;

  let cleanSchoolName = null;
  if (role === 'school_admin') {
    cleanSchoolName = typeof school_name === 'string' ? school_name.trim().slice(0, 150) : '';
    if (!cleanSchoolName || cleanSchoolName.length < 3) {
      return res.status(400).json({ error: 'اكتب اسم المدرسة كامل' });
    }
  }

  try {
    const supabase = db.supabase; // الاتصال الحقيقي بـ Supabase من ملف db.js

    // 1. التأكد هل الإيميل موجود مسبقاً؟
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingUser) {
      return res.status(409).json({ error: 'الإيميل ده متسجّل بحساب قبل كده' });
    }

    // 2. تشفير الباسورد
    const password_hash = await auth.hashPassword(password);

    // 3. إدخال المستخدم الجديد في Supabase
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{
        email: cleanEmail,
        password_hash,
        full_name: cleanName,
        role,
        grade: cleanGrade,
        school_id: school_id ? Number(school_id) : null
      }])
      .select('id, email, full_name, role')
      .single();

    if (insertError || !newUser) {
      console.error('Supabase Insert Error:', insertError);
      return res.status(500).json({ error: 'حصل خطأ أثناء إنشاء الحساب' });
    }

    const userId = newUser.id;

    // 4. لو مسؤول مدرسة، بننشئ المدرسة ونربطها بيه
    if (role === 'school_admin') {
      const { data: newSchool } = await supabase
        .from('schools')
        .insert([{ name: cleanSchoolName, admin_user_id: userId }])
        .select('id')
        .single();

      if (newSchool) {
        await supabase
          .from('users')
          .update({ school_id: newSchool.id })
          .eq('id', userId);
      }
    }

    // 5. إنشاء التوكن وتسجيل الدخول بالكويكي
    const token = auth.signToken(newUser);
    auth.setAuthCookie(res, token);

    return res.status(201).json({ user: newUser });
  } catch (err) {
    console.error('Register Exception:', err);
    return res.status(500).json({ error: 'حصل خطأ غير متوقع أثناء التسجيل' });
  }
});

// ──────────────────────────────────────────────────────────────
// PARENT ↔ STUDENT LINKING — محتاج موافقة الطالب، مش تلقائي
// ──────────────────────────────────────────────────────────────

app.post('/api/parent/link-request', auth.requireAuth, auth.requireRole('parent'), (req, res) => {
  const email = typeof req.body?.student_email === 'string' ? req.body.student_email.trim().toLowerCase() : '';
  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'اكتب بريد إلكتروني صحيح لحساب ابنك/بنتك' });
  }

  const student = db.prepare('SELECT id, full_name FROM users WHERE email = ? AND role = ?').get(email, 'student');
  if (!student) {
    return res.status(404).json({ error: 'مفيش حساب طالب بالبريد الإلكتروني ده' });
  }
  if (student.id === req.user.id) {
    return res.status(400).json({ error: 'مينفعش تربط حسابك بنفسك' });
  }

  const existing = db.prepare('SELECT status FROM parent_student_links WHERE parent_id = ? AND student_id = ?').get(req.user.id, student.id);
  if (existing) {
    return res.json({ requested: true, status: existing.status, studentName: student.full_name });
  }

  db.prepare('INSERT INTO parent_student_links (parent_id, student_id, status) VALUES (?, ?, ?)').run(req.user.id, student.id, 'pending');
  res.json({ requested: true, status: 'pending', studentName: student.full_name });
});

app.get('/api/parent/links', auth.requireAuth, auth.requireRole('parent'), (req, res) => {
  const links = db.prepare(`
    SELECT l.status, u.id AS student_id, u.full_name, u.grade
    FROM parent_student_links l JOIN users u ON u.id = l.student_id
    WHERE l.parent_id = ? ORDER BY l.created_at DESC
  `).all(req.user.id);
  res.json({ links });
});

app.get('/api/parent/dashboard', auth.requireAuth, auth.requireRole('parent'), (req, res) => {
  const approvedLinks = db.prepare(`
    SELECT u.id, u.full_name, u.grade
    FROM parent_student_links l JOIN users u ON u.id = l.student_id
    WHERE l.parent_id = ? AND l.status = 'approved'
    ORDER BY u.full_name COLLATE NOCASE
  `).all(req.user.id);

  const children = approvedLinks.map(child => {
    const streak = db.prepare('SELECT current_streak, longest_streak, points, last_activity_date FROM streaks WHERE user_id = ?').get(child.id)
      || { current_streak: 0, longest_streak: 0, points: 0, last_activity_date: null };
    const recentActivity = db.prepare(
      'SELECT mode, snippet, created_at FROM activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 5'
    ).all(child.id);
    const planRow = db.prepare('SELECT plan_json FROM study_plans WHERE user_id = ?').get(child.id);
    let planSummary = null;
    if (planRow) { try { planSummary = JSON.parse(planRow.plan_json).summary || null; } catch {} }

    return {
      id: child.id, full_name: child.full_name, grade: child.grade,
      currentStreak: streak.current_streak, longestStreak: streak.longest_streak,
      points: streak.points, lastActivityDate: streak.last_activity_date,
      recentActivity, planSummary
    };
  });

  res.json({ children });
});

app.get('/api/student/pending-requests', auth.requireAuth, auth.requireRole('student'), (req, res) => {
  const rows = db.prepare(`
    SELECT l.id AS link_id, u.full_name AS parent_name, u.email AS parent_email, l.created_at
    FROM parent_student_links l JOIN users u ON u.id = l.parent_id
    WHERE l.student_id = ? AND l.status = 'pending'
    ORDER BY l.created_at DESC
  `).all(req.user.id);
  res.json({ requests: rows });
});

app.post('/api/student/respond-request', auth.requireAuth, auth.requireRole('student'), (req, res) => {
  const linkId = Number(req.body?.link_id);
  const approve = !!req.body?.approve;
  const link = db.prepare('SELECT * FROM parent_student_links WHERE id = ? AND student_id = ?').get(linkId, req.user.id);
  if (!link) return res.status(404).json({ error: 'الطلب ده مش موجود' });

  if (approve) {
    db.prepare("UPDATE parent_student_links SET status = 'approved' WHERE id = ?").run(linkId);
  } else {
    db.prepare('DELETE FROM parent_student_links WHERE id = ?').run(linkId);
  }
  res.json({ ok: true });
});

// ──────────────────────────────────────────────────────────────
// MINISTRY DASHBOARD — نظرة على مستوى الدولة، كل المدارس مع بعض
// ──────────────────────────────────────────────────────────────

app.get('/api/ministry/dashboard', auth.requireAuth, auth.requireRole('ministry'), (req, res) => {
  const today = todayStrServer();

  const totalSchools = db.prepare('SELECT COUNT(*) AS c FROM schools').get().c;
  const totalStudents = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'student'").get().c;
  const totalTeachers = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'teacher'").get().c;

  const activeTodayRow = db.prepare(`
    SELECT COUNT(*) AS c FROM users u JOIN streaks s ON s.user_id = u.id
    WHERE u.role = 'student' AND s.last_activity_date = ?
  `).get(today);

  const avgStreakRow = db.prepare(`
    SELECT AVG(s.current_streak) AS avg FROM users u JOIN streaks s ON s.user_id = u.id
    WHERE u.role = 'student'
  `).get();

  const schools = db.prepare(`
    SELECT sc.id, sc.name,
      (SELECT COUNT(*) FROM users u WHERE u.school_id = sc.id AND u.role = 'student') AS student_count,
      (SELECT COUNT(*) FROM users u WHERE u.school_id = sc.id AND u.role = 'teacher') AS teacher_count,
      (SELECT COUNT(*) FROM users u JOIN streaks s ON s.user_id = u.id
         WHERE u.school_id = sc.id AND u.role = 'student' AND s.last_activity_date = ?) AS active_today,
      (SELECT AVG(s.current_streak) FROM users u JOIN streaks s ON s.user_id = u.id
         WHERE u.school_id = sc.id AND u.role = 'student') AS avg_streak
    FROM schools sc
    ORDER BY student_count DESC
  `).all(today);

  const gradeDistribution = db.prepare(`
    SELECT grade, COUNT(*) AS count FROM users
    WHERE role = 'student' AND grade IS NOT NULL AND grade != ''
    GROUP BY grade ORDER BY CAST(grade AS INTEGER)
  `).all();

  res.json({
    stats: {
      totalSchools, totalStudents, totalTeachers,
      activeToday: activeTodayRow.c,
      avgStreak: Math.round((avgStreakRow.avg || 0) * 10) / 10
    },
    schools: schools.map(s => ({
      ...s,
      avg_streak: Math.round((s.avg_streak || 0) * 10) / 10
    })),
    gradeDistribution
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!cleanEmail || typeof password !== 'string') {
    return res.status(400).json({ error: 'اكتب البريد الإلكتروني وكلمة السر' });
  }

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
  // رسالة الخطأ واحدة سواء الإيميل مش موجود أو الباسورد غلط، عشان محدش يعرف يجرب إيميلات موجودة
  const genericError = () => res.status(401).json({ error: 'الإيميل أو كلمة السر غلط' });

  if (!row) return genericError();

  const ok = await auth.verifyPassword(password, row.password_hash);
  if (!ok) return genericError();

  db.prepare('UPDATE users SET last_login_at = datetime(\'now\') WHERE id = ?').run(row.id);

  const user = { id: row.id, email: row.email, full_name: row.full_name, role: row.role };
  const token = auth.signToken(user);
  auth.setAuthCookie(res, token);

  return res.json({ user });
});

app.post('/api/auth/logout', (req, res) => {
  auth.clearAuthCookie(res);
  return res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'مش مسجّل دخول' });
  return res.json({ user: req.user });
});

// ──────────────────────────────────────────────────────────────
// STREAK — per-user, server-authoritative date (بدل localStorage)
// ──────────────────────────────────────────────────────────────

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];
const POINTS_PER_ACTIVITY = 10;

function todayStrServer(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function daysBetweenServer(a, b) {
  return Math.round((new Date(b+'T00:00:00') - new Date(a+'T00:00:00')) / 86400000);
}

function getOrCreateStreakRow(userId) {
  let row = db.prepare('SELECT * FROM streaks WHERE user_id = ?').get(userId);
  if (!row) {
    db.prepare('INSERT INTO streaks (user_id) VALUES (?)').run(userId);
    row = db.prepare('SELECT * FROM streaks WHERE user_id = ?').get(userId);
  }
  return row;
}

app.get('/api/streak', auth.requireAuth, (req, res) => {
  const row = getOrCreateStreakRow(req.user.id);
  const today = todayStrServer();

  if (row.last_activity_date && daysBetweenServer(row.last_activity_date, today) >= 2) {
    db.prepare('UPDATE streaks SET current_streak = 0 WHERE user_id = ?').run(req.user.id);
    row.current_streak = 0;
  }

  res.json({
    currentStreak: row.current_streak, longestStreak: row.longest_streak,
    points: row.points, didToday: row.last_activity_date === today
  });
});

app.post('/api/streak/record', auth.requireAuth, (req, res) => {
  const row = getOrCreateStreakRow(req.user.id);
  const today = todayStrServer();
  let milestone = null;

  if (row.last_activity_date === today) {
    db.prepare('UPDATE streaks SET points = points + ? WHERE user_id = ?').run(POINTS_PER_ACTIVITY, req.user.id);
  } else {
    const gap = row.last_activity_date ? daysBetweenServer(row.last_activity_date, today) : null;
    const newStreak = (gap === 1) ? row.current_streak + 1 : 1;
    const newLongest = Math.max(row.longest_streak, newStreak);
    db.prepare(`UPDATE streaks SET current_streak=?, longest_streak=?, points=points+?, last_activity_date=? WHERE user_id=?`)
      .run(newStreak, newLongest, POINTS_PER_ACTIVITY, today, req.user.id);
    if (STREAK_MILESTONES.includes(newStreak)) milestone = newStreak;
  }

  const updated = db.prepare('SELECT * FROM streaks WHERE user_id = ?').get(req.user.id);
  res.json({
    currentStreak: updated.current_streak, longestStreak: updated.longest_streak,
    points: updated.points, alreadyToday: row.last_activity_date === today, milestone
  });
});

// بيرحّل تقدم الضيف (localStorage) للحساب — بس أول مرة، ومبيدرّسش تقدم موجود بالفعل
app.post('/api/streak/migrate', auth.requireAuth, (req, res) => {
  const row = getOrCreateStreakRow(req.user.id);
  if (row.points > 0 || row.current_streak > 0) {
    return res.json({ migrated: false });
  }
  const { currentStreak, longestStreak, points, lastActivityDate } = req.body || {};
  const cs = Number.isFinite(currentStreak) ? Math.max(0, Math.floor(currentStreak)) : 0;
  const ls = Number.isFinite(longestStreak) ? Math.max(cs, Math.floor(longestStreak)) : cs;
  const pts = Number.isFinite(points) ? Math.max(0, Math.floor(points)) : 0;
  const lad = (typeof lastActivityDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(lastActivityDate)) ? lastActivityDate : null;
  db.prepare(`UPDATE streaks SET current_streak=?, longest_streak=?, points=?, last_activity_date=? WHERE user_id=?`)
    .run(cs, ls, pts, lad, req.user.id);
  res.json({ migrated: true });
});

// ──────────────────────────────────────────────────────────────
// STUDY PLAN — آخر جدول محفوظ لكل مستخدم (بدل localStorage)
// ──────────────────────────────────────────────────────────────

app.get('/api/study-plan', auth.requireAuth, (req, res) => {
  const row = db.prepare('SELECT plan_json FROM study_plans WHERE user_id = ?').get(req.user.id);
  let plan = null;
  if (row) { try { plan = JSON.parse(row.plan_json); } catch {} }
  res.json({ plan });
});

app.post('/api/study-plan', auth.requireAuth, (req, res) => {
  const { plan } = req.body || {};
  if (!plan || !Array.isArray(plan.days)) {
    return res.status(400).json({ error: 'بيانات جدول غير صحيحة' });
  }
  db.prepare(`
    INSERT INTO study_plans (user_id, plan_json, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET plan_json = excluded.plan_json, updated_at = excluded.updated_at
  `).run(req.user.id, JSON.stringify(plan));
  res.json({ ok: true });
});

// ──────────────────────────────────────────────────────────────
// ACTIVITY LOG — لعرضه في لوحة الطالب
// ──────────────────────────────────────────────────────────────

app.get('/api/activity', auth.requireAuth, (req, res) => {
  const rows = db.prepare(
    'SELECT mode, snippet, created_at FROM activity_log WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 20'
  ).all(req.user.id);
  res.json({ activity: rows });
});

// ──────────────────────────────────────────────────────────────
// FEATURE INTEREST — مؤشر طلب حقيقي على ميزات "قريبًا"
// ──────────────────────────────────────────────────────────────

const KNOWN_UPCOMING_FEATURES = ['pdf_meeting'];

app.get('/api/feature-interest/count', (req, res) => {
  const feature = KNOWN_UPCOMING_FEATURES.includes(req.query.feature) ? req.query.feature : null;
  if (!feature) return res.status(400).json({ error: 'ميزة غير معروفة' });
  const row = db.prepare('SELECT COUNT(*) AS c FROM feature_interest WHERE feature = ?').get(feature);
  const registered = req.user
    ? !!db.prepare('SELECT 1 FROM feature_interest WHERE user_id = ? AND feature = ?').get(req.user.id, feature)
    : false;
  res.json({ count: row.c, registered });
});

app.post('/api/feature-interest', auth.requireAuth, (req, res) => {
  const feature = KNOWN_UPCOMING_FEATURES.includes(req.body?.feature) ? req.body.feature : null;
  if (!feature) return res.status(400).json({ error: 'ميزة غير معروفة' });
  try {
    db.prepare('INSERT INTO feature_interest (user_id, feature) VALUES (?, ?)').run(req.user.id, feature);
  } catch {
    return res.json({ registered: true, alreadyRegistered: true }); // UNIQUE constraint = مسجّل بالفعل
  }
  res.json({ registered: true, alreadyRegistered: false });
});

// ──────────────────────────────────────────────────────────────
// LEADERBOARD — منافسة بالنقاط بين الطلاب (مدرسة أو عام)
// ──────────────────────────────────────────────────────────────

app.get('/api/leaderboard', auth.requireAuth, (req, res) => {
  const scope = req.query.scope === 'school' ? 'school' : 'global';

  let schoolId = null;
  if (scope === 'school') {
    const row = db.prepare('SELECT school_id FROM users WHERE id = ?').get(req.user.id);
    schoolId = row?.school_id || null;
    if (!schoolId) {
      return res.json({ scope, top: [], myRank: null, myPoints: null, noSchool: true });
    }
  }

  const whereSchool = scope === 'school' ? 'AND u.school_id = ?' : '';
  const params = scope === 'school' ? [schoolId] : [];

  const top = db.prepare(`
    SELECT u.id, u.full_name, u.grade,
           COALESCE(s.points, 0) AS points, COALESCE(s.current_streak, 0) AS current_streak
    FROM users u JOIN streaks s ON s.user_id = u.id
    WHERE u.role = 'student' ${whereSchool}
    ORDER BY s.points DESC, s.current_streak DESC
    LIMIT 20
  `).all(...params);

  let myRank = null, myPoints = null;
  if (req.user.role === 'student') {
    const myStreak = db.prepare('SELECT points FROM streaks WHERE user_id = ?').get(req.user.id);
    myPoints = myStreak?.points || 0;
    const rankRow = db.prepare(`
      SELECT COUNT(*) + 1 AS rank
      FROM users u JOIN streaks s ON s.user_id = u.id
      WHERE u.role = 'student' AND s.points > ? ${whereSchool}
    `).get(myPoints, ...params);
    myRank = rankRow.rank;
  }

  res.json({ scope, top, myRank, myPoints, noSchool: false });
});

// ──────────────────────────────────────────────────────────────
// ACHIEVEMENTS / BADGES — بتتحسب لايف من الإحصائيات الموجودة
// ──────────────────────────────────────────────────────────────

const BADGE_DEFS = [
  { key: 'first_step',   icon: '🌱', title: 'أول خطوة',       desc: 'اسأل أول سؤال ليك',              metric: 'total_activity', threshold: 1 },
  { key: 'hard_worker',  icon: '📚', title: 'مجتهد',          desc: '10 أنشطة',                        metric: 'total_activity', threshold: 10 },
  { key: 'pro_learner',  icon: '🎯', title: 'محترف',          desc: '50 نشاط',                         metric: 'total_activity', threshold: 50 },
  { key: 'week_streak',  icon: '🔥', title: 'أسبوع كامل',     desc: 'سلسلة 7 أيام',                     metric: 'longest_streak', threshold: 7 },
  { key: 'two_weeks',    icon: '💎', title: 'نص شهر',         desc: 'سلسلة 14 يوم',                     metric: 'longest_streak', threshold: 14 },
  { key: 'month_streak', icon: '👑', title: 'شهر كامل',       desc: 'سلسلة 30 يوم',                     metric: 'longest_streak', threshold: 30 },
  { key: 'homework_5',   icon: '📸', title: 'حلّال واجبات',   desc: '5 واجبات اتحلوا',                  metric: 'homework_count', threshold: 5 },
  { key: 'voice_5',      icon: '🎙️', title: 'متكلم بطلاقة',   desc: '5 محادثات صوتية',                  metric: 'voice_count', threshold: 5 },
  { key: 'planner_1',    icon: '📅', title: 'مخطط ذكي',       desc: 'أول جدول دراسي',                   metric: 'plan_count', threshold: 1 },
  { key: 'points_100',   icon: '⭐', title: 'صاحب نقاط',      desc: '100 نقطة',                         metric: 'points', threshold: 100 },
];

app.post('/api/quiz/submit-score', auth.requireAuth, (req, res) => {
  const score = Number(req.body?.score);
  const total = Number(req.body?.total);
  const topic = typeof req.body?.topic === 'string' ? req.body.topic.slice(0, 80) : 'اختبار';

  if (!Number.isFinite(score) || !Number.isFinite(total) || total <= 0 || score < 0 || score > total) {
    return res.status(400).json({ error: 'بيانات نتيجة غير صحيحة' });
  }

  const bonusPoints = score * 5; // 5 نقاط لكل إجابة صح
  db.prepare('INSERT OR IGNORE INTO streaks (user_id) VALUES (?)').run(req.user.id);
  db.prepare('UPDATE streaks SET points = points + ? WHERE user_id = ?').run(bonusPoints, req.user.id);

  try {
    db.prepare('INSERT INTO activity_log (user_id, mode, snippet) VALUES (?, ?, ?)')
      .run(req.user.id, 'quiz', `النتيجة ${score}/${total} — ${topic}`);
  } catch {}

  const updated = db.prepare('SELECT points FROM streaks WHERE user_id = ?').get(req.user.id);
  res.json({ ok: true, bonusPoints, totalPoints: updated.points });
});

app.get('/api/badges', auth.requireAuth, (req, res) => {
  const uid = req.user.id;
  const streak = db.prepare('SELECT longest_streak, points FROM streaks WHERE user_id = ?').get(uid) || { longest_streak: 0, points: 0 };
  const countByMode = (mode) => db.prepare('SELECT COUNT(*) AS c FROM activity_log WHERE user_id = ? AND mode = ?').get(uid, mode).c;

  const metrics = {
    total_activity: db.prepare('SELECT COUNT(*) AS c FROM activity_log WHERE user_id = ?').get(uid).c,
    longest_streak: streak.longest_streak,
    homework_count: countByMode('homework'),
    voice_count: countByMode('voice'),
    plan_count: countByMode('study_plan'),
    points: streak.points
  };

  const badges = BADGE_DEFS.map(b => ({
    key: b.key, icon: b.icon, title: b.title, desc: b.desc,
    current: metrics[b.metric], threshold: b.threshold,
    earned: metrics[b.metric] >= b.threshold
  }));

  res.json({ badges, earnedCount: badges.filter(b => b.earned).length, totalCount: badges.length });
});

// ──────────────────────────────────────────────────────────────
// LESSON DATABASE
// ──────────────────────────────────────────────────────────────

const LESSONS_DB = [
  { id: 1, grade: "7", subject: "math", lesson: "الجبر", content: "حل المعادلات..." },
  { id: 2, grade: "9", subject: "science", lesson: "نيوتن", content: "F = m × a" },
  { id: 3, grade: "10", subject: "physics", lesson: "كولوم", content: "F = k q1 q2 / r²" },
  { id: 4, grade: "11", subject: "chemistry", lesson: "الروابط", content: "أيونية وتساهمية" },
  { id: 5, grade: "6", subject: "arabic", lesson: "الجملة", content: "اسمية وفعلية" },
  { id: 6, grade: "8", subject: "history", lesson: "مصر القديمة", content: "حضارة النيل" },
  { id: 7, grade: "5", subject: "science", lesson: "الماء", content: "دورة الماء" },
  { id: 8, grade: "12", subject: "math", lesson: "التفاضل", content: "المشتقات" },
  { id: 9, grade: "3", subject: "math", lesson: "الضرب", content: "4 × 3 = 12" },
  { id: 10, grade: "10", subject: "biology", lesson: "الخلية", content: "DNA + نواة" }
];

// ──────────────────────────────────────────────────────────────
// SYSTEM PROMPT BUILDER
// ──────────────────────────────────────────────────────────────

function buildSystemPrompt(mode, lesson, hasImage, voiceLang) {
  let lessonContext = '';

  if (lesson) {
    lessonContext = `
## سياق الدرس
- المادة: ${lesson.subject}
- الصف: ${lesson.grade}
- الدرس: ${lesson.lesson}
- المحتوى: ${lesson.content}
`;
  }

  const modeInstructions = {
    explain: `
## المطلوب
اشرح المفهوم خطوة خطوة مع مثال مصري.`,

    summarize: `
## المطلوب
تلخيص في نقاط قصيرة.`,

    questions: `
## المطلوب
إنشاء أسئلة اختبار مع إجابات.`,

    homework: `
## المطلوب — حلّ / تصحيح واجب من صورة
الطالب أرفق صورة واجب منزلي أو ورقة أسئلة أو مسألة. اقرأ الصورة بعناية أولاً (النص، المعادلات، خط الطالب لو موجود)، ثم حدّد:

- لو الصورة فيها سؤال/مسألة من غير أي إجابة مكتوبة من الطالب → "حل": حلّها خطوة بخطوة بأسلوب تعليمي واضح.
- لو الصورة فيها إجابة الطالب مكتوبة (بالقلم أو مطبوعة) → "تصحيح": قيّم إجابته من 10 بناءً على مدى صحتها واكتمال خطواته، ووضّح بالتفصيل الصح والغلط وإزاي يصححها، بأسلوب تحفيزي وغير محبط أبداً حتى لو الإجابة غلط تمامًا.

⚠️ صيغة الرد إلزامية: أول سطر في الرد لازم يكون **بالظبط** واحد من السطرين دول، من غير أي كلام قبله:
النوع: حل
أو
النوع: تصحيح | التقييم: X/10
(استبدل X برقم صحيح من 0 لـ 10)

بعد السطر ده اترك سطر فاضي، وبعدين اكتب الشرح/التصحيح التفصيلي بالماركداون العادي.
لو الصورة مش واضحة أو مش تعليمية خالص، اكتب "النوع: حل" وبعدها اشرح إنك محتاج صورة أوضح.`,

    voice: `
## المطلوب — محادثة صوتية مباشرة
انت بتتكلم مع الطالب صوتيًا دلوقتي، مش بتكتبله رسالة. عشان كده ردّك لازم:
- يكون قصير ومباشر (من جملتين لحد 4 جمل عادةً)، من غير عناوين (##) أو نقط أو أي رموز Markdown، لأن الرد هيتقرأ بصوت مسموع زي ما هو.
- يكون بأسلوب محادثة طبيعي ودافئ، كإنك بتتكلم معاه وش في وش، مش بتلقي محاضرة.
- لو في تاريخ محادثة قبل كده، افتكر السياق ورد على أساسه، وكمّل الحوار بطبيعية من غير ما تكرر نفسك.
- ${voiceLang === 'en' ? 'الطالب بيتمرن على اللغة الإنجليزية دلوقتي — ردّ بالإنجليزية بأسلوب بسيط ومشجّع، وصحّح أي غلطة لغوية بلطف لو لاحظتها.' : 'ردّ بالعربية المصرية البسيطة، إلا لو الطالب اتكلم بلغة تانية فردّ بنفس لغته.'}`,

    quiz: `
## المطلوب — اختبار تفاعلي (اختيار من متعدد)
اعمل اختبار قصير من 5 أسئلة اختيار من متعدد عن الموضوع اللي الطالب كتبه، بحيث كل سؤال ليه 4 اختيارات واختيار واحد صح بس.
نوّع صعوبة الأسئلة (سهل → متوسط → صعب)، وخلّي كل سؤال يقيس فهم حقيقي مش مجرد حفظ.

⚠️ صيغة الرد إلزامية: رد بصيغة JSON فقط، من غير أي نص أو Markdown قبله أو بعده، مطابق تمامًا لهذا الشكل:
{
  "topic": "اسم الموضوع باختصار",
  "questions": [
    { "question": "نص السؤال", "options": ["اختيار 1","اختيار 2","اختيار 3","اختيار 4"], "correctIndex": 0, "explanation": "شرح قصير ليه الإجابة دي صح" }
  ]
}
لازم بالظبط 5 عناصر في "questions"، و"correctIndex" رقم من 0 لـ 3 يشير لمكان الإجابة الصحيحة في "options".`
  };

  const imageInstructions = (hasImage && mode !== 'homework') ? `
## تعليمات إضافية بخصوص الصورة المرفقة
الطالب أرفق صورة (ممكن تكون واجب منزلي، ورقة أسئلة، مسألة رياضية، أو صفحة من كتاب).
1. اقرأ محتوى الصورة بعناية أولاً (النص، المعادلات، الرسومات).
2. لو الصورة فيها سؤال أو مسألة بدون إجابة: حلّها خطوة بخطوة بأسلوب تعليمي واضح.
3. لو الصورة فيها إجابة الطالب: صحّح الإجابة، وضّح لو صح أو غلط ولماذا، وإزاي يصححها لو غلط، بأسلوب تحفيزي غير محبط.
4. لو الصورة مش واضحة أو مش تعليمية، قول ذلك بأدب واطلب صورة أوضح.
5. لو مفيش سؤال نصي مكتوب من الطالب، اعتبر طلبه هو "اشرح/حلّ محتوى هذه الصورة".` : '';

  return `
أنت مدرس خبير.

${lessonContext}
${modeInstructions[mode] || modeInstructions.explain}
${imageInstructions}

استخدم أسلوب بسيط وواضح.
`;
}

// ──────────────────────────────────────────────────────────────
// MAIN ENDPOINT
// ──────────────────────────────────────────────────────────────

// أنواع الصور المسموح بيها في الـ data URL اللي جاي من الفرونت إند
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_IMAGE_BASE64_CHARS = 7 * 1024 * 1024; // ~7M حرف base64 (هامش أمان تحت الـ 8mb body limit)

function parseImageDataUrl(image) {
  if (typeof image !== 'string') return null;
  const match = image.match(/^data:(image\/[a-zA-Z+]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return null;
  const [, mimeType, base64] = match;
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType.toLowerCase())) return null;
  if (base64.length > MAX_IMAGE_BASE64_CHARS) return null;
  return { mimeType, base64 };
}

app.post('/ask-ai', async (req, res) => {

  const { question, mode, lesson, image, history, lang } = req.body;

  const rawQuestion = typeof question === 'string' ? question.trim() : '';
  let parsedImage = null;

  if (image) {
    parsedImage = parseImageDataUrl(image);
    if (!parsedImage) {
      return res.status(400).json({ error: 'صيغة الصورة غير مدعومة أو حجمها كبير جداً' });
    }
  }

  const validModes = ['explain', 'summarize', 'questions', 'homework', 'voice', 'quiz'];
  const cleanMode = validModes.includes(mode) ? mode : 'explain';

  if (!rawQuestion && !parsedImage) {
    return res.status(400).json({ error: 'أدخل سؤال أو ارفق صورة' });
  }

  const cleanQuestion = rawQuestion.slice(0, 500);

  if (cleanMode === 'homework' && !parsedImage) {
    return res.status(400).json({ error: 'وضع "حلّ الواجب" محتاج صورة مرفقة' });
  }
  if (cleanMode === 'quiz' && !cleanQuestion) {
    return res.status(400).json({ error: 'اكتب الموضوع اللي عايز اختبار عليه' });
  }

  // تاريخ محادثة قصير لوضع الصوت بس (آخر 3 تبادلات كحد أقصى)، عشان الـ AI يفتكر السياق
  let cleanHistory = [];
  if (cleanMode === 'voice' && Array.isArray(history)) {
    cleanHistory = history
      .filter(h => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
      .slice(-6)
      .map(h => ({ role: h.role, content: h.content.slice(0, 500) }));
  }
  const cleanLang = (lang === 'en') ? 'en' : 'ar';

  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'PUT_YOUR_API_KEY_HERE') {
    return res.status(503).json({ error: 'ضع API Key في .env' });
  }

  const systemPrompt = buildSystemPrompt(cleanMode, lesson, !!parsedImage, cleanLang);

  // لو فيه صورة، نبني رسالة multimodal (نص + صورة) عشان الموديل يقدر "يشوفها"
  const userContent = parsedImage
    ? [
        { type: 'text', text: cleanQuestion || 'من فضلك حلّ أو اشرح محتوى هذه الصورة.' },
        { type: 'image_url', image_url: { url: `data:${parsedImage.mimeType};base64,${parsedImage.base64}` } }
      ]
    : cleanQuestion;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...cleanHistory,
    { role: 'user', content: userContent }
  ];

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        max_tokens: parsedImage ? Math.max(AI_MAX_TOKENS, 2000) : (cleanMode === 'voice' ? 400 : cleanMode === 'quiz' ? 1800 : AI_MAX_TOKENS),
        ...(cleanMode === 'quiz' ? { response_format: { type: 'json_object' } } : {})
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: data?.error?.message || 'AI Error'
      });
    }

    const answer = data?.choices?.[0]?.message?.content;

    if (cleanMode === 'quiz') {
      let quiz;
      try { quiz = JSON.parse(answer); }
      catch {
        const match = (answer || '').match(/\{[\s\S]*\}/);
        if (match) { try { quiz = JSON.parse(match[0]); } catch {} }
      }
      const validQuiz = quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0 &&
        quiz.questions.every(q => q && typeof q.question === 'string' && Array.isArray(q.options) &&
          q.options.length === 4 && Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex <= 3);

      if (!validQuiz) {
        return res.status(502).json({ error: 'تعذّر توليد اختبار صحيح، حاول تاني' });
      }

      if (req.user) {
        try {
          db.prepare('INSERT INTO activity_log (user_id, mode, snippet) VALUES (?, ?, ?)')
            .run(req.user.id, 'quiz', `اختبار: ${(quiz.topic || cleanQuestion).slice(0, 70)}`);
        } catch {}
      }

      return res.json({ quiz, mode: cleanMode, model: AI_MODEL });
    }

    if (req.user) {
      const snippet = cleanQuestion
        ? cleanQuestion.slice(0, 80)
        : (parsedImage ? '📷 صورة مرفقة' : '');
      try {
        db.prepare('INSERT INTO activity_log (user_id, mode, snippet) VALUES (?, ?, ?)')
          .run(req.user.id, cleanMode, snippet);
      } catch {} // فشل تسجيل النشاط مايوقفش الرد على الطالب
    }

    return res.json({
      answer,
      mode: cleanMode,
      model: AI_MODEL
    });

  } catch (err) {
    return res.status(500).json({
      error: 'Server Error'
    });
  }
});

// ──────────────────────────────────────────────────────────────
// STUDY PLANNER ENDPOINT
// ──────────────────────────────────────────────────────────────

const ARABIC_DAYS = ['السبت','الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة'];
const SUBJECT_NAMES_AR = { math:'رياضيات', science:'علوم', arabic:'لغة عربية', english:'لغة إنجليزية', history:'تاريخ', geography:'جغرافيا', physics:'فيزياء', chemistry:'كيمياء', biology:'أحياء' };
const GOAL_LABELS = { general: 'مراجعة عامة مستمرة من غير امتحان قريب', exam: 'استعداد مكثف لامتحان قريب', subject: 'تقوية مادة أو مواد معينة بالذات' };

function buildPlannerPrompt({ availableDays, hoursPerDay, subjects, examDate, goal }) {
  const subjectsAr = subjects.map(s => SUBJECT_NAMES_AR[s] || s).join('، ');
  let examContext = '';
  if (examDate) {
    const today = new Date(); today.setHours(0,0,0,0);
    const exam = new Date(examDate + 'T00:00:00');
    const daysLeft = Math.round((exam - today) / 86400000);
    if (daysLeft > 0) examContext = `\n- موعد الامتحان: بعد ${daysLeft} يوم (${examDate})`;
    else if (daysLeft === 0) examContext = `\n- الامتحان النهاردة!`;
  }

  return `
أنت خبير في التخطيط الدراسي وتنظيم الوقت للطلاب.

## بيانات الطالب
- الأيام المتاحة للمذاكرة: ${availableDays.join('، ')}
- عدد الساعات المتاحة يوميًا: ${hoursPerDay} ساعة/ساعات
- المواد المطلوب التركيز عليها: ${subjectsAr}
- الهدف: ${GOAL_LABELS[goal] || GOAL_LABELS.general}${examContext}

## المطلوب
وزّع المواد دي على الأيام المتاحة بس (من غير أي أيام تانية)، بحيث:
- كل يوم متاح يتقسم لفترات (blocks) مدة كل واحدة بين 25 و 50 دقيقة، وميزودش مجموع ساعات اليوم عن الساعات المتاحة.
- التوزيع يكون متوازن ومريح، مش كل المواد في يوم واحد، ومفيش ضغط زيادة.
- لو الهدف "استعداد لامتحان قريب"، ركّز أكتر على مواد الامتحان كل ما اقتربنا من التاريخ.
- لو مادة واحدة بس اتطلبت، نوّع بين مواضيع فرعية منها (مراجعة نظرية / حل مسائل / حل اختبارات) بدل تكرار نفس النشاط.
- اكتب "task" قصير وعملي لكل فترة (مثلاً: "مراجعة نظرية الوحدة التالتة" مش مجرد "مذاكرة").

## صيغة الرد — إلزامية
رد **بصيغة JSON فقط**، من غير أي نص أو markdown قبله أو بعده، مطابق تمامًا لهذا الشكل:
{
  "summary": "جملة تحفيزية قصيرة عن الجدول ده (سطر واحد)",
  "days": [
    { "day": "اسم اليوم بالعربي", "blocks": [ { "time": "5:00 م - 5:40 م", "subject": "اسم المادة بالعربي", "task": "وصف قصير للنشاط" } ] }
  ],
  "tips": ["نصيحة قصيرة 1", "نصيحة قصيرة 2", "نصيحة قصيرة 3"]
}
اكتب "days" فقط للأيام المتاحة اللي اتذكرت فوق، بنفس ترتيبها، وبلا أي أيام زيادة.
`;
}

app.post('/generate-study-plan', async (req, res) => {
  const { availableDays, hoursPerDay, subjects, examDate, goal } = req.body;

  if (!Array.isArray(availableDays) || availableDays.length === 0 || !availableDays.every(d => ARABIC_DAYS.includes(d))) {
    return res.status(400).json({ error: 'اختار يوم واحد على الأقل من أيام الأسبوع الصحيحة' });
  }
  if (!Array.isArray(subjects) || subjects.length === 0 || subjects.length > 6 || !subjects.every(s => Object.keys(SUBJECT_NAMES_AR).includes(s))) {
    return res.status(400).json({ error: 'اختار من مادة لـ 6 مواد صحيحة' });
  }
  const cleanHours = Number(hoursPerDay);
  if (!Number.isFinite(cleanHours) || cleanHours < 1 || cleanHours > 8) {
    return res.status(400).json({ error: 'عدد الساعات لازم يكون بين 1 و 8' });
  }
  const cleanGoal = ['general','exam','subject'].includes(goal) ? goal : 'general';
  let cleanExamDate = null;
  if (examDate && /^\d{4}-\d{2}-\d{2}$/.test(examDate)) cleanExamDate = examDate;

  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'PUT_YOUR_API_KEY_HERE') {
    return res.status(503).json({ error: 'ضع API Key في .env' });
  }

  const prompt = buildPlannerPrompt({ availableDays, hoursPerDay: cleanHours, subjects, examDate: cleanExamDate, goal: cleanGoal });

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: 'أنت مساعد تخطيط دراسي، وترد بصيغة JSON صحيحة فقط دايمًا.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2200,
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({ error: data?.error?.message || 'AI Error' });
    }

    const raw = data?.choices?.[0]?.message?.content || '';
    let plan;
    try {
      plan = JSON.parse(raw);
    } catch {
      // محاولة أخيرة: استخراج أول { ... } من النص لو فيه كلام زيادة حواليها
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) { try { plan = JSON.parse(match[0]); } catch {} }
    }

    if (!plan || !Array.isArray(plan.days)) {
      return res.status(502).json({ error: 'تعذّر توليد جدول صحيح، حاول تاني' });
    }

    if (req.user) {
      const subjectsAr = subjects.map(s => SUBJECT_NAMES_AR[s] || s).join('، ');
      try {
        db.prepare('INSERT INTO activity_log (user_id, mode, snippet) VALUES (?, ?, ?)')
          .run(req.user.id, 'study_plan', `جدول أسبوعي: ${subjectsAr}`.slice(0, 80));
      } catch {}
    }

    return res.json({ plan, model: AI_MODEL });

  } catch (err) {
    return res.status(500).json({ error: 'Server Error' });
  }
});

// ──────────────────────────────────────────────────────────────
// EXTRA ROUTES
// ──────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/lessons', (req, res) => {
  res.json(LESSONS_DB);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ──────────────────────────────────────────────────────────────
// START SERVER
// ──────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});