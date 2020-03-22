var INIT_DELAY = 1000;
var tryCount = 0;

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
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.message==="keyIn") {
      stockInfo(request.key);
    }
  });

function stockInfo(apiKey) {
  $(document).ready(function() { //wait for dom to fully load before doing anything
    try {
      var stocks = new Stocks(apiKey);
    }
    catch (ex) {
      console.log('error '+ ex);
    }
    $('#stockinfo').remove();

    //insert new div on side bar
    $("div[class='css-1dbjc4n r-1u4rsef r-9cbz99 r-t23y2h r-1phboty r-rs99b7 r-ku1wi2 r-1udh08x']")
      .before('<div class="stock_info" id="stockinfo"></div>');

    $('#stockinfo').css({ //setup styling of div
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

    let fullticker = $("input[aria-label='Search query']").val().trim(); //extract ticker from search bar
    ticker = fullticker.substring(1,fullticker.length).toUpperCase(); //take out $
    //console.log(ticker);

    request(ticker); //call async stocks function

    async function request(stock) {
      tryCount++;
      //console.log(Date().toString());
      var now = new Date();
      var currentHr = now.getHours();
      var todayData;
      if(currentHr>16) {
        todayData = 8;
      }
      else {
        todayData = currentHr - 9;
      }
      var dataAmount = 32 + todayData;
      var timeSeriesOptions = {
      symbol: stock,
      interval: '60min',
      amount: dataAmount //could use some type of dynamic thing to go back so far
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
      else if(timeSeries.length===0 && tryCount<4) {
        console.log('Got no data. retry');
          setTimeout(request,1000,stock);
      }
      else if(timeSeries.length===0 && tryCount>=4) {
        $('#stockinfo').html('<h1>Error</h1>');
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
        console.log(closes);
        console.log(dates);

        dailyChange = closes[0]-closes[1]; //calculate price movement
        percentChange = (closes[0]-closes[1])/closes[1]*100; //percent movement

        var resulthtml = "<div id='stockHeader' style='margin: 8px 10px 2px 15px;'>";
          resulthtml+= "<h2 style='font-size: 20px;margin: 0px'>"+ companyName + ' (' + stock + ')' + '</h2>'; //html to be added in div
        resulthtml+="</div>"
        resulthtml+='<span id="price" style="margin-left: 20px; font-size: 24px">' + closes[0].toFixed(2) + '</span>';
        resulthtml+='<span id="currency" style="margin-left: 3px;font-size: 18px;color: #616161">' + companyCurrency + '</span>';
        resulthtml+='<span id="priceMovements" style="display: inline-block;width: 20%;margin-left: 5px;margin-right: 10px;width:40px">'
          resulthtml+='<div id="dailyChange" style="font-size: 12px">  ' + dailyChange.toFixed(2) + '</div>';
          resulthtml+='<div id="percentChange" style="font-size: 12px;">(' + Math.abs(percentChange).toFixed(2) + '%)</div>';
        resulthtml+='</span>'

        var googleUrl = `http://google.com/search?q=${stock}&tbm=fin`;
        resulthtml+=`<a href="${googleUrl}" target="_blank">google finance</a>`;
        var plot = {
          x: dateIndices,
          y: closes,
          connectgaps: false,
          type: 'scatter',
          mode: 'lines'
        };
        var dateTicks = dateIndices.filter(d=>d%5===0);
        var datesToShow =[];
        console.log(dateTicks);
        for(var i=5;i<dates.length;i+=5) {
          datesToShow.push(dates[i]);
        }
        console.log(datesToShow);
        var layout = {
          height: 175,
          width: 350,
          margin: {
            t: 50,
            b: 50,
            l: 30,
            r: 50
          },
          font: {
            family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif'
          },
          xaxis: {
            tickmode: 'array',
            tickvals: dateTicks,
            ticktext: datesToShow.map(d => { return (new Date(d)).toDateString();}),
            titlefont: {
              size: 12
            },
            automargin: true,
            showgrid: false,
            nticks: 5,
            rangeselector: {buttons: [
              {
                count: 1,
                label: '1d',
                step: 'day',
                stepmode: 'backward'
              },
              {
                count: 5,
                label: '5d',
                step: 'day',
                stepmode: 'backward'
              }
            ]}
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
          $('#dailyChange').css('color', '#0C9D58');
          $('#percentChange').css('color','#0C9D58');
        } else {
          $('#dailyChange').css('color','#D23F30');
          $('#percentChange').css('color','#D23F30');
        }

        $('#stockinfo').children()
          .css('font-family','system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif');
        $('#stockinfo').append('<div id="plotly"></div>');
        if($('#plotly').length) {
            Plotly.react('plotly',plotData,layout);
        } else {
          console.log('Could not insert plot');
        }
        $('div[class="svg-container"]').css({'display':'block','margin-left':'auto','margin-right':'auto','width':'340px'});
      }
    }
  });
}
