const SERVER_URL = "https://the-hive-uqio.onrender.com";
const IDLE_THRESHOLD_SECONDS = 300; // 5 minutes

let deviceId = null;
let activeSite = null; // { site, tabId }
let userIdleState = "ACTIVE"; // ACTIVE, IDLE, or LOCKED

// ── Device ID ────────────────────────────────────────────────────────────────
async function getOrCreateDeviceId() {
  if (deviceId) return deviceId;
  const result = await chrome.storage.local.get(["deviceId"]);
  if (result.deviceId) {
    deviceId = result.deviceId;
  } else {
    deviceId = crypto.randomUUID();
    await chrome.storage.local.set({ deviceId });
  }
  return deviceId;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function extractSite(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function isTrackable(url) {
  return url && (url.startsWith("http://") || url.startsWith("https://"));
}

// ── Idle State Tracking ──────────────────────────────────────────────────────
async function updateIdleState() {
  chrome.idle.queryState(IDLE_THRESHOLD_SECONDS, (state) => {
    userIdleState = state; // "ACTIVE", "IDLE", or "LOCKED"
  });
}

// Start idle detection every 30 seconds
setInterval(updateIdleState, 30000);
updateIdleState(); // Initial check on startup

// ── Send event to server ────────────────────────────────────────────────────
async function sendEvent(site, state) {
  try {
    const { token } = await chrome.storage.local.get(["token"]);
    if (!token) return;

    const id = await getOrCreateDeviceId();

    await fetch(`${SERVER_URL}/api/activity/chrome`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        deviceId: id,
        site: site || "unknown",
        state,
        idleState: userIdleState,
        timestamp: Date.now(),
      }),
    });
  } catch (err) {
    console.error("Activity tracking error:", err);
  }
}

// ── State transitions ───────────────────────────────────────────────────────
async function openSite(site, tabId) {
  if (activeSite && activeSite.site === site) return; // already active
  await closeCurrent();
  activeSite = { site, tabId };
  await sendEvent(site, "active");
}

async function closeCurrent() {
  if (!activeSite) return;
  await sendEvent(activeSite.site, "closed");
  activeSite = null;
}

// ── Tab Events ──────────────────────────────────────────────────────────────
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) return;
    if (isTrackable(tab.url)) {
      openSite(extractSite(tab.url), tab.id);
    } else {
      closeCurrent();
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.active) return;
  if (isTrackable(tab.url)) {
    openSite(extractSite(tab.url), tabId);
  } else {
    closeCurrent();
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeSite && activeSite.tabId === tabId) {
    closeCurrent();
  }
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    closeCurrent();
  } else {
    chrome.tabs.query({ active: true, windowId }, ([tab]) => {
      if (tab && isTrackable(tab.url)) {
        openSite(extractSite(tab.url), tab.id);
      }
    });
  }
});

// ── Startup ─────────────────────────────────────────────────────────────────
chrome.runtime.onStartup.addListener(() => getOrCreateDeviceId());
chrome.runtime.onInstalled.addListener(() => getOrCreateDeviceId());

// ── Message handler (popup asks for current state or deviceId) ──────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === "getState") {
    sendResponse({ 
      activeSite: activeSite ? activeSite.site : null,
      idleState: userIdleState
    });
  } else if (msg.action === "getDeviceId") {
    getOrCreateDeviceId().then((id) => sendResponse({ deviceId: id }));
    return true; // keep channel open for async response
  }
  return false;
});
