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
   UNIQUE 3D HOLOGRAPHIC QUANTUM WAVE & CYBER CONSTELLATION ENGINE
   ========================================================================== */
(function initUniqueBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height;
  let time = 0;
  let mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, radius: 180 };
  let floatingParticles = [];
  const particleCount = 40;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  // Floating Quantum Star Nodes
  class StarParticle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.45;
      this.vy = (Math.random() - 0.5) * 0.45;
      this.radius = Math.random() * 2 + 1;
      this.baseAlpha = Math.random() * 0.5 + 0.25;
      this.pulseSpeed = Math.random() * 0.03 + 0.01;
      this.hue = Math.random() > 0.5 ? 215 : 185; // Royal Blue / Cyan
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0) this.x = width;
      if (this.x > width) this.x = 0;
      if (this.y < 0) this.y = height;
      if (this.y > height) this.y = 0;

      // Mouse interactive deflection
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < mouse.radius) {
        const force = (mouse.radius - dist) / mouse.radius;
        this.x -= (dx / dist) * force * 2.5;
        this.y -= (dy / dist) * force * 2.5;
      }
    }
    draw() {
      const alpha = this.baseAlpha + Math.sin(time * this.pulseSpeed * 50) * 0.2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue}, 90%, 65%, ${Math.max(0.1, alpha)})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = `hsl(${this.hue}, 90%, 60%)`;
      ctx.fill();
    }
  }

  function init() {
    resize();
    floatingParticles = [];
    for (let i = 0; i < particleCount; i++) {
      floatingParticles.push(new StarParticle());
    }
  }

  function drawQuantumWaveField() {
    // 3D Perspective Undulating Cyber Waves across bottom/middle
    const rows = 12;
    const cols = 36;
    const startY = height * 0.42;
    const rowSpacing = (height * 0.65) / rows;
    const colSpacing = width / cols;

    for (let r = 0; r < rows; r++) {
      ctx.beginPath();
      const rowProgress = r / rows;
      const baseY = startY + r * rowSpacing;

      let points = [];
      for (let c = 0; c <= cols; c++) {
        const x = c * colSpacing;
        
        // Multi-frequency undulating sine wave
        const wave1 = Math.sin(c * 0.22 + time * 0.025 + r * 0.35) * (16 + r * 2.5);
        const wave2 = Math.cos(c * 0.15 - time * 0.018 + r * 0.25) * (12 + r * 1.8);
        
        // Mouse ripple distortion
        const dx = x - mouse.x;
        const dy = baseY - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let mouseElevate = 0;
        if (dist < mouse.radius * 1.5) {
          const factor = (mouse.radius * 1.5 - dist) / (mouse.radius * 1.5);
          mouseElevate = Math.sin(factor * Math.PI) * 35;
        }

        const y = baseY + wave1 + wave2 - mouseElevate;
        points.push({ x, y, dist });
      }

      // Draw flowing wave line with gradient
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];

        const lineGradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
        const alpha = (0.08 + rowProgress * 0.22);
        
        // Highlight near mouse
        const isNearMouse = p1.dist < mouse.radius || p2.dist < mouse.radius;
        if (isNearMouse) {
          lineGradient.addColorStop(0, `rgba(6, 182, 212, ${Math.min(0.9, alpha + 0.45)})`);
          lineGradient.addColorStop(1, `rgba(99, 102, 241, ${Math.min(0.9, alpha + 0.45)})`);
          ctx.lineWidth = 1.8;
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#06b6d4';
        } else {
          lineGradient.addColorStop(0, `rgba(37, 99, 235, ${alpha})`);
          lineGradient.addColorStop(1, `rgba(99, 102, 241, ${alpha * 0.8})`);
          ctx.lineWidth = 1.1;
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = lineGradient;
        ctx.stroke();

        // Draw node points periodically
        if (i % 3 === 0 && rowProgress > 0.2) {
          ctx.beginPath();
          ctx.arc(p1.x, p1.y, isNearMouse ? 2.5 : 1.5, 0, Math.PI * 2);
          ctx.fillStyle = isNearMouse ? '#38bdf8' : `rgba(147, 197, 253, ${alpha * 1.4})`;
          ctx.fill();
        }
      }
    }
  }

  function drawConstellation() {
    // Connect floating stars
    for (let i = 0; i < floatingParticles.length; i++) {
      floatingParticles[i].update();
      floatingParticles[i].draw();

      for (let j = i + 1; j < floatingParticles.length; j++) {
        const dx = floatingParticles[i].x - floatingParticles[j].x;
        const dy = floatingParticles[i].y - floatingParticles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 130) {
          const alpha = (1 - dist / 130) * 0.24;
          ctx.beginPath();
          ctx.moveTo(floatingParticles[i].x, floatingParticles[i].y);
          ctx.lineTo(floatingParticles[j].x, floatingParticles[j].y);
          ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Mouse interactive beam
      const mdx = floatingParticles[i].x - mouse.x;
      const mdy = floatingParticles[i].y - mouse.y;
      const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mdist < mouse.radius) {
        const alpha = (1 - mdist / mouse.radius) * 0.55;
        ctx.beginPath();
        ctx.moveTo(floatingParticles[i].x, floatingParticles[i].y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    time += 1;

    // Smooth mouse lerp
    mouse.x += (mouse.targetX - mouse.x) * 0.15;
    mouse.y += (mouse.targetY - mouse.y) * 0.15;

    // Render 3D Quantum Waves & Ambient Constellations
    drawQuantumWaveField();
    drawConstellation();

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => {
    resize();
    init();
  });

  window.addEventListener('mousemove', (e) => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouse.targetX = -1000;
    mouse.targetY = -1000;
  });

  init();
  animate();
})();
