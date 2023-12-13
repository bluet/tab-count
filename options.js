// Save options to localstorage
async function save_options (type, value) {
	console.log(`type: ${type}, value: ${value}`);
	let data = {};
	data[type] = value;
	await chrome.storage.local.set(data);

	// Update selection status
	const status = document.getElementById("status");
	status.textContent = "Selection Saved...";
	setTimeout(() => {
		status.textContent = "";
	}, 750);
	await updateBadgeText();
}

// Restore selection from localstorage
async function restore_options () {
	const data = await chrome.storage.local.get(["badgeDisplayOption", "tabDedupe", "tabJanitor", "tabJanitorDays"]);
	const { badgeDisplayOption, tabDedupe, tabJanitor, tabJanitorDays } = data;

	// restore options for popupDisplay
	const radios = document.getElementById("popupOptionsForm").tabCountRadios;
	if (!badgeDisplayOption) {
		document.getElementById("defaultPopupSelection").checked = true;
	}
	for (let i = 0; i < radios.length; i++) {
		if (radios[i].value === badgeDisplayOption) {
			radios[i].checked = true;
		}
	}

	// restore options for tabDedupe
	document.getElementById("tabDedupe").checked = Boolean(tabDedupe);

	// Restore tab janitor options.
	document.getElementById("tabJanitor").checked = Boolean(tabJanitor);
	document.getElementById("tabJanitorDays").value = tabJanitorDays || 5;
}

document.addEventListener("DOMContentLoaded", restore_options);

// Add event listeners to the radio buttons
const radios = document.getElementById("popupOptionsForm").tabCountRadios;
for (let i = 0; i < radios.length; i++) {
	radios[i].addEventListener("click", async () => {return await save_options("badgeDisplayOption", radios[i].value);});
}

// Add event listener for tabDedupe checkbox.
const checkbox = document.getElementById("tabDedupe");
checkbox.addEventListener("click", async () => {return await save_options("tabDedupe", checkbox.checked);});

// Add event listener for tabJanitor checkbox.
const janitorCheckbox = document.getElementById("tabJanitor");
janitorCheckbox.addEventListener("click", async () => {return await save_options("tabJanitor", janitorCheckbox.checked);});

// Add event listener for tabJanitorDays input.
document.getElementById("tabJanitorDays").addEventListener("input", () => {
	save_options("tabJanitorDays", document.getElementById("tabJanitorDays").valueAsNumber);
});

document.getElementById("refreshButton").addEventListener("click", () => {
	location.reload();
});

async function updateCounts () {
	const data = await chrome.storage.local.get(["windowsCount", "allWindowsTabsCount"]);
	const { windowsCount, allWindowsTabsCount } = data;

	document.getElementById("windowsCount").textContent = windowsCount;
	document.getElementById("tabsCount").textContent = allWindowsTabsCount;
}

updateCounts();

// set icon text on badge
async function updateBadgeText () {
	const { badgeDisplayOption } = await chrome.storage.local.get(["badgeDisplayOption"]);
	const data = await chrome.storage.local.get(["windowsCount", "allWindowsTabsCount"]);
	const { windowsCount, allWindowsTabsCount } = data;
	if (!badgeDisplayOption || badgeDisplayOption === "allWindows") {
		// show the tabs count in all windows
		await chrome.action.setBadgeText({ "text": String(allWindowsTabsCount) });
		await updateBadgeTitle(allWindowsTabsCount);
	} else if (badgeDisplayOption === "currentWindow") {
		// show the tabs count in current window
		let currentWindowTabs = await chrome.tabs.query({ "currentWindow": true });
		await chrome.action.setBadgeText({ "text": String(currentWindowTabs.length) });
	} else if (badgeDisplayOption === "windowsCount") {
		// show the windows count
		await chrome.action.setBadgeText({ "text": String(windowsCount) });
		await updateBadgeTitle(windowsCount);
	}
}

// set icon's tooltip
async function updateBadgeTitle (count) {
	const iconTitle = `You have ${count} open tab(s)/window(s).`;
	await chrome.action.setTitle({ "title": iconTitle });
}
