// Trigger URL format:
//   http://tabgroup.localhost/?name=Work&color=blue&collapsed=1&u=<url1>&u=<url2>...
// The extension catches it, opens every "u" in a new group, then closes the trigger tab.
// Host permission is limited to tabgroup.localhost, so the extension can't see any other tab's URL.

const HOST = "tabgroup.localhost";
const COLORS = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange"];
const handled = new Set();

function isTrigger(url) {
  try { return new URL(url).hostname === HOST; } catch { return false; }
}

async function handle(tabId, rawUrl) {
  if (!isTrigger(rawUrl) || handled.has(tabId)) return;
  handled.add(tabId);

  const p = new URL(rawUrl).searchParams;
  const urls = p.getAll("u").filter(Boolean);
  const name = p.get("name") || "";
  const color = COLORS.includes(p.get("color")) ? p.get("color") : undefined;
  const collapsed = p.get("collapsed") === "1";

  const trigger = await chrome.tabs.get(tabId).catch(() => null);
  const windowId = trigger?.windowId;

  if (urls.length) {
    const tabIds = [];
    for (const url of urls) {
      const tab = await chrome.tabs.create({ url, windowId, active: tabIds.length === 0 });
      tabIds.push(tab.id);
    }
    const groupId = await chrome.tabs.group({ tabIds });
    const props = { title: name, collapsed };
    if (color) props.color = color;
    await chrome.tabGroups.update(groupId, props);
  }

  await chrome.tabs.remove(tabId).catch(() => {});
}

// Chrome already running: URL is only visible for tabgroup.localhost tabs.
chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  handle(tabId, info.url || tab.pendingUrl || tab.url);
});
chrome.tabs.onCreated.addListener((tab) => handle(tab.id, tab.pendingUrl || tab.url));

// Cold start: Chrome was launched with the URL before this worker was listening.
async function scan() {
  const tabs = await chrome.tabs.query({ url: `*://${HOST}/*` });
  for (const t of tabs) handle(t.id, t.url || t.pendingUrl);
}
chrome.runtime.onStartup.addListener(scan);
chrome.runtime.onInstalled.addListener(scan);
scan();
