//$('#getResults').on("click", function() {console.log('clicked');});
//document.getElementById('getResults').addEventListener(onKeySubmit);
$(document).ready(function() {
  $('#sendKey').on("click", onKeySubmit);
  function onKeySubmit() {
    let params = {
      active: true,
      currentWindow: true
    }
    chrome.tabs.query(params, gotTabs);

    function gotTabs(tabs) {
      console.log(tabs);
      let apiKey = $('#keyInput').val().trim();
      if(apiKey.length===16) {
        chrome.storage.sync.set({apiKey: apiKey},function() {
          console.log('Set user api key to ' + apiKey);
        })
      }
      else {
        alert('Looks like you entered an invalid API key! Get one from the link.');
      }
    }
  }
});
