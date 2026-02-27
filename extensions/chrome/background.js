const SERVER_URL = "http://localhost:3000";

let deviceId = null;
let activeSite = null; // { site, tabId }

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

// ── Send event to server ────────────────────────────────────────────────────
async function sendEvent(site, state) {
  const { token } = await chrome.storage.local.get(["token"]);
  if (!token) return;

  const id = await getOrCreateDeviceId();

  try {
    await fetch(`${SERVER_URL}/extension/usage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        deviceId: id,
        site,
        state,
        timestamp: Date.now(),
      }),
    });
  } catch (err) {
    console.error(`Failed to send ${state} event for ${site}:`, err);
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

// ── Message handler (popup asks for current state) ──────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === "getState") {
    sendResponse({ activeSite: activeSite ? activeSite.site : null });
  }
  return false;
});
