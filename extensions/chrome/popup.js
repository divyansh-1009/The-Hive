const SERVER_URL = "http://localhost:3000";

// ── DOM refs ────────────────────────────────────────────────────────────────
const authSection = document.getElementById("auth-section");
const dashboard = document.getElementById("dashboard");
const authError = document.getElementById("auth-error");
const emailInput = document.getElementById("auth-email");
const passwordInput = document.getElementById("auth-password");
const personaSelect = document.getElementById("auth-persona");
const btnLogin = document.getElementById("btn-login");
const btnSignup = document.getElementById("btn-signup");
const btnLogout = document.getElementById("btn-logout");
const userLabel = document.getElementById("user-label");
const siteDisplay = document.getElementById("site-display");

// ── Init ────────────────────────────────────────────────────────────────────
chrome.storage.local.get(["token", "userEmail"], (data) => {
  if (data.token) {
    showDashboard(data.userEmail || "User");
  } else {
    showAuth();
  }
});

// ── Auth ────────────────────────────────────────────────────────────────────
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

btnLogin.addEventListener("click", async () => {
  authError.style.display = "none";
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) return showError("Email and password required.");

  try {
    const res = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return showError(data.error || "Login failed.");

    chrome.storage.local.set(
      { token: data.token, userEmail: email },
      () => showDashboard(email)
    );
  } catch {
    showError("Cannot reach server.");
  }
});

btnSignup.addEventListener("click", async () => {
  authError.style.display = "none";
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const personaRole = personaSelect.value;

  if (!email || !password)
    return showError("Email and password required.");

  // Get or create deviceId from background
  const { deviceId } = await chrome.storage.local.get(["deviceId"]);
  const id = deviceId || crypto.randomUUID();
  if (!deviceId) await chrome.storage.local.set({ deviceId: id });

  try {
    const res = await fetch(`${SERVER_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        deviceId: id,
        deviceType: "chrome",
        personaRole,
      }),
    });
    const data = await res.json();
    if (!res.ok) return showError(data.error || "Signup failed.");

    chrome.storage.local.set(
      { token: data.token, userEmail: email },
      () => showDashboard(email)
    );
  } catch {
    showError("Cannot reach server.");
  }
});

btnLogout.addEventListener("click", () => {
  chrome.storage.local.remove(["token", "userEmail"], () => showAuth());
});

// ── Current state display ───────────────────────────────────────────────────
function loadCurrentState() {
  chrome.runtime.sendMessage({ action: "getState" }, (res) => {
    if (res && res.activeSite) {
      siteDisplay.innerHTML = `<span class="status-dot active"></span><span class="site">${res.activeSite}</span>`;
    } else {
      siteDisplay.innerHTML = `<span class="status-dot idle"></span><span class="inactive">No active tab</span>`;
    }
  });
}
