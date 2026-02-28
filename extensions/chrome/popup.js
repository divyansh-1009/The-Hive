const SERVER_URL = "http://localhost:3000";

// ── DOM ─────────────────────────────────────────
const loginSection = document.getElementById("login-section");
const signupSection = document.getElementById("signup-section");
const dashboard = document.getElementById("dashboard");

const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginError = document.getElementById("login-error");
const btnLogin = document.getElementById("btn-login");

const signupUsername = document.getElementById("signup-username");
const signupEmail = document.getElementById("signup-email");
const signupPassword = document.getElementById("signup-password");
const signupPersona = document.getElementById("signup-persona");
const signupError = document.getElementById("signup-error");
const btnSignup = document.getElementById("btn-signup");

const btnLogout = document.getElementById("btn-logout");
const userLabel = document.getElementById("user-label");
const siteDisplay = document.getElementById("site-display");

const showSignupLink = document.getElementById("show-signup");
const showLoginLink = document.getElementById("show-login");

// ── Safe JSON Parser ─────────────────────────────
async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

// ── Get deviceId from service worker (MV3 compatible) ──
function getDeviceId() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "getDeviceId" }, (response) => {
      resolve(response?.deviceId || null);
    });
  });
}

// ── View Switching ──────────────────────────────
function hideAll() {
  loginSection.style.display = "none";
  signupSection.style.display = "none";
  dashboard.style.display = "none";
}

function showLogin() {
  hideAll();
  loginSection.style.display = "block";
  clearErrors();
}

function showSignup() {
  hideAll();
  signupSection.style.display = "block";
  clearErrors();
}

function showDashboard(label) {
  hideAll();
  dashboard.style.display = "block";
  userLabel.textContent = `Logged in as ${label}`;
  loadCurrentState();
}

function showErrorOn(el, msg) {
  el.textContent = msg;
  el.style.display = "block";
}

function clearErrors() {
  loginError.style.display = "none";
  signupError.style.display = "none";
}

// ── Toggle links ────────────────────────────────
showSignupLink.addEventListener("click", (e) => { e.preventDefault(); showSignup(); });
showLoginLink.addEventListener("click", (e) => { e.preventDefault(); showLogin(); });

// ── Init ─────────────────────────────────────────
chrome.storage.local.get(["token", "email"], (data) => {
  if (data.token) {
    showDashboard(data.email || "User");
  } else {
    showLogin();
  }
});

// ── LOGIN (email + password only) ───────────────
btnLogin.addEventListener("click", async () => {
  clearErrors();

  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();

  if (!email || !password) {
    return showErrorOn(loginError, "Email and password are required");
  }

  btnLogin.disabled = true;

  try {
    const deviceId = await getDeviceId();

    const res = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, deviceId, deviceType: "chrome" }),
    });

    const data = await safeJson(res);

    if (res.status === 401) {
      btnLogin.disabled = false;
      return showErrorOn(loginError, "Invalid credentials");
    }

    if (!res.ok || !data.token) {
      btnLogin.disabled = false;
      return showErrorOn(loginError, data.error || "Login failed");
    }

    chrome.storage.local.set(
      { token: data.token, email },
      () => showDashboard(email)
    );
  } catch {
    showErrorOn(loginError, "Server error. Try again later.");
  }

  btnLogin.disabled = false;
});

// ── SIGNUP (name + email + password + persona) ──
btnSignup.addEventListener("click", async () => {
  clearErrors();

  const name = signupUsername.value.trim();
  const email = signupEmail.value.trim();
  const password = signupPassword.value.trim();
  const persona = signupPersona.value;

  if (!name || !email || !password || !persona) {
    return showErrorOn(signupError, "All fields are required");
  }

  btnSignup.disabled = true;

  try {
    const deviceId = await getDeviceId();

    const res = await fetch(`${SERVER_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        personaRole: persona,
        deviceId,
        deviceType: "chrome",
      }),
    });

    const data = await safeJson(res);

    if (res.status === 409) {
      btnSignup.disabled = false;
      return showErrorOn(signupError, "Email already registered");
    }

    if (!res.ok) {
      btnSignup.disabled = false;
      return showErrorOn(signupError, data.error || "Signup failed");
    }

    // Success — switch to login view with a success message
    showLogin();
    showErrorOn(loginError, "Account created! Please log in.");
    loginError.style.color = "#34a853"; // green for success
  } catch {
    showErrorOn(signupError, "Server error. Try again later.");
  }

  btnSignup.disabled = false;
});

// ── Logout ──────────────────────────────────────
if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    chrome.storage.local.remove(["token", "email"], () => showLogin());
  });
}

// ── Current Site ────────────────────────────────
function loadCurrentState() {
  chrome.runtime.sendMessage({ action: "getState" }, (res) => {
    if (!siteDisplay) return;

    if (res && res.activeSite) {
      siteDisplay.innerHTML =
        `<span class="status-dot active"></span>
         <span class="site">${res.activeSite}</span>`;
    } else {
      siteDisplay.innerHTML =
        `<span class="status-dot idle"></span>
         <span class="inactive">No active tab</span>`;
    }
  });
}