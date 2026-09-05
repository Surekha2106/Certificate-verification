const API_BASE = '/api';

// State Management
let currentUser = null;
let token = null;
let allCertificatesCache = [];

// DOM Elements
const loginPage = document.getElementById('login-page');
const dashboardWrapper = document.getElementById('dashboard-wrapper');
const loginForm = document.getElementById('login-form');
const sidebarItems = document.querySelectorAll('.sidebar-nav li');
const pages = document.querySelectorAll('.page-content');
const roleBtns = document.querySelectorAll('.role-btn');
const issueForm = document.getElementById('issue-form');
const successModal = document.getElementById('success-modal');
const closeModalBtn = document.getElementById('close-modal');
const logoutBtn = document.getElementById('logout-btn');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toast-message');
const statCards = document.querySelectorAll('.stat-card h3');
const searchInput = document.querySelector('.search-bar input');

// Navigation Logic
function switchPage(pageId) {
  pages.forEach(p => p.classList.remove('active'));
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add('active');
  }

  // Update sidebar active state
  sidebarItems.forEach(item => {
    if (item.getAttribute('data-page') === pageId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Render specific page content if needed
  if (pageId === 'dashboard') renderDashboard();
  if (pageId === 'my-certificates') renderCertificates();
  if (pageId === 'recent-verifications') renderHistory();
}

// Public "Verify Now" Button on Landing Page
const publicVerifyBtn = document.getElementById('public-verify');
if (publicVerifyBtn) {
  publicVerifyBtn.addEventListener('click', () => {
    document.getElementById('goto-signup').click();
    showToast('Please sign in or create an account to access the verification terminal', 'info');
  });
}

const startNowBtn = document.getElementById('start-now');
if (startNowBtn) {
  startNowBtn.addEventListener('click', () => {
    document.getElementById('email').focus();
  });
}

sidebarItems.forEach(item => {
  item.addEventListener('click', () => {
    switchPage(item.getAttribute('data-page'));
  });
});

// Helper to set up user session & dashboard
function handleUserLogin(user, userToken, isNewSignup = false) {
  currentUser = user;
  token = userToken || 'demo-session-token';
  currentUser.role = (currentUser.role || 'ADMIN').toUpperCase();

  // Update UI with user avatar & info
  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.fullName || 'User')}&backgroundColor=2563eb&textColor=ffffff`;
  if (document.getElementById('nav-user-name')) document.getElementById('nav-user-name').innerText = currentUser.fullName;
  if (document.getElementById('nav-user-avatar')) document.getElementById('nav-user-avatar').src = avatarUrl;
  if (document.getElementById('sidebar-user-name')) document.getElementById('sidebar-user-name').innerText = currentUser.fullName;
  if (document.getElementById('sidebar-user-role')) document.getElementById('sidebar-user-role').innerText = currentUser.role.charAt(0) + currentUser.role.slice(1).toLowerCase();
  if (document.getElementById('sidebar-avatar')) document.getElementById('sidebar-avatar').src = avatarUrl;
  if (document.getElementById('profile-full-name')) document.getElementById('profile-full-name').value = currentUser.fullName;
  if (document.getElementById('profile-email')) document.getElementById('profile-email').value = currentUser.email;
  if (document.getElementById('profile-display-name')) document.getElementById('profile-display-name').innerText = currentUser.fullName;
  if (document.getElementById('profile-role-badge')) document.getElementById('profile-role-badge').innerText = `Verified ${currentUser.role.charAt(0) + currentUser.role.slice(1).toLowerCase()}`;
  if (document.getElementById('profile-img-display')) document.getElementById('profile-img-display').src = avatarUrl;
  if (document.getElementById('welcome-user-name')) document.getElementById('welcome-user-name').innerText = (currentUser.fullName || 'User').split(' ')[0];

  const digitalId = '0x' + btoa(currentUser.email || 'user').substring(0, 36).replace(/[^a-fA-F0-9]/g, 'a') + '...';
  if (document.getElementById('profile-wallet-address')) document.getElementById('profile-wallet-address').value = digitalId;
  if (document.getElementById('profile-member-since')) document.getElementById('profile-member-since').innerText = new Date().getFullYear();

  if (loginPage) loginPage.classList.remove('active');
  const signupPage = document.getElementById('signup-page');
  if (signupPage) signupPage.classList.remove('active');
  if (dashboardWrapper) dashboardWrapper.style.display = 'flex';

  switchPage('dashboard');
  if (isNewSignup) {
    showToast(`Account created successfully! Welcome, ${currentUser.fullName}!`, 'success');
  } else {
    showToast(`Welcome back, ${currentUser.fullName}!`, 'success');
  }
}

// Login Logic
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  showToast('Authenticating with secure registry...', 'info');

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.ok && data.user) {
      handleUserLogin(data.user, data.token, false);
    } else {
      showToast(data.message || 'Invalid email or password', 'error');
    }
  } catch (err) {
    showToast('Backend service unreachable. Please ensure server is running.', 'error');
  }
});

// Top-right Profile Navigation
const userAvatarEl = document.querySelector('.user-avatar');
if (userAvatarEl) {
  userAvatarEl.addEventListener('click', () => {
    switchPage('profile');
  });
}

logoutBtn.addEventListener('click', () => {
  currentUser = null;
  token = null;
  dashboardWrapper.style.display = 'none';
  const signupPage = document.getElementById('signup-page');
  if (signupPage) signupPage.classList.remove('active');
  loginPage.classList.add('active');
  showToast('Logged out securely', 'info');
});

// Role Selectors
roleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    roleBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

const signupRoleBtns = document.querySelectorAll('.role-btn-signup');
signupRoleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    signupRoleBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// Auth Page Switching
document.getElementById('goto-signup').addEventListener('click', (e) => {
  e.preventDefault();
  loginPage.classList.remove('active');
  document.getElementById('signup-page').classList.add('active');
});

document.getElementById('goto-login').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('signup-page').classList.remove('active');
  loginPage.classList.add('active');
});

// Signup Logic
const signupForm = document.getElementById('signup-form');
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fullName = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value.trim();

  const roleBtn = document.querySelector('.role-btn-signup.active');
  const role = roleBtn ? roleBtn.getAttribute('data-role').toUpperCase() : 'STUDENT';

  if (!fullName || !email || !password) {
    return showToast('Please complete all required fields', 'warning');
  }

  showToast('Creating account in cryptographic registry...', 'info');

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password, role })
    });

    const data = await res.json();
    if (res.ok && data.user) {
      handleUserLogin(data.user, data.token, true);
    } else {
      showToast(data.message || 'Registration failed', 'error');
    }
  } catch (err) {
    showToast('Cannot reach backend registry server', 'error');
  }
});

// Issue Certificate Logic
const certFileInput = document.getElementById('certFile');
const certFileLabel = document.querySelector('.file-label p');

if (certFileInput) {
  certFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      const fileName = e.target.files[0].name;
      certFileLabel.innerHTML = `File Selected: <br> <strong style="color: var(--accent-secondary);">${fileName}</strong>`;
      showToast(`Selected file: "${fileName}"`, 'info');
    }
  });
}

issueForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const student = document.getElementById('studentName').value.trim();
  const course = document.getElementById('courseName').value.trim();
  const institution = document.getElementById('institutionName').value.trim();
  const file = certFileInput ? certFileInput.files[0] : null;

  if (!student || !course || !institution || !file) {
    return showToast('Please fill all fields and select a PDF file', 'warning');
  }

  const formData = new FormData();
  formData.append('studentName', student);
  formData.append('courseName', course);
  formData.append('institutionName', institution);
  formData.append('certFile', file);

  showToast('Generating SHA-256 fingerprint & digital credential...', 'info');

  try {
    const res = await fetch(`${API_BASE}/certificates/issue`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (res.ok) {
      document.getElementById('display-cert-id').innerText = data.certId;
      document.getElementById('tx-hash').innerText = data.txHash;
      document.querySelector('.qr-preview img').src = data.qrCode;
      successModal.style.display = 'flex';
      showToast('Digital Certificate Issued & Anchored Successfully!', 'success');
    } else {
      showToast(data.message || 'Issuance failed', 'error');
    }
  } catch (err) {
    showToast('Error communicating with certificate issuance service', 'error');
  }
});

closeModalBtn.addEventListener('click', () => {
  successModal.style.display = 'none';
  issueForm.reset();
  if (certFileLabel) {
    certFileLabel.innerHTML = 'Upload Certificate (PDF) <br> <span class="text-gray" style="font-size: 0.8rem;">Max size 50MB</span>';
  }
  switchPage('my-certificates');
});

// Render Functions
async function renderDashboard() {
  const activityList = document.querySelector('.activity-card');
  try {
    const res = await fetch(`${API_BASE}/certificates`);
    const data = await res.json();
    allCertificatesCache = Array.isArray(data) ? data : [];

    // Update stats
    if (statCards.length >= 4) {
      statCards[0].innerText = allCertificatesCache.length;
      statCards[1].innerText = allCertificatesCache.length;
      statCards[2].innerText = allCertificatesCache.filter(c => new Date(c.issuedAt).getMonth() === new Date().getMonth()).length;
      statCards[3].innerText = '100%';
    }

    const profCertCount = document.getElementById('profile-cert-count');
    if (profCertCount) profCertCount.innerText = allCertificatesCache.length;
    const navCertCount = document.getElementById('nav-cert-count');
    if (navCertCount) navCertCount.innerText = allCertificatesCache.length;

    if (activityList) {
      activityList.innerHTML = allCertificatesCache.slice(-5).reverse().map(c => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--border-color);">
          <div style="display: flex; align-items: center; gap: 14px;">
            <i class="fas fa-check-circle" style="color: var(--success); font-size: 1.1rem;"></i>
            <div>
              <p style="font-weight: 600; color: var(--text-primary); font-size: 0.95rem;">${c.studentName}</p>
              <span class="text-gray" style="font-size: 0.82rem;">${c.courseName} • ${c.institutionName || 'Certified'}</span>
            </div>
          </div>
          <div style="text-align: right;">
            <span class="badge badge-success">Verified</span>
            <div class="text-gray" style="font-size: 0.75rem; margin-top: 4px;">${new Date(c.issuedAt).toLocaleDateString()}</div>
          </div>
        </div>
      `).join('') || '<p class="text-gray" style="padding: 20px 0; text-align: center;">No certificates issued yet. Issue your first credential above!</p>';
    }
  } catch (err) {
    if (activityList) activityList.innerHTML = '<p class="text-danger">Unable to load activity logs.</p>';
  }
}

async function renderCertificates(filter = 'All', searchQuery = '') {
  const grid = document.querySelector('.certificate-grid');
  if (!grid) return;

  try {
    if (allCertificatesCache.length === 0) {
      const res = await fetch(`${API_BASE}/certificates`);
      allCertificatesCache = await res.json();
    }

    let items = Array.isArray(allCertificatesCache) ? allCertificatesCache : [];

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(c => 
        (c.studentName && c.studentName.toLowerCase().includes(q)) ||
        (c.courseName && c.courseName.toLowerCase().includes(q)) ||
        (c.id && c.id.toLowerCase().includes(q))
      );
    }

    if (items.length === 0) {
      grid.innerHTML = `
        <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 48px 20px;">
          <i class="fas fa-certificate" style="font-size: 2.5rem; color: var(--text-muted); margin-bottom: 12px;"></i>
          <h3 style="color: var(--text-primary); margin-bottom: 6px;">No Certificates Found</h3>
          <p class="text-gray" style="font-size: 0.9rem;">No credentials match your current filter criteria.</p>
        </div>`;
      return;
    }

    grid.innerHTML = items.map(cert => `
      <div class="glass-card certificate-card">
        <div class="cert-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-shield-alt" style="color: var(--accent-secondary);"></i>
            <span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">${cert.id}</span>
          </div>
          <span class="badge badge-success"><i class="fas fa-check"></i> Verified</span>
        </div>
        <h3>${cert.courseName}</h3>
        <p class="text-gray"><i class="fas fa-user-graduate" style="margin-right: 6px;"></i> Issued to <strong>${cert.studentName}</strong></p>
        <div style="background: var(--bg-input); padding: 8px 12px; border-radius: var(--radius-sm); font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono); margin-bottom: 16px; word-break: break-all;">
          Hash: ${cert.hash ? cert.hash.substring(0, 24) + '...' : 'Tamper-Evident SHA-256'}
        </div>
        <div class="cert-footer">
          <span class="text-gray" style="font-size: 0.82rem;"><i class="fas fa-calendar-alt" style="margin-right: 4px;"></i> ${new Date(cert.issuedAt).toLocaleDateString()}</span>
          <button class="btn btn-accent btn-sm" onclick="viewCertificate('${cert.id}')">View Details <i class="fas fa-arrow-right"></i></button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    grid.innerHTML = '<p class="text-danger">Failed to load certificates.</p>';
  }
}

async function renderHistory() {
  const body = document.getElementById('history-body');
  if (!body) return;

  try {
    const res = await fetch(`${API_BASE}/certificates`);
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];

    body.innerHTML = list.slice().reverse().map(h => {
      const avatarSeed = encodeURIComponent(h.studentName || 'User');
      return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="https://api.dicebear.com/7.x/initials/svg?seed=${avatarSeed}&backgroundColor=2563eb&textColor=ffffff" style="width: 32px; height: 32px; border-radius: 50%;">
            <div>
              <div style="font-weight: 600;">${h.studentName}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">${h.id}</div>
            </div>
          </div>
        </td>
        <td class="text-gray">${h.courseName}</td>
        <td><span class="badge badge-success"><i class="fas fa-shield-check"></i> Authenticated</span></td>
        <td class="text-gray" style="font-size: 0.84rem;">${new Date(h.issuedAt).toLocaleString()}</td>
        <td><button class="btn btn-primary btn-sm" onclick="viewCertificate('${h.id}')"><i class="fas fa-eye"></i> Verify</button></td>
      </tr>`;
    }).join('') || '<tr><td colspan="5" style="text-align:center; padding: 32px;" class="text-gray">No verification records available</td></tr>';
  } catch (err) {
    body.innerHTML = '<tr><td colspan="5" class="text-danger" style="text-align:center; padding: 20px;">Error loading verification history</td></tr>';
  }
}

// Search Filter Handling
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value;
    const activePage = document.querySelector('.page-content.active');
    if (activePage && activePage.id === 'my-certificates') {
      renderCertificates('All', query);
    }
  });
}

// Certificate Filter Options Buttons
const filterBtns = document.querySelectorAll('.filter-options .btn');
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderCertificates(btn.innerText.trim(), searchInput ? searchInput.value : '');
  });
});

// Verify by ID Logic
const verifyIdBtn = document.getElementById('btn-verify-id');
const verifyInput = document.getElementById('verify-id-input');
const verifyFileBtn = document.getElementById('btn-verify-file');
const verifyFileInput = document.getElementById('verify-file');
const verifyFileLabel = document.querySelector('label[for="verify-file"]');

if (verifyFileInput && verifyFileLabel) {
  verifyFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      const fileName = e.target.files[0].name;
      verifyFileLabel.innerText = `${fileName.substring(0, 18)}...`;
      showToast(`Loaded file "${fileName}"`, 'info');
    }
  });
}

if (verifyIdBtn && verifyInput) {
  verifyIdBtn.addEventListener('click', async () => {
    const id = verifyInput.value.trim();
    if (!id) return showToast('Please enter a Certificate ID', 'warning');

    showToast('Consulting cryptographic registry...', 'info');

    try {
      const res = await fetch(`${API_BASE}/certificates/verify/${encodeURIComponent(id)}`);
      const data = await res.json();

      if (data.verified && data.certificate) {
        showToast(`Verified! Valid credential issued to ${data.certificate.studentName}`, 'success');
        document.getElementById('display-cert-id').innerText = data.certificate.id;
        document.getElementById('tx-hash').innerText = data.certificate.txHash || data.certificate.hash;
        
        // Generate QR code for display
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(window.location.origin + '/#verify?id=' + data.certificate.id)}`;
        document.querySelector('.qr-preview img').src = qrUrl;
        successModal.style.display = 'flex';
      } else {
        showToast(data.message || 'Certificate ID not found in registry', 'error');
      }
    } catch (err) {
      showToast('Verification service error', 'error');
    }
  });
}

// Verify by PDF File Upload Logic
if (verifyFileBtn && verifyFileInput) {
  verifyFileBtn.addEventListener('click', async () => {
    const file = verifyFileInput.files[0];
    if (!file) return showToast('Please select a PDF certificate to verify', 'warning');

    const formData = new FormData();
    formData.append('certFile', file);

    showToast('Hashing file and checking cryptographic checksum...', 'info');

    try {
      const res = await fetch(`${API_BASE}/certificates/verify-pdf`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.verified && data.certificate) {
        showToast(`Integrity Verified 100%! Authentic document issued to ${data.certificate.studentName}`, 'success');
        document.getElementById('display-cert-id').innerText = data.certificate.id;
        document.getElementById('tx-hash').innerText = data.certificate.txHash || data.certificate.hash;
        
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(window.location.origin + '/#verify?id=' + data.certificate.id)}`;
        document.querySelector('.qr-preview img').src = qrUrl;
        successModal.style.display = 'flex';
      } else {
        showToast(data.message || 'Cryptographic checksum mismatch! File has been altered or is unverified.', 'error');
      }
    } catch (err) {
      showToast('Verification service unavailable', 'error');
    }
  });
}

// Auto-handle QR Code Verification URLs
window.addEventListener('load', () => {
  let certId = new URLSearchParams(window.location.search).get('id');
  if (!certId && window.location.hash && window.location.hash.includes('id=')) {
    const hashParts = window.location.hash.split('?');
    if (hashParts.length > 1) {
      certId = new URLSearchParams(hashParts[1]).get('id');
    }
  }

  if (certId && verifyInput && verifyIdBtn) {
    // If login is showing, bypass landing page to show verification directly
    if (loginPage) loginPage.classList.remove('active');
    if (dashboardWrapper) dashboardWrapper.style.display = 'flex';
    switchPage('verify-certificate');
    verifyInput.value = certId;
    verifyIdBtn.click();
  }
});

// Profile Tabs Navigation
const tabBtns = document.querySelectorAll('.tab-btn');
const settingsContents = document.querySelectorAll('.settings-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabId = btn.getAttribute('data-tab');
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    settingsContents.forEach(content => {
      content.classList.remove('active');
      if (content.id === `section-${tabId}`) {
        content.classList.add('active');
      }
    });
  });
});

// Notifications Dropdown Logic
const bellIcon = document.getElementById('bell-icon');
const notifDropdown = document.getElementById('notif-dropdown');
const markAllReadBtn = document.querySelector('.notif-header a');
const notifList = document.getElementById('notif-list');
const notifBadge = document.querySelector('.notification-icon .badge');

if (bellIcon && notifDropdown) {
  bellIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    notifDropdown.classList.toggle('active');
  });

  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (notifList) notifList.innerHTML = '<p class="text-gray" style="text-align: center; padding: 20px;">No new notifications</p>';
      if (notifBadge) notifBadge.style.display = 'none';
      showToast('All notifications marked as read', 'info');
    });
  }

  document.addEventListener('click', () => {
    notifDropdown.classList.remove('active');
  });

  notifDropdown.addEventListener('click', (e) => e.stopPropagation());
}

// Theme Switcher (Dark Mode / Light Mode)
const themeSwitch = document.getElementById('theme-switch');
let currentTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', currentTheme);
updateThemeIcon();

if (themeSwitch) {
  themeSwitch.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateThemeIcon();
    showToast(`${currentTheme === 'dark' ? 'Dark Slate' : 'Clean Light'} Mode Activated`, 'info');
  });
}

function updateThemeIcon() {
  if (!themeSwitch) return;
  const icon = themeSwitch.querySelector('i');
  if (icon) {
    icon.className = (currentTheme === 'dark') ? 'fas fa-sun' : 'fas fa-moon';
  }
}

// Enterprise Toast Notification
function showToast(message, type = 'success') {
  if (!toast || !toastMsg) return;
  toastMsg.innerText = message;
  toast.style.display = 'flex';

  if (type === 'error') {
    toast.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    toast.style.background = '#1e293b';
    toast.querySelector('i').style.color = 'var(--danger)';
  } else if (type === 'warning') {
    toast.style.borderColor = 'rgba(245, 158, 11, 0.4)';
    toast.style.background = '#1e293b';
    toast.querySelector('i').style.color = 'var(--warning)';
  } else if (type === 'info') {
    toast.style.borderColor = 'rgba(37, 99, 235, 0.4)';
    toast.style.background = '#1e293b';
    toast.querySelector('i').style.color = 'var(--accent-secondary)';
  } else {
    toast.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    toast.style.background = '#1e293b';
    toast.querySelector('i').style.color = 'var(--success)';
  }

  setTimeout(() => {
    toast.style.display = 'none';
  }, 3500);
}

// Global View Certificate Helper
window.viewCertificate = function (id) {
  if (!id || id === 'undefined') {
    return showToast('Certificate ID not found', 'error');
  }
  switchPage('verify-certificate');
  if (verifyInput && verifyIdBtn) {
    verifyInput.value = id;
    verifyIdBtn.click();
  }
};

/* ==========================================================================
   3D PERSPECTIVE CYBER GRIDSCAN WEBGL SHADER ENGINE (Three.js)
   ========================================================================== */
(function initGridScanShader() {
  const container = document.getElementById('gridscan-container');
  if (!container || typeof THREE === 'undefined') return;

  const vert = `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

  const frag = `
#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform vec3 iResolution;
uniform float iTime;
uniform vec2 uSkew;
uniform float uTilt;
uniform float uYaw;
uniform float uLineThickness;
uniform vec3 uLinesColor;
uniform vec3 uScanColor;
uniform float uGridScale;
uniform float uLineStyle;
uniform float uLineJitter;
uniform float uScanOpacity;
uniform float uScanDirection;
uniform float uNoise;
uniform float uBloomOpacity;
uniform float uScanGlow;
uniform float uScanSoftness;
uniform float uPhaseTaper;
uniform float uScanDuration;
uniform float uScanDelay;
uniform float uLightMode;
varying vec2 vUv;

uniform float uScanStarts[8];
uniform float uScanCount;

const int MAX_SCANS = 8;

float smoother01(float a, float b, float x){
  float t = clamp((x - a) / max(1e-5, (b - a)), 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 p = (2.0 * fragCoord - iResolution.xy) / iResolution.y;

    vec3 ro = vec3(0.0);
    vec3 rd = normalize(vec3(p, 2.0));

    float cR = cos(uTilt), sR = sin(uTilt);
    rd.xy = mat2(cR, -sR, sR, cR) * rd.xy;

    float cY = cos(uYaw), sY = sin(uYaw);
    rd.xz = mat2(cY, -sY, sY, cY) * rd.xz;

    vec2 skew = clamp(uSkew, vec2(-0.7), vec2(0.7));
    rd.xy += skew * rd.z;

    vec3 color = vec3(0.0);
    float minT = 1e20;
    float gridScale = max(1e-5, uGridScale);
    float fadeStrength = 1.8;
    vec2 gridUV = vec2(0.0);

    float hitIsY = 1.0;
    for (int i = 0; i < 4; i++)
    {
        float isY = float(i < 2);
        float pos = mix(-0.25, 0.25, float(i)) * isY + mix(-0.6, 0.6, float(i - 2)) * (1.0 - isY);
        float num = pos - (isY * ro.y + (1.0 - isY) * ro.x);
        float den = isY * rd.y + (1.0 - isY) * rd.x;
        float t = num / den;
        vec3 h = ro + rd * t;

        float depthBoost = smoothstep(0.0, 3.0, h.z);
        h.xy += skew * 0.15 * depthBoost;

        bool use = t > 0.0 && t < minT;
        gridUV = use ? mix(h.zy, h.xz, isY) / gridScale : gridUV;
        minT = use ? t : minT;
        hitIsY = use ? isY : hitIsY;
    }

    vec3 hit = ro + rd * minT;
    float dist = length(hit - ro);

    float jitterAmt = clamp(uLineJitter, 0.0, 1.0);
    if (jitterAmt > 0.0) {
      vec2 j = vec2(
        sin(gridUV.y * 2.7 + iTime * 1.8),
        cos(gridUV.x * 2.3 - iTime * 1.6)
      ) * (0.15 * jitterAmt);
      gridUV += j;
    }
    float fx = fract(gridUV.x);
    float fy = fract(gridUV.y);
    float ax = min(fx, 1.0 - fx);
    float ay = min(fy, 1.0 - fy);
    float wx = fwidth(gridUV.x);
    float wy = fwidth(gridUV.y);
    float halfPx = max(0.0, uLineThickness) * 0.5;

    float tx = halfPx * wx;
    float ty = halfPx * wy;

    float aax = wx;
    float aay = wy;

    float lineX = 1.0 - smoothstep(tx, tx + aax, ax);
    float lineY = 1.0 - smoothstep(ty, ty + aay, ay);
    float primaryMask = max(lineX, lineY);

    vec2 gridUV2 = (hitIsY > 0.5 ? hit.xz : hit.zy) / gridScale;
    if (jitterAmt > 0.0) {
      vec2 j2 = vec2(
        cos(gridUV2.y * 2.1 - iTime * 1.4),
        sin(gridUV2.x * 2.5 + iTime * 1.7)
      ) * (0.15 * jitterAmt);
      gridUV2 += j2;
    }
    float fx2 = fract(gridUV2.x);
    float fy2 = fract(gridUV2.y);
    float ax2 = min(fx2, 1.0 - fx2);
    float ay2 = min(fy2, 1.0 - fy2);
    float wx2 = fwidth(gridUV2.x);
    float wy2 = fwidth(gridUV2.y);
    float tx2 = halfPx * wx2;
    float ty2 = halfPx * wy2;
    float aax2 = wx2;
    float aay2 = wy2;
    float lineX2 = 1.0 - smoothstep(tx2, tx2 + aax2, ax2);
    float lineY2 = 1.0 - smoothstep(ty2, ty2 + aay2, ay2);
    float altMask = max(lineX2, lineY2);

    float edgeDistX = min(abs(hit.x - (-0.6)), abs(hit.x - 0.6));
    float edgeDistY = min(abs(hit.y - (-0.25)), abs(hit.y - 0.25));
    float edgeDist = mix(edgeDistY, edgeDistX, hitIsY);
    float edgeGate = 1.0 - smoothstep(gridScale * 0.5, gridScale * 2.0, edgeDist);
    altMask *= edgeGate;

    float lineMask = max(primaryMask, altMask);

    float fade = exp(-dist * fadeStrength);

    float dur = max(0.05, uScanDuration);
    float del = max(0.0, uScanDelay);
    float scanZMax = 2.4;
    float widthScale = max(0.1, uScanGlow);
    float sigma = max(0.001, 0.18 * widthScale * uScanSoftness);
    float sigmaA = sigma * 2.0;

    float combinedPulse = 0.0;
    float combinedAura = 0.0;

    float cycle = dur + del;
    float tCycle = mod(iTime, cycle);
    float scanPhase = clamp((tCycle - del) / dur, 0.0, 1.0);
    float phase = scanPhase;
    if (uScanDirection > 1.5) {
      float t2 = mod(max(0.0, iTime - del), 2.0 * dur);
      phase = (t2 < dur) ? (t2 / dur) : (1.0 - (t2 - dur) / dur);
    }
    float scanZ = phase * scanZMax;
    float dz = abs(hit.z - scanZ);
    float lineBand = exp(-0.5 * (dz * dz) / (sigma * sigma));
    float taper = clamp(uPhaseTaper, 0.0, 0.49);
    float headW = taper;
    float tailW = taper;
    float headFade = smoother01(0.0, headW, phase);
    float tailFade = 1.0 - smoother01(1.0 - tailW, 1.0, phase);
    float phaseWindow = headFade * tailFade;
    float pulseBase = lineBand * phaseWindow;
    combinedPulse += pulseBase * clamp(uScanOpacity, 0.0, 1.0);
    float auraBand = exp(-0.5 * (dz * dz) / (sigmaA * sigmaA));
    combinedAura += (auraBand * 0.35) * phaseWindow * clamp(uScanOpacity, 0.0, 1.0);

    for (int i = 0; i < MAX_SCANS; i++) {
      if (float(i) >= uScanCount) break;
      float tActiveI = iTime - uScanStarts[i];
      float phaseI = clamp(tActiveI / dur, 0.0, 1.0);
      phaseI = (phaseI < 0.5) ? (phaseI * 2.0) : (1.0 - (phaseI - 0.5) * 2.0);
      float scanZI = phaseI * scanZMax;
      float dzI = abs(hit.z - scanZI);
      float lineBandI = exp(-0.5 * (dzI * dzI) / (sigma * sigma));
      float headFadeI = smoother01(0.0, headW, phaseI);
      float tailFadeI = 1.0 - smoother01(1.0 - tailW, 1.0, phaseI);
      float phaseWindowI = headFadeI * tailFadeI;
      combinedPulse += lineBandI * phaseWindowI * clamp(uScanOpacity, 0.0, 1.0);
      float auraBandI = exp(-0.5 * (dzI * dzI) / (sigmaA * sigmaA));
      combinedAura += (auraBandI * 0.35) * phaseWindowI * clamp(uScanOpacity, 0.0, 1.0);
    }

    float lineVis = lineMask;
    vec3 gridCol = uLinesColor * lineVis * fade;
    vec3 scanCol = uScanColor * combinedPulse * 1.4;
    vec3 scanAura = uScanColor * combinedAura * 1.2;

    color = gridCol + scanCol + scanAura;

    float n = fract(sin(dot(gl_FragCoord.xy + vec2(iTime * 123.4), vec2(12.9898,78.233))) * 43758.5453123);
    color += (n - 0.5) * uNoise;
    color = clamp(color, 0.0, 1.0);
    float alpha = clamp(max(lineVis * 0.8, combinedPulse), 0.0, 1.0);
    
    if (uLightMode > 0.5) {
      float energy = max(max(color.r, color.g), color.b);
      float coverage = clamp(max(alpha, smoothstep(0.0, 0.55, energy) * 0.82), 0.0, 0.9);
      coverage *= smoothstep(0.015, 0.12, energy);
      vec3 chroma = clamp(color / max(energy, 0.0001), 0.0, 1.0);
      chroma = pow(chroma, vec3(1.2));
      fragColor = vec4(mix(vec3(0.96, 0.97, 0.98), chroma, coverage * 0.94), 1.0);
    } else {
      fragColor = vec4(color, alpha);
    }
}

void main(){
  vec4 c;
  mainImage(c, vUv * iResolution.xy);
  gl_FragColor = c;
}
`;

  // Renderer Setup
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const MAX_SCANS = 8;
  let scanStarts = [];
  function pushScan(t) {
    if (scanStarts.length >= MAX_SCANS) scanStarts.shift();
    scanStarts.push(t);
    const buf = new Array(MAX_SCANS).fill(0);
    for (let i = 0; i < scanStarts.length && i < MAX_SCANS; i++) buf[i] = scanStarts[i];
    uniforms.uScanStarts.value = buf;
    uniforms.uScanCount.value = scanStarts.length;
  }

  const uniforms = {
    iResolution: { value: new THREE.Vector3(window.innerWidth, window.innerHeight, renderer.getPixelRatio()) },
    iTime: { value: 0 },
    uSkew: { value: new THREE.Vector2(0, 0) },
    uTilt: { value: 0 },
    uYaw: { value: 0 },
    uLineThickness: { value: 1.2 },
    uLinesColor: { value: new THREE.Color('#2563eb') },
    uScanColor: { value: new THREE.Color('#38bdf8') },
    uGridScale: { value: 0.085 },
    uLineStyle: { value: 0 },
    uLineJitter: { value: 0.05 },
    uScanOpacity: { value: 0.85 },
    uNoise: { value: 0.012 },
    uBloomOpacity: { value: 0.5 },
    uScanGlow: { value: 0.7 },
    uScanSoftness: { value: 2.0 },
    uPhaseTaper: { value: 0.4 },
    uScanDuration: { value: 2.2 },
    uScanDelay: { value: 1.0 },
    uScanDirection: { value: 2 },
    uScanStarts: { value: new Array(MAX_SCANS).fill(0) },
    uScanCount: { value: 0 },
    uLightMode: { value: document.documentElement.getAttribute('data-theme') === 'light' ? 1 : 0 }
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    extensions: {
      derivatives: true
    }
  });

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(quad);

  // Mouse & Motion Physics
  let lookTarget = new THREE.Vector2(0, 0);
  let lookCurrent = new THREE.Vector2(0, 0);
  let lookVel = new THREE.Vector2(0, 0);
  let tiltTarget = 0, tiltCurrent = 0, tiltVel = 0;
  let yawTarget = 0, yawCurrent = 0, yawVel = 0;
  const smoothTime = 0.25;

  function smoothDamp(current, target, velRef, smTime, dt) {
    const omega = 2 / Math.max(0.0001, smTime);
    const x = omega * dt;
    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    const change = current - target;
    const temp = (velRef.v + omega * change) * dt;
    velRef.v = (velRef.v - omega * temp) * exp;
    return target + (change + temp) * exp;
  }

  window.addEventListener('mousemove', (e) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = -((e.clientY / window.innerHeight) * 2 - 1);
    lookTarget.set(nx, ny);
    yawTarget = nx * 0.4;
    tiltTarget = -ny * 0.25;
  });

  window.addEventListener('click', () => {
    pushScan(performance.now() / 1000);
  });

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, renderer.getPixelRatio());
  });

  // Theme change observer
  const observer = new MutationObserver(() => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    uniforms.uLightMode.value = isLight ? 1 : 0;
    if (isLight) {
      uniforms.uLinesColor.value.set('#3b82f6');
      uniforms.uScanColor.value.set('#0284c7');
    } else {
      uniforms.uLinesColor.value.set('#2563eb');
      uniforms.uScanColor.value.set('#38bdf8');
    }
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  let lastTime = performance.now();
  function animate() {
    const now = performance.now();
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    const tVel = { v: tiltVel };
    tiltCurrent = smoothDamp(tiltCurrent, tiltTarget, tVel, smoothTime, dt);
    tiltVel = tVel.v;

    const yVel = { v: yawVel };
    yawCurrent = smoothDamp(yawCurrent, yawTarget, yVel, smoothTime, dt);
    yawVel = yVel.v;

    const lxVel = { v: lookVel.x };
    lookCurrent.x = smoothDamp(lookCurrent.x, lookTarget.x, lxVel, smoothTime, dt);
    lookVel.x = lxVel.v;

    const lyVel = { v: lookVel.y };
    lookCurrent.y = smoothDamp(lookCurrent.y, lookTarget.y, lyVel, smoothTime, dt);
    lookVel.y = lyVel.v;

    uniforms.uSkew.value.set(lookCurrent.x * 0.14, -lookCurrent.y * 0.2);
    uniforms.uTilt.value = tiltCurrent * 0.25;
    uniforms.uYaw.value = yawCurrent * 0.28;
    uniforms.iTime.value = now / 1000;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
})();
