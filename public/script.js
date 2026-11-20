
'use strict';

/* ═══════════════════════════════════════════════════════════════════════════
   Skills management
   ═══════════════════════════════════════════════════════════════════════════ */
let skills = [];

function renderSkillChips() {
  const container = document.getElementById('skillsContainer');
  container.innerHTML = '';
  skills.forEach((skill, i) => {
    const chip = document.createElement('span');
    chip.className = 'skill-chip';
    chip.innerHTML = `${escHtml(skill)}<button type="button" aria-label="Remove ${escHtml(skill)}" data-index="${i}">×</button>`;
    chip.querySelector('button').addEventListener('click', () => {
      skills.splice(i, 1);
      renderSkillChips();
    });
    container.appendChild(chip);
  });
}

function addSkill() {
  const input = document.getElementById('skillInput');
  const val = input.value.trim();
  if (val && !skills.includes(val)) {
    skills.push(val);
    renderSkillChips();
  }
  input.value = '';
  input.focus();
}

document.getElementById('addSkillBtn').addEventListener('click', addSkill);
document.getElementById('skillInput').addEventListener('keydown', (e) => {
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
    } else {
      throw new Error('not ok');
    }
  } catch {
    dot.className     = 'status-dot offline';
    label.textContent = 'API Offline';
  }
}
checkHealth();

/* ═══════════════════════════════════════════════════════════════════════════
   Form submission
   ═══════════════════════════════════════════════════════════════════════════ */
document.getElementById('registrationForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFieldErrors();

  const payload = buildPayload();
  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-icon">⏳</span> Sending…';

  try {
    const res = await fetch('/api/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    renderResponse(res.status, data);
  } catch (err) {
    renderNetworkError(err);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">🚀</span> Register &amp; Validate';
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   Reset
   ═══════════════════════════════════════════════════════════════════════════ */
document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('registrationForm').reset();
  skills = [];
  renderSkillChips();
  clearFieldErrors();
  resetResponsePanel();
});

/* ═══════════════════════════════════════════════════════════════════════════
   Build payload from form
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
   Render API response
   ═══════════════════════════════════════════════════════════════════════════ */
function renderResponse(httpStatus, data) {
  const statusBar    = document.getElementById('responseStatusBar');
  const summary      = document.getElementById('responseSummary');
  const errorSec     = document.getElementById('errorSection');
  const sanitSec     = document.getElementById('sanitizedSection');
  const jsonViewer   = document.getElementById('jsonViewer');
  const summaryValid = document.getElementById('summaryValid');
  const summaryCode  = document.getElementById('summaryCode');

  // Status bar
  if (data.valid) {
    statusBar.innerHTML = `<div class="status-bar-success">✅ Validation passed — registration successful!</div>`;
  } else {
    const count = (data.errors || []).length;
    statusBar.innerHTML = `<div class="status-bar-error">❌ Validation failed — ${count} error${count !== 1 ? 's' : ''} found</div>`;
  }

  // Summary pills
  summary.classList.remove('hidden');
  summaryValid.className = 'summary-pill ' + (data.valid ? 'pill-valid' : 'pill-invalid');
  summaryValid.textContent = data.valid ? '✓ Valid' : '✗ Invalid';
  summaryCode.className  = 'summary-pill pill-code';
  summaryCode.textContent = `HTTP ${httpStatus}`;

  // Field-level errors
  if (!data.valid && data.errors && data.errors.length) {
    errorSec.classList.remove('hidden');
    const list = document.getElementById('errorList');
    list.innerHTML = '';
    data.errors.forEach(err => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="error-field">${escHtml(err.field)}</span><span class="error-msg">${escHtml(err.message)}</span>`;
      list.appendChild(li);
      highlightField(err.field, 'error');
    });
  } else {
    errorSec.classList.add('hidden');
  }

  // Sanitized data (success path)
  if (data.valid && data.user) {
    sanitSec.classList.remove('hidden');
    const fields = document.getElementById('sanitizedFields');
    fields.innerHTML = '';
    Object.entries(data.user).forEach(([k, v]) => {
      const row = document.createElement('div');
      row.className = 'sanitized-row';
      row.innerHTML = `<span class="san-key">${escHtml(k)}</span><span class="san-val">${escHtml(Array.isArray(v) ? JSON.stringify(v) : String(v))}</span>`;
      fields.appendChild(row);
    });
    // Sanitization note
    if (data.sanitizationApplied) {
      const noteDiv = document.createElement('div');
      noteDiv.className = 'sanitized-row';
      noteDiv.style.marginTop = '10px';
      const noteItems = Object.entries(data.sanitizationApplied)
        .map(([k, v]) => `<strong style="color:var(--accent-soft)">${escHtml(k)}</strong>: ${escHtml(String(v))}`)
        .join('<br>');
      noteDiv.innerHTML = `<span class="san-key" style="min-width:auto;color:var(--accent)">ℹ️</span><span class="san-val" style="font-family:var(--font);font-size:.78rem;line-height:1.6;color:var(--text-muted)">${noteItems}</span>`;
      fields.appendChild(noteDiv);
    }
    ['name','email','age','phone'].forEach(f => highlightField(f, 'valid'));
    highlightField('skills', 'valid');
  } else {
    sanitSec.classList.add('hidden');
  }

  // JSON viewer with syntax highlighting
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
    `<div class="status-empty"><span class="status-empty-icon">⏳</span><span>Submit the form to see the response</span></div>`;
  document.getElementById('responseSummary').classList.add('hidden');
  document.getElementById('errorSection').classList.add('hidden');
  document.getElementById('sanitizedSection').classList.add('hidden');
  document.getElementById('jsonViewer').textContent = '// No request sent yet';
}

/* ═══════════════════════════════════════════════════════════════════════════
   JSON syntax highlighter
   ═══════════════════════════════════════════════════════════════════════════ */
function syntaxHighlight(json) {
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'json-key' : 'json-string';
      } else if (/true|false/.test(match)) {
        cls = 'json-bool';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      // For string values, strip trailing colon from key detection
      const escaped = match
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<span class="${cls}">${escaped}</span>`;
    }
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Field highlighting
   ═══════════════════════════════════════════════════════════════════════════ */
function highlightField(field, state) {
  const fg = document.getElementById('fg-' + field);
  if (!fg) return;
  const input = fg.querySelector('.field-input, .skills-container');
  if (!input) return;
  input.classList.remove('is-error', 'is-valid');
  input.classList.add(state === 'error' ? 'is-error' : 'is-valid');
}

function clearFieldErrors() {
  document.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; });
  document.querySelectorAll('.field-input').forEach(el => el.classList.remove('is-error', 'is-valid'));
  document.querySelectorAll('.skills-container').forEach(el => el.classList.remove('is-error', 'is-valid'));
}

/* ═══════════════════════════════════════════════════════════════════════════
   Populate form + submit helper
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
}

/* ═══════════════════════════════════════════════════════════════════════════
   General test cases
   ═══════════════════════════════════════════════════════════════════════════ */
const testCases = [
  {
    label: '✅ Valid User',
    kind: 'valid',
    data: {
      name: '  Alice Johnson  ',   // leading/trailing spaces — validify-kit trims
      email: 'Alice@Example.COM',  // mixed case — validify-kit lowercases
      password: 'Secure@123',
      age: 28,
      phone: '+1 800 555 0100',
      skills: ['JavaScript', 'Node.js', 'React'],
    },
  },
  {
    label: '📧 Invalid Email',
    kind: 'invalid',
    data: {
      name: 'Bob Smith',
      email: 'not-an-email',
      password: 'Secure@123',
      age: 25,
      phone: '+44 20 7946 0958',
      skills: ['Python'],
    },
  },
  {
    label: '🔐 Weak Password',
    kind: 'invalid',
    data: {
      name: 'Carol White',
      email: 'carol@example.com',
      password: 'password',   // no uppercase, number or special char
      age: 30,
      phone: '9876543210',
      skills: ['CSS'],
    },
  },
  {
    label: '⚠️ Missing Fields',
    kind: 'invalid',
    data: {
      name: '',
      email: '',
      password: '',
      age: '',
      phone: '',
      skills: [],
    },
  },
  {
    label: '🔞 Underage User',
    kind: 'invalid',
    data: {
      name: 'Dan Young',
      email: 'dan@example.com',
      password: 'Secure@123',
      age: 15,
      phone: '+91 98765 43210',
      skills: ['HTML'],
    },
  },
  {
    label: '📋 Empty Skills',
    kind: 'invalid',
    data: {
      name: 'Eve Developer',
      email: 'eve@example.com',
      password: 'Secure@123',
      age: 22,
      phone: '+91 98765 43210',
      skills: [],
    },
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
   Phone number test cases
   ═══════════════════════════════════════════════════════════════════════════ */

// Base data for phone tests (all other fields valid)
const PHONE_BASE = {
  name: 'Phone Tester',
  email: 'phone@example.com',
  password: 'Secure@123',
  age: 25,
  skills: ['Testing'],
};

const phoneValidCases = [
  { label: '+91 98765 43210',  phone: '+91 98765 43210' },
  { label: '+1 800 555 0100',  phone: '+1 800 555 0100' },
  { label: '+44 20 7946 0958', phone: '+44 20 7946 0958' },
  { label: '9876543210',       phone: '9876543210' },
];

const phoneInvalidCases = [
  { label: '800 555 0100 48758',    phone: '800 555 0100 48758' },
  { label: '123',                   phone: '123' },
  { label: 'abcdefghij',            phone: 'abcdefghij' },
  { label: '+91 98765 ABC10',       phone: '+91 98765 ABC10' },
  { label: '++91 9876543210',       phone: '++91 9876543210' },
  { label: '+91 98765 43210 12345', phone: '+91 98765 43210 12345' },
];

function buildPhoneTestCase(phone) {
  return { ...PHONE_BASE, phone };
}

const phoneValidGrid   = document.getElementById('phoneValidGrid');
const phoneInvalidGrid = document.getElementById('phoneInvalidGrid');

phoneValidCases.forEach(({ label, phone }) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'test-btn test-btn-phone-valid';
  btn.textContent = label;
  btn.title = `Expected: HTTP 201 ✅`;
  btn.addEventListener('click', () => populateForm({ data: buildPhoneTestCase(phone) }));
  phoneValidGrid.appendChild(btn);
});

phoneInvalidCases.forEach(({ label, phone }) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'test-btn test-btn-phone-invalid';
  btn.textContent = label;
  btn.title = `Expected: HTTP 400 ❌`;
  btn.addEventListener('click', () => populateForm({ data: buildPhoneTestCase(phone) }));
  phoneInvalidGrid.appendChild(btn);
});

/* ═══════════════════════════════════════════════════════════════════════════
   Utility
   ═══════════════════════════════════════════════════════════════════════════ */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
