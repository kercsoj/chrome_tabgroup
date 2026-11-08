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
      const tab = await chrome.tabs.create({ url, windowId, active: !collapsed && tabIds.length === 0 });
      tabIds.push(tab.id);
    }
    const groupId = await chrome.tabs.group({ tabIds });
    const props = { title: name };
    if (color) props.color = color;
    await chrome.tabGroups.update(groupId, props);

    if (collapsed) {
      // Chrome won't collapse a group while one of its tabs is active.
      // Go back to the page that was active before the helper tab opened.
      const back = await tabToReturnTo(windowId, tabId, groupId);
      if (back) {
        await chrome.tabs.update(back.id, { active: true });
        await chrome.tabs.remove(tabId).catch(() => {});
      } else {
        // No safe tab to return to: turn the helper tab into a new tab page.
        await chrome.tabs.update(tabId, { url: "chrome://newtab/", active: true });
      }
      await chrome.tabGroups.update(groupId, { collapsed: true });
      return;
    }
  }

  await chrome.tabs.remove(tabId).catch(() => {});
}

// Picks the tab to show after creating a collapsed group. Never picks a tab
// inside a collapsed group, because activating it would expand that group.
async function tabToReturnTo(windowId, triggerId, newGroupId) {
  const tabs = await chrome.tabs.query({ windowId });
  const collapsedGroups = new Set(
    (await chrome.tabGroups.query({ windowId, collapsed: true })).map((g) => g.id)
  );
  const usable = (t) => t && t.id !== triggerId && t.groupId !== newGroupId && !collapsedGroups.has(t.groupId);

  const key = "active-" + windowId;
  const { [key]: recent = [] } = await chrome.storage.session.get(key);
  for (const id of recent) {
    const t = tabs.find((x) => x.id === id);
    if (usable(t)) return t;
  }
  return tabs.filter(usable).sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))[0];
}

// Remember the last few active tabs per window.
chrome.tabs.onActivated.addListener(async ({ tabId, windowId }) => {
  const key = "active-" + windowId;
  const { [key]: recent = [] } = await chrome.storage.session.get(key);
  if (recent[0] === tabId) return;
  await chrome.storage.session.set({ [key]: [tabId, ...recent.filter((id) => id !== tabId)].slice(0, 5) });
});

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
