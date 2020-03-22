chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) { //wait for dom to be updated
  if(details.url.includes('twitter.com/search?q=%24')) {
    console.log(details.transitionType);
    chrome.tabs.executeScript(null,{file:"jquery-3.4.1.min.js"}); // reload jquery first
    chrome.tabs.executeScript(null,{file:"plotly-basic.min.js"});
    chrome.tabs.executeScript(null,{file:"stocks.js"});
    chrome.tabs.executeScript(null,{file:"content.js"}); //re-run content script
  }
});
