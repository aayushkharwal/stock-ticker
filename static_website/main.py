import requests
from urllib.parse import urljoin 
from dateutil.relativedelta import relativedelta
from datetime import datetime, timedelta
from flask import Flask, request

api_base_url = "https://finnhub.io/api/v1/"
api_token = "cn271phr01qmg1p4mii0cn271phr01qmg1p4miig"
charts_base_url = "https://api.polygon.io/v2"
charts_token = "yj5dD0Ovl8goaX3A4WtsmW2c_XTI8_X1"

app = Flask(__name__)

def get_formatted_datetime(unix_time):
    return datetime.fromtimestamp(unix_time).strftime("%d %B, %Y")


@app.route("/health_check", methods=["GET"])
def health_check():
    return {"Hello": "World!"}

@app.route("/")
def index():
    return app.send_static_file("index.html")


@app.route("/company_profile", methods=["GET"])
def company_profile():

    params = {
        "token": api_token,
        "symbol": request.args.get("symbol")
    }
    api_url_path = "stock/profile2"
    api_url = urljoin(api_base_url, api_url_path)
    response = requests.get(api_url, params=params)
    # print("Flask: ", response.status_code, response)
    response = response.json()
    if response:
        response["invalid"]=0
    else:
        response["invalid"]=1

    print("company_profile: ", response)
    return response


@app.route("/stock_summary", methods=["GET"])
def stock_summary():

    params = {
        "token": api_token,
        "symbol": request.args.get("symbol")
    }
    api_url_path = "quote"
    api_url = urljoin(api_base_url, api_url_path)
    response = requests.get(api_url, params=params)
    # print(response.status_code, response.json())
    response_quote = response.json()
    response_quote["t"] = get_formatted_datetime(response_quote["t"])
    response_quote["s"] = request.args.get("symbol")

    api_url_path = "stock/recommendation"
    api_url = urljoin(api_base_url, api_url_path)
    response = requests.get(api_url, params=params)
    # print(response.status_code, response.json())
    response_recommendation = response.json()
    response_recommendation.sort(key=lambda i: datetime.strptime(i["period"], "%Y-%m-%d"), reverse=True)

    response = {"quote": response_quote, "recommendation": response_recommendation[0]}
    print("stock_summary: ", response)
    return response

@app.route("/charts", methods=["GET"])
def charts():

    params = {
        "adjusted": True,
        "sort": "asc",
        "apiKey": charts_token
    }
    
    api_url_path = "aggs/ticker"
    api_url = "/".join([
        charts_base_url,
        api_url_path,
        request.args.get("symbol"),
        "range",
        request.args.get("multiplier", "1"),
        request.args.get("timespan", "day"),
        request.args.get("from", (datetime.today() - relativedelta(months=6, days=1)).strftime("%Y-%m-%d")),
        request.args.get("to", datetime.today().strftime("%Y-%m-%d"))
    ])
    response = requests.get(api_url, params=params)
    print(response.status_code, response.json())

    response = response.json()
    response["date"] = datetime.today().strftime("%Y-%m-%d")
    print("charts: ", response)
    return response

@app.route("/latest_news", methods=["GET"])
def latest_news():

    params = {
        "token": api_token,
        "symbol": request.args.get("symbol"),
        "from": request.args.get("from", (datetime.today() - timedelta(days=30)).strftime("%Y-%m-%d")),
        "to": request.args.get("to", datetime.today().strftime("%Y-%m-%d"))
    }

    api_url_path = "company-news"
    api_url = urljoin(api_base_url, api_url_path)
    response = requests.get(api_url, params=params)
    # print(response.status_code, response.json())
    
    news_list = response.json()
    news_keys = ["image", "url", "headline", "datetime"]
    output_data = []
    max_output_size = 5

    i=0
    while len(output_data)!=max_output_size and i<len(news_list):
        if all(k in news_list[i] and news_list[i].get(k) is not None and str(news_list[i].get(k)).strip() for k in news_keys):
            news_list[i]["datetime"] = get_formatted_datetime(news_list[i]["datetime"])
            output_data.append(news_list[i])
        i=i+1

    print("latest_news: ", output_data)
    return output_data

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8080, debug=True)
