const SERVER_URL = "http://localhost:3000";

// ── DOM ─────────────────────────────────────────
const authSection = document.getElementById("auth-section");
const dashboard = document.getElementById("dashboard");
const authError = document.getElementById("auth-error");

const usernameInput = document.getElementById("auth-username");
const emailInput = document.getElementById("auth-email");
const passwordInput = document.getElementById("auth-password");
const personaSelect = document.getElementById("auth-persona");

const btnLogin = document.getElementById("btn-login");
const btnSignup = document.getElementById("btn-signup");
const btnLogout = document.getElementById("btn-logout");
const userLabel = document.getElementById("user-label");
const siteDisplay = document.getElementById("site-display");

// ── Safe JSON Parser ─────────────────────────────
async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

// ── Init ─────────────────────────────────────────
chrome.storage.local.get(["token", "username"], (data) => {
  if (data.token) {
    showDashboard(data.username || "User");
  } else {
    showAuth();
  }
});

function showAuth() {
  authSection.style.display = "block";
  dashboard.style.display = "none";
}

function showDashboard(label) {
  authSection.style.display = "none";
  dashboard.style.display = "block";
  userLabel.textContent = `Logged in as ${label}`;
  loadCurrentState();
}

function showError(msg) {
  authError.textContent = msg;
  authError.style.display = "block";
}

function clearError() {
  authError.style.display = "none";
}

function validateFields(requirePersona = true) {
  if (
    !usernameInput.value.trim() ||
    !emailInput.value.trim() ||
    !passwordInput.value.trim() ||
    (requirePersona && !personaSelect.value)
  ) {
    return false;
  }
  return true;
}

// ── LOGIN ───────────────────────────────────────
btnLogin.addEventListener("click", async () => {
  clearError();

  if (!validateLogin()) {
    return showError("All Fields are Required");
  }

  btnLogin.disabled = true;

  const { username, email, password } = getFormValues();

  try {
    // Get deviceId from background script
    const bg = chrome.extension.getBackgroundPage();
    const deviceId = await bg.getOrCreateDeviceId();

    const res = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, deviceId, deviceType: "chrome" }),
    });

    if (res.status === 404) {
      btnLogin.disabled = false;
      return showError("Please Sign Up First");
    }

    const data = await safeJson(res);

    if (!res.ok || !data.token) {
      btnLogin.disabled = false;
      return showError("Invalid Credentials");
    }

    chrome.storage.local.set(
      { token: data.token, username },
      () => showDashboard(username)
    );

  } catch {
    showError("Server Error. Try Again Later.");
  }

  btnLogin.disabled = false;
});

// ── SIGNUP ──────────────────────────────────────
btnSignup.addEventListener("click", async () => {
  clearError();

  if (!validateSignup()) {
    return showError("All Fields are Required");
  }

  btnSignup.disabled = true;

  const { username, email, password, persona } = getFormValues();

  try {
    // Get deviceId from background script
    const bg = chrome.extension.getBackgroundPage();
    const deviceId = await bg.getOrCreateDeviceId();

    const res = await fetch(`${SERVER_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: username,
        email,
        password,
        personaRole: persona,
        deviceId,
        deviceType: "chrome"
      }),
    });

    const data = await safeJson(res);

    // 👇 IMPORTANT PART
    if (res.status === 409) {
      btnSignup.disabled = false;
      return showError("Email Already Registered");
    }

    if (!res.ok) {
      btnSignup.disabled = false;
      return showError(data.error || "Signup Failed");
    }

    showError("Signup Successful! Please Log In.");

  } catch {
    showError("Server Error. Try Again Later.");
  }

  btnSignup.disabled = false;
});

// ── Logout ──────────────────────────────────────
if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    chrome.storage.local.remove(["token", "username"], () => showAuth());
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