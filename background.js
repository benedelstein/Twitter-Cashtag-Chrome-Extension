// twitter doesn't reload page on navigation, it just updates the dom
// this background script looks for that change and then runs all the content scripts
chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) { //wait for dom to be updated
    if(details.url.includes('twitter.com/search?q=%24')) {
        console.log("running scripts");
        chrome.tabs.insertCSS(null,{file:"content.css"});
        chrome.tabs.executeScript(null,{file:"jquery-3.4.1.min.js"}); // reload jquery first
        chrome.tabs.executeScript(null,{file:"plotly-basic.min.js"}); //then plotly
        chrome.tabs.executeScript(null,{file:"stocks.js"}); //then stocks
        chrome.tabs.executeScript(null,{file:"content.js"}); //finally re-run content script
    }
});
