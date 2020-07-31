var INIT_DELAY = 1000;

//check if valid api key exists
chrome.storage.sync.get(['apiKey'], function(result) {
  if(!result.apiKey) {
    alert('You haven\'t entered your stocks API key yet. Open the popup (top right of browser) to enter it.');
  }
  else {
    setTimeout(stockInfo, INIT_DELAY, result.apiKey); // delay to allow page to load, 3rd arg is argument passed to stockInfo
  }
});

//listen for api key enter message to run script without refreshing page
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.message==="keyIn") {
      stockInfo(request.key);
    }
});

function stockInfo(apiKey) {
  var theme;
  const lightTheme = {
    trendsDivClass:'css-1dbjc4n r-1u4rsef r-9cbz99 r-t23y2h r-1phboty r-rs99b7 r-ku1wi2 r-1udh08x',
    bgColor: '#ffffff',
    textColor: '#212121',
    borderColor: '#E6ECF0',
    plotFontColor: '#444',
    errorFontColor: '#212121',
    footerColor: '#616161',
    plotBarColor: '#232323'
  };
  const dimTheme = {
    trendsDivClass: 'css-1dbjc4n r-1uaug3w r-1uhd6vh r-t23y2h r-1phboty r-rs99b7 r-ku1wi2 r-1udh08x',
    bgColor: 'rgb(21, 32, 43)',
    textColor: '#ffffff',
    borderColor: '#37444C',
    plotFontColor: '#fff',
    errorFontColor: '#aaaaaa',
    footerColor: '#aaaaaa',
    plotBarColor: '#bbbbbb'
  };
  const darkTheme = {
    trendsDivClass: 'css-1dbjc4n r-1ysxnx4 r-k0dy70 r-t23y2h r-1phboty r-rs99b7 r-ku1wi2 r-1udh08x',
    bgColor: '#000000',
    textColor: '#ffffff',
    borderColor: '#2F3336',
    plotFontColor: '#fff',
    errorFontColor: '#aaaaaa',
    footerColor: '#aaaaaa',
    plotBarColor: '#dddddd'
  };

  $(document).ready(function() { //wait for dom to fully load before doing anything
    if($('#typeaheadDropdown-1').length===0) { //check if typing box is active and don't do anything if so
      $('#stockinfo').remove(); // clear the div

      var bgColor = document.body.style.backgroundColor;
      if(bgColor=='rgb(255, 255, 255)') { //light mode
        theme = lightTheme;
      }
      else if (bgColor=='rgb(21, 32, 43)') { //dim mode
        theme = dimTheme;
      }
      else { //lights out
        theme = darkTheme;
      }
      $(`div[class="${theme.trendsDivClass}"]`).before('<div class="stock_info" id="stockinfo"></div>');
      $('#stockinfo').css('background-color',theme.bgColor);
      $('#stockinfo').css('border-color',theme.borderColor);
      try {
        var stocks = new Stocks(apiKey);
      }
      catch (ex) {
        console.log('error '+ ex);
      }

      let fullticker = $("input[aria-label='Search query']").val().trim(); //extract ticker from search bar
      ticker = fullticker.substring(1,fullticker.length).toUpperCase(); //take out $

      request(ticker); //call async stocks function

      async function request(stock) {
        var skipPrices = false;
        var skipGraph = false; //flag to skip graph if no data received
        var now = new Date();
        var currentHr = now.getHours();
        var currentMins = now.getMinutes();
        var currentDayOfWeek = now.getDay();
        var todayData;
        if(currentHr>=16 || currentDayOfWeek===0 || currentDayOfWeek===6) { //
          todayData = 13;
        }
        else {
          todayData = 2*(currentHr - 9)-1;
        }
        if(currentMins>30 && (currentHr<16 && currentHr>9)) { //if it's past half hour add another data point
          todayData+=1;
        }
        var dataAmount = 13*4 + todayData;

        /* HTML string to be injected into stockinfo div */
        var resulthtml = "<div id='stockHeader'></div>";
        resulthtml+="<div id='stockPrice'></div>";
        //inject html into page
        $('#stockinfo').html(resulthtml);

        //get json info
        var companyInfo = await stocks.searchEndpoint({keywords: stock});
        if(typeof companyInfo==='undefined') {
          errorMessage();
          return;
        }
        var companyTicker = companyInfo['1. symbol'];
        var companyName = companyInfo['2. name'];
        var companyCurrency = companyInfo['8. currency'];

        if(companyTicker!==stock) { //autocorrect ticker misspellings
          stock = companyTicker;
        }
        var googleUrl = `http://google.com/search?q=${stock}&tbm=fin`; //google finance link

        var headerHtml = companyName + ' (<a href="' + googleUrl +
          '" target="_blank">' + stock + '</a>)'
        $('#stockHeader').append(headerHtml);
        $('#stockHeader').css('color',theme.textColor);
        $('#stockHeader').css('border-bottom-color',theme.borderColor);
        var globalQuote = await stocks.quoteEndpoint({symbol: stock});
        var gotGlobalQuote; //flag for if we got good quote data
        if(typeof globalQuote=== 'undefined') {
          gotGlobalQuote = false;
        } else {
          gotGlobalQuote = true;
          var lastClose = parseFloat(globalQuote['08. previous close']);
        }

        var timeSeriesOptions = {
        symbol: stock,
        interval: '30min',
        amount: dataAmount
        };
        var timeSeries = await stocks.timeSeries(timeSeriesOptions);

        if(timeSeries.length===0 || typeof timeSeries==='undefined') {
          skipGraph = true; //if you don't have time series data you can't graph
        } else if(timeSeries.length !==dataAmount) {
          //console.log('data mismatch: ' + dataAmount + ' requested vs. ' + timeSeries.length + ' received');
        }

        /****Instantiate variables for time series data*****/
        var closePrice;
        var dailyChange;
        var percentChange;
        var opens = [];
        var closes = [];
        var highs = [];
        var lows = [];
        var volumes = [];
        var dates = [];
        var dateIndices = [];

        if(!skipGraph) {
          //extract data into arrays
          for(var i = 0; i<timeSeries.length; i++) {
            opens.push(timeSeries[i].open);
            closes.push(timeSeries[i].close);
            highs.push(timeSeries[i].high);
            lows.push(timeSeries[i].low);
            volumes.push(timeSeries[i].volume);
            dates.push(timeSeries[i].date);
            dateIndices.push(timeSeries.length-1-i); //used to set x-axis on plot
          }
          closePrice = closes[0];
          /******calculate price movements *****/
          dailyChange = closePrice - lastClose;
          percentChange = dailyChange/lastClose*100;
        } else {
          if(gotGlobalQuote) {
            dailyChange = parseFloat(globalQuote['09. change']);
            percentChange = globalQuote['10. change percent'];
            percentChange = parseFloat(percentChange.substring(0,percentChange.length-1));
            closePrice = parseFloat(globalQuote['05. price']);
          } else {
            skipPrices = true; //if no time series data and no global quote, then there's nothing to display in this div
          }
        }

        if(!skipPrices) {
          var priceSpan = '<span id="price" >' + closePrice.toFixed(2) + '</span>';
          var currencySpan = '<span id="currency">' + companyCurrency + '</span>';
          $('#stockPrice').append(priceSpan);
          $('#price').css('color',theme.textColor);
          $('#stockPrice').append(currencySpan);
          var dailyChangeString = '';
          if(dailyChange>=0) { //format daily change string
            dailyChangeString = '+' + dailyChange.toFixed(2);
          }
          else {
            dailyChangeString = dailyChange.toFixed(2);
          }
          var dailyChangeSpan = '<span id="dailyChange">' + dailyChangeString + '</span>';
          var percentChangeSpan = '<span id="percentChange">(' + Math.abs(percentChange).toFixed(2) + '%)</span>';
          $('#stockPrice').append('<span id="priceMovements"></span>')
          $('#priceMovements').append(dailyChangeSpan);
          $('#priceMovements').append(percentChangeSpan);
          //change change color based on price movement
          if(dailyChange>=0) {
            $('#dailyChange').css('color', '#0C9D58');
            $('#percentChange').css('color','#0C9D58');
          } else {
            $('#dailyChange').css('color','#D23F30');
            $('#percentChange').css('color','#D23F30');
          }
        }

        $('#stockinfo').append('<div id="plotly"></div>');
        if(!skipGraph) {
          var plot = {
            x: dateIndices,
            y: closes,
            text: dates.map(d => { return (new Date(d)).toString().substring(0,21);}),
            type: 'scatter',
            mode: 'lines'
          };

          var desiredTicks = 3;
          var divisor = Math.floor(dataAmount/desiredTicks);
          var dateTicks = dateIndices.filter(d=>d%divisor===0);
          var datesToShow =[];
          for(var i=0;i<dates.length;i+=divisor) {
            datesToShow.push(dates[i]);
          }

          var layout = {
            paper_bgcolor: theme.bgColor,
            plot_bgcolor: theme.bgColor,
            hovermode: "x",
            height: 180,
            width: 349,
            margin: {
              t: 15,
              b: 10,
              l: 35,
              r: 35
            },
            font: {
              family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif'
            },
            xaxis: {
              tickmode: 'array',
              tickvals: dateTicks,
              ticktext: datesToShow.map(d => { return (new Date(d)).toString().substring(4,10);}),
              automargin: true,
              showgrid: false,
              color: theme.plotBarColor
            },
            yaxis: {
              nticks: 5,
              showline: false,
              color: theme.plotBarColor
            }
          };

          if($('#plotly').length) {
              Plotly.react('plotly',[plot],layout,{displayModeBar: false});
          } else {
            //console.log('Could not insert plot');
            /**TODO: insert plot error image */
          }
        } else {
          $('#plotly').html('<div id="nograph">Could not insert graph<br><p>Wait a minute and try again</p></div>');
          $('#nograph').css('color',theme.errorFontColor);
        }
        $('#stockinfo').append('<div id="footer">Click on the ticker to get more info from Google Finance</div>');
        $('#footer').css('color',theme.footerColor);
      }
    }
    else {
      //console.log('typing active');
    }
  });
}
//put message in div when an unresolvable error occurs
function errorMessage() {
  var alertUrl = chrome.extension.getURL("images/alert.png");
  var alertHtml = `<img class="alertImage" src="${alertUrl}"></img>`;
  $('#stockinfo').html('<div id="error"><h1>error</h1></div>');
  $('#error').prepend(alertHtml);
}
