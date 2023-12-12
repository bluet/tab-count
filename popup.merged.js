
const tabs = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const searchInput = document.getElementById('searchInput');
let currentItemIndex = 0;


function addItems(tabContent, items, prefix) {
	items.forEach(item => {
		const listItem = document.createElement('div');
		listItem.classList.add('flex', 'items-center', 'p-2', 'rounded', 'mb-2', 'list-item');
		listItem.tabIndex = 0;
		listItem.innerHTML = `
    <img class="mr-2" width='16' height='16' src="${item.favIconUrl}" alt="favicon">
    <div class='truncated'><span style=cursor:pointer title='${prefix}${item.url}'>${item.title}</span></div>
    <span class="remove-btn text-red-500">❌</span>
  `;

		// if click on the item, pass the tabID and windowID to the function goToOpenedTab
		// if click on the remove button, pass the tabID to the function closeOpenedTab
		listItem.addEventListener("click", (function (item) {
			return function (event) {
				console.log("listItem click");
				console.log("listItem event.target: ", event.target);
				if (event.target.classList.contains('remove-btn')) {
					console.log("listItem remove-btn click");
					closeOpenedTab(item.id);
					e.target.parentElement.remove();
					updateSearchPlaceholder();
				} else {
					console.log("listItem goToOpenedTab click");
					goToOpenedTab(item.id, item.windowId);
					updateSearchPlaceholder();
				}
			}
		})(item));

		tabContent.appendChild(listItem);
	});
}

// function to display the selected tab
function goToOpenedTab(tabID, windowID) {
	console.log("goToOpenedTab tabID: ", tabID);
	console.log("goToOpenedTab windowID: ", windowID);
	chrome.windows.update(windowID, { focused: true });
	chrome.tabs.update(tabID, { active: true });
}

// function to close the selected tab
function closeOpenedTab(tabID) {
	console.log("closeOpenedTab tabID: ", tabID);
	chrome.tabs.remove(tabID);
	// reload popup to refresh the count and links
	window.location.reload();
}


function updateSearchPlaceholder(count) {
	const activeTabContent = document.querySelector('.tab-content.active');
	const items = activeTabContent.querySelectorAll('.list-item');
	const itemCount = count !== undefined ? count : items.length;
	searchInput.placeholder = `Search... (${itemCount} items)`;
}

//get tabs in current window
function getCurrentWindowTabs(callback) {
	chrome.tabs.query({ currentWindow: true }, function (tabs) {
		callback(tabs);
	});
}

//get all tabs
function getAllTabs(callback) {
	chrome.tabs.query({}, function (tabs) {
		callback(tabs);
	});
}


function init() {
	// Initialize the search placeholder with the count of items in the active tab
	updateSearchPlaceholder();


	getCurrentWindowTabs(function (tabs) {
		addItems(document.getElementById('currentWindow'), tabs, '');
	});

	getAllTabs(function (tabs) {
		addItems(document.getElementById('allWindow'), tabs, '');
	});

	// Initialize the labels of tabs
	tabs.forEach(tab => {
		tab.addEventListener('click', () => {
			console.debug('click', tab);
			const target = document.querySelector(tab.dataset.tabTarget);
			tabContents.forEach(tabContent => {
				tabContent.classList.remove('active');
			});
			tabs.forEach(tab => {
				tab.classList.remove('active');
			});
			tab.classList.add('active');
			target.classList.add('active');
			updateSearchPlaceholder();
		});
	});

	searchInput.addEventListener('input', () => {
		const searchTerm = searchInput.value.toLowerCase();
		const activeTabContent = document.querySelector('.tab-content.active');
		const items = activeTabContent.querySelectorAll('.list-item');
		let visibleCount = 0;

		items.forEach(item => {
			const text = item.textContent.toLowerCase();
			const isVisible = text.includes(searchTerm);
			item.style.display = isVisible ? 'block' : 'none';
			if (isVisible) visibleCount++;
		});

		updateSearchPlaceholder(visibleCount);
	});


	// Keyboard navigation and selection for list items
	document.addEventListener('keydown', (e) => {
		const currentTabIndex = [...tabs].findIndex(tab => tab.classList.contains('active'));
		const activeTabContent = document.querySelector('.tab-content.active');
		const items = [...activeTabContent.querySelectorAll('.list-item')];

		let newIndex;
		let newTabIndex;

		if (items.length === 0) return;

		switch (e.key) {
			case 'ArrowLeft':
				newTabIndex = (currentTabIndex - 1 + tabs.length) % tabs.length;
				tabs[newTabIndex].click();
				break;
			case 'ArrowRight':
				newTabIndex = (currentTabIndex + 1) % tabs.length;
				tabs[newTabIndex].click();
				break;
			case 'ArrowUp':
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
			case 'ArrowDown':
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
			case 'End':
				items[items.length - 1].focus();
				currentItemIndex = items.length - 1;
				break;
			case ' ':
				e.preventDefault();
				items[currentItemIndex].classList.toggle('selected');
				items[currentItemIndex].classList.contains('bg-blue-100') ? items[currentItemIndex].classList.remove('bg-blue-100') : items[currentItemIndex].classList.add('bg-blue-100');
				break;
			case 'Delete':
				const selectedItems = activeTabContent.querySelectorAll('.list-item.selected');
				selectedItems.forEach(item => item.remove());
				updateSearchPlaceholder();
				break;
			default:
				// if anything else, assume it's a search term
				searchInput.focus();
				break;
		}
	});

	// Click event for removing items
	// This doesn't work because the items are dynamically added
	// Implemented the click event on the item itself
	//
	document.addEventListener('click', (e) => {
		if (e.target.classList.contains('remove-btn')) {
			// e.target.parentElement.remove();
			updateSearchPlaceholder();
		}
	});
}


init();