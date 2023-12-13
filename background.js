let allWindowsTabCount = 0;
let tab_activation_history = {};

// set icon's tooltip
function updateBadgeTitle (count) {
	const iconTitle = `You have ${count} open tab(s).`;
	chrome.action.setTitle({ "title": iconTitle });
}

// set icon's text
async function updateBadgeText () {
	const { "badgeDisplayOption": displayOption } = await chrome.storage.local.get(["badgeDisplayOption"]);
	if (!displayOption || displayOption === "allWindows") {
		chrome.action.setBadgeText({ "text": String(allWindowsTabCount) });
		updateBadgeTitle(allWindowsTabCount);
	}
}

// count all tabs in all windows
function getAllStats (callback) {
	chrome.windows.getAll({ "populate": true }, callback);
}

function displayResults (window_list) {
	allWindowsTabCount = window_list.reduce((count, win) => {return count + win.tabs.length;}, 0);
	chrome.storage.local.set({
		"windowsCount": window_list.length,
		"allWindowsTabsCount": allWindowsTabCount
	});
	updateBadgeText();
}

function registerTabDedupeHandler () {
	chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
		if (changeInfo.url) {
			const tabs = await chrome.tabs.query({ "url": changeInfo.url });
			if (tabs.length === 2 && changeInfo.url !== "chrome://newtab/") {
				const oldTab = tabs[0].id === tabId ? tabs[1] : tabs[0];
				const dedupe = confirm("Duplicate tab detected. Switch to existing open tab?");
				if (dedupe) {
					chrome.tabs.update(oldTab.id, { "active": true }, () => {
						chrome.windows.update(oldTab.windowId, { "focused": true }, () => {
							chrome.tabs.remove(tabId);
						});
					});
				}
			}
		}
	});
}

// Use chrome.alarms instead of setInterval
function registerTabJanitor (days) {
	chrome.alarms.create("tabJanitor", { "periodInMinutes": 60 });
	chrome.alarms.onAlarm.addListener((alarm) => {
		if (alarm.name === "tabJanitor") {
			const now = Date.now();
			for (const [tabId, ts] of Object.entries(tab_activation_history)) {
				if (now - ts > 1000 * 60 * 60 * 24 * days) {
					chrome.tabs.remove(parseInt(tabId));
				}
			}
		}
	});
}

/* Keeps track of the last timestamp each tab was activated */
chrome.tabs.onActivated.addListener((activeInfo) => {
	tab_activation_history[activeInfo.tabId] = Date.now();
});

async function init () {
	const { tabDedupe, tabJanitor, tabJanitorDays } = await chrome.storage.local.get(["tabDedupe", "tabJanitor", "tabJanitorDays"]);

	// Action taken when a new tab is opened.
	chrome.tabs.onCreated.addListener(() => {return getAllStats(displayResults);});

	// Action taken when a tab is closed.
	chrome.tabs.onRemoved.addListener(() => {return getAllStats(displayResults);});

	// Action taken when a new window is opened
	chrome.windows.onCreated.addListener(() => {return getAllStats(displayResults);});

	// Action taken when a windows is closed.
	chrome.windows.onRemoved.addListener(() => {return getAllStats(displayResults);});

	// to change badge text on switching current tab
	chrome.windows.onFocusChanged.addListener(() => {return getAllStats(displayResults);});

	// Initialize the stats to start off with.
	getAllStats(displayResults);

	// Activate tab de-dupe detector if enabled in options.
	if (tabDedupe) {
		registerTabDedupeHandler();
	}

	// Activate tab janitor if enabled.
	if (tabJanitor) {
		registerTabJanitor(tabJanitorDays);
	}
}

// Initialize the extension.
init();
