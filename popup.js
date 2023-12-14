const tabs = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab-content");
const searchInput = document.getElementById("searchInput");
let currentItemIndex = 0;

function addItems (tabContent, items, prefix) {
	items.forEach((item, tabIndex) => {
		const listItem = document.createElement("div");
		listItem.classList.add("flex", "items-center", "p-2", "rounded", "list-item");
		if (item.active) {
			listItem.classList.add("tab-active");
		}
		listItem.tabIndex = tabIndex;
		listItem.tabid = item.id;
		listItem.innerHTML = `
    <img class="mr-2" width='16' height='16' src="${item.favIconUrl}" alt="favicon">
    <div class='truncated'><span style=cursor:pointer tabid=${item.id} title='${prefix}${item.url}'>${item.title}</span></div>
    <span class="remove-btn text-red-500">❌</span>
  `;

		// if click on the item, pass the tabID and windowID to the function goToOpenedTab
		// if click on the remove button, pass the tabID to the function closeOpenedTab
		listItem.addEventListener(
			"click",
			(function (item) {
				return function (event) {
					// console.log("listItem click");
					// console.log("listItem event.target: ", event.target);
					if (event.target.classList.contains("remove-btn")) {
						// console.log("listItem remove-btn click");
						// event.target.parentElement.remove();
						// need to remove the item from both lists
						removeItemFromLists(item.id);
						closeOpenedTab(item.id);
						updateCounterText();
					} else {
						// console.log("listItem goToOpenedTab click");
						goToOpenedTab(item.id, item.windowId);
						updateCounterText();
					}
				};
			})(item)
		);

		tabContent.appendChild(listItem);
	});
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

function init () {
	// Initialize the search placeholder with the count of items in the active tab
	// updateCounterText();

	getCurrentWindowTabs((tabs) => {
		addItems(document.getElementById("currentWindow"), tabs, "");
		updateCounterText();
	});

	getAllTabs((tabs) => {
		addItems(document.getElementById("allWindow"), tabs, "");
		updateCounterText();
	});

	// Initialize the labels of tabs
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
		});
	});

	searchInput.addEventListener("input", () => {
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
			item.style.display = isVisible ? "block" : "none";
			if (isVisible) {
				visibleCount++;
			}
		});

		updateCounterText(visibleCount);
	});

	// Keyboard navigation and selection for list items
	document.addEventListener("keydown", (e) => {
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
		default:
			// if anything else, assume it's a search term
			searchInput.focus();
			break;
		}
	});
}

// Ensure event listeners are added after DOM content is loaded
document.addEventListener("DOMContentLoaded", (event) => {
	init();
});
