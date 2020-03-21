chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
  if(details.url.includes('twitter.com/search?q=%24')) {
    console.log(details.transitionType);
    chrome.tabs.executeScript(null,{file:"content.js"});
  }
});
