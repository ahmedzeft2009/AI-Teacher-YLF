/* ============================================================
   AI TEACHER HUB — auth.js
   دوال مساعدة للتسجيل والدخول: تشفير الباسورد، JWT، middleware
   ============================================================ */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';
const COOKIE_NAME = 'ai_teacher_token';

if (!JWT_SECRET || JWT_SECRET === 'PUT_A_LONG_RANDOM_SECRET_HERE') {
  console.warn('⚠️  JWT_SECRET غير مضبوط في .env — حط قيمة عشوائية طويلة قبل ما تنشر الموقع فعليًا.');
}

const VALID_ROLES = ['student', 'teacher', 'parent', 'school_admin', 'ministry', 'tutoring_company'];

async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
    JWT_SECRET || 'insecure-dev-secret-change-me',
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 أيام
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

// middleware: لو فيه توكن صحيح، يحط بيانات المستخدم في req.user. مبيرفضش الطلب لو مفيش توكن.
function attachUser(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET || 'insecure-dev-secret-change-me');
    } catch {
      req.user = null;
    }
  }
  next();
}

// middleware: يرفض الطلب لو مفيش مستخدم مسجّل دخول
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'لازم تسجّل دخول الأول' });
  next();
}

// middleware factory: يرفض الطلب لو دور المستخدم مش من ضمن الأدوار المسموح بيها
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'لازم تسجّل دخول الأول' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'مفيش صلاحية للوصول لده' });
    next();
  };
}

module.exports = {
  VALID_ROLES, COOKIE_NAME,
  hashPassword, verifyPassword,
  signToken, setAuthCookie, clearAuthCookie,
  attachUser, requireAuth, requireRole
};
