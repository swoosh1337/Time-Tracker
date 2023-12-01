"use strict";

let activeTabId;
let startTime;
const timeSpent = {};

function updateActiveTab(newActiveTabId) {
    const now = Date.now();

    if (activeTabId && timeSpent[activeTabId]) {
        timeSpent[activeTabId] += now - startTime;
    } else if (activeTabId) {
        timeSpent[activeTabId] = now - startTime;
    }

    activeTabId = newActiveTabId;
    startTime = now;
}

chrome.tabs.onActivated.addListener((activeInfo) => {
    updateActiveTab(activeInfo.tabId);
});

chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        updateActiveTab(null);
    } else {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) updateActiveTab(tabs[0].id);
        });
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
        updateActiveTab(tabId);
    }
});

setInterval(() => {
    chrome.storage.local.set({ timeSpent });
}, 10000); // Consider increasing the interval

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "saveData") {
        chrome.storage.local.set({ timeSpent });
    }
});
