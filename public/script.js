'use strict';

/* ═══════════════════════════════════════════════════════════════════════════
   Install box — package manager tabs & copy
═══════════════════════════════════════════════════════════════════════════ */
const PM_COMMANDS = {
  npm:  'npm install validify-kit',
  pnpm: 'pnpm add validify-kit',
  yarn: 'yarn add validify-kit',
  bun:  'bun add validify-kit',
};

const installCmd  = document.getElementById('installCmd');
const installTabs = document.getElementById('installTabs');

installTabs.addEventListener('click', (e) => {
  const tab = e.target.closest('.itab');
  if (!tab) return;
  installTabs.querySelectorAll('.itab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  installCmd.textContent = PM_COMMANDS[tab.dataset.pm];
});

document.getElementById('copyInstallBtn').addEventListener('click', () => {
  copyToClipboard(installCmd.textContent, 'copyInstallIcon');
});

// Code snippet copy
document.getElementById('copyCodeBtn').addEventListener('click', () => {
  const raw = document.getElementById('codeSnippet').innerText;
  copyToClipboard(raw, 'copyCodeIcon');
});

function copyToClipboard(text, iconId) {
  navigator.clipboard.writeText(text).then(() => {
    const icon = document.getElementById(iconId);
    const orig = icon.textContent;
    icon.textContent = '✓';
    icon.style.color = '#39FF14';
    setTimeout(() => {
      icon.textContent = orig;
      icon.style.color = '';
    }, 1800);
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   API health check
═══════════════════════════════════════════════════════════════════════════ */
async function checkHealth() {
  const dot   = document.getElementById('statusDot');
  const label = document.getElementById('statusLabel');
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      dot.className     = 'status-dot online';
      label.textContent = 'API Online';
    } else throw new Error();
  } catch {
    dot.className     = 'status-dot offline';
    label.textContent = 'API Offline';
  }
}
checkHealth();

/* ═══════════════════════════════════════════════════════════════════════════
   Skills
═══════════════════════════════════════════════════════════════════════════ */
let skills = [];

function renderSkillChips() {
  const c = document.getElementById('skillsContainer');
  c.innerHTML = '';
  skills.forEach((s, i) => {
    const chip = document.createElement('span');
    chip.className = 'skill-chip';
    chip.innerHTML = `${escHtml(s)}<button type="button" aria-label="Remove ${escHtml(s)}">×</button>`;
    chip.querySelector('button').addEventListener('click', () => { skills.splice(i, 1); renderSkillChips(); });
    c.appendChild(chip);
  });
}

function addSkill() {
  const inp = document.getElementById('skillInput');
  const v   = inp.value.trim();
  if (v && !skills.includes(v)) { skills.push(v); renderSkillChips(); }
  inp.value = '';
  inp.focus();
}

document.getElementById('addSkillBtn').addEventListener('click', addSkill);
document.getElementById('skillInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); addSkill(); }
});

/* ═══════════════════════════════════════════════════════════════════════════
   Password toggle
═══════════════════════════════════════════════════════════════════════════ */
document.getElementById('togglePw').addEventListener('click', () => {
  const pw = document.getElementById('password');
  pw.type = pw.type === 'password' ? 'text' : 'password';
});

/* ═══════════════════════════════════════════════════════════════════════════
   Build payload
═══════════════════════════════════════════════════════════════════════════ */
function buildPayload() {
  const ageRaw = document.getElementById('age').value;
  return {
    name:     document.getElementById('name').value,
    email:    document.getElementById('email').value,
    password: document.getElementById('password').value,
    age:      ageRaw !== '' ? Number(ageRaw) : '',
    phone:    document.getElementById('phone').value,
    skills:   [...skills],
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Send a single request
═══════════════════════════════════════════════════════════════════════════ */
async function sendRequest(payload) {
  const res  = await fetch('/api/register', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  const data = await res.json();
  return { status: res.status, data };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Form submit
═══════════════════════════════════════════════════════════════════════════ */
document.getElementById('registrationForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFieldErrors();
  hideBurstLog();

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.innerHTML = '<span>⏳ Sending…</span>';

  try {
    const { status, data } = await sendRequest(buildPayload());
    renderResponse(status, data);
  } catch (err) {
    renderNetworkError(err);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>▶ Send Request</span>';
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   Burst (5 simultaneous requests)
═══════════════════════════════════════════════════════════════════════════ */
document.getElementById('burstBtn').addEventListener('click', async () => {
  clearFieldErrors();
  const btn = document.getElementById('burstBtn');
  btn.disabled = true;
  btn.textContent = '⚡ Sending…';

  const payload = buildPayload();
  const promises = Array.from({ length: 5 }, () => sendRequest(payload).catch(err => ({ status: 0, data: { error: err.message } })));
  const results  = await Promise.all(promises);

  renderResponse(results[0].status, results[0].data);
  showBurstLog(results);

  btn.disabled = false;
  btn.textContent = '⚡ Burst (5×)';
});

function showBurstLog(results) {
  const log  = document.getElementById('burstLog');
  const list = document.getElementById('burstList');
  log.classList.remove('hidden');
  list.innerHTML = '';
  results.forEach((r, i) => {
    const li = document.createElement('li');
    const ok = r.status === 201;
    li.innerHTML = `<span class="${ok ? 'burst-ok' : 'burst-err'}">${ok ? '✓' : '✗'}</span>` +
                   `<span>Request ${i + 1}</span>` +
                   `<span class="rpill ${ok ? 'rpill-valid' : 'rpill-invalid'}">HTTP ${r.status}</span>` +
                   `<span style="color:var(--text-dim);font-size:.7rem">${r.data.valid ? 'valid' : 'invalid'}</span>`;
    list.appendChild(li);
  });
}

function hideBurstLog() {
  document.getElementById('burstLog').classList.add('hidden');
}

/* ═══════════════════════════════════════════════════════════════════════════
   Reset
═══════════════════════════════════════════════════════════════════════════ */
document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('registrationForm').reset();
  skills = [];
  renderSkillChips();
  clearFieldErrors();
  resetResponsePanel();
  hideBurstLog();
});

/* ═══════════════════════════════════════════════════════════════════════════
   Render response
═══════════════════════════════════════════════════════════════════════════ */
function renderResponse(httpStatus, data) {
  const statusBar  = document.getElementById('responseStatusBar');
  const summary    = document.getElementById('responseSummary');
  const errorSec   = document.getElementById('errorSection');
  const sanitSec   = document.getElementById('sanitizedSection');
  const jsonViewer = document.getElementById('jsonViewer');
  const sumValid   = document.getElementById('summaryValid');
  const sumCode    = document.getElementById('summaryCode');

  if (data.valid) {
    statusBar.innerHTML = `<div class="status-bar-success">✅ Validation passed — registration successful!</div>`;
  } else {
    const n = (data.errors || []).length;
    statusBar.innerHTML = `<div class="status-bar-error">❌ Validation failed — ${n} error${n !== 1 ? 's' : ''}</div>`;
  }

  summary.classList.remove('hidden');
  sumValid.className   = `rpill ${data.valid ? 'rpill-valid' : 'rpill-invalid'}`;
  sumValid.textContent = data.valid ? '✓ Valid' : '✗ Invalid';
  sumCode.className    = 'rpill rpill-code';
  sumCode.textContent  = `HTTP ${httpStatus}`;

  if (!data.valid && data.errors && data.errors.length) {
    errorSec.classList.remove('hidden');
    const list = document.getElementById('errorList');
    list.innerHTML = '';
    data.errors.forEach(err => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="err-field">${escHtml(err.field)}</span><span class="err-msg">${escHtml(err.message)}</span>`;
      list.appendChild(li);
      highlightField(err.field, 'error');
    });
  } else {
    errorSec.classList.add('hidden');
  }

  if (data.valid && data.user) {
    sanitSec.classList.remove('hidden');
    const sf = document.getElementById('sanitizedFields');
    sf.innerHTML = '';
    Object.entries(data.user).forEach(([k, v]) => {
      const row = document.createElement('div');
      row.className = 'san-row';
      row.innerHTML = `<span class="san-key">${escHtml(k)}</span><span class="san-val">${escHtml(Array.isArray(v) ? JSON.stringify(v) : String(v))}</span>`;
      sf.appendChild(row);
    });
    ['name','email','age','phone'].forEach(f => highlightField(f, 'valid'));
    highlightField('skills', 'valid');
  } else {
    sanitSec.classList.add('hidden');
  }

  const display = JSON.parse(JSON.stringify(data));
  if (display.user && display.user.password) delete display.user.password;
  jsonViewer.innerHTML = syntaxHighlight(JSON.stringify(display, null, 2));
}

function renderNetworkError(err) {
  document.getElementById('responseStatusBar').innerHTML =
    `<div class="status-bar-error">🌐 Network error: ${escHtml(err.message)}</div>`;
  document.getElementById('jsonViewer').textContent = `// Network error: ${err.message}`;
}

function resetResponsePanel() {
  document.getElementById('responseStatusBar').innerHTML =
    `<div class="resp-idle"><span class="resp-idle-dot">●</span><span>Waiting for request…</span></div>`;
  document.getElementById('responseSummary').classList.add('hidden');
  document.getElementById('errorSection').classList.add('hidden');
  document.getElementById('sanitizedSection').classList.add('hidden');
  document.getElementById('jsonViewer').textContent = '// No request sent yet';
}

/* ═══════════════════════════════════════════════════════════════════════════
   Field highlighting
═══════════════════════════════════════════════════════════════════════════ */
function highlightField(field, state) {
  const fg = document.getElementById('fg-' + field);
  if (!fg) return;
  const el = fg.querySelector('.field-input, .skills-container');
  if (!el) return;
  el.classList.remove('is-error', 'is-valid');
  el.classList.add(state === 'error' ? 'is-error' : 'is-valid');
}
function clearFieldErrors() {
  document.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; });
  document.querySelectorAll('.field-input, .skills-container').forEach(el => el.classList.remove('is-error', 'is-valid'));
}

/* ═══════════════════════════════════════════════════════════════════════════
   JSON syntax highlight
═══════════════════════════════════════════════════════════════════════════ */
function syntaxHighlight(json) {
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    match => {
      let cls = 'json-number';
      if (/^"/.test(match))        cls = /:$/.test(match) ? 'json-key' : 'json-string';
      else if (/true|false/.test(match)) cls = 'json-bool';
      else if (/null/.test(match)) cls = 'json-null';
      return `<span class="${cls}">${match.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>`;
    }
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Populate form
═══════════════════════════════════════════════════════════════════════════ */
function populateForm(tc) {
  document.getElementById('name').value     = tc.data.name;
  document.getElementById('email').value    = tc.data.email;
  document.getElementById('password').value = tc.data.password;
  document.getElementById('age').value      = tc.data.age !== '' ? tc.data.age : '';
  document.getElementById('phone').value    = tc.data.phone;
  skills = [...(tc.data.skills || [])];
  renderSkillChips();
  clearFieldErrors();
  resetResponsePanel();
  hideBurstLog();
  // Scroll to form
  document.getElementById('playground').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ═══════════════════════════════════════════════════════════════════════════
   General test cases
═══════════════════════════════════════════════════════════════════════════ */
const testCases = [
  {
    label: '✅ Valid User', kind: 'valid',
    data: { name: '  Alice Johnson  ', email: 'Alice@Example.COM', password: 'Secure@123', age: 28, phone: '+1 800 555 0100', skills: ['JavaScript','Node.js','React'] },
  },
  {
    label: '📧 Bad Email', kind: 'invalid',
    data: { name: 'Bob Smith', email: 'not-an-email', password: 'Secure@123', age: 25, phone: '+44 20 7946 0958', skills: ['Python'] },
  },
  {
    label: '🔐 Weak Pwd', kind: 'invalid',
    data: { name: 'Carol White', email: 'carol@example.com', password: 'password', age: 30, phone: '9876543210', skills: ['CSS'] },
  },
  {
    label: '⚠️ Missing', kind: 'invalid',
    data: { name: '', email: '', password: '', age: '', phone: '', skills: [] },
  },
  {
    label: '🔞 Underage', kind: 'invalid',
    data: { name: 'Dan Young', email: 'dan@example.com', password: 'Secure@123', age: 15, phone: '+91 98765 43210', skills: ['HTML'] },
  },
  {
    label: '📋 No Skills', kind: 'invalid',
    data: { name: 'Eve Dev', email: 'eve@example.com', password: 'Secure@123', age: 22, phone: '+91 98765 43210', skills: [] },
  },
];

const grid = document.getElementById('testCasesGrid');
testCases.forEach(tc => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `test-btn test-btn-${tc.kind}`;
  btn.textContent = tc.label;
  btn.addEventListener('click', () => populateForm(tc));
  grid.appendChild(btn);
});

/* ═══════════════════════════════════════════════════════════════════════════
   Phone test cases
═══════════════════════════════════════════════════════════════════════════ */
const PHONE_BASE = { name: 'Phone Tester', email: 'phone@example.com', password: 'Secure@123', age: 25, skills: ['Testing'] };

const phoneValid = [
  { label: '+91 98765 43210',  phone: '+91 98765 43210' },
  { label: '+1 800 555 0100',  phone: '+1 800 555 0100' },
  { label: '+44 20 7946 0958', phone: '+44 20 7946 0958' },
  { label: '9876543210',       phone: '9876543210' },
];
const phoneInvalid = [
  { label: '800 555 0100 48758',    phone: '800 555 0100 48758' },
  { label: '123',                   phone: '123' },
  { label: 'abcdefghij',            phone: 'abcdefghij' },
  { label: '+91 98765 ABC10',       phone: '+91 98765 ABC10' },
  { label: '++91 9876543210',       phone: '++91 9876543210' },
  { label: '+91 98765 43210 12345', phone: '+91 98765 43210 12345' },
];

function mkPhoneBtn(label, phone, kind) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `test-btn test-btn-${kind}`;
  btn.textContent = label;
  btn.title = kind === 'valid' ? 'Expected: HTTP 201 ✅' : 'Expected: HTTP 400 ❌';
  btn.addEventListener('click', () => populateForm({ data: { ...PHONE_BASE, phone } }));
  return btn;
}

const pvGrid = document.getElementById('phoneValidGrid');
const piGrid = document.getElementById('phoneInvalidGrid');
phoneValid.forEach(({ label, phone })   => pvGrid.appendChild(mkPhoneBtn(label, phone, 'valid')));
phoneInvalid.forEach(({ label, phone }) => piGrid.appendChild(mkPhoneBtn(label, phone, 'invalid')));

/* ═══════════════════════════════════════════════════════════════════════════
   Utility
═══════════════════════════════════════════════════════════════════════════ */
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
