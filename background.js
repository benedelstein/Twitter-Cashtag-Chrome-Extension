chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) { //wait for dom to be updated
  if(details.url.includes('twitter.com/search?q=%24')) {
    console.log(details.transitionType);
    chrome.tabs.executeScript(null,{file:"content.js"}); //re-run content script
  }
});
