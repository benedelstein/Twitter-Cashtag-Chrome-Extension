$(document).ready(function() {
  chrome.storage.sync.get(['apiKey'], function(result) {
    var keyData;
    if(result.apiKey) {
      keyData = 'your current API key: ' + result.apiKey;
      $('#noKeyYet').hide();
      $('#apiKey').text(result.apiKey);
    } else {
      keyData = 'You haven\'t entered an API key yet';
      $('#keyIn').hide();
    }
    $('#noKeyMsg').html(keyData);
  });

  $('#submitButton').on("click", onKeySubmit); //listen for key entry
  $('#keyInput').on('keypress',function(e) {
    if(e.which == 13) {
        onKeySubmit();
    }
  });

  $('#reenter').on("click", function() {
    $('#keyIn').hide();
    $('#noKeyYet').show();
  }); //listen for button press

  function onKeySubmit() { //function run when submit button is pressed
    let params = {
      active: true,
      currentWindow: true
    }
    let apiKey = $('#keyInput').val().trim();
    if(apiKey.length===16) { // if key is valid
      /* TODO: check if API KEY is actually valid */
      chrome.storage.sync.set({apiKey: apiKey}, function() {
        var newKeyData = 'your current API key: ' + apiKey;
        console.log("key in");
        $('#noKeyMsg').html(newKeyData);
        $('#apiKey').text(apiKey);
      });
      $('#noKeyYet').hide();
      $('#keyIn').show();
      $('#keyInput').val(''); // clear the text input
      chrome.tabs.query(params, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {message: "keyIn",key: apiKey}); //tell the content script that a valid api key was entered
      });
    } else {
      alert('Looks like you entered an invalid API key! Get one from the link.');
    }
  }
});
