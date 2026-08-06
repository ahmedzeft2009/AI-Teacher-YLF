/* ============================================================
   AI TEACHER HUB — db.js
   طبقة قاعدة البيانات (SQLite عبر better-sqlite3)
   - ملف واحد محلي (data.db) مفيش سيرفر DB منفصل مطلوب
   - ده الأساس اللي هتُبنى عليه لوحات التحكم لاحقًا
   ============================================================ */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL'); // أداء أفضل مع كتابة/قراءة متزامنة

// ──────────────────────────────────────────────────────────────
// SCHEMA
// ──────────────────────────────────────────────────────────────

db.exec(`
-- المدارس — بيتعمل صف جديد أوتوماتيك لما مسؤول مدرسة يعمل حساب
CREATE TABLE IF NOT EXISTS schools (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  admin_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('student','teacher','parent','school_admin','ministry','tutoring_company')),
  grade         TEXT,             -- للطلاب بس
  school_id     INTEGER REFERENCES schools(id) ON DELETE SET NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ربط ولي الأمر بابنه/بنته — لازم موافقة الطالب الأول (status: pending → approved)
CREATE TABLE IF NOT EXISTS parent_student_links (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(parent_id, student_id)
);

-- سلسلة الاستمرارية (Streak) — صف واحد لكل مستخدم، بدل localStorage
CREATE TABLE IF NOT EXISTS streaks (
  user_id            INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak     INTEGER NOT NULL DEFAULT 0,
  longest_streak      INTEGER NOT NULL DEFAULT 0,
  points              INTEGER NOT NULL DEFAULT 0,
  last_activity_date  TEXT
);

-- آخر جدول دراسي اتولّد للمستخدم — صف واحد لكل مستخدم، بدل localStorage
CREATE TABLE IF NOT EXISTS study_plans (
  user_id     INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  plan_json   TEXT NOT NULL,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- سجل نشاط الطالب (لعرضه في لوحة التحكم) — كل سؤال/واجب/جدول اتولّد
CREATE TABLE IF NOT EXISTS activity_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode        TEXT NOT NULL,   -- explain | summarize | questions | homework | study_plan
  snippet     TEXT,            -- وصف قصير للنشاط (نص السؤال المختصر مثلاً)
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id, created_at DESC);

-- تسجيل اهتمام الطلاب بميزة لسه هتتعمل (مؤشر طلب حقيقي قبل ما نبني الميزة كاملة)
CREATE TABLE IF NOT EXISTS feature_interest (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature     TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, feature)
);

-- دورات شركات الدروس الخصوصية
CREATE TABLE IF NOT EXISTS courses (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  subject       TEXT,
  grade         TEXT,
  teacher_name  TEXT,
  price         REAL NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- اشتراك الطالب في دورة (بديل مبسّط لنظام دفع حقيقي)
CREATE TABLE IF NOT EXISTS course_enrollments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id   INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(course_id, student_id)
);
`);

// ──────────────────────────────────────────────────────────────
// MIGRATIONS — لقواعد بيانات اتعملت بنسخة أقدم قبل إضافة المدارس
// ──────────────────────────────────────────────────────────────

const userColumns = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
if (!userColumns.includes('school_id')) {
  db.exec('ALTER TABLE users ADD COLUMN school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL');
}

const linkColumns = db.prepare("PRAGMA table_info(parent_student_links)").all().map(c => c.name);
if (!linkColumns.includes('status')) {
  db.exec("ALTER TABLE parent_student_links ADD COLUMN status TEXT NOT NULL DEFAULT 'approved'");
  // ملحوظة: أي روابط قديمة كانت اتعملت قبل نظام الموافقة بتفضل approved تلقائيًا عشان محدش يفقد وصول كان شغال بالفعل
}

module.exports = db;
