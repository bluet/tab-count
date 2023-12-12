let allWindowsTabCount = 0;
let tab_activation_history = {};

// set icon's tooltip
function updateBadgeTitle (count) {
	const iconTitle = `You have ${count} open tab(s).`;
	chrome.action.setTitle({ "title": iconTitle });
}

// set icon's text
function updateBadgeText () {
	chrome.storage.local.get(["badgeDisplayOption"], (result) => {
		const displayOption = result.badgeDisplayOption;
		if (typeof displayOption === "undefined" || displayOption === "allWindows") {
			chrome.action.setBadgeText({ "text": String(allWindowsTabCount) });
			updateBadgeTitle(allWindowsTabCount);
		} else {
			//Use callback
			// FIXME: This feature is currently disabled from options.html and options.js
			// count = getCurrentWindowTabs(updateCurrentWindowBadge);

			// chrome.tabs.query({currentWindow:true}, function(tabs) {
			//   chrome.browserAction.setBadgeText({text: String(tabs.length)});
			//   updateBadgeTitle(tabs.length);
			// });
		}
	});
}

// count all tabs in all windows
function getAllStats (callback) {
	chrome.windows.getAll({ "populate": true }, (window_list) => {
		callback(window_list);
	});
}

function displayResults (window_list) {
	allWindowsTabCount = 0;
	for (let i = 0; i < window_list.length; i++) {
		allWindowsTabCount += window_list[i].tabs.length;
	}
	chrome.storage.local.set({
		"windowsCount": window_list.length,
		"allWindowsTabsCount": allWindowsTabCount
	});
	updateBadgeText();
}

function registerTabDedupeHandler () {
	chrome.tabs.onUpdated.addListener(
		(tabId, changeInfo, tab) => {
			if (changeInfo.url) {
				// check if any other tabs with different Ids exist with same URL
				chrome.tabs.query({ "url": changeInfo.url }, (tabs) => {
					if (tabs.length == 2 && changeInfo.url != "chrome://newtab/") {
						var oldTab = tabs[0].id == tabId ? tabs[1] : tabs[0];
						// This is a new duplicate
						var dedupe = confirm(
							"Duplicate tab detected. Switch to existing open tab?");
						if (dedupe) {
							// Switch to existing tab and make it active.
							chrome.tabs.update(oldTab.id, { "active": true }, () => {
								// Make sure the window of that tab is also made active
								chrome.windows.update(oldTab.windowId, { "focused": true }, () => {
									// And kill the newly opened tab.
									chrome.tabs.remove(tabId);
								});
							});
						}
					}
				});
			}
		});
}

// Use chrome.alarms instead of setInterval
function registerTabJanitor (days) {
	chrome.alarms.create("tabJanitor", { "periodInMinutes": 60 });
	chrome.alarms.onAlarm.addListener((alarm) => {
		if (alarm.name === "tabJanitor") {
			const keys = Object.keys(tab_activation_history);
			const now = Date.now();
			keys.forEach((tabId) => {
				const ts = tab_activation_history[tabId];
				if (now - ts > 1000 * 60 * 60 * 24 * days) {
					chrome.tabs.remove(parseInt(tabId));
				}
			});
		}
	});
}

/* Keeps track of the last timestamp each tab was activated */
chrome.tabs.onActivated.addListener((activeInfo) => {
	// Store timestamp in ms
	tab_activation_history[activeInfo.tabId] = Date.now();
});

function init () {
	// Action taken when a new tab is opened.
	chrome.tabs.onCreated.addListener((tab) => {
		getAllStats(displayResults);
	});

	// Action taken when a tab is closed.
	chrome.tabs.onRemoved.addListener((tab) => {
		getAllStats(displayResults);
	});

	// Action taken when a new window is opened
	chrome.windows.onCreated.addListener((tab) => {
		getAllStats(displayResults);
	});

	// Action taken when a windows is closed.
	chrome.windows.onRemoved.addListener((tab) => {
		getAllStats(displayResults);
	});

	// to change badge text on switching current tab
	chrome.windows.onFocusChanged.addListener((tab) => {
		getAllStats(displayResults);
	});

	// Initialize the stats to start off with.
	getAllStats(displayResults);

	// Activate tab de-dupe detector if enabled in options.
	if (chrome.storage.local["tabDedupe"]) {
		registerTabDedupeHandler();
	}

	// Activate tab janitor if enabled.
	if (chrome.storage.local["tabJanitor"]) {
		registerTabJanitor(chrome.storage.local["tabJanitorDays"]);
	}
}

// Initialize the extension.
init();
