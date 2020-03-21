var INIT_DELAY = 1000;
var API_KEY = "ABXAGJEZ3LRJWYQS";
//             V9PSVN3EJ1VQL43G
//setTimeout(stockInfo, INIT_DELAY, API_KEY);

chrome.storage.sync.get(['apiKey'], function(result) {
  if(!result.apiKey) {
    alert('You haven\'t entered your stocks API key yet. Open the popup to enter it.');
  }
  else {
    setTimeout(stockInfo, INIT_DELAY, result.apiKey);
  }
});

function stockInfo(apiKey) {

  var stocks = new Stocks(apiKey);
  $('#stockinfo').remove();
  //insert new div below top nav bar
  //$("nav[class='css-1dbjc4n r-1awozwy r-18u37iz r-1h3ijdo']").parent()
  // .append('<div class="stock_info" id="stockinfo"></div>');

  $("div[class='css-1dbjc4n r-1u4rsef r-9cbz99 r-t23y2h r-1phboty r-rs99b7 r-ku1wi2 r-1udh08x']")
    .before('<div class="stock_info" id="stockinfo"></div>');

  $('#stockinfo').css({
    'height': '280px',
    'width': '349px',
    'margin-bottom' : '20px',
    'margin-top': '0px',
    'position': 'sticky',
    'top': '10px',
    'border-radius': '12px',
    'border': '1px solid #E6ECF0',
    'z-index': '100',
    'background-color': '#ffffff'
  });

  let fullticker = $("input[aria-label='Search query']").val(); //extract ticker from search bar
  ticker = fullticker.substring(1,fullticker.length).toUpperCase(); //take out $
  //console.log(ticker);

  request(ticker); //call async stocks function

  async function request(stock) {
    console.log(Date().toString());
    var timeSeriesOptions = {
    symbol: stock,
    interval: 'daily',
    amount: 5 //could use some type of dynamic thing to go back so far
    };

    //get json info
    var companyInfo = await stocks.searchEndpoint({keywords: stock});
    console.log(companyInfo);
    companyTicker = companyInfo['1. symbol'];
    companyName = companyInfo['2. name'];
    companyCurrency = companyInfo['8. currency'];

    var timeSeries = await stocks.timeSeries(timeSeriesOptions);
    console.log(timeSeries);

    if(stock!==companyTicker) { //means invalid ticker
      alert('Invalid Ticker. Make sure you spelled it correctly!');
    }
    else if(timeSeries.length===0) {
      console.log('Got no data. retry');
      setTimeout(request,1000,stock);
    }
    else {
      /****Instantiate arrays for time series data*****/
      var opens = [];
      var closes = [];
      var highs = [];
      var lows = [];
      var volumes = [];
      var dates = [];

      //extract data into arrays
      for(var i = 0; i<timeSeries.length; i++) {
        opens.push(timeSeries[i].open);
        closes.push(timeSeries[i].close);
        highs.push(timeSeries[i].high);
        lows.push(timeSeries[i].low);
        volumes.push(timeSeries[i].volume);
        dates.push(timeSeries[i].date);
      }

      // console.log(opens);
      // console.log(closes);
      // console.log(dates);

      dailyChange = closes[0]-closes[1]; //calculate price movement
      percentChange = (closes[0]-closes[1])/closes[1]*100; //percent movement

      var resulthtml = "<h3 style='margin: 8px 5px 2px 10px;'>" + companyName + ' (' + stock + ')' + '</h3>'; //html to be added in div
      resulthtml+='<span id="price" style="margin-left: 15px; font-size: 20px">' + closes[0].toFixed(2) + '</span>';
      resulthtml+='<span id="currency" style="margin-left: 3px; font-size: 15px">' + companyCurrency + '</span>';
      resulthtml+='<span id="priceMovements">'
      resulthtml+='<div id="dailyChange" style="font-size: 10px;">' + dailyChange.toFixed(2) + '</div>';
      resulthtml+='<div id="percentChange" style="font-size: 10px;">' + percentChange.toFixed(2) + '%</div>';
      resulthtml+='</span>'

      var googleUrl = `http://google.com/search?q=${stock}&tbm=fin`;
      resulthtml+=`<a href="${googleUrl}" target="_blank">google finance</a>`;
      var plot = {
        x: dates,
        y: closes,
        type: 'scatter'
      };

      var layout = {
        height: 175,
        width: 350,
        margin: {
          t: 50,
          b: 50,
          l: 30
        },
        font: {
          family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif'
        },
        xaxis: {
          titlefont: {
            size: 12
          },
          showgrid: false,
          nticks: 5
        },
        yaxis: {
          titlefont: {
            size: 12
          },
          nticks: 5
        }
      };

      var plotData = [plot]; //put data into array so it can be plotted

      //inject html into page
      $('#stockinfo').append(resulthtml);

      //change change color based on price movement
      if(percentChange>0) {
        $('#dailyChange').css('color,green');
        $('#percentChange').css('color','green');
      } else {
        $('#dailyChange').css('color,red');
        $('#percentChange').css('color','red');
      }

      $('#stockinfo').children()
        .css('font-family','system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif');
      $('#stockinfo').append('<div id="plotly"></div>');
      if($('#plotly').length) {
        Plotly.plot('plotly',plotData,layout);
      } else {
        console.log('Could not insert plot');
      }
      $('div[class="svg-container"]').css({'display':'block','margin-left':'auto','margin-right':'auto'});
      }
  }

}
