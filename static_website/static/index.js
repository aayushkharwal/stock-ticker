function clear_display(event) {
  open_tab("company");
  document.getElementById("invalid_symbol").style.display="none";
  document.getElementById("valid_symbol").style.display="none"; 
}

function open_tab(tab_window_id) {
       
    let tab_window = document.getElementById("tab_window");
    for (var i = 0; i < tab_window.children.length; i++) {
      tab_window.children[i].style.display = "none";
    }
    
    let tabs = document.getElementsByClassName("tab");
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].className = tabs[i].className.replace(" active", "");
    }
    
    document.getElementById(tab_window_id).style.display = "flex";
    document.getElementById("button_"+tab_window_id).className += " active";

}

async function fetch_request(url, symbol) {
  
  const response = await fetch(`https://web-tech-csci571.wl.r.appspot.com/${url}?symbol=${symbol}`, {
    method: "GET",
    headers: {
      // "mode": 'no-cors',
      "Content-Type": "application/json",
      "Accept": "application/json",
    }
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json()

}

async function populate_company_tab (symbol) {

  const response_data = await fetch_request("company_profile", symbol)
  
  if (response_data["invalid"] == 0) {

    const table_data = document.querySelectorAll("#company [id]");

    for(var i = 0; i < table_data.length; i++) {
      if (table_data[i].nodeName == "IMG") {
        table_data[i].src=response_data[table_data[i].id];
      } else {
        table_data[i].innerHTML=response_data[table_data[i].id];
      }
    } 

    document.getElementById("invalid_symbol").style.display="none";
    document.getElementById("valid_symbol").style.display="flex";
    // document.getElementById("company").style.display="flex";
    open_tab("company");
    return response_data["ticker"]

  } else {
    
    document.getElementById("invalid_symbol").style.display="block";
    document.getElementById("valid_symbol").style.display="none";
    
    return
  }

}

async function populate_stock_summary_tab (symbol, ticker_symbol) {

  let response_data = await fetch_request("stock_summary", symbol);
  const table_data = document.querySelectorAll("#stock_summary table [id]");
  response_data["quote"]["s"] = ticker_symbol;

  for(var i = 0; i < table_data.length; i++) {
    table_data[i].innerHTML=response_data["quote"][table_data[i].id];
    if ((table_data[i].id == 'd' || table_data[i].id=='dp') && response_data["quote"][table_data[i].id]!=0) {
      if (response_data["quote"][table_data[i].id]>0) {
        image_path = "/static/images/GreenArrowUp.png";
      } else {
        image_path = "/static/images/RedArrowDown.png";
      }
      table_data[i].innerHTML += "<img alt='trend' src='"+image_path+"' />";
    }
  }

  const span_data = document.querySelectorAll("#stock_summary div [id]");
  const colors = {
    strongSell: "#ec2938",
    sell: "#b05e48",
    hold: "#75935c",
    buy: "#3cc970",
    strongBuy: "#01ff7c"
  };

  for(var i = 0; i < span_data.length; i++) {
    span_data[i].innerHTML=response_data["recommendation"][span_data[i].id];
    span_data[i].style.backgroundColor=colors[span_data[i].id];
  }

  return 

}

async function populate_latest_news_tab (symbol) {

  const response_data = await fetch_request("latest_news", symbol);
  const container_news = document.getElementById("latest_news");
  const doc_frag = document.createDocumentFragment();

  container_news.innerHTML = ""
  
  // console.log("response_data: ", response_data);
  for (var i = 0; i < response_data.length; i++) {
    let div = document.createElement("div");
    div.className = "card_news";
      let div1=document.createElement("div");
      div1.className = "news_image";
        let img=document.createElement("img");
        img.alt="news_image";
        img.src=response_data[i]["image"];
      div1.appendChild(img);
    div.appendChild(div1);

    let div2=document.createElement("div");
    div2.className = "news_content";
      let p_headline = document.createElement("p");
      p_headline.textContent = response_data[i]["headline"];
      let p_datetime= document.createElement("p");
      p_datetime.textContent = response_data[i]["datetime"];
      let p_a = document.createElement("p");
      p_a.innerHTML = "<a target='_blank' href='"+response_data[i]["url"]+"'>See Original Post</a>";
      div2.append(p_headline, p_datetime, p_a);
    div.appendChild(div2);

    doc_frag.appendChild(div);
  }

  container_news.appendChild(doc_frag);
  return
}

async function populate_charts_tab(symbol) {
  const response_data = await fetch_request("charts", symbol);
  const data_price=[], data_volume=[];
  
  let max_volumne = 0
  for (var i =0; i< response_data["results"].length;i++){
    data_price.push([response_data["results"][i]["t"],response_data["results"][i]["c"]]);
    data_volume.push([response_data["results"][i]["t"],response_data["results"][i]["v"]]);
    max_volumne = (max_volumne < response_data["results"][i]["v"]) ? response_data["results"][i]["v"] : max_volumne;
  }

  Highcharts.stockChart("charts", {
    accessibility: {
      enabled: false
    },

    exporting: {
      enabled: true
    },
    
    rangeSelector: {
      inputEnabled: false,
      allButtonsEnabled: true,
      selected: 0,
      buttons: [
        {
          type: 'day',
          count: 7,
          text: '7d',
          title: 'View 7 days'
        },
        {
          type: 'day',
          count: 15,
          text: '15d',
          title: 'View 15 days'
        },
        {
          type: 'month',
          count: 1,
          text: '1m',
          title: 'View 1 month'
        },
        {
          type: 'month',
          count: 3,
          text: '3m',
          title: 'View 3 months'
        },
        {
          type: 'month',
          count: 6,
          text: '6m',
          title: 'View 6 months'
        },
      ]
    },

    title: {
      text: `Stock Price ${response_data["ticker"]} ${response_data["date"]}`
    },

    subtitle: {
      useHTML: true,
      text: '<a href="https://polygon.io/" target="_blank">Source: Polygon.io</a>'
    },

    tooltip: {
      split: true
    },

    navigator: {
        series: {
            accessibility: {
                exposeAsGroupOnly: true
            }
        }
    },

    yAxis: [
      {
        labels: {
          align: 'right',
        },
        title: {
          text: 'Stock Price'
        },
        lineWidth: 0,
        resize: {
          enabled: true
        },
        opposite: false
      },
      {
        labels: {
          align: 'left',
        },
        title: {
          text: 'Volume'
        },
        lineWidth: 0,
        resize: {
          enabled: false
        },
        opposite: true,
        max: max_volumne*2
      }
    ],

    plotOptions: {
      series: {
        pointPlacement: "on"
      }
    },

    series: [
      {
        type: 'area',
        name: 'Stock Price',
        data: data_price,
        yAxis: 0,
        threshold: null,
        tooltip: {
            valueDecimals: 2
        },
        fillColor: {
            linearGradient: {
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 1
            },
            stops: [
                [0, Highcharts.getOptions().colors[0]],
                [1, Highcharts.color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
            ]
        }
      },
      {
        type: 'column',
        name: 'Volume',
        data: data_volume,
        yAxis: 1,
        tooltip: {
            valueDecimals: 0
        },
        color: '#000000',
        pointWidth: 5,
      }
    ]
  });

  return

}

async function search_bar() {

  try {

    if (form["symbol"].value.trim()=="") {
      form["symbol"].focus();
      return
    }

    const ticker_symbol = await populate_company_tab(form["symbol"].value);
    if (ticker_symbol!==undefined) {
      await populate_stock_summary_tab(form["symbol"].value, ticker_symbol);
      await populate_latest_news_tab(form["symbol"].value);
      await populate_charts_tab(form["symbol"].value);
    } 

	} catch (error) {
		console.error(error);
	}

  return

}

const form = document.getElementById("form_search_bar");
form.addEventListener("submit", (event) => {
  event.preventDefault();
  search_bar();
});