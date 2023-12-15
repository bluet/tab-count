const tabs = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab-content");
const searchInput = document.getElementById("searchInput");
let currentItemIndex = 0;

// function addItems (tabContent, items, prefix) {
// 	const windowMap = new Map();

// 	items.forEach((item, tabIndex) => {
// 		if (!windowMap.has(item.windowId)) {
// 			windowMap.set(item.windowId, []);
// 		}
// 		windowMap.get(item.windowId).push(item);
// 	});

// 	windowMap.forEach((items, windowId) => {
// 		const windowDiv = document.createElement("div");
// 		windowDiv.classList.add("window");
// 		windowDiv.innerHTML = `<h2>Window ${windowId}</h2>`;

// 		items.forEach((item, tabIndex) => {
// 			const listItem = document.createElement("div");
// 			listItem.classList.add("flex", "items-center", "p-2", "rounded", "list-item");
// 			if (item.active) {
// 				listItem.classList.add("tab-active");
// 			}
// 			listItem.tabIndex = tabIndex;
// 			listItem.tabid = item.id;
// 			listItem.innerHTML = `
// 			<img class="mr-2" width='16' height='16' src="${item.favIconUrl}" alt="favicon">
// 			<div class='truncated'><span style=cursor:pointer tabid=${item.id} title='${prefix}${item.url}'>${item.title}</span></div>
// 			<span class="remove-btn text-red-500">❌</span>
// 			`;

// 			// if click on the item, pass the tabID and windowID to the function goToOpenedTab
// 			// if click on the remove button, pass the tabID to the function closeOpenedTab
// 			listItem.addEventListener(
// 				"click",
// 				(function (item) {
// 					return function (event) {
// 						// console.log("listItem click");
// 						// console.log("listItem event.target: ", event.target);
// 						if (event.target.classList.contains("remove-btn")) {
// 							// console.log("listItem remove-btn click");
// 							// event.target.parentElement.remove();
// 							// need to remove the item from both lists
// 							removeItemFromLists(item.id);
// 							closeOpenedTab(item.id);
// 							updateCounterText();
// 						} else {
// 							// console.log("listItem goToOpenedTab click");
// 							goToOpenedTab(item.id, item.windowId);
// 							updateCounterText();
// 						}
// 					};
// 				})(item)
// 			);

// 			// if this is the current active tab in the current window, focus on it
// 			if (item.active) {
// 				listItem.focus();
// 			}

// 			windowDiv.appendChild(listItem);
// 		});

// 		tabContent.appendChild(windowDiv);
// 	});
// }

function addItemsToBoth (items, currentWindowId) {
	const tabContentCurrent = document.getElementById("currentWindow");
	const tabContentAll = document.getElementById("allWindow");
	const windowMap = new Map();

	items.forEach((item, tabIndex) => {
		if (!windowMap.has(item.windowId)) {
			windowMap.set(item.windowId, []);
		}
		windowMap.get(item.windowId).push(item);
	});

	windowMap.forEach((items, windowID) => {
		const windowDivAllWindows = document.createElement("div");
		windowDivAllWindows.windowId = windowID;
		windowDivAllWindows.classList.add("window");
		windowDivAllWindows.innerHTML = `<h2>Window ${windowID}</h2>`;
		const windowDivCurrentWindow = windowDivAllWindows.cloneNode(true);

		items.forEach((item, tabIndex) => {
			const listItemAllWindows = buildListItem(item, tabIndex);
			const listItemCurrentWindow = buildListItem(item, tabIndex);

			// if this is the current active tab in the current window, focus on it
			if (item.active) {
				listItemAllWindows.focus();
				listItemCurrentWindow.focus();
			}

			windowDivAllWindows.appendChild(listItemAllWindows);
			if (windowID === currentWindowId) {
				windowDivCurrentWindow.appendChild(listItemCurrentWindow);
			}
		});

		tabContentAll.appendChild(windowDivAllWindows);
		// console.log("windowId: ", windowId);
		// console.log("chrome.windows.WINDOW_ID_CURRENT: ", chrome.windows.WINDOW_ID_CURRENT);
		// console.log("currentWindowId: ", currentWindowId);
		if (windowID === currentWindowId) {
			tabContentCurrent.appendChild(windowDivCurrentWindow);
		}
	});
}

function buildListItem (data, tabIndex) {
	const listItem = document.createElement("div");
	const tabID = data.id;
	listItem.classList.add("flex", "items-center", "p-2", "rounded", "list-item");
	if (data.active) {
		listItem.classList.add("tab-active");
	}
	listItem.tabIndex = tabIndex;
	listItem.tabid = tabID;
	listItem.innerHTML = `
	<img class="mr-2" width='16' height='16' src="${data.favIconUrl}" alt="favicon">
	<div class='truncated'><span style=cursor:pointer tabid=${tabID} title='${data.url}'>${data.title}</span></div>
	<span class="remove-btn text-red-500">❌</span>
	`;

	listItem.addEventListener(
		"click",
		(function (data) {
			return function (event) {
				// console.log("listItem click");
				// console.log("listItem event.target: ", event.target);
				if (event.target.classList.contains("remove-btn")) {
					// console.log("listItem remove-btn click");
					// event.target.parentElement.remove();
					// need to remove the item from both lists
					removeItemFromLists(data.id);
					closeOpenedTab(data.id);
					updateCounterText();
				} else {
					// console.log("listItem goToOpenedTab click");
					goToOpenedTab(data.id, data.windowId);
					updateCounterText();
				}
			};
		})(data)
	);

	return listItem;
}

function removeItemFromLists (tabID) {
	const currentWindowContent = document.getElementById("currentWindow");
	const currentWindowItems = currentWindowContent.querySelectorAll(".list-item");
	const allWindowContent = document.getElementById("allWindow");
	const allWindowItems = allWindowContent.querySelectorAll(".list-item");

	currentWindowItems.forEach((item) => {
		if (item.tabid === tabID) {
			item.remove();
		}
	});

	allWindowItems.forEach((item) => {
		if (item.tabid === tabID) {
			item.remove();
		}
	});
}

// Function to add sample items to the tabs
// function addSampleItems (tabContent, itemCount, prefix) {
// 	for (let i = 1; i <= itemCount; i++) {
// 		const item = document.createElement("div");
// 		item.classList.add("flex", "items-center", "p-2", "bg-blue-100", "rounded", "list-item");
// 		item.innerHTML = `
// 	    <img class="mr-2" src="https://via.placeholder.com/16" alt="favicon">
// 	    ${prefix} Item ${i}
// 	  `;
// 		tabContent.appendChild(item);
// 	}
// }
// addSampleItems(document.getElementById('currentWindow'), 15, 'Sample');

// function to display the selected tab
function goToOpenedTab (tabID, windowID) {
	// console.log("goToOpenedTab tabID: ", tabID);
	// console.log("goToOpenedTab windowID: ", windowID);
	chrome.windows.update(windowID, { "focused": true });
	chrome.tabs.update(tabID, { "active": true });
	// updateCounterText();
}

// function to close the selected tab
function closeOpenedTab (tabID) {
	chrome.tabs.remove(tabID);
	// updateCounterText();
}

function updateSearchPlaceholder (count) {
	const activeTabContent = document.querySelector(".tab-content.active");
	const items = activeTabContent.querySelectorAll(".list-item");
	const itemCount = count !== undefined ? count : items.length;
	searchInput.placeholder = `Search... (${itemCount} items)`;
}

function updateCounterText (count) {
	updateSearchPlaceholder(count);

	// get element with id="currentWindow" and get the number of items in current window
	const currentWindowContent = document.getElementById("currentWindow");
	const currentWindowItems = currentWindowContent.querySelectorAll(".list-item");
	// get element with id="allWindow" and get the number of items in all windows
	const allWindowContent = document.getElementById("allWindow");
	const allWindowItems = allWindowContent.querySelectorAll(".list-item");

	// get active tab-button
	// if it's id="tabTitleCurrent", then get the number of tabs in current window and replace the text in id="tabTitleCurrent"
	// if it's id="tabTitleAll", then get the number of tabs in all windows and replace the text in id="tabTitleAll"
	const activeTabButton = document.querySelector(".tab-button.active");
	if (activeTabButton.id === "tabTitleCurrent") {
		const itemCount = count !== undefined ? count : currentWindowItems.length;
		document.getElementById("tabTitleCurrent").innerHTML = `Current ( ${itemCount} )`;
		// count the number of windows and the number of tabs in all windows
		chrome.windows.getAll({ "populate": true }, (window_list) => {
			document.getElementById("tabTitleAll").innerHTML
				= `All ( ${allWindowItems.length} in ${window_list.length} )`;
		});
	} else if (activeTabButton.id === "tabTitleAll") {
		const itemCount = count !== undefined ? count : allWindowItems.length;
		document.getElementById("tabTitleCurrent").innerHTML = `Current ( ${currentWindowItems.length} )`;
		// count the number of windows
		chrome.windows.getAll({ "populate": true }, (window_list) => {
			// get the number of tabs in all windows
			document.getElementById("tabTitleAll").innerHTML
				= `All ( ${itemCount} in ${window_list.length} )`;
		});
	}
}

//get tabs in current window
function getCurrentWindowTabs (callback) {
	chrome.tabs.query({ "currentWindow": true }, (tabs) => {
		callback(tabs);
	});
}

//get all tabs
function getAllTabs (callback) {
	chrome.tabs.query({}, (tabs) => {
		callback(tabs);
	});
}

function scrollToItem (tabID, windowID) {
	const currentWindowContent = document.getElementById("currentWindow");
	const currentWindowItems = currentWindowContent.querySelectorAll(".list-item");
	const allWindowContent = document.getElementById("allWindow");
	const allWindowItems = allWindowContent.querySelectorAll(".list-item");

	// console.log("target tabID: ", tabID);

	// if showing allWindows tabs, scroll to the item of the current active tab in the current active window
	if (allWindowContent.classList.contains("active")) {
		// console.log("allWindowContent.classList.contains('active'): ", allWindowContent.classList.contains("active"));
		// console.log("allWindowContent: ", allWindowContent);
		// console.log("allWindowItems: ", allWindowItems);
		allWindowItems.forEach((item, index) => {
			if (item.tabid === tabID) {
				// console.log("scrollToItem item: ", item);
				// item.scrollIntoView();
				item.focus();
				currentItemIndex = index;
			}
		});
	} else if (currentWindowContent.classList.contains("active")) {
		// console.log("currentWindowContent.classList.contains('active'): ", currentWindowContent.classList.contains("active"));
		// console.log("currentWindowContent: ", currentWindowContent);
		// console.log("currentWindowItems: ", currentWindowItems);
		// if showing currentWindow tabs, scroll to the item of the current active tab in the current active window
		currentWindowItems.forEach((item, index) => {
			// console.log("item.tabid: ", item.tabid);
			if (item.tabid === tabID) {
				// console.log("scrollToItem item: ", item);
				// item.scrollIntoView();
				item.focus();
				currentItemIndex = index;
			}
		});
	}
}

function scrollToCurrentItem () {
	// scroll to the item of the current active tab in the current active window
	// const activeTabContent = document.querySelector(".tab-content.active");
	// scroll to the item of the current active tab in the current active window
	// get current window id and current tab id
	chrome.windows.getCurrent((window) => {
		const currentWindowId = window.id;
		chrome.tabs.query({ "active": true, "windowId": currentWindowId }, (tabs) => {
			const currentTabId = tabs[0].id;
			// const currentItem = activeTabContent.querySelector(`.list-item[tabid="${currentTabId}"]`);
			// scrollToItem(currentItem);
			scrollToItem(currentTabId, currentWindowId);
		});
	});
}

function handleKeyDown (e) {

	const currentTabIndex = [...tabs].findIndex((tab) => {
		return tab.classList.contains("active");
	});
	const activeTabContent = document.querySelector(".tab-content.active");
	const items = [...activeTabContent.querySelectorAll(".list-item")];

	let newIndex;
	let newTabIndex;
	let selectedItems;

	if (items.length === 0) {
		return;
	}

	switch (e.key) {
	case "ArrowLeft":
		newTabIndex = (currentTabIndex - 1 + tabs.length) % tabs.length;
		tabs[newTabIndex].click();
		break;
	case "ArrowRight":
		newTabIndex = (currentTabIndex + 1) % tabs.length;
		tabs[newTabIndex].click();
		break;
	case "ArrowUp":
		if (searchInput === document.activeElement) {
			// If the search input is focused, move focus to the last item
			items[items.length - 1].focus();
			currentItemIndex = items.length - 1;
		} else {
			newIndex = (currentItemIndex - 1 + items.length) % items.length;
			items[newIndex].focus();
			currentItemIndex = newIndex;
		}
		break;
	case "ArrowDown":
		if (searchInput === document.activeElement) {
			// If the search input is focused, move focus to the first item
			items[0].focus();
			currentItemIndex = 0;
		} else {
			newIndex = (currentItemIndex + 1) % items.length;
			items[newIndex].focus();
			currentItemIndex = newIndex;
		}
		break;
		// case 'Home':
		//   searchInput.focus();
		//   break;
	case "End":
		items[items.length - 1].focus();
		currentItemIndex = items.length - 1;
		break;
	case " ":
		e.preventDefault();
		items[currentItemIndex].classList.toggle("selected");
		items[currentItemIndex].classList.contains("bg-blue-100")
			? items[currentItemIndex].classList.remove("bg-blue-100")
			: items[currentItemIndex].classList.add("bg-blue-100");
		break;
	case "Delete":
		selectedItems = activeTabContent.querySelectorAll(".list-item.selected");
		selectedItems.forEach((item) => {
			closeOpenedTab(item.id);
			item.remove();
		});
		updateCounterText();
		break;
	case "Enter":
		// If the search input is focused, go to the first item
		if (searchInput === document.activeElement) {
			items[0].focus();
			currentItemIndex = 0;
		} else {
			goToOpenedTab(items[currentItemIndex].id, items[currentItemIndex].windowId);
		}
		break;
	case "Escape":
		// If the search input is focused, clear the search input and focus the current item
		if (searchInput === document.activeElement && searchInput.value !== "") {
			searchInput.value = "";
			handleSearchInput();
			e.preventDefault();
		} else if (searchInput === document.activeElement) {
			items[currentItemIndex].focus();
			handleSearchInput();
			e.preventDefault();
		}
		break;
	default:
		// if it's a special character, do nothing
		if (e.key.length > 1) {
			return;
		}
		// if anything else, assume it's a search term and focus the search input
		searchInput.focus();
		// searchInput.value += e.key;
		break;
	}

	// e.preventDefault();
}

function handleSearchInput (e) {
	const searchTerm = searchInput.value.toLowerCase();
	const activeTabContent = document.querySelector(".tab-content.active");
	const items = activeTabContent.querySelectorAll(".list-item");
	let visibleCount = 0;

	if (items.length === 0) {
		return;
	}

	items.forEach((item) => {
		const text = item.textContent.toLowerCase();
		const isVisible = text.includes(searchTerm);
		item.style.display = isVisible ? "flex" : "none";
		if (isVisible) {
			visibleCount++;
		}
	});

	updateCounterText(visibleCount);
}

function init () {
	// Initialize the search placeholder with the count of items in the active tab
	// updateCounterText();

	// getCurrentWindowTabs((tabs) => {
	// 	addItems(document.getElementById("currentWindow"), tabs, "");
	// 	updateCounterText();
	// });

	// getAllTabs((tabs) => {
	// 	addItems(document.getElementById("allWindow"), tabs, "");
	// 	updateCounterText();
	// });

	getAllTabs((tabs) => {
		// get active window id
		chrome.windows.getCurrent((window) => {
			const currentWindowId = window.id;
			addItemsToBoth(tabs, currentWindowId);
			updateCounterText();
		});
	});

	// render contents in tabs (this function is a refactored addItems)
	// renderTabs(["currentWindow", "allWindow"], () => { updateCounterText(); });

	// Initialize event listeners on the labels of tabs
	tabs.forEach((tab) => {
		tab.addEventListener("click", () => {
			// console.debug("click", tab);
			const target = document.querySelector(tab.dataset.tabTarget);
			tabContents.forEach((tabContent) => {
				tabContent.classList.remove("active");
			});
			tabs.forEach((tab) => {
				tab.classList.remove("active");
			});
			tab.classList.add("active");
			target.classList.add("active");

			// find div id="currentWindow" and add 'active' class
			// document.getElementById("currentWindow").classList.add('active');

			updateCounterText();

			scrollToCurrentItem();
		});
	});

	searchInput.addEventListener("input", handleSearchInput);

	// Keyboard navigation and selection for list items
	document.addEventListener("keydown", handleKeyDown);

	scrollToCurrentItem();
}

// Ensure event listeners are added after DOM content is loaded
document.addEventListener("DOMContentLoaded", (event) => {
	init();
});
