# Twitter-Finance-Chrome-Extension

This is a chrome extension for Twitter Cashtags.

Twitter announced cashtags back in 2012, but hasn't done much with them in the 8 years they've been around. Just like with a hashtag, you can use the $ symbol in your tweets to track specific equities (e.g. $TSLA or $SPY). It's helpful to see what people are saying about certain stocks, but unless you happen to know the ticker name, you have no idea what these tweets are talking about.

I created a chrome extension to give more info on these cashtags. Just click on a cashtag, and you'll get taken to the regular Twitter search page, but with a special side bar that shows you the company name, price, increase/decrease, and 5 day graph.

Before you can get started, you'll need to download the chrome extension from <a href="#" target="_blank">here</a> get an API key from <a href="https://www.alphavantage.co/support/#api-key" target="_blank">here</a>. It's free and takes just a minute to get one! Then enter that key in the extension's popup window, and you'll be good to go!

I built this extension using the stocks.js javascript API from wagenaartje on Github (<a href="https://github.com/wagenaartje/stocks.js">link</a>), and the plotly javascript API for plotting.

<strong>Usage</strong>
<ul>
  <li>
    The free API key only lets you search 5 times per minute and 500 times per day. If you refresh the search page too many times or click on too many cashtags too quickly, you might get an error.
  </li>
  <li>
    If you want, you can update to a paid API key for a monthly fee. It will provide higher usage limits.
  </li>
</ul>
