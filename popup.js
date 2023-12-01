document.addEventListener('DOMContentLoaded', () => {
  // Trigger a save operation before displaying data
  chrome.runtime.sendMessage({ action: "saveData" });

  // Call the displayTime function to show the aggregated times
  displayTime();
});

function displayTime() {
  chrome.storage.local.get(['timeSpent'], async (result) => {
    const timeSpent = result.timeSpent || {};
    const timerDiv = document.getElementById('timer');
    timerDiv.innerHTML = '';

    try {
      const aggregatedTimes = await aggregateTimes(timeSpent);
      Object.entries(aggregatedTimes).forEach(([title, time]) => {
        const formattedTime = new Date(time).toISOString().slice(11, 19);
        timerDiv.innerHTML += `<div><span class="title">${title}</span>: <span class="time">${formattedTime}</span></div>`;
      });
    } catch (error) {
      console.error("Error displaying times:", error);
    }
  });
}

function aggregateTimes(timeSpent) {
  const promises = Object.keys(timeSpent).map(tabId => {
    return new Promise((resolve, reject) => {
      chrome.tabs.get(parseInt(tabId), (tab) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve({ title: tab.title, time: timeSpent[tabId] });
        }
      });
    });
  });

  return Promise.all(promises)
    .then(results => {
      const aggregatedTimes = {};
      results.forEach(({ title, time }) => {
        const simplifiedTitle = title.split(' - ')[0]; // Adjust as needed
        aggregatedTimes[simplifiedTitle] = (aggregatedTimes[simplifiedTitle] || 0) + time;
      });
      return aggregatedTimes;
    })
    .catch(error => {
      console.error("Error aggregating times:", error);
      return {};
    });
}
