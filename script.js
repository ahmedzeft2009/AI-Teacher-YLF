/* ============================================================
   AI TEACHER HUB — script.js
   قادة مدارس الجمهورية × CSU × YLF
   ============================================================ */

// ── PARTICLES ──────────────────────────────────────────────────
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  function random(min, max) { return Math.random() * (max - min) + min; }
  function createParticle() {
    return { x: random(0,W), y: random(0,H), r: random(1,2.5), dx: random(-0.3,0.3), dy: random(-0.5,-0.1),
      opacity: random(0.1,0.5), color: Math.random()>0.6?'#3b71ff':Math.random()>0.5?'#38d9f5':'#f0c040' };
  }
  function draw() {
    ctx.clearRect(0,0,W,H);
    particles.forEach((p,i) => {
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = p.color; ctx.globalAlpha = p.opacity; ctx.fill();
      p.x += p.dx; p.y += p.dy;
      if (p.y < -5) { particles[i] = createParticle(); particles[i].y = H+5; }
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  resize(); window.addEventListener('resize', resize);
  for (let i=0; i<80; i++) particles.push(createParticle());
  draw();
})();

// ── 1. LESSON DATABASE ─────────────────────────────────────────
const LESSONS_DB = [
  { id:1, grade:"7",  subject:"math",      lesson:"الجبر – المعادلات من الدرجة الأولى",   content:"المعادلة من الدرجة الأولى هي معادلة يكون فيها المجهول مرفوعاً للأس الأول. مثال: 2x + 3 = 7. لحلّها نعزل المجهول بطرح الثوابت من طرفَي المعادلة ثم القسمة على معامل المجهول." },
  { id:2, grade:"9",  subject:"science",   lesson:"قانون نيوتن الثاني – الحركة",          content:"قانون نيوتن الثاني: القوة = الكتلة × التسارع (F = m × a). كلما زادت القوة المؤثرة على جسم زاد تسارعه، وكلما زادت كتلته قلّ تسارعه بنفس القوة." },
  { id:3, grade:"10", subject:"physics",   lesson:"الكهرباء الساكنة – قانون كولوم",       content:"قانون كولوم يصف قوة التجاذب أو التنافر بين شحنتين كهربائيتين. القوة تتناسب طردياً مع حاصل ضرب الشحنتين، وعكسياً مع مربع المسافة بينهما. F = k × q1 × q2 / r²" },
  { id:4, grade:"11", subject:"chemistry", lesson:"الجدول الدوري والروابط الكيميائية",    content:"الجدول الدوري ينظّم العناصر الكيميائية حسب عددها الذري وخصائصها. الرابطة الأيونية تنشأ بين معدن وغير معدن بنقل إلكترون، أما الرابطة التساهمية فتنشأ بين غير معدنين بالمشاركة في إلكترونات." },
  { id:5, grade:"6",  subject:"arabic",    lesson:"الجملة الاسمية والفعلية",              content:"الجملة الاسمية: تبدأ باسم وتتكوّن من مبتدأ وخبر. مثال: العِلمُ نورٌ. الجملة الفعلية: تبدأ بفعل وتتكوّن من فعل وفاعل وقد يكون لها مفعول به. مثال: يدرسُ الطالبُ الدرسَ." },
  { id:6, grade:"8",  subject:"history",   lesson:"الحضارة المصرية القديمة",              content:"نشأت الحضارة المصرية القديمة على ضفاف نهر النيل منذ أكثر من 5000 سنة. تميّزت ببناء الأهرامات والمعابد وابتكار الكتابة الهيروغليفية والتقويم الشمسي ومهارات التحنيط." },
  { id:7, grade:"5",  subject:"science",   lesson:"دورة الماء في الطبيعة",               content:"تمر المياه بدورة مستمرة في الطبيعة: التبخّر من البحار والأنهار بفعل الشمس، التكاثف في الغلاف الجوي لتكوّن السحب، ثم التساقط كمطر أو ثلج، ثم التجمّع في الأنهار والبحيرات من جديد." },
  { id:8, grade:"12", subject:"math",      lesson:"التفاضل والتكامل – المشتقات",          content:"المشتقة هي معدل تغيّر دالة ما بالنسبة لمتغيّرها. مشتقة xⁿ = n·xⁿ⁻¹. تُستخدم في إيجاد أقصى قيمة وأدنى قيمة للدوال، وحساب السرعة اللحظية في الفيزياء." },
  { id:9, grade:"3",  subject:"math",      lesson:"الضرب والقسمة",                        content:"الضرب هو جمع متكرر لعدد محدد من المرات. مثال: 4 × 3 = 12. القسمة هي العملية العكسية للضرب: 12 ÷ 3 = 4. يمكن استخدام جدول الضرب لحفظ نتائج الضرب بسهولة." },
  { id:10,grade:"10", subject:"biology",   lesson:"الخلية وأجزاؤها",                      content:"الخلية هي أصغر وحدة حيّة في الكائنات الحية. تتكوّن من: غشاء خلوي يحيط بها، سيتوبلازم يملأها، نواة تحتوي على المادة الوراثية DNA، وعضيات مختلفة كالميتوكوندريا لإنتاج الطاقة." }
];

const SUBJECT_NAMES = { math:"رياضيات",science:"علوم",arabic:"لغة عربية",english:"إنجليزية",history:"تاريخ",geography:"جغرافيا",physics:"فيزياء",chemistry:"كيمياء",biology:"أحياء" };
const MODE_LABELS   = { explain:"شرح", summarize:"ملخّص", questions:"أسئلة اختبار", homework:"حلّ الواجب" };

// ── 2. ELEMENTS ────────────────────────────────────────────────
const gradeSelect     = document.getElementById('gradeSelect');
const subjectSelect   = document.getElementById('subjectSelect');
const lessonSelect    = document.getElementById('lessonSelect');
const lessonPreview   = document.getElementById('lessonPreview');
const questionInput   = document.getElementById('questionInput');
const charCount       = document.getElementById('charCount');
const voiceBtn        = document.getElementById('voiceBtn');
const explainBtn      = document.getElementById('explainBtn');
const summarizeBtn    = document.getElementById('summarizeBtn');
const questionsBtn    = document.getElementById('questionsBtn');
const homeworkBtn     = document.getElementById('homeworkBtn');
const quizBtn         = document.getElementById('quizBtn');
const responseActionsEl = document.querySelector('.response-actions');
const loadingState    = document.getElementById('loadingState');
const loadingText     = document.getElementById('loadingText');
const emptyState      = document.getElementById('emptyState');
const responseContent = document.getElementById('responseContent');
const responseBody    = document.getElementById('responseBody');
const responseBadge   = document.getElementById('responseBadge');
const errorState      = document.getElementById('errorState');
const errorMsg        = document.getElementById('errorMsg');
const retryBtn        = document.getElementById('retryBtn');
const ttsBtn          = document.getElementById('ttsBtn');
const copyBtn         = document.getElementById('copyBtn');
const toast           = document.getElementById('toast');
const simpleToggle    = document.getElementById('simpleToggle');
const a11yPanelOverlay = document.getElementById('a11yPanelOverlay');
const a11yPanel        = document.getElementById('a11yPanel');
const a11yPanelClose   = document.getElementById('a11yPanelClose');
const a11yMasterToggle = document.getElementById('a11yMasterToggle');
const a11yReadBtn      = document.getElementById('a11yReadBtn');
const a11yStopBtn      = document.getElementById('a11yStopBtn');
const a11yFontDown     = document.getElementById('a11yFontDown');
const a11yFontReset    = document.getElementById('a11yFontReset');
const a11yFontUp       = document.getElementById('a11yFontUp');
const a11ySpeedSlow    = document.getElementById('a11ySpeedSlow');
const a11ySpeedNormal  = document.getElementById('a11ySpeedNormal');
const a11ySpeedFast    = document.getElementById('a11ySpeedFast');
const a11yDyslexiaToggle  = document.getElementById('a11yDyslexiaToggle');
const a11yGrayscaleToggle = document.getElementById('a11yGrayscaleToggle');
const a11yCursorToggle    = document.getElementById('a11yCursorToggle');
const a11yOpaqueToggle    = document.getElementById('a11yOpaqueToggle');
const a11yRulerToggle     = document.getElementById('a11yRulerToggle');
const a11yUnderlineToggle = document.getElementById('a11yUnderlineToggle');
const a11yAutoReadToggle  = document.getElementById('a11yAutoReadToggle');
const a11yVoiceCheckBtn    = document.getElementById('a11yVoiceCheckBtn');
const a11yVoiceDiagResult  = document.getElementById('a11yVoiceDiagResult');
const a11yVoicePickerWrap  = document.getElementById('a11yVoicePickerWrap');
const a11yVoicePicker      = document.getElementById('a11yVoicePicker');
const a11ySwitchScanToggle    = document.getElementById('a11ySwitchScanToggle');
const a11yScanSlow            = document.getElementById('a11yScanSlow');
const a11yScanNormal          = document.getElementById('a11yScanNormal');
const a11yScanFast            = document.getElementById('a11yScanFast');
const a11ySwitchScanIndicator = document.getElementById('a11ySwitchScanIndicator');
const a11ySwitchScanStop      = document.getElementById('a11ySwitchScanStop');
const a11yReadingRuler    = document.getElementById('a11yReadingRuler');
const a11yResetAll        = document.getElementById('a11yResetAll');
const simpleOverlay   = document.getElementById('simpleOverlay');
const simpleClose     = document.getElementById('simpleClose');
const simpleContent   = document.getElementById('simpleContent');
const simpleTtsBtn    = document.getElementById('simpleTtsBtn');
const lessonsGrid     = document.getElementById('lessonsGrid');
const navPills        = document.querySelectorAll('.nav-pill');
const imageAttachPrompt = document.getElementById('imageAttachPrompt');
const imageInput       = document.getElementById('imageInput');
const imagePreview     = document.getElementById('imagePreview');
const imagePreviewThumb= document.getElementById('imagePreviewThumb');
const removeImageBtn   = document.getElementById('removeImageBtn');
const streakWidget      = document.getElementById('streakWidget');
const streakFlame       = document.getElementById('streakFlame');
const streakCountEl     = document.getElementById('streakCount');
const streakBestEl      = document.getElementById('streakBest');
const streakPointsEl    = document.getElementById('streakPoints');
const streakTodayEl     = document.getElementById('streakToday');
const streakCelebrateOverlay = document.getElementById('streakCelebrateOverlay');
const streakCelebrateEmoji   = document.getElementById('streakCelebrateEmoji');
const streakCelebrateTitle   = document.getElementById('streakCelebrateTitle');
const streakCelebrateDesc    = document.getElementById('streakCelebrateDesc');
const streakCelebrateClose   = document.getElementById('streakCelebrateClose');
const dayPillsWrap      = document.getElementById('dayPills');
const subjectPillsWrap  = document.getElementById('subjectPills');
const goalPillsWrap     = document.getElementById('goalPills');
const examDateField     = document.getElementById('examDateField');
const examDateInput     = document.getElementById('examDateInput');
const hoursPerDaySelect = document.getElementById('hoursPerDaySelect');
const generatePlanBtn   = document.getElementById('generatePlanBtn');
const plannerHint       = document.getElementById('plannerHint');
const plannerResultCard = document.getElementById('plannerResultCard');
const plannerLoadingState = document.getElementById('plannerLoadingState');
const plannerSummary    = document.getElementById('plannerSummary');
const plannerWeekGrid   = document.getElementById('plannerWeekGrid');
const plannerTips       = document.getElementById('plannerTips');
const regeneratePlanBtn = document.getElementById('regeneratePlanBtn');
const plannerFormCard   = document.getElementById('plannerFormCard');
const authLoggedOutBtn = document.getElementById('authLoggedOutBtn');
const authUserChip     = document.getElementById('authUserChip');
const authUserName     = document.getElementById('authUserName');
const authLogoutBtn    = document.getElementById('authLogoutBtn');
const authOverlay      = document.getElementById('authOverlay');
const authClose        = document.getElementById('authClose');
const authTabLogin     = document.getElementById('authTabLogin');
const authTabRegister  = document.getElementById('authTabRegister');
const loginForm        = document.getElementById('loginForm');
const registerForm     = document.getElementById('registerForm');
const loginEmail       = document.getElementById('loginEmail');
const loginPassword    = document.getElementById('loginPassword');
const loginError       = document.getElementById('loginError');
const regName          = document.getElementById('regName');
const regEmail         = document.getElementById('regEmail');
const regPassword      = document.getElementById('regPassword');
const regRole          = document.getElementById('regRole');
const regGrade         = document.getElementById('regGrade');
const regGradeWrap     = document.getElementById('regGradeWrap');
const registerError    = document.getElementById('registerError');
const regSchoolName        = document.getElementById('regSchoolName');
const regSchoolSelectWrap  = document.getElementById('regSchoolSelectWrap');
const regSchoolSelect      = document.getElementById('regSchoolSelect');
const schoolLoginCta      = document.getElementById('schoolLoginCta');
const schoolWrongRoleCta  = document.getElementById('schoolWrongRoleCta');
const schoolContent       = document.getElementById('schoolContent');
const schoolLoginBtn      = document.getElementById('schoolLoginBtn');
const schoolWelcome       = document.getElementById('schoolWelcome');
const schoolTeachersNum   = document.getElementById('schoolTeachersNum');
const schoolStudentsNum   = document.getElementById('schoolStudentsNum');
const schoolActiveNum     = document.getElementById('schoolActiveNum');
const schoolAvgStreakNum  = document.getElementById('schoolAvgStreakNum');
const schoolTeachersList  = document.getElementById('schoolTeachersList');
const schoolStudentsList  = document.getElementById('schoolStudentsList');
const teacherLoginCta       = document.getElementById('teacherLoginCta');
const teacherWrongRoleCta   = document.getElementById('teacherWrongRoleCta');
const teacherNoSchoolCta    = document.getElementById('teacherNoSchoolCta');
const teacherContent        = document.getElementById('teacherContent');
const teacherLoginBtn       = document.getElementById('teacherLoginBtn');
const teacherWelcome        = document.getElementById('teacherWelcome');
const teacherStudentsNum    = document.getElementById('teacherStudentsNum');
const teacherActiveWeekNum  = document.getElementById('teacherActiveWeekNum');
const teacherAvgPointsNum   = document.getElementById('teacherAvgPointsNum');
const teacherHomeworkNum    = document.getElementById('teacherHomeworkNum');
const teacherAttentionList  = document.getElementById('teacherAttentionList');
const teacherStudentsList   = document.getElementById('teacherStudentsList');
const teacherGradeFilter    = document.getElementById('teacherGradeFilter');
const dashParentRequestsCard = document.getElementById('dashParentRequestsCard');
const dashParentRequestsList = document.getElementById('dashParentRequestsList');
const parentLoginCta      = document.getElementById('parentLoginCta');
const parentWrongRoleCta  = document.getElementById('parentWrongRoleCta');
const parentContent       = document.getElementById('parentContent');
const parentLoginBtn      = document.getElementById('parentLoginBtn');
const parentChildEmail    = document.getElementById('parentChildEmail');
const parentAddChildBtn   = document.getElementById('parentAddChildBtn');
const parentAddError      = document.getElementById('parentAddError');
const parentPendingCard   = document.getElementById('parentPendingCard');
const parentPendingList   = document.getElementById('parentPendingList');
const parentChildrenWrap  = document.getElementById('parentChildrenWrap');
const ministryLoginCta      = document.getElementById('ministryLoginCta');
const ministryWrongRoleCta  = document.getElementById('ministryWrongRoleCta');
const ministryContent       = document.getElementById('ministryContent');
const ministryLoginBtn      = document.getElementById('ministryLoginBtn');
const ministrySchoolsNum    = document.getElementById('ministrySchoolsNum');
const ministryStudentsNum   = document.getElementById('ministryStudentsNum');
const ministryTeachersNum   = document.getElementById('ministryTeachersNum');
const ministryActiveNum     = document.getElementById('ministryActiveNum');
const ministryGradeChart    = document.getElementById('ministryGradeChart');
const ministrySchoolsTable  = document.getElementById('ministrySchoolsTable');
const dashboardLoginCta = document.getElementById('dashboardLoginCta');
const dashboardContent  = document.getElementById('dashboardContent');
const dashboardLoginBtn = document.getElementById('dashboardLoginBtn');
const dashboardWelcome  = document.getElementById('dashboardWelcome');
const dashStreakNum     = document.getElementById('dashStreakNum');
const dashBestNum       = document.getElementById('dashBestNum');
const dashPointsNum     = document.getElementById('dashPointsNum');
const dashActivityNum   = document.getElementById('dashActivityNum');
const dashPlanPreview   = document.getElementById('dashPlanPreview');
const dashActivityList  = document.getElementById('dashActivityList');
const dashGoToPlannerBtn = document.getElementById('dashGoToPlannerBtn');
const dashBadgesCount   = document.getElementById('dashBadgesCount');
const dashBadgesGrid    = document.getElementById('dashBadgesGrid');
const leaderboardLoginCta = document.getElementById('leaderboardLoginCta');
const leaderboardLoginBtn = document.getElementById('leaderboardLoginBtn');
const leaderboardContent  = document.getElementById('leaderboardContent');
const lbScopeGlobal       = document.getElementById('lbScopeGlobal');
const lbScopeSchool       = document.getElementById('lbScopeSchool');
const myRankCard          = document.getElementById('myRankCard');
const myRankNum           = document.getElementById('myRankNum');
const myRankPoints        = document.getElementById('myRankPoints');
const leaderboardList     = document.getElementById('leaderboardList');
const voiceEntryBtn    = document.getElementById('voiceEntryBtn');
const voiceOverlay     = document.getElementById('voiceOverlay');
const voiceClose       = document.getElementById('voiceClose');
const voiceMessages    = document.getElementById('voiceMessages');
const voiceEmptyHint   = document.getElementById('voiceEmptyHint');
const voiceMicBtn      = document.getElementById('voiceMicBtn');
const voiceStatus      = document.getElementById('voiceStatus');
const voiceResetBtn    = document.getElementById('voiceResetBtn');
const voiceLangToggle  = document.getElementById('voiceLangToggle');
const soonInterestCount = document.getElementById('soonInterestCount');
const soonNotifyBtn     = document.getElementById('soonNotifyBtn');
const soonCtaText       = document.getElementById('soonCtaText');

let lastResponse='', lastMode='explain', retryPayload=null, isSpeaking=false, recognition=null, isSimpleMode=false;
let selectedImage=null; // base64 data URL (resized) of the attached image, or null

// ── 3. TABS ────────────────────────────────────────────────────
navPills.forEach(pill => {
  pill.addEventListener('click', () => {
    const tab = pill.dataset.tab; if (!tab) return;
    navPills.forEach(p => p.classList.remove('active')); pill.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    if (tab === 'lessons') renderLessonsGrid();
    if (tab === 'planner') renderSavedStudyPlan();
    if (tab === 'dashboard') renderDashboard();
    if (tab === 'leaderboard') renderLeaderboard();
    if (tab === 'pdf-soon') renderSoonPage();
    if (tab === 'school') renderSchoolDashboard();
    if (tab === 'teacher') renderTeacherDashboard();
    if (tab === 'parent') renderParentDashboard();
    if (tab === 'ministry') renderMinistryDashboard();
  });
});

// ── 3b. AUTH ───────────────────────────────────────────────────
const ROLE_LABELS = { student:'طالب', parent:'ولي أمر', teacher:'معلم', school_admin:'مسؤول مدرسة', tutoring_company:'شركة دروس', ministry:'الوزارة' };

let currentUser = null; // بيانات المستخدم لو مسجّل دخول، وإلا null (يبقى وضع ضيف/localStorage)

function showLoggedInHeader(user) {
  currentUser = user;
  authLoggedOutBtn.classList.add('hidden');
  authUserChip.classList.remove('hidden');
  authUserName.textContent = `${user.full_name} · ${ROLE_LABELS[user.role]||user.role}`;
  syncStreakForLoggedInUser();
  syncStudyPlanForLoggedInUser();
}
function showLoggedOutHeader() {
  currentUser = null;
  authLoggedOutBtn.classList.remove('hidden');
  authUserChip.classList.add('hidden');
}

async function checkSession() {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) { showLoggedOutHeader(); return; }
    const data = await res.json();
    showLoggedInHeader(data.user);
  } catch { showLoggedOutHeader(); }
}

function openAuthModal(tab = 'login') {
  authOverlay.classList.remove('hidden');
  switchAuthTab(tab);
}
function closeAuthModal() {
  authOverlay.classList.add('hidden');
  loginError.classList.add('hidden');
  registerError.classList.add('hidden');
}
function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  authTabLogin.classList.toggle('active', isLogin);
  authTabRegister.classList.toggle('active', !isLogin);
  loginForm.classList.toggle('hidden', !isLogin);
  registerForm.classList.toggle('hidden', isLogin);
}

authLoggedOutBtn.addEventListener('click', () => openAuthModal('login'));
authClose.addEventListener('click', closeAuthModal);
authOverlay.addEventListener('click', (e) => { if (e.target === authOverlay) closeAuthModal(); });
authTabLogin.addEventListener('click', () => switchAuthTab('login'));
authTabRegister.addEventListener('click', () => { switchAuthTab('register'); loadSchoolsList(); });
regRole.addEventListener('change', () => updateRegFieldsVisibility());

function updateRegFieldsVisibility() {
  const role = regRole.value;
  regGradeWrap.classList.toggle('hidden', role !== 'student');
  regSchoolName.classList.toggle('hidden', role !== 'school_admin');
  regSchoolSelectWrap.classList.toggle('hidden', !(role === 'student' || role === 'teacher'));
}
updateRegFieldsVisibility(); // الدور الافتراضي "طالب"

let schoolsListLoaded = false;
async function loadSchoolsList() {
  if (schoolsListLoaded) return;
  try {
    const res = await fetch('/api/schools');
    const data = await res.json();
    (data.schools || []).forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id; opt.textContent = s.name;
      regSchoolSelect.appendChild(opt);
    });
    schoolsListLoaded = true;
  } catch {}
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('hidden');
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail.value.trim(), password: loginPassword.value })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'حصل خطأ، حاول تاني');
    showLoggedInHeader(data.user);
    closeAuthModal();
    showToast(`أهلاً بيك يا ${data.user.full_name} 👋`, 'success');
    loginForm.reset();
  } catch (err) {
    loginError.textContent = err.message;
    loginError.classList.remove('hidden');
  } finally { submitBtn.disabled = false; }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  registerError.classList.add('hidden');
  const submitBtn = registerForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: regName.value.trim(), email: regEmail.value.trim(),
        password: regPassword.value, role: regRole.value,
        grade: regRole.value === 'student' ? regGrade.value : null,
        school_name: regRole.value === 'school_admin' ? regSchoolName.value.trim() : null,
        school_id: (regRole.value === 'student' || regRole.value === 'teacher') ? (regSchoolSelect.value || null) : null
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'حصل خطأ، حاول تاني');
    showLoggedInHeader(data.user);
    closeAuthModal();
    showToast(`تم إنشاء الحساب بنجاح، أهلاً بيك يا ${data.user.full_name} 🎉`, 'success');
    registerForm.reset();
    updateRegFieldsVisibility();
  } catch (err) {
    registerError.textContent = err.message;
    registerError.classList.remove('hidden');
  } finally { submitBtn.disabled = false; }
});

authLogoutBtn.addEventListener('click', async () => {
  try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
  showLoggedOutHeader();
  initStreak();
  if (document.getElementById('tab-planner').classList.contains('active')) renderSavedStudyPlan();
  showToast('تم تسجيل الخروج', '');
});

checkSession();

// ── 4. LESSON SELECTORS ────────────────────────────────────────
function populateLessons() {
  const grade=gradeSelect.value, subject=subjectSelect.value;
  lessonSelect.innerHTML = '<option value="">اختر الدرس</option>';
  lessonPreview.classList.add('hidden');
  if (!grade && !subject) return;
  LESSONS_DB.filter(l=>(!grade||l.grade===grade)&&(!subject||l.subject===subject)).forEach(l=>{
    const opt=document.createElement('option'); opt.value=l.id; opt.textContent=l.lesson; lessonSelect.appendChild(opt);
  });
}

gradeSelect.addEventListener('change', populateLessons);
subjectSelect.addEventListener('change', populateLessons);
lessonSelect.addEventListener('change', () => {
  const id=parseInt(lessonSelect.value); if(!id){lessonPreview.classList.add('hidden');return;}
  const lesson=LESSONS_DB.find(l=>l.id===id);
  if(lesson){lessonPreview.innerHTML=`<strong>📖 ${lesson.lesson}</strong>${lesson.content}`;lessonPreview.classList.remove('hidden');}
});

// ── 5. CHAR COUNT ──────────────────────────────────────────────
questionInput.addEventListener('input', () => {
  const len=questionInput.value.length;
  charCount.textContent=`${len} / 500 حرف`;
  charCount.classList.toggle('warn', len>450);
});

// ── 6. VOICE INPUT ─────────────────────────────────────────────
function initVoice() {
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){voiceBtn.style.opacity='0.4';voiceBtn.style.cursor='not-allowed';return;}
  recognition=new SR(); recognition.lang='ar-EG'; recognition.continuous=false; recognition.interimResults=false;
  recognition.onresult=e=>{questionInput.value=e.results[0][0].transcript;questionInput.dispatchEvent(new Event('input'));showToast('✅ تم التعرف على صوتك','success');};
  recognition.onerror=()=>{voiceBtn.classList.remove('recording');showToast('❌ لم يتم التعرف على الصوت','error');};
  recognition.onend=()=>voiceBtn.classList.remove('recording');
  voiceBtn.addEventListener('click',()=>{
    if(voiceBtn.classList.contains('recording')){recognition.stop();voiceBtn.classList.remove('recording');}
    else{recognition.start();voiceBtn.classList.add('recording');showToast('🎤 استمر في الكلام…','');}
  });
}
initVoice();

// ── 6b. IMAGE ATTACHMENT ────────────────────────────────────────
const MAX_IMAGE_DIMENSION = 1280;   // longest side after resize (px)
const IMAGE_JPEG_QUALITY  = 0.82;
const MAX_RAW_IMAGE_MB    = 8;      // reject originals bigger than this before we even try to resize
let pendingAutoSubmitMode = null;   // لو الصورة اتطلبت من زرار "حلّ الواجب"، نبعت السؤال أوتوماتيك بعد اختيارها

imageAttachPrompt.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', async () => {
  const file = imageInput.files && imageInput.files[0];
  imageInput.value = ''; // allow re-selecting the same file later
  if (!file) { pendingAutoSubmitMode = null; return; }

  if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
    showToast('❌ الصورة لازم تكون PNG أو JPG أو WEBP', 'error');
    pendingAutoSubmitMode = null;
    return;
  }
  if (file.size > MAX_RAW_IMAGE_MB * 1024 * 1024) {
    showToast(`❌ حجم الصورة كبير جداً (الحد الأقصى ${MAX_RAW_IMAGE_MB}MB)`, 'error');
    pendingAutoSubmitMode = null;
    return;
  }

  try {
    const resizedDataUrl = await resizeImageFile(file, MAX_IMAGE_DIMENSION, IMAGE_JPEG_QUALITY);
    selectedImage = resizedDataUrl;
    imagePreviewThumb.src = resizedDataUrl;
    imageAttachPrompt.classList.add('hidden');
    imagePreview.classList.remove('hidden');
    showToast('🖼️ تم إرفاق الصورة', 'success');

    if (pendingAutoSubmitMode) {
      const modeToRun = pendingAutoSubmitMode;
      pendingAutoSubmitMode = null;
      askAI(modeToRun);
    }
  } catch (err) {
    pendingAutoSubmitMode = null;
    showToast('تعذّر معالجة الصورة، جرّب صورة تانية', 'error');
  }
});

removeImageBtn.addEventListener('click', () => {
  selectedImage = null;
  imagePreviewThumb.src = '';
  imagePreview.classList.add('hidden');
  imageAttachPrompt.classList.remove('hidden');
});

// يصغّر الصورة على المتصفح قبل الإرسال عشان يقلل حجم الـ payload ويسرّع الرفع
function resizeImageFile(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read-failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode-failed'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ── 6c. STREAK SYSTEM (localStorage-based, no backend DB yet) ──
const STREAK_STORAGE_KEY = 'aiTeacherStreak';
const STREAK_MILESTONES  = [3, 7, 14, 30, 60, 100];
const POINTS_PER_ACTIVITY = 10;

function todayStr(d = new Date()) {
  // YYYY-MM-DD بالتوقيت المحلي للمتصفح
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function daysBetween(dateStrA, dateStrB) {
  const a = new Date(dateStrA + 'T00:00:00');
  const b = new Date(dateStrB + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}

function loadStreak() {
  try {
    const raw = localStorage.getItem(STREAK_STORAGE_KEY);
    if (!raw) return { currentStreak: 0, longestStreak: 0, lastActivityDate: null, points: 0 };
    const parsed = JSON.parse(raw);
    return {
      currentStreak: parsed.currentStreak || 0,
      longestStreak: parsed.longestStreak || 0,
      lastActivityDate: parsed.lastActivityDate || null,
      points: parsed.points || 0
    };
  } catch { return { currentStreak: 0, longestStreak: 0, lastActivityDate: null, points: 0 }; }
}

function saveStreak(data) {
  try { localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function renderStreak(data, didToday) {
  streakCountEl.textContent = data.currentStreak;
  streakBestEl.textContent  = data.longestStreak;
  streakPointsEl.textContent = data.points;
  streakWidget.classList.toggle('active', data.currentStreak > 0);
  streakTodayEl.textContent = didToday
    ? '✅ سجّلت النهاردة'
    : (data.currentStreak > 0 ? 'اسأل سؤال النهاردة عشان متكسرش السلسلة' : 'اسأل سؤال النهاردة وابدأ سلسلتك');
}

// بيتنادى مرة واحدة لما الصفحة تفتح (وضع ضيف)، وبعد تسجيل الخروج للرجوع لوضع الضيف
function initStreak() {
  if (currentUser) return; // المستخدم المسجّل بياخد بياناته من السيرفر عبر syncStreakForLoggedInUser
  const data = loadStreak();
  if (data.lastActivityDate) {
    const gap = daysBetween(data.lastActivityDate, todayStr());
    if (gap >= 2) { data.currentStreak = 0; saveStreak(data); } // فات يوم أو أكتر من غير نشاط
  }
  renderStreak(data, data.lastActivityDate === todayStr());
}

// بيتنادى لما المستخدم يسجّل دخول/يعمل حساب: يرحّل تقدم الضيف (لو موجود) ويجيب بيانات السيرفر
async function syncStreakForLoggedInUser() {
  try {
    const localData = loadStreak();
    if (localData.points > 0 || localData.currentStreak > 0) {
      await fetch('/api/streak/migrate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localData)
      });
    }
    const res = await fetch('/api/streak');
    const data = await res.json();
    renderStreak({ currentStreak: data.currentStreak, longestStreak: data.longestStreak, points: data.points }, data.didToday);
    localStorage.removeItem(STREAK_STORAGE_KEY); // بقت البيانات على الحساب، مفيش داعي للنسخة المحلية
  } catch {}
}

// بيتنادى بعد كل رد ناجح من الـ AI
async function recordStreakActivity() {
  if (currentUser) {
    try {
      const res = await fetch('/api/streak/record', { method: 'POST' });
      const data = await res.json();
      renderStreak({ currentStreak: data.currentStreak, longestStreak: data.longestStreak, points: data.points }, true);
      if (data.milestone) showStreakCelebration(data.milestone);
      else if (!data.alreadyToday) showToast(`🔥 يوم ${data.currentStreak} متتالي! استمر`, 'success');
    } catch {}
    return;
  }

  const data = loadStreak();
  const today = todayStr();

  if (data.lastActivityDate === today) {
    // اتسجل النهاردة بالفعل، بس بنزود نقاط المشاركة
    data.points += POINTS_PER_ACTIVITY;
    saveStreak(data);
    renderStreak(data, true);
    return;
  }

  const gap = data.lastActivityDate ? daysBetween(data.lastActivityDate, today) : null;
  const wasStreakBefore = data.currentStreak;

  if (gap === 1) {
    data.currentStreak += 1; // كمّل يوم
  } else {
    data.currentStreak = 1; // أول نشاط، أو السلسلة كانت اتكسرت
  }
  data.longestStreak = Math.max(data.longestStreak, data.currentStreak);
  data.points += POINTS_PER_ACTIVITY;
  data.lastActivityDate = today;
  saveStreak(data);
  renderStreak(data, true);

  if (STREAK_MILESTONES.includes(data.currentStreak)) {
    showStreakCelebration(data.currentStreak);
  } else if (data.currentStreak > wasStreakBefore) {
    showToast(`🔥 يوم ${data.currentStreak} متتالي! استمر`, 'success');
  }
}

function showStreakCelebration(streakDays) {
  const messages = {
    3:  { emoji:'🔥', title:'سلسلة 3 أيام!', desc:'بداية قوية! الاستمرارية هي سر التفوق، كمّل كده' },
    7:  { emoji:'🌟', title:'أسبوع كامل!', desc:'أسبوع متواصل من المذاكرة، أنت فعلاً مجتهد' },
    14: { emoji:'💎', title:'أسبوعين متتاليين!', desc:'الانضباط ده هيوصلك بعيد، افتخر بنفسك' },
    30: { emoji:'👑', title:'شهر كامل بدون انقطاع!', desc:'ده إنجاز حقيقي — أنت بقيت من نجوم المذاكرة' },
    60: { emoji:'🏆', title:'شهرين متتاليين!', desc:'استمراريتك أصبحت عادة، استمر في التميّز' },
    100:{ emoji:'🎖️', title:'100 يوم متتالي!!', desc:'إنجاز أسطوري — إنت قدوة لأي طالب تاني' }
  };
  const m = messages[streakDays] || { emoji:'🔥', title:`سلسلة ${streakDays} يوم!`, desc:'استمر كده' };
  streakCelebrateEmoji.textContent = m.emoji;
  streakCelebrateTitle.textContent = m.title;
  streakCelebrateDesc.textContent  = m.desc;
  streakCelebrateOverlay.classList.remove('hidden');
  streakWidget.classList.add('milestone');
  setTimeout(()=>streakWidget.classList.remove('milestone'), 700);
}

streakCelebrateClose.addEventListener('click', () => {
  streakCelebrateOverlay.classList.add('hidden');
});

initStreak();

// ── 6d. STUDY PLANNER ────────────────────────────────────────────
const STUDY_PLAN_STORAGE_KEY = 'aiTeacherStudyPlan';
let selectedGoal = 'general';

function togglePillGroup(wrap, selector, multi = true) {
  wrap.querySelectorAll(selector).forEach(pill => {
    pill.addEventListener('click', () => {
      if (multi) {
        pill.classList.toggle('active');
      } else {
        wrap.querySelectorAll(selector).forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
      }
      if (wrap === goalPillsWrap) {
        selectedGoal = pill.dataset.goal;
        examDateField.style.display = (selectedGoal === 'exam') ? 'block' : 'none';
      }
    });
  });
}
togglePillGroup(dayPillsWrap, '.day-pill', true);
togglePillGroup(subjectPillsWrap, '.day-pill', true);
togglePillGroup(goalPillsWrap, '.goal-pill', false);
examDateField.style.display = 'none'; // مبيّن بس لو اختار "استعداد لامتحان"

function getSelectedValues(wrap, dataAttr) {
  return Array.from(wrap.querySelectorAll('.active')).map(p => p.dataset[dataAttr]);
}

async function generateStudyPlan() {
  const availableDays = getSelectedValues(dayPillsWrap, 'day');
  const subjects = getSelectedValues(subjectPillsWrap, 'subject');
  const hoursPerDay = hoursPerDaySelect.value;
  const examDate = (selectedGoal === 'exam' && examDateInput.value) ? examDateInput.value : null;

  if (availableDays.length === 0) { showToast('⚠️ اختار يوم واحد على الأقل', 'error'); return; }
  if (subjects.length === 0) { showToast('⚠️ اختار مادة واحدة على الأقل', 'error'); return; }

  generatePlanBtn.disabled = true;
  plannerResultCard.classList.remove('hidden');
  plannerLoadingState.classList.remove('hidden');
  plannerSummary.innerHTML = ''; plannerWeekGrid.innerHTML = ''; plannerTips.innerHTML = '';
  plannerResultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

  try {
    const res = await fetch('/generate-study-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ availableDays, hoursPerDay, subjects, examDate, goal: selectedGoal })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `خطأ من الخادم (${res.status})`);

    await saveStudyPlan(data.plan);
    renderStudyPlan(data.plan);
    recordStreakActivity();
    showToast('📅 جدولك جاهز!', 'success');
  } catch (err) {
    plannerSummary.innerHTML = `<p style="color:var(--terra-l)">❌ ${err.message || 'حصل خطأ، حاول تاني'}</p>`;
  } finally {
    plannerLoadingState.classList.add('hidden');
    generatePlanBtn.disabled = false;
  }
}

async function saveStudyPlan(plan) {
  if (currentUser) {
    try {
      await fetch('/api/study-plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      });
    } catch {}
    return;
  }
  try { localStorage.setItem(STUDY_PLAN_STORAGE_KEY, JSON.stringify(plan)); } catch {}
}

async function renderSavedStudyPlan() {
  if (currentUser) {
    try {
      const res = await fetch('/api/study-plan');
      const data = await res.json();
      if (data.plan) { plannerResultCard.classList.remove('hidden'); renderStudyPlan(data.plan); }
      else plannerResultCard.classList.add('hidden');
    } catch {}
    return;
  }
  try {
    const raw = localStorage.getItem(STUDY_PLAN_STORAGE_KEY);
    if (!raw) { plannerResultCard.classList.add('hidden'); return; }
    const plan = JSON.parse(raw);
    plannerResultCard.classList.remove('hidden');
    renderStudyPlan(plan);
  } catch {}
}

// بيتنادى لما المستخدم يسجّل دخول: لو مفيش جدول محفوظ على حسابه وفيه جدول ضيف محلي، يرحّله
async function syncStudyPlanForLoggedInUser() {
  try {
    const raw = localStorage.getItem(STUDY_PLAN_STORAGE_KEY);
    const res = await fetch('/api/study-plan');
    const data = await res.json();
    if (!data.plan && raw) {
      const localPlan = JSON.parse(raw);
      await fetch('/api/study-plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: localPlan })
      });
    }
    localStorage.removeItem(STUDY_PLAN_STORAGE_KEY);
  } catch {}
}

function renderStudyPlan(plan) {
  plannerSummary.textContent = plan.summary || '';

  plannerWeekGrid.innerHTML = (plan.days || []).map(day => {
    const blocksHtml = (day.blocks && day.blocks.length)
      ? day.blocks.map(b => `
          <div class="day-plan-block">
            <span class="block-time">${escapeHtml(b.time||'')}</span>
            <div class="block-body">
              <div class="block-subject">${escapeHtml(b.subject||'')}</div>
              <div class="block-task">${escapeHtml(b.task||'')}</div>
            </div>
          </div>`).join('')
      : `<p class="day-plan-empty">يوم راحة 🌿</p>`;
    return `<div class="day-plan-card"><div class="day-plan-title">📆 ${escapeHtml(day.day||'')}</div>${blocksHtml}</div>`;
  }).join('');

  plannerTips.innerHTML = (plan.tips && plan.tips.length)
    ? `<div class="planner-tips-title">نصايح سريعة</div>` + plan.tips.map(t => `<div class="planner-tip">${escapeHtml(t)}</div>`).join('')
    : '';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

generatePlanBtn.addEventListener('click', generateStudyPlan);
regeneratePlanBtn.addEventListener('click', () => {
  plannerResultCard.classList.add('hidden');
  plannerFormCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ── 6e. STUDENT DASHBOARD ────────────────────────────────────────
dashboardLoginBtn.addEventListener('click', () => openAuthModal('login'));
dashGoToPlannerBtn.addEventListener('click', () => document.querySelector('[data-tab="planner"]').click());

function formatRelativeArabic(sqliteUtcStr) {
  if (!sqliteUtcStr) return '';
  const d = new Date(sqliteUtcStr.replace(' ', 'T') + 'Z');
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return 'الآن';
  if (diffMin < 60) return `قبل ${diffMin} دقيقة`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `قبل ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'امبارح';
  if (days < 7) return `قبل ${days} أيام`;
  return d.toLocaleDateString('ar-EG');
}

const ACTIVITY_ICONS = { explain:'🎓', summarize:'📝', questions:'❓', homework:'📸', study_plan:'📅', voice:'🎙️', quiz:'📝' };
const ACTIVITY_LABELS = { explain:'شرح', summarize:'تلخيص', questions:'أسئلة اختبار', homework:'حلّ واجب', study_plan:'توليد جدول', voice:'محادثة صوتية', quiz:'اختبار تفاعلي' };

async function renderDashboard() {
  if (!currentUser) {
    dashboardLoginCta.classList.remove('hidden');
    dashboardContent.classList.add('hidden');
    return;
  }
  dashboardLoginCta.classList.add('hidden');
  dashboardContent.classList.remove('hidden');
  dashboardWelcome.textContent = `أهلاً بيك يا ${currentUser.full_name} 👋`;

  // طلبات ربط من أولياء الأمور (بس لو الحساب طالب)
  if (currentUser.role === 'student') {
    try {
      const res = await fetch('/api/student/pending-requests');
      const data = await res.json();
      const requests = data.requests || [];
      dashParentRequestsCard.classList.toggle('hidden', requests.length === 0);
      dashParentRequestsList.innerHTML = requests.map(r => `
        <div class="school-person-row">
          <div class="school-person-avatar">${initialsOf(r.parent_name)}</div>
          <div class="school-person-body">
            <div class="school-person-name">${escapeHtml(r.parent_name)}</div>
            <div class="school-person-sub">${escapeHtml(r.parent_email)}</div>
          </div>
          <div class="request-actions">
            <button class="request-approve-btn" data-link-id="${r.link_id}" data-approve="1" title="موافقة">✓</button>
            <button class="request-reject-btn" data-link-id="${r.link_id}" data-approve="0" title="رفض">✕</button>
          </div>
        </div>`).join('');
    } catch {}
  } else {
    dashParentRequestsCard.classList.add('hidden');
  }

  // Streak + Points
  try {
    const res = await fetch('/api/streak');
    const data = await res.json();
    dashStreakNum.textContent = data.currentStreak;
    dashBestNum.textContent = data.longestStreak;
    dashPointsNum.textContent = data.points;
  } catch {}

  // Study Plan preview
  try {
    const res = await fetch('/api/study-plan');
    const data = await res.json();
    if (data.plan) {
      const daysWithWork = (data.plan.days || []).filter(d => d.blocks && d.blocks.length).length;
      dashPlanPreview.innerHTML = `
        <p style="margin-bottom:8px">${escapeHtml(data.plan.summary || '')}</p>
        <p style="color:var(--txt-3);font-size:.76rem">📆 ${daysWithWork} يوم مذاكرة في جدولك الحالي</p>`;
    } else {
      dashPlanPreview.innerHTML = `<p class="dash-plan-empty">لسه معملتش جدول دراسي — روح تبويب "📅 جدولي" وولّد واحد</p>`;
    }
  } catch {}

  // Activity log
  try {
    const res = await fetch('/api/activity');
    const data = await res.json();
    const activity = data.activity || [];
    dashActivityNum.textContent = activity.length;
    dashActivityList.innerHTML = activity.length
      ? activity.map(a => `
          <div class="dash-activity-item">
            <div class="dash-activity-icon">${ACTIVITY_ICONS[a.mode] || '💬'}</div>
            <div class="dash-activity-body">
              <div class="dash-activity-snippet">${ACTIVITY_LABELS[a.mode] || a.mode}${a.snippet ? ' · ' + escapeHtml(a.snippet) : ''}</div>
              <div class="dash-activity-time">${formatRelativeArabic(a.created_at)}</div>
            </div>
          </div>`).join('')
      : `<p class="dash-activity-empty">لسه مفيش أي نشاط مسجّل — اسأل أول سؤال ليك!</p>`;
  } catch {}

  // Badges
  try {
    const res = await fetch('/api/badges');
    const data = await res.json();
    dashBadgesCount.textContent = `${data.earnedCount}/${data.totalCount}`;
    dashBadgesGrid.innerHTML = data.badges.map(b => `
      <div class="badge-card ${b.earned ? 'earned' : 'locked'}" title="${escapeHtml(b.desc)}">
        <span class="badge-icon">${b.icon}</span>
        <span class="badge-title">${escapeHtml(b.title)}</span>
        ${b.earned ? '' : `<span class="badge-progress">${Math.min(b.current,b.threshold)}/${b.threshold}</span>`}
      </div>`).join('');

    // احتفال بأوسمة جديدة اتفتحت من أول ما فتحنا الصفحة في الجلسة دي
    const newlyEarnedKeys = data.badges.filter(b => b.earned).map(b => b.key);
    if (previouslyEarnedBadgeKeys !== null) {
      const newOnes = newlyEarnedKeys.filter(k => !previouslyEarnedBadgeKeys.includes(k));
      if (newOnes.length) {
        const badge = data.badges.find(b => b.key === newOnes[0]);
        showToast(`🏅 وسام جديد: ${badge.icon} ${badge.title}!`, 'success');
      }
    }
    previouslyEarnedBadgeKeys = newlyEarnedKeys;
  } catch {}
}
let previouslyEarnedBadgeKeys = null;

dashParentRequestsList.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-link-id]');
  if (!btn) return;
  const linkId = Number(btn.dataset.linkId);
  const approve = btn.dataset.approve === '1';
  btn.closest('.school-person-row').style.opacity = '.5';
  try {
    await fetch('/api/student/respond-request', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link_id: linkId, approve })
    });
    showToast(approve ? '✅ تم قبول طلب المتابعة' : '❌ تم رفض الطلب', approve ? 'success' : '');
    renderDashboard();
  } catch {
    showToast('حصل خطأ، حاول تاني', 'error');
  }
});

// ── 6e2. SCHOOL DASHBOARD ─────────────────────────────────────
schoolLoginBtn.addEventListener('click', () => openAuthModal('login'));

function initialsOf(name) {
  return (name || '').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function renderSchoolPersonRow(person, isStudent) {
  const streakBadge = isStudent
    ? (person.current_streak > 0
        ? `<span class="school-person-streak">🔥 ${person.current_streak} يوم</span>`
        : `<span class="school-person-streak inactive">لسه مفيش نشاط</span>`)
    : '';
  const sub = isStudent
    ? `الصف ${escapeHtml(person.grade || '—')} · ${escapeHtml(person.email)}`
    : escapeHtml(person.email);
  return `
    <div class="school-person-row">
      <div class="school-person-avatar">${initialsOf(person.full_name)}</div>
      <div class="school-person-body">
        <div class="school-person-name">${escapeHtml(person.full_name)}</div>
        <div class="school-person-sub">${sub}</div>
      </div>
      ${streakBadge}
    </div>`;
}

async function renderSchoolDashboard() {
  schoolLoginCta.classList.add('hidden');
  schoolWrongRoleCta.classList.add('hidden');
  schoolContent.classList.add('hidden');

  if (!currentUser) { schoolLoginCta.classList.remove('hidden'); return; }
  if (currentUser.role !== 'school_admin') { schoolWrongRoleCta.classList.remove('hidden'); return; }

  try {
    const res = await fetch('/api/school/dashboard');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'حصل خطأ');

    schoolContent.classList.remove('hidden');
    schoolWelcome.textContent = `🏫 ${data.school.name}`;
    schoolTeachersNum.textContent = data.stats.totalTeachers;
    schoolStudentsNum.textContent = data.stats.totalStudents;
    schoolActiveNum.textContent = data.stats.activeToday;
    schoolAvgStreakNum.textContent = data.stats.avgStreak;

    schoolTeachersList.innerHTML = data.teachers.length
      ? data.teachers.map(t => renderSchoolPersonRow(t, false)).join('')
      : `<p class="school-list-empty">لسه مفيش معلمين مسجّلين بالمدرسة دي</p>`;

    schoolStudentsList.innerHTML = data.students.length
      ? data.students.map(s => renderSchoolPersonRow(s, true)).join('')
      : `<p class="school-list-empty">لسه مفيش طلاب مسجّلين بالمدرسة دي</p>`;
  } catch (err) {
    schoolContent.classList.remove('hidden');
    schoolWelcome.textContent = `❌ ${err.message || 'حصل خطأ، حاول تاني'}`;
  }
}

// ── 6e3. TEACHER DASHBOARD ────────────────────────────────────
teacherLoginBtn.addEventListener('click', () => openAuthModal('login'));
let teacherStudentsCache = [];

function gradeLabel(grade) {
  return grade ? `الصف ${grade}` : 'بدون صف';
}

teacherGradeFilter.addEventListener('change', () => renderTeacherStudentsList());

function renderTeacherStudentsList() {
  const filterGrade = teacherGradeFilter.value;
  const filtered = filterGrade ? teacherStudentsCache.filter(s => s.grade === filterGrade) : teacherStudentsCache;

  const attention = filtered.filter(s => s.needsAttention);
  teacherAttentionList.innerHTML = attention.length
    ? attention.map(s => renderTeacherStudentRow(s)).join('')
    : `<p class="school-list-empty">كل الطلاب نشيطين، مفيش حد محتاج متابعة دلوقتي 🎉</p>`;

  teacherStudentsList.innerHTML = filtered.length
    ? filtered.map(s => renderTeacherStudentRow(s)).join('')
    : `<p class="school-list-empty">لسه مفيش طلاب في المدرسة دي بالصف ده</p>`;
}

function renderTeacherStudentRow(s) {
  const lastActive = s.last_activity_at ? formatRelativeArabic(s.last_activity_at) : 'لسه مفيش نشاط';
  const badge = s.needsAttention
    ? `<span class="school-person-streak inactive">⏸ ${lastActive}</span>`
    : `<span class="school-person-streak">🔥 ${s.current_streak} يوم</span>`;
  return `
    <div class="school-person-row">
      <div class="school-person-avatar">${initialsOf(s.full_name)}</div>
      <div class="school-person-body">
        <div class="school-person-name">${escapeHtml(s.full_name)}</div>
        <div class="school-person-sub">${gradeLabel(s.grade)} · ${s.total_activity} نشاط · ${s.homework_count} واجب · ${s.quiz_count} اختبار</div>
      </div>
      ${badge}
    </div>`;
}

async function renderTeacherDashboard() {
  teacherLoginCta.classList.add('hidden');
  teacherWrongRoleCta.classList.add('hidden');
  teacherNoSchoolCta.classList.add('hidden');
  teacherContent.classList.add('hidden');

  if (!currentUser) { teacherLoginCta.classList.remove('hidden'); return; }
  if (currentUser.role !== 'teacher') { teacherWrongRoleCta.classList.remove('hidden'); return; }

  try {
    const res = await fetch('/api/teacher/dashboard');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'حصل خطأ');

    if (!data.school) { teacherNoSchoolCta.classList.remove('hidden'); return; }

    teacherContent.classList.remove('hidden');
    teacherWelcome.textContent = `🧑‍🏫 ${data.school.name}`;
    teacherStudentsNum.textContent = data.stats.totalStudents;
    teacherActiveWeekNum.textContent = data.stats.activeThisWeek;
    teacherAvgPointsNum.textContent = data.stats.avgPoints;
    teacherHomeworkNum.textContent = data.stats.totalHomeworkSolved;

    teacherStudentsCache = data.students;

    // املأ فلتر الصفوف بالصفوف الموجودة فعليًا بين الطلاب بس
    const grades = [...new Set(data.students.map(s => s.grade).filter(Boolean))].sort((a,b)=>Number(a)-Number(b));
    teacherGradeFilter.innerHTML = '<option value="">كل الصفوف</option>' +
      grades.map(g => `<option value="${g}">الصف ${g}</option>`).join('');

    renderTeacherStudentsList();
  } catch (err) {
    teacherContent.classList.remove('hidden');
    teacherWelcome.textContent = `❌ ${err.message || 'حصل خطأ، حاول تاني'}`;
  }
}

// ── 6e4. PARENT DASHBOARD ─────────────────────────────────────
parentLoginBtn.addEventListener('click', () => openAuthModal('login'));

parentAddChildBtn.addEventListener('click', async () => {
  const email = parentChildEmail.value.trim();
  parentAddError.classList.add('hidden');
  if (!email) { parentAddError.textContent = 'اكتب بريد إلكتروني'; parentAddError.classList.remove('hidden'); return; }

  parentAddChildBtn.disabled = true;
  try {
    const res = await fetch('/api/parent/link-request', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_email: email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'حصل خطأ');

    if (data.status === 'approved') showToast(`إنت متابع لـ ${data.studentName} بالفعل ✅`, 'success');
    else showToast(`📨 اتبعت طلب لـ ${data.studentName}، مستني موافقته`, 'success');
    parentChildEmail.value = '';
    renderParentDashboard();
  } catch (err) {
    parentAddError.textContent = err.message;
    parentAddError.classList.remove('hidden');
  } finally { parentAddChildBtn.disabled = false; }
});

function renderParentChildCard(child) {
  const planHtml = child.planSummary
    ? `<div class="parent-child-plan">📅 ${escapeHtml(child.planSummary)}</div>`
    : `<div class="parent-child-plan">لسه معملش جدول دراسي</div>`;

  const activityHtml = child.recentActivity.length
    ? child.recentActivity.map(a => `
        <div class="parent-child-activity-item">${ACTIVITY_ICONS[a.mode] || '💬'} ${ACTIVITY_LABELS[a.mode] || a.mode}${a.snippet ? ' · ' + escapeHtml(a.snippet) : ''} · ${formatRelativeArabic(a.created_at)}</div>`).join('')
    : `<p class="dash-activity-empty">لسه مفيش نشاط مسجّل</p>`;

  return `
    <div class="parent-child-card">
      <div class="parent-child-header">
        <div class="school-person-avatar">${initialsOf(child.full_name)}</div>
        <div>
          <div class="parent-child-name">${escapeHtml(child.full_name)}</div>
          <div class="parent-child-grade">${gradeLabel(child.grade)}</div>
        </div>
      </div>
      <div class="parent-child-stats">
        <span class="parent-child-stat-chip">🔥 ${child.currentStreak} يوم متتالي</span>
        <span class="parent-child-stat-chip">🏆 أفضل ${child.longestStreak} يوم</span>
        <span class="parent-child-stat-chip">⭐ ${child.points} نقطة</span>
      </div>
      ${planHtml}
      <div class="parent-child-activity-title">آخر الأنشطة</div>
      ${activityHtml}
    </div>`;
}

async function renderParentDashboard() {
  parentLoginCta.classList.add('hidden');
  parentWrongRoleCta.classList.add('hidden');
  parentContent.classList.add('hidden');

  if (!currentUser) { parentLoginCta.classList.remove('hidden'); return; }
  if (currentUser.role !== 'parent') { parentWrongRoleCta.classList.remove('hidden'); return; }
  parentContent.classList.remove('hidden');

  try {
    const linksRes = await fetch('/api/parent/links');
    const linksData = await linksRes.json();
    const pending = (linksData.links || []).filter(l => l.status === 'pending');

    parentPendingCard.classList.toggle('hidden', pending.length === 0);
    parentPendingList.innerHTML = pending.map(l => `
      <div class="school-person-row">
        <div class="school-person-avatar">${initialsOf(l.full_name)}</div>
        <div class="school-person-body">
          <div class="school-person-name">${escapeHtml(l.full_name)}</div>
          <div class="school-person-sub">${gradeLabel(l.grade)} · مستني موافقته</div>
        </div>
      </div>`).join('');
  } catch {}

  try {
    const res = await fetch('/api/parent/dashboard');
    const data = await res.json();
    parentChildrenWrap.innerHTML = (data.children && data.children.length)
      ? data.children.map(c => renderParentChildCard(c)).join('')
      : `<p class="school-list-empty">لسه مفيش أطفال متابَعين — اربط حساب ابنك/بنتك من فوق</p>`;
  } catch {}
}

// ── 6e5. MINISTRY DASHBOARD ───────────────────────────────────
ministryLoginBtn.addEventListener('click', () => openAuthModal('login'));

async function renderMinistryDashboard() {
  ministryLoginCta.classList.add('hidden');
  ministryWrongRoleCta.classList.add('hidden');
  ministryContent.classList.add('hidden');

  if (!currentUser) { ministryLoginCta.classList.remove('hidden'); return; }
  if (currentUser.role !== 'ministry') { ministryWrongRoleCta.classList.remove('hidden'); return; }

  try {
    const res = await fetch('/api/ministry/dashboard');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'حصل خطأ');

    ministryContent.classList.remove('hidden');
    ministrySchoolsNum.textContent = data.stats.totalSchools;
    ministryStudentsNum.textContent = data.stats.totalStudents;
    ministryTeachersNum.textContent = data.stats.totalTeachers;
    ministryActiveNum.textContent = data.stats.activeToday;

    const maxCount = Math.max(1, ...data.gradeDistribution.map(g => g.count));
    ministryGradeChart.innerHTML = data.gradeDistribution.length
      ? data.gradeDistribution.map(g => `
          <div class="ministry-grade-row">
            <span class="ministry-grade-label">${gradeLabel(g.grade)}</span>
            <div class="ministry-grade-bar-wrap"><div class="ministry-grade-bar" style="width:${(g.count/maxCount*100).toFixed(0)}%"></div></div>
            <span class="ministry-grade-count">${g.count}</span>
          </div>`).join('')
      : `<p class="school-list-empty">لسه مفيش طلاب مسجّلين بصفوف محددة</p>`;

    ministrySchoolsTable.innerHTML = data.schools.length
      ? data.schools.map(s => `
          <div class="ministry-school-row">
            <span class="ministry-school-name">🏫 ${escapeHtml(s.name)}</span>
            <div class="ministry-school-stats">
              <span class="ministry-school-chip">🎓 ${s.student_count}</span>
              <span class="ministry-school-chip">🧑‍🏫 ${s.teacher_count}</span>
              <span class="ministry-school-chip">✅ ${s.active_today} النهاردة</span>
              <span class="ministry-school-chip">🔥 ${s.avg_streak} متوسط</span>
            </div>
          </div>`).join('')
      : `<p class="school-list-empty">لسه مفيش مدارس مسجّلة على المنصة</p>`;
  } catch (err) {
    ministryContent.classList.remove('hidden');
    ministrySchoolsTable.innerHTML = `<p class="school-list-empty">❌ ${err.message || 'حصل خطأ، حاول تاني'}</p>`;
  }
}

// ── 6e6. LEADERBOARD ──────────────────────────────────────────
leaderboardLoginBtn.addEventListener('click', () => openAuthModal('login'));
let currentLbScope = 'global';

lbScopeGlobal.addEventListener('click', () => { setLbScope('global'); });
lbScopeSchool.addEventListener('click', () => { setLbScope('school'); });

function setLbScope(scope) {
  currentLbScope = scope;
  lbScopeGlobal.classList.toggle('active', scope === 'global');
  lbScopeSchool.classList.toggle('active', scope === 'school');
  renderLeaderboard();
}

async function renderLeaderboard() {
  leaderboardLoginCta.classList.add('hidden');
  leaderboardContent.classList.add('hidden');
  if (!currentUser) { leaderboardLoginCta.classList.remove('hidden'); return; }
  leaderboardContent.classList.remove('hidden');

  try {
    const res = await fetch(`/api/leaderboard?scope=${currentLbScope}`);
    const data = await res.json();

    if (data.noSchool) {
      myRankCard.classList.add('hidden');
      leaderboardList.innerHTML = `<p class="school-list-empty">حسابك مش مرتبط بمدرسة، فمينفعش نعرض ترتيب مدرستك. جرّب "🌍 عام" بدل كده</p>`;
      return;
    }

    if (data.myRank) {
      myRankCard.classList.remove('hidden');
      myRankNum.textContent = `#${data.myRank}`;
      myRankPoints.textContent = `${data.myPoints} نقطة`;
    } else {
      myRankCard.classList.add('hidden');
    }

    leaderboardList.innerHTML = data.top.length
      ? data.top.map((s, i) => {
          const rank = i + 1;
          const topClass = rank <= 3 ? `top${rank}` : '';
          const isMe = currentUser.role === 'student' && s.id === currentUser.id;
          const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
          return `
            <div class="leaderboard-row ${topClass} ${isMe ? 'is-me' : ''}">
              <span class="leaderboard-rank">${medal}</span>
              <div class="school-person-avatar">${initialsOf(s.full_name)}</div>
              <div class="leaderboard-body">
                <div class="leaderboard-name">${escapeHtml(s.full_name)}${isMe ? ' (إنت)' : ''}</div>
                <div class="leaderboard-sub">${gradeLabel(s.grade)} · 🔥 ${s.current_streak} يوم</div>
              </div>
              <div class="leaderboard-points">${s.points} نقطة</div>
            </div>`;
        }).join('')
      : `<p class="school-list-empty">لسه مفيش طلاب لهم نقاط في القائمة دي</p>`;
  } catch {
    leaderboardList.innerHTML = `<p class="school-list-empty">حصل خطأ، حاول تاني</p>`;
  }
}

// ── 6f. VOICE CHAT (المحادثة الصوتية) ────────────────────────────
let voiceLang = 'ar';           // 'ar' | 'en'
let voiceHistory = [];          // [{role:'user'|'assistant', content:string}, ...]
let voiceRecognition = null;
let voiceState = 'idle';        // idle | listening | thinking | speaking

function voiceSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function initVoiceChat() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    voiceEntryBtn.style.opacity = '0.4';
    voiceEntryBtn.style.cursor = 'not-allowed';
    voiceEntryBtn.title = 'المتصفح ده مش بيدعم التعرف على الصوت';
    return;
  }
  voiceRecognition = new SR();
  voiceRecognition.continuous = false;
  voiceRecognition.interimResults = false;

  voiceRecognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    addVoiceBubble('user', transcript);
    voiceHistory.push({ role: 'user', content: transcript });
    sendVoiceMessage(transcript);
  };
  voiceRecognition.onerror = () => {
    setVoiceState('idle');
    showToast('❌ لم يتم التعرف على الصوت، حاول تاني', 'error');
  };
  voiceRecognition.onend = () => {
    if (voiceState === 'listening') setVoiceState('idle');
  };
}
initVoiceChat();

function setVoiceState(state) {
  voiceState = state;
  voiceMicBtn.classList.remove('listening', 'thinking', 'speaking');
  voiceMicBtn.disabled = false;
  if (state === 'listening') { voiceMicBtn.classList.add('listening'); voiceStatus.textContent = '🎤 بسمعك… اتكلم دلوقتي'; voiceMicBtn.setAttribute('aria-label','جاري الاستماع، اضغط للإيقاف'); }
  else if (state === 'thinking') { voiceMicBtn.classList.add('thinking'); voiceMicBtn.disabled = true; voiceStatus.textContent = '🤔 بيفكر…'; voiceMicBtn.setAttribute('aria-label','المعلم الذكي بيفكر في الرد'); }
  else if (state === 'speaking') { voiceMicBtn.classList.add('speaking'); voiceStatus.textContent = '🔊 بيتكلم… اضغط للمقاطعة'; voiceMicBtn.setAttribute('aria-label','جاري الرد صوتيًا، اضغط للمقاطعة'); }
  else { voiceStatus.textContent = 'اضغط للتكلم'; voiceMicBtn.setAttribute('aria-label','اضغط للتحدث'); }
}

function addVoiceBubble(role, text) {
  voiceEmptyHint.style.display = 'none';
  const bubble = document.createElement('div');
  bubble.className = `voice-bubble ${role}`;
  bubble.textContent = text;
  voiceMessages.appendChild(bubble);
  voiceMessages.scrollTop = voiceMessages.scrollHeight;
  return bubble;
}

async function sendVoiceMessage(transcript) {
  setVoiceState('thinking');
  const thinkingBubble = addVoiceBubble('assistant', '...');
  thinkingBubble.classList.add('thinking');

  try {
    const res = await fetch('/ask-ai', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: transcript, mode: 'voice', lang: voiceLang,
        history: voiceHistory.slice(-6)
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'حصل خطأ، حاول تاني');

    thinkingBubble.remove();
    addVoiceBubble('assistant', data.answer);
    voiceHistory.push({ role: 'assistant', content: data.answer });
    recordStreakActivity();
    speakVoiceAnswer(data.answer);
  } catch (err) {
    thinkingBubble.remove();
    addVoiceBubble('assistant', `❌ ${err.message || 'حصل خطأ، حاول تاني'}`);
    setVoiceState('idle');
  }
}

async function speakVoiceAnswer(text) {
  if (!('speechSynthesis' in window)) { setVoiceState('idle'); return; }
  window.speechSynthesis.cancel();
  await ensureVoicesLoaded();
  const voice = pickVoice(voiceLang === 'en' ? 'en' : 'ar');
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = voice ? voice.lang : (voiceLang === 'en' ? 'en-US' : 'ar-EG');
  if (voice) utter.voice = voice;
  utter.rate = ttsRate;
  utter.onstart = () => setVoiceState('speaking');
  utter.onend = () => setVoiceState('idle');
  utter.onerror = () => setVoiceState('idle');
  window.speechSynthesis.speak(utter);
}

voiceEntryBtn.addEventListener('click', () => {
  if (!voiceSupported()) { showToast('❌ المتصفح ده مش بيدعم المحادثة الصوتية', 'error'); return; }
  voiceOverlay.classList.remove('hidden');
});
voiceClose.addEventListener('click', () => {
  voiceOverlay.classList.add('hidden');
  if (voiceRecognition && voiceState === 'listening') voiceRecognition.stop();
  window.speechSynthesis && window.speechSynthesis.cancel();
  setVoiceState('idle');
});
voiceResetBtn.addEventListener('click', () => {
  voiceHistory = [];
  voiceMessages.innerHTML = '';
  voiceMessages.appendChild(voiceEmptyHint);
  voiceEmptyHint.style.display = 'block';
  window.speechSynthesis && window.speechSynthesis.cancel();
  setVoiceState('idle');
  showToast('🔄 بدأنا محادثة جديدة', '');
});
voiceLangToggle.addEventListener('click', (e) => {
  const btn = e.target.closest('.voice-lang-btn');
  if (!btn) return;
  voiceLang = btn.dataset.lang;
  voiceLangToggle.querySelectorAll('.voice-lang-btn').forEach(b => b.classList.toggle('active', b === btn));
  if (voiceRecognition) voiceRecognition.lang = voiceLang === 'en' ? 'en-US' : 'ar-EG';
});
voiceMicBtn.addEventListener('click', () => {
  if (voiceState === 'speaking') { window.speechSynthesis.cancel(); setVoiceState('idle'); return; }
  if (voiceState === 'thinking') return;
  if (voiceState === 'listening') { voiceRecognition.stop(); setVoiceState('idle'); return; }
  voiceRecognition.lang = voiceLang === 'en' ? 'en-US' : 'ar-EG';
  try { voiceRecognition.start(); setVoiceState('listening'); }
  catch { showToast('❌ مايكروفون الجهاز مش متاح', 'error'); }
});

// ── 6g. COMING SOON — PDF + ASSISTANT MEETING ────────────────────
const SOON_FEATURE_KEY = 'pdf_meeting';

async function renderSoonPage() {
  try {
    const res = await fetch(`/api/feature-interest/count?feature=${SOON_FEATURE_KEY}`);
    const data = await res.json();
    soonInterestCount.textContent = data.count;
    if (data.registered) {
      soonNotifyBtn.textContent = '✅ هتوصلك رسالة لما الميزة تتاح';
      soonNotifyBtn.disabled = true;
    } else {
      soonNotifyBtn.textContent = '🔔 أعلمني لما تتاح';
      soonNotifyBtn.disabled = false;
    }
  } catch {}
}

soonNotifyBtn.addEventListener('click', async () => {
  if (!currentUser) {
    showToast('📝 سجّل دخول الأول عشان تتسجّل في قائمة الاهتمام', '');
    openAuthModal('login');
    return;
  }
  soonNotifyBtn.disabled = true;
  try {
    const res = await fetch('/api/feature-interest', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feature: SOON_FEATURE_KEY })
    });
    const data = await res.json();
    soonNotifyBtn.textContent = '✅ هتوصلك رسالة لما الميزة تتاح';
    showToast(data.alreadyRegistered ? 'إنت مسجّل بالفعل 👍' : '🎉 تم تسجيل اهتمامك بنجاح', 'success');
    renderSoonPage();
  } catch {
    soonNotifyBtn.disabled = false;
    showToast('حصل خطأ، حاول تاني', 'error');
  }
});

// ── 7. TTS ─────────────────────────────────────────────────────
// تحميل أصوات القراءة بشكل موثوق — المتصفح (خصوصًا Chrome) بيحمّلها متأخر ومرحلي
// وأول Call لـ getVoices() ممكن يرجع فاضي أو ناقص، فبيقع بالغلط على صوت إنجليزي افتراضي
let _voicesCache = [];
let _voicesReadyPromise = null;
function ensureVoicesLoaded() {
  if (_voicesReadyPromise) return _voicesReadyPromise;
  _voicesReadyPromise = new Promise(resolve => {
    let settled = false;
    const finish = (v) => { if(!settled){ settled=true; _voicesCache=v; resolve(v); } };
    const tryNow = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) { _voicesCache = v; return true; }
      return false;
    };
    if (tryNow()) { finish(_voicesCache); return; }
    window.speechSynthesis.onvoiceschanged = () => { if (tryNow()) finish(_voicesCache); };
    // بعض المتصفحات بتحمّل القايمة على دفعات، فبنحاول كذا مرة بدل مرة واحدة بس
    let attempts = 0;
    const poll = setInterval(() => {
      attempts++;
      if (tryNow() || attempts >= 8) { clearInterval(poll); finish(_voicesCache); }
    }, 350);
  });
  return _voicesReadyPromise;
}
// بيدوّر على أي صوت عربي مهما كان الاحتمال (لهجات مختلفة، أو حتى لو الاسم مكتوب "Arabic" من غير كود لغة صحيح)
function pickVoice(langPrefix) {
  const voices = _voicesCache.length ? _voicesCache : window.speechSynthesis.getVoices();
  if (langPrefix === 'ar' && typeof a11yState !== 'undefined' && a11yState.manualVoiceURI) {
    const manual = voices.find(v => v.voiceURI === a11yState.manualVoiceURI);
    if (manual) return manual;
  }
  if (langPrefix !== 'ar') return voices.find(v => v.lang.toLowerCase().startsWith(langPrefix)) || null;
  return voices.find(v => v.lang.toLowerCase() === 'ar-eg')
    || voices.find(v => v.lang.toLowerCase().startsWith('ar'))
    || voices.find(v => /arabic|عرب/i.test(v.name || ''))
    || null;
}
function getAllArabicVoices() {
  const voices = _voicesCache.length ? _voicesCache : window.speechSynthesis.getVoices();
  return voices.filter(v => v.lang.toLowerCase().startsWith('ar') || /arabic|عرب/i.test(v.name || ''));
}
let ttsRate = 0.9; // سرعة القراءة الافتراضية، قابلة للتعديل من لوحة سهولة الوصول

async function speak(text, btn) {
  if(!('speechSynthesis' in window)){showToast('المتصفح لا يدعم القراءة الصوتية','error');return;}
  if(isSpeaking){window.speechSynthesis.cancel();isSpeaking=false;if(btn)btn.classList.remove('active');return;}
  const clean=text.replace(/#+\s/g,'').replace(/\*\*/g,'').replace(/\*/g,'').replace(/[-•]/g,'').trim();
  await ensureVoicesLoaded();
  const arVoice=pickVoice('ar');
  const u=new SpeechSynthesisUtterance(clean); u.lang=arVoice?arVoice.lang:'ar-EG'; u.rate=ttsRate; u.pitch=1;
  if(arVoice) u.voice=arVoice;
  else { showNoArabicVoiceHelp(); }
  u.onstart=()=>{isSpeaking=true;if(btn)btn.classList.add('active');};
  u.onend=()=>{isSpeaking=false;if(btn)btn.classList.remove('active');};
  u.onerror=()=>{isSpeaking=false;if(btn)btn.classList.remove('active');};
  window.speechSynthesis.speak(u);
}

// جهاز المستخدم مفيهوش صوت عربي مثبّت على مستوى نظام التشغيل — ده قيد برّه سيطرة الموقع،
// فبنوريه بالظبط إزاي يظبطها بدل ما نسيبه يسمع صوت إنجليزي بيقرا عربي من غير تفسير
let _a11yVoiceHelpShown = false;
function showNoArabicVoiceHelp() {
  showToast('⚠️ جهازك مفيهوش صوت عربي — هيقرا بصوت التاني المتاح', 'error');
  if (_a11yVoiceHelpShown) return;
  _a11yVoiceHelpShown = true;
  const ua = navigator.userAgent;
  const isWin = /Windows/i.test(ua), isMac = /Macintosh/i.test(ua), isAndroid = /Android/i.test(ua);
  let steps = 'من إعدادات نظام التشغيل، ضيف حزمة صوت عربي (Text-to-Speech) ثم أعد تحميل الصفحة.';
  if (isWin) steps = 'الإعدادات ← الوقت واللغة ← اللغة والمنطقة ← أضف لغة "العربية" ← فعّل خاصية التحدث (Speech) الخاصة بيها، وبعدها أعد تحميل الصفحة.';
  else if (isMac) steps = 'إعدادات النظام ← إمكانية الوصول ← المحتوى المنطوق ← اختار صوتًا عربيًا من قائمة النظام، وبعدها أعد تحميل الصفحة.';
  else if (isAndroid) steps = 'إعدادات الجهاز ← إعدادات إضافية ← تحويل النص إلى كلام ← ثبّت بيانات اللغة العربية.';
  showToast(steps, '');
}

ttsBtn.addEventListener('click', ()=>speak(lastResponse,ttsBtn));

// ── 8. COPY ────────────────────────────────────────────────────
copyBtn.addEventListener('click', async ()=>{
  if(!lastResponse) return;
  try{await navigator.clipboard.writeText(lastResponse);showToast('📋 تم النسخ','success');}
  catch{showToast('تعذّر النسخ','error');}
});

// ── 9. API CALL ────────────────────────────────────────────────
async function askAI(mode) {
  const question=questionInput.value.trim();
  if(mode==='homework' && !selectedImage){
    showToast('📸 اختار صورة الواجب دلوقتي…','');
    pendingAutoSubmitMode='homework';
    imageInput.click();
    return;
  }
  if(mode==='quiz' && !question){
    showToast('📝 اكتب الموضوع اللي عايز اختبار عليه الأول','error');
    questionInput.focus();
    return;
  }
  if(!question && !selectedImage){showToast('⚠️ أدخل سؤالاً أو ارفق صورة أولاً','error');questionInput.focus();return;}
  if(question.length>500){showToast('السؤال طويل جداً','error');return;}

  document.querySelectorAll('.action-btn').forEach(b=>b.classList.remove('active-btn'));
  const activeBtn=document.querySelector(`[data-mode="${mode}"]`);
  if(activeBtn) activeBtn.classList.add('active-btn');

  const lessonId=parseInt(lessonSelect.value);
  const lesson=lessonId?LESSONS_DB.find(l=>l.id===lessonId):null;
  const payload={question,mode,lesson:lesson||null,image:selectedImage||null};
  retryPayload={mode,payload}; lastMode=mode;

  setUIState('loading');
  loadingText.textContent = mode==='homework'
    ? 'المعلم الذكي بيحلّ ويصحّح الواجب…'
    : mode==='quiz'
    ? 'بيجهّز أسئلة الاختبار…'
    : (selectedImage
        ? 'المعلم الذكي بيحلل الصورة…'
        : ({explain:'المعلم الذكي يُعدّ الشرح…',summarize:'جاري التلخيص…',questions:'يُنشئ أسئلة الاختبار…'}[mode]||'جارٍ المعالجة…'));

  try {
    const res = await fetch('/ask-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data=await res.json();
    if(!res.ok) throw new Error(data.error||`خطأ من الخادم (${res.status})`);

    if (mode === 'quiz') {
      responseActionsEl.classList.add('hidden');
      renderQuiz(data.quiz);
      setUIState('response');
      recordStreakActivity();
      return;
    }
    responseActionsEl.classList.remove('hidden');

    let homeworkInfo=null;
    if(mode==='homework'){
      const parsed=stripHomeworkMarker(data.answer||'');
      lastResponse=parsed.clean;
      homeworkInfo={type:parsed.type,score:parsed.score};
    } else {
      lastResponse=data.answer||'';
    }
    renderResponse(lastResponse,mode,homeworkInfo);
    setUIState('response');
    recordStreakActivity();
    if(isSimpleMode) openSimpleMode(lastResponse);
    if(a11yState.autoRead && lastResponse) speak(lastResponse, a11yReadBtn);
  } catch(err) {
    errorMsg.textContent=err.message||'حدث خطأ في الاتصال بالخادم.';
    setUIState('error');
  }
}

// يفصل سطر الماركر الخاص بوضع "حلّ الواجب" (النوع/التقييم) عن باقي النص
function stripHomeworkMarker(text) {
  const markerMatch = text.match(/^\s*النوع:\s*(حل|تصحيح)(?:\s*\|\s*التقييم:\s*(\d{1,2})\s*\/\s*10)?\s*\n+/);
  if (!markerMatch) return { clean: text, type: null, score: null };
  const [fullMatch, type, scoreStr] = markerMatch;
  return { clean: text.slice(fullMatch.length), type, score: scoreStr ? parseInt(scoreStr,10) : null };
}

// ── اختبار تفاعلي (Quiz) ────────────────────────────────────────
function renderQuiz(quiz) {
  responseBadge.textContent = 'اختبار تفاعلي';
  responseBadge.className = 'response-badge badge-quiz';

  const questionsHtml = quiz.questions.map((q, qi) => `
    <div class="quiz-question-block" data-qindex="${qi}">
      <div class="quiz-question-num">سؤال ${qi+1} من ${quiz.questions.length}</div>
      <div class="quiz-question-text">${escapeHtml(q.question)}</div>
      <div class="quiz-options">
        ${q.options.map((opt, oi) => `
          <label class="quiz-option">
            <input type="radio" name="quiz-q${qi}" value="${oi}">
            <span class="quiz-option-text">${escapeHtml(opt)}</span>
            <span class="quiz-option-icon" aria-hidden="true"></span>
          </label>`).join('')}
      </div>
      <div class="quiz-explanation hidden"></div>
    </div>`).join('');

  responseBody.innerHTML = `
    <div class="quiz-wrap" id="quizWrap">
      <div class="quiz-topic">📝 ${escapeHtml(quiz.topic || '')}</div>
      ${questionsHtml}
      <button class="planner-generate-btn quiz-submit-btn" id="quizSubmitBtn">✅ صحّح إجاباتي</button>
      <div class="quiz-result hidden" id="quizResult"></div>
    </div>`;

  document.getElementById('quizSubmitBtn').addEventListener('click', () => gradeQuiz(quiz));
}

function gradeQuiz(quiz) {
  const wrap = document.getElementById('quizWrap');
  const total = quiz.questions.length;
  let score = 0;
  let allAnswered = true;

  quiz.questions.forEach((q, qi) => {
    const selected = wrap.querySelector(`input[name="quiz-q${qi}"]:checked`);
    if (!selected) { allAnswered = false; return; }
  });

  if (!allAnswered) {
    showToast('⚠️ جاوب على كل الأسئلة الأول', 'error');
    return;
  }

  quiz.questions.forEach((q, qi) => {
    const selected = wrap.querySelector(`input[name="quiz-q${qi}"]:checked`);
    const selectedIndex = Number(selected.value);
    const isCorrect = selectedIndex === q.correctIndex;
    if (isCorrect) score++;

    const block = wrap.querySelector(`.quiz-question-block[data-qindex="${qi}"]`);
    const options = block.querySelectorAll('.quiz-option');
    options.forEach((optEl, oi) => {
      optEl.classList.add('answered');
      const iconEl = optEl.querySelector('.quiz-option-icon');
      if (oi === q.correctIndex) { optEl.classList.add('correct'); iconEl.textContent = '✓'; }
      else if (oi === selectedIndex) { optEl.classList.add('incorrect'); iconEl.textContent = '✗'; }
      optEl.querySelector('input').disabled = true;
    });

    const explanationEl = block.querySelector('.quiz-explanation');
    explanationEl.textContent = `${isCorrect ? '✅ إجابة صحيحة —' : '❌ إجابة غير صحيحة —'} ${q.explanation || ''}`;
    explanationEl.classList.remove('hidden');
    explanationEl.classList.add(isCorrect ? 'correct-exp' : 'incorrect-exp');
    explanationEl.setAttribute('role', 'status');
  });

  const submitBtn = document.getElementById('quizSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'تم التصحيح ✓';

  const resultEl = document.getElementById('quizResult');
  const pct = Math.round(score / total * 100);
  const face = pct >= 80 ? '🌟' : pct >= 50 ? '💪' : '📚';
  resultEl.innerHTML = `<div class="quiz-score-chip">${face} نتيجتك: ${score}/${total}</div>`;
  resultEl.classList.remove('hidden');
  resultEl.setAttribute('role', 'status');
  resultEl.setAttribute('aria-live', 'polite');

  if (currentUser) {
    fetch('/api/quiz/submit-score', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, total, topic: quiz.topic || '' })
    }).then(r => r.json()).then(data => {
      if (data.ok) showToast(`+${data.bonusPoints} نقطة! 🎉`, 'success');
    }).catch(() => {});
  } else {
    showToast('سجّل دخول عشان نقاطك ونتيجتك تتحفظ 💾', '');
  }
}

// ── 10. RENDER RESPONSE ────────────────────────────────────────
function renderResponse(text,mode,homeworkInfo) {
  responseBadge.textContent=MODE_LABELS[mode]||mode;
  responseBadge.className='response-badge';
  if(mode==='summarize') responseBadge.classList.add('badge-summarize');
  if(mode==='questions') responseBadge.classList.add('badge-questions');
  if(mode==='homework')  responseBadge.classList.add('badge-homework');

  let scoreChipHtml = '';
  if (mode === 'homework' && homeworkInfo) {
    if (homeworkInfo.type === 'تصحيح' && homeworkInfo.score !== null) {
      const score = homeworkInfo.score;
      const level = score>=8 ? 'score-good' : score>=5 ? 'score-mid' : 'score-low';
      const face  = score>=8 ? '🌟' : score>=5 ? '💪' : '📚';
      scoreChipHtml = `<div class="score-chip ${level}">
        <span class="score-chip-num">${face} ${score}/10</span>
        <span class="score-chip-label">تقييم إجابتك</span>
      </div>`;
    } else if (homeworkInfo.type === 'حل') {
      scoreChipHtml = `<div class="score-chip score-good">
        <span class="score-chip-num">🧮</span>
        <span class="score-chip-label">تم حلّ المسألة خطوة بخطوة</span>
      </div>`;
    }
  }

  let html=text
    .replace(/^### (.+)$/gm,'<h3>$1</h3>').replace(/^## (.+)$/gm,'<h3>$1</h3>').replace(/^# (.+)$/gm,'<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/^[-•*]\s(.+)$/gm,'<li>$1</li>').replace(/^\d+\.\s(.+)$/gm,'<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/gs,m=>`<ul>${m}</ul>`)
    .replace(/^(📌|مثال[:]?)\s(.+)$/gm,'<div class="example-block"><strong>$1</strong> $2</div>')
    .split(/\n{2,}/).map(b=>(b.startsWith('<h3>')||b.startsWith('<ul>')||b.startsWith('<div'))?b:`<p>${b.replace(/\n/g,'<br/>')}</p>`).join('');
  responseBody.innerHTML=scoreChipHtml+html;
}

// ── 11. UI STATES ──────────────────────────────────────────────
function setUIState(state) {
  [loadingState,emptyState,responseContent,errorState].forEach(el=>el.classList.add('hidden'));
  if(state==='loading')  loadingState.classList.remove('hidden');
  if(state==='empty')    emptyState.classList.remove('hidden');
  if(state==='response') responseContent.classList.remove('hidden');
  if(state==='error')    errorState.classList.remove('hidden');
}

// ── 12. BUTTONS ────────────────────────────────────────────────
explainBtn.addEventListener('click',   ()=>askAI('explain'));
summarizeBtn.addEventListener('click', ()=>askAI('summarize'));
questionsBtn.addEventListener('click', ()=>askAI('questions'));
homeworkBtn.addEventListener('click', ()=>askAI('homework'));
quizBtn.addEventListener('click', ()=>askAI('quiz'));
retryBtn.addEventListener('click', ()=>{ if(retryPayload) askAI(retryPayload.mode); });

// ── 13. لوحة سهولة الوصول الشاملة ────────────────────────────────
const A11Y_KEY = 'aiTeacherA11ySettings';
const FONT_LEVELS = [null, 'a11y-font-lg', 'a11y-font-xl']; // 0=عادي 1=كبير 2=أكبر
let a11yState = { master:false, fontLevel:0, speed:'normal', dyslexia:false, grayscale:false, cursor:false, opaque:false, ruler:false, underline:false, autoRead:false, manualVoiceURI:null, switchScan:false };

function loadA11yState() {
  try {
    const saved = JSON.parse(localStorage.getItem(A11Y_KEY) || '{}');
    a11yState = { ...a11yState, ...saved };
  } catch {}
}
function saveA11yState() {
  try { localStorage.setItem(A11Y_KEY, JSON.stringify(a11yState)); } catch {}
}
function setSwitch(btn, on) { btn.setAttribute('aria-checked', on ? 'true' : 'false'); }

function applyA11yState() {
  const html = document.documentElement;
  html.classList.toggle('a11y-mode', a11yState.master);
  FONT_LEVELS.forEach(cls => { if (cls) html.classList.remove(cls); });
  if (FONT_LEVELS[a11yState.fontLevel]) html.classList.add(FONT_LEVELS[a11yState.fontLevel]);
  html.classList.toggle('a11y-dyslexia', a11yState.dyslexia);
  html.classList.toggle('a11y-grayscale', a11yState.grayscale);
  html.classList.toggle('a11y-big-cursor', a11yState.cursor);
  html.classList.toggle('a11y-opaque', a11yState.opaque);
  html.classList.toggle('a11y-underline', a11yState.underline);
  ttsRate = a11yState.speed === 'slow' ? 0.65 : a11yState.speed === 'fast' ? 1.25 : 0.9;

  setSwitch(a11yMasterToggle, a11yState.master);
  setSwitch(a11yDyslexiaToggle, a11yState.dyslexia);
  setSwitch(a11yGrayscaleToggle, a11yState.grayscale);
  setSwitch(a11yCursorToggle, a11yState.cursor);
  setSwitch(a11yOpaqueToggle, a11yState.opaque);
  setSwitch(a11yRulerToggle, a11yState.ruler);
  setSwitch(a11yUnderlineToggle, a11yState.underline);
  setSwitch(a11yAutoReadToggle, a11yState.autoRead);
  setSwitch(a11ySwitchScanToggle, a11yState.switchScan);
  simpleToggle.classList.toggle('active', a11yState.master);
  simpleToggle.setAttribute('aria-pressed', a11yState.master ? 'true' : 'false');
  [a11ySpeedSlow,a11ySpeedNormal,a11ySpeedFast].forEach(b=>b.classList.remove('active'));
  ({slow:a11ySpeedSlow,normal:a11ySpeedNormal,fast:a11ySpeedFast}[a11yState.speed]||a11ySpeedNormal).classList.add('active');

  toggleReadingRuler(a11yState.ruler);
  if (a11yState.switchScan && !switchScan.active) startSwitchScan();
  else if (!a11yState.switchScan && switchScan.active) stopSwitchScan();
}

// ── وضع المسح بمفتاح واحد (Single-Switch Scanning Access) ──────
// أداة مساعدة احترافية لذوي الإعاقة الحركية الشديدة اللي مقدرش يستخدموا
// ماوس أو كيبورد عادي — كل عناصر الصفحة بتضيء أوتوماتيك واحد واحد بالدور،
// وضغطة واحدة بس (مسافة أو نقرة في أي مكان) بتفعّل اللي مضيء دلوقتي.
const switchScan = { active:false, elements:[], index:-1, timer:null, speedMs:2000 };

function getScannableElements() {
  const sel = 'button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), [role="switch"]';
  return Array.from(document.querySelectorAll(sel)).filter(el => {
    if (el.closest('.a11y-switch-scan-indicator')) return false; // متضيئش شريط المسح نفسه
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    const style = window.getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none') return false;
    if (el.closest('.hidden')) return false;
    const overlayParent = el.closest('.auth-overlay,.voice-overlay,.simple-overlay,.streak-celebrate-overlay,.a11y-panel-overlay');
    if (overlayParent && overlayParent.classList.contains('hidden')) return false;
    return true;
  });
}

function clearScanHighlight() {
  const cur = switchScan.elements[switchScan.index];
  if (cur) cur.classList.remove('switch-scan-highlight');
}

function advanceScan() {
  clearScanHighlight();
  switchScan.elements = getScannableElements(); // نعيد الفحص كل مرة لأن محتوى الصفحة ممكن يتغيّر
  if (!switchScan.elements.length) return;
  switchScan.index = (switchScan.index + 1) % switchScan.elements.length;
  const el = switchScan.elements[switchScan.index];
  el.classList.add('switch-scan-highlight');
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function activateScanElement() {
  const el = switchScan.elements[switchScan.index];
  if (!el) return;
  clearScanHighlight();
  el.click();
  // نديله فرصة صغيرة إن أي نافذة/تبويب جديد يفتح قبل ما نكمّل المسح فيه
  setTimeout(advanceScan, 400);
}

function startSwitchScan() {
  switchScan.active = true;
  switchScan.index = -1;
  a11ySwitchScanIndicator.classList.remove('hidden');
  advanceScan();
  switchScan.timer = setInterval(advanceScan, switchScan.speedMs);
}
function stopSwitchScan() {
  switchScan.active = false;
  clearInterval(switchScan.timer);
  clearScanHighlight();
  a11ySwitchScanIndicator.classList.add('hidden');
}

document.addEventListener('keydown', (e) => {
  if (!switchScan.active) return;
  if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); activateScanElement(); }
});
document.addEventListener('click', (e) => {
  if (!switchScan.active) return;
  if (e.target.closest('.a11y-switch-scan-indicator')) return; // زرار الإيقاف له تصرفه الطبيعي
  if (e.target === switchScan.elements[switchScan.index]) return; // نقر مباشر على العنصر نفسه، سيبه يشتغل عادي
  e.preventDefault();
  activateScanElement();
}, true);

a11ySwitchScanToggle.addEventListener('click', () => {
  a11yState.switchScan = !a11yState.switchScan;
  setSwitch(a11ySwitchScanToggle, a11yState.switchScan);
  saveA11yState();
  if (a11yState.switchScan) { startSwitchScan(); showToast('🔘 وضع المسح بمفتاح واحد شغّال — دوس مسافة للاختيار', 'success'); }
  else stopSwitchScan();
});
a11ySwitchScanStop.addEventListener('click', () => { a11yState.switchScan = false; setSwitch(a11ySwitchScanToggle, false); saveA11yState(); stopSwitchScan(); });

function setScanSpeed(ms, btn) {
  switchScan.speedMs = ms;
  [a11yScanSlow, a11yScanNormal, a11yScanFast].forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (switchScan.active) { clearInterval(switchScan.timer); switchScan.timer = setInterval(advanceScan, ms); }
}
a11yScanSlow.addEventListener('click', () => setScanSpeed(3200, a11yScanSlow));
a11yScanNormal.addEventListener('click', () => setScanSpeed(2000, a11yScanNormal));
a11yScanFast.addEventListener('click', () => setScanSpeed(1100, a11yScanFast));

loadA11yState();
applyA11yState();
isSimpleMode = a11yState.master; // التوافق مع منطق "الوضع المبسّط" الأصلي لعرض إجابات الـ AI

simpleToggle.addEventListener('click', ()=>{ a11yPanelOverlay.classList.toggle('hidden'); });
a11yPanelClose.addEventListener('click', ()=> a11yPanelOverlay.classList.add('hidden'));
a11yPanelOverlay.addEventListener('click', (e)=>{ if(e.target===a11yPanelOverlay) a11yPanelOverlay.classList.add('hidden'); });
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && !a11yPanelOverlay.classList.contains('hidden')) a11yPanelOverlay.classList.add('hidden'); });

// قفل التنقل بالتاب جوه اللوحة بس وهي مفتوحة، ونقل التركيز لها فورًا — يضمن إنك تقدر توصل لزرار الإغلاق دايمًا
const a11yPanelObserver = new MutationObserver(() => {
  if (!a11yPanelOverlay.classList.contains('hidden')) {
    requestAnimationFrame(() => a11yPanelClose.focus());
  }
});
a11yPanelObserver.observe(a11yPanelOverlay, { attributes: true, attributeFilter: ['class'] });

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab' || a11yPanelOverlay.classList.contains('hidden')) return;
  const focusables = a11yPanel.querySelectorAll('button, [href], input, select, [tabindex]:not([tabindex="-1"])');
  if (!focusables.length) return;
  const first = focusables[0], last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

a11yMasterToggle.addEventListener('click', ()=>{
  a11yState.master = !a11yState.master; isSimpleMode = a11yState.master;
  applyA11yState(); saveA11yState();
  showToast(a11yState.master?'♿ وضع سهولة الوصول الشامل مفعّل':'تم تعطيل الوضع الشامل','success');
  if (isSimpleMode && lastResponse) openSimpleMode(lastResponse);
});
a11yDyslexiaToggle.addEventListener('click', ()=>{ a11yState.dyslexia=!a11yState.dyslexia; applyA11yState(); saveA11yState(); });
a11yGrayscaleToggle.addEventListener('click', ()=>{ a11yState.grayscale=!a11yState.grayscale; applyA11yState(); saveA11yState(); });
a11yCursorToggle.addEventListener('click', ()=>{ a11yState.cursor=!a11yState.cursor; applyA11yState(); saveA11yState(); });
a11yOpaqueToggle.addEventListener('click', ()=>{ a11yState.opaque=!a11yState.opaque; applyA11yState(); saveA11yState(); });
a11yRulerToggle.addEventListener('click', ()=>{ a11yState.ruler=!a11yState.ruler; applyA11yState(); saveA11yState(); });
a11yUnderlineToggle.addEventListener('click', ()=>{ a11yState.underline=!a11yState.underline; applyA11yState(); saveA11yState(); });
a11yAutoReadToggle.addEventListener('click', ()=>{ a11yState.autoRead=!a11yState.autoRead; applyA11yState(); saveA11yState(); });

a11yVoiceCheckBtn.addEventListener('click', async () => {
  a11yVoiceCheckBtn.textContent = '⏳ بيفحص…';
  await ensureVoicesLoaded();
  const arVoices = getAllArabicVoices();
  a11yVoiceCheckBtn.textContent = '🔍 فحص الصوت العربي المتاح على جهازك';
  a11yVoiceDiagResult.classList.remove('hidden', 'ok', 'warn');

  if (arVoices.length === 0) {
    a11yVoiceDiagResult.classList.add('warn');
    a11yVoiceDiagResult.textContent = '❌ مفيش أي صوت عربي متاح على جهازك دلوقتي. لازم تضيف صوت عربي من إعدادات نظام التشغيل (الوقت واللغة ← الكلام، على ويندوز مثلًا)، وبعدين رجّع افتح الصفحة تاني.';
    a11yVoicePickerWrap.classList.add('hidden');
  } else {
    a11yVoiceDiagResult.classList.add('ok');
    a11yVoiceDiagResult.textContent = `✅ لقينا ${arVoices.length} صوت عربي على جهازك. اختار اللي عايزه من القائمة تحت لو حابب تحدد صوت بعينه:`;
    a11yVoicePicker.innerHTML = arVoices.map(v => `<option value="${v.voiceURI}">${v.name} (${v.lang})</option>`).join('');
    if (a11yState.manualVoiceURI) a11yVoicePicker.value = a11yState.manualVoiceURI;
    a11yVoicePickerWrap.classList.remove('hidden');
  }
});

a11yVoicePicker.addEventListener('change', () => {
  a11yState.manualVoiceURI = a11yVoicePicker.value || null;
  saveA11yState();
  showToast('✅ تم اختيار الصوت، جرّب زرار القراءة دلوقتي', 'success');
});

a11yFontUp.addEventListener('click', ()=>{ a11yState.fontLevel=Math.min(2,a11yState.fontLevel+1); applyA11yState(); saveA11yState(); });
a11yFontDown.addEventListener('click', ()=>{ a11yState.fontLevel=Math.max(0,a11yState.fontLevel-1); applyA11yState(); saveA11yState(); });
a11yFontReset.addEventListener('click', ()=>{ a11yState.fontLevel=0; applyA11yState(); saveA11yState(); });

a11ySpeedSlow.addEventListener('click', ()=>{ a11yState.speed='slow'; applyA11yState(); saveA11yState(); });
a11ySpeedNormal.addEventListener('click', ()=>{ a11yState.speed='normal'; applyA11yState(); saveA11yState(); });
a11ySpeedFast.addEventListener('click', ()=>{ a11yState.speed='fast'; applyA11yState(); saveA11yState(); });


a11yResetAll.addEventListener('click', ()=>{
  a11yState = { master:false, fontLevel:0, speed:'normal', dyslexia:false, grayscale:false, cursor:false, opaque:false, ruler:false, underline:false, autoRead:false, manualVoiceURI:null, switchScan:false };
  isSimpleMode = false;
  applyA11yState(); saveA11yState();
  a11yVoiceDiagResult.classList.add('hidden');
  a11yVoicePickerWrap.classList.add('hidden');
  showToast('↺ تم إرجاع كل إعدادات سهولة الوصول للوضع الافتراضي','');
});

// مسطرة تتبّع القراءة — بتتحرك مع الماوس ولوحة المفاتيح (تفيد عسر القراءة وصعوبات التركيز)
function toggleReadingRuler(on) {
  a11yReadingRuler.classList.toggle('hidden', !on);
  if (on) document.addEventListener('mousemove', moveReadingRuler);
  else document.removeEventListener('mousemove', moveReadingRuler);
}
function moveReadingRuler(e) {
  a11yReadingRuler.style.top = (e.clientY - 19) + 'px';
}

function getReadablePageText() {
  const activePanel = document.querySelector('.tab-panel.active');
  if (!activePanel) return '';
  // نتجاهل عناصر الإدخال والأزرار المكررة، ونركّز على النص الفعلي المقروء
  const clone = activePanel.cloneNode(true);
  clone.querySelectorAll('input,select,textarea,svg,button').forEach(el => el.remove());
  return clone.textContent.replace(/\s+/g, ' ').trim().slice(0, 3000);
}

a11yReadBtn.addEventListener('click', () => {
  const text = getReadablePageText();
  if (!text) { showToast('مفيش محتوى نصي هنا للقراءة', ''); return; }
  speak(text, a11yReadBtn);
});
a11yStopBtn.addEventListener('click', () => {
  window.speechSynthesis && window.speechSynthesis.cancel();
  isSpeaking = false;
  a11yReadBtn.classList.remove('active');
});

simpleClose.addEventListener('click', ()=>{ simpleOverlay.classList.add('hidden'); window.speechSynthesis&&window.speechSynthesis.cancel(); isSpeaking=false; });
simpleTtsBtn.addEventListener('click', ()=>speak(lastResponse,simpleTtsBtn));

function openSimpleMode(text) {
  const plain=text.replace(/#+\s/g,'').replace(/\*\*/g,'').replace(/\*/g,'').replace(/^[-•*]\s/gm,'• ').trim();
  simpleContent.textContent=plain; simpleOverlay.classList.remove('hidden');
}

// ── 14. LESSONS GRID ───────────────────────────────────────────
function renderLessonsGrid() {
  lessonsGrid.innerHTML='';
  LESSONS_DB.forEach(lesson=>{
    const card=document.createElement('div'); card.className='lesson-grid-card';
    card.innerHTML=`
      <div class="lgc-subject">${SUBJECT_NAMES[lesson.subject]||lesson.subject}</div>
      <div class="lgc-title">${lesson.lesson}</div>
      <div class="lgc-grade">الصف ${getGradeLabel(lesson.grade)}</div>
      <div class="lgc-snippet">${lesson.content}</div>
      <button class="lgc-use-btn">استخدم هذا الدرس →</button>
    `;
    card.querySelector('.lgc-use-btn').addEventListener('click',()=>useLesson(lesson));
    lessonsGrid.appendChild(card);
  });
}

function useLesson(lesson) {
  document.querySelector('[data-tab="ask"]').click();
  gradeSelect.value=lesson.grade; subjectSelect.value=lesson.subject; populateLessons();
  setTimeout(()=>{ lessonSelect.value=lesson.id; lessonSelect.dispatchEvent(new Event('change')); showToast('✅ تم تحميل الدرس','success'); document.querySelector('.question-card').scrollIntoView({behavior:'smooth'}); },50);
}

function getGradeLabel(grade) {
  const L={"1":"الأول الابتدائي","2":"الثاني الابتدائي","3":"الثالث الابتدائي","4":"الرابع الابتدائي","5":"الخامس الابتدائي","6":"السادس الابتدائي","7":"الأول الإعدادي","8":"الثاني الإعدادي","9":"الثالث الإعدادي","10":"الأول الثانوي","11":"الثاني الثانوي","12":"الثالث الثانوي"};
  return L[grade]||grade;
}

// ── 15. TOAST ─────────────────────────────────────────────────
let toastTimeout;
function showToast(msg,type='') {
  clearTimeout(toastTimeout); toast.textContent=msg; toast.className=`toast show ${type}`;
  toastTimeout=setTimeout(()=>toast.classList.remove('show'),3000);
}

// ── 16. KEYBOARD ──────────────────────────────────────────────
document.addEventListener('keydown', e=>{
  if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();askAI('explain');}
  if(e.key==='Escape'){simpleOverlay.classList.add('hidden');window.speechSynthesis&&window.speechSynthesis.cancel();}
});

// ── 17. INIT ──────────────────────────────────────────────────
setUIState('empty');
if('speechSynthesis' in window) ensureVoicesLoaded(); // نبدأ تحميل الأصوات بدري من فتح الصفحة
console.log('%c 🎓 AI Teacher Hub – قادة مدارس الجمهورية ','background:#2552be;color:#fff;font-size:14px;padding:8px 16px;border-radius:8px;');
