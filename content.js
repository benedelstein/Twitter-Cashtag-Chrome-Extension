var INIT_DELAY = 1000;

//check if valid api key exists
chrome.storage.sync.get(['apiKey'], function(result) {
  if(!result.apiKey) {
    alert('You haven\'t entered your stocks API key yet. Open the popup to enter it.');
  }
  else {
    setTimeout(stockInfo, INIT_DELAY, result.apiKey);
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
  $(document).ready(function() { //wait for dom to fully load before doing anything
    if($('#typeaheadDropdown-1').length===0) { //check if typing box is active and don't do anything if so
      $('#stockinfo').remove();

      //insert new div on side bar
      $("div[class='css-1dbjc4n r-1u4rsef r-9cbz99 r-t23y2h r-1phboty r-rs99b7 r-ku1wi2 r-1udh08x']")
        .before('<div class="stock_info" id="stockinfo"></div>');

      try {
        var stocks = new Stocks(apiKey);
      }
      catch (ex) {
        console.log('error '+ ex);
      }



      let fullticker = $("input[aria-label='Search query']").val().trim(); //extract ticker from search bar
      ticker = fullticker.substring(1,fullticker.length).toUpperCase(); //take out $
      //console.log(ticker);

      request(ticker); //call async stocks function

      async function request(stock) {
        tryCount++; //update amount of trys to call API before timeout
        var now = new Date();
        var currentHr = now.getHours();
        var currentMins = now.getMinutes();
        var currentDayOfWeek = now.getDay();
        var todayData;
        if(currentHr>=16 || currentDayOfWeek===0 || currentDayOfWeek===6) { //
          todayData = 14;
        }
        else {
          todayData = 2*(currentHr - 9);
        }
        if(currentMins>30 && (currentHr<16 && currentHr>9)) { //if it's past half hour add another data point
          todayData+=1;
        }
        console.log('Data for today: ' + todayData);
        var dataAmount = 56 + todayData;

        var timeSeriesOptions = {
        symbol: stock,
        interval: '30min',
        amount: dataAmount
        };

        //get json info
        var companyInfo = await stocks.searchEndpoint({keywords: stock});
        console.log(companyInfo);
        var globalQuote = await stocks.quoteEndpoint({symbol: stock});
        console.log(globalQuote);
        var timeSeries = await stocks.timeSeries(timeSeriesOptions);
        console.log(timeSeries);

        if(typeof companyInfo ==='undefined' || typeof timeSeries === 'undefined' || typeof globalQuote==='undefined') {
          errorMessage();
          return;
        }
        companyTicker = companyInfo['1. symbol'];
        companyName = companyInfo['2. name'];
        companyCurrency = companyInfo['8. currency'];
        var lastClose = parseFloat(globalQuote['08. previous close']);


        if(stock!==companyTicker) { //means invalid ticker
          alert('Invalid Ticker. Make sure you spelled it correctly!');
          errorMessage();
        }
        else {
          /****Instantiate arrays for time series data*****/
          var opens = [];
          var closes = [];
          var highs = [];
          var lows = [];
          var volumes = [];
          var dates = [];
          var dateIndices = [];
          //extract data into arrays
          for(var i = 0; i<timeSeries.length; i++) {
            opens.push(timeSeries[i].open);
            closes.push(timeSeries[i].close);
            highs.push(timeSeries[i].high);
            lows.push(timeSeries[i].low);
            volumes.push(timeSeries[i].volume);
            dates.push(timeSeries[i].date);
            dateIndices.push(timeSeries.length-1-i);
          }

          // console.log(opens);
          //console.log(closes);
          //console.log(dates);
          // console.log(dateIndices);

          /******calculate price movements *****/
          var dailyChange = closes[0] - lastClose;
          var percentChange = dailyChange/lastClose*100;

          var dailyChangeString = '';
          if(dailyChange>=0) {
            dailyChangeString = '+' + dailyChange.toFixed(2);
          }
          else {
            dailyChangeString = dailyChange.toFixed(2);
          }

          var googleUrl = `http://google.com/search?q=${stock}&tbm=fin`; //google finance link

          /* HTML string to be injected into stockinfo div */
          var resulthtml = "<div id='stockHeader'>";
            resulthtml+= "<h2>"+ companyName
              + ' (<a href="' + googleUrl + '" target="_blank">' + stock + '</a>)' + '</h2>'; //html to be added in div
          resulthtml+="</div>"
          resulthtml+="<div id='stockPrice'>"
            resulthtml+='<span id="price" >' + closes[0].toFixed(2) + '</span>';
            resulthtml+='<span id="currency">' + companyCurrency + '</span>';
            resulthtml+='<span id="priceMovements">'
              resulthtml+='<div id="dailyChange">' + dailyChangeString + '</div>';
              resulthtml+='<div id="percentChange">(' + percentChange.toFixed(2) + '%)</div>';
            resulthtml+='</span>'
          resulthtml+='</div>'

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
          console.log(dateTicks);
          for(var i=0;i<dates.length;i+=divisor) {
            datesToShow.push(dates[i]);
          }
          console.log(datesToShow);

          var layout = {
            hovermode: "x",
            height: 200,
            width: 340,
            margin: {
              t: 10,
              b: 50,
              l: 30,
              r: 30
            },
            font: {
              family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif'
            },
            xaxis: {
              tickmode: 'array',
              tickvals: dateTicks,
              ticktext: datesToShow.map(d => { return (new Date(d)).toString().substring(4,10);}),
              automargin: true,
              showgrid: false
            },
            yaxis: {
              nticks: 5
            }
          };

          //inject html into page
          $('#stockinfo').html(resulthtml);

          //change change color based on price movement
          if(dailyChange>0) {
            $('#dailyChange').css('color', '#0C9D58');
            $('#percentChange').css('color','#0C9D58');
          } else {
            $('#dailyChange').css('color','#D23F30');
            $('#percentChange').css('color','#D23F30');
          }
          $('#stockinfo').append('<div id="plotly"></div>');
          if($('#plotly').length) {
              Plotly.react('plotly',[plot],layout,{displayModeBar: false});
          } else {
            console.log('Could not insert plot');
            /**TODO: insert plot error image */
          }
          $('stockinfo').append('<div id="footer">Click on the ticker to get more info from Google Finance</div>');
        }
      }
    }
    else {
      console.log('typing active');
    }
  });
}
//put message in div when an unresolvable error occurs
function errorMessage() {
  $('#stockinfo').html('<h1>Error</h1>');
}
