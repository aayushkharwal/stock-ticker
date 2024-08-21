import { Injectable, output } from '@angular/core';
import { AutoCompleteData } from './auto-complete-data';
import { Data } from './data';

@Injectable({
  providedIn: 'root'
})

export class DataService {

  private backendUrl = 'https://web-tech3-csci571.wl.r.appspot.com/';

  constructor() { }

  async getAutocompleteResults(partialTicker: string): Promise<AutoCompleteData[]> {
    const data = await fetch(`${this.backendUrl}/search/${partialTicker}`);
    const jsonData = await data.json() ?? [];
    console.log("AutoComplete API returned: ", jsonData);
    return jsonData
  }
    
  async getInitialState(tickerSymbol: string): Promise<Data> {
    const data = await fetch(`${this.backendUrl}/db/${tickerSymbol}`);
    const jsonData = await data.json() ?? {};
    console.log("DB State: ", jsonData);
    return jsonData
  } 

  async getQuoteData(tickerSymbol: string): Promise<Data> {
    const data = await fetch(`${this.backendUrl}/search/${tickerSymbol}/stock_quote`);
    const jsonData = await data.json() ?? {};
    console.log("Stock Quote API returned: ", jsonData);
    return jsonData
  }

  async getLiveData(tickerSymbol: string): Promise<Data> {
    const urls = [
      "quote",
      "charts"
    ]
    const requests = urls.map((url) => fetch(`${this.backendUrl}/search/${tickerSymbol}/stock_${url}`)); 
    const responses = await Promise.all(requests); 

    const outputData: Data = {};
    await Promise.all(responses.map(async (response, index) => { outputData[urls[index]] = await response.json() }));
    console.log("Real time stock data: ", outputData);

    return outputData
  }

  async getSummaryData(tickerSymbol: string): Promise<Data> {
    const urls = [
      "profile",
      "peers",
      // "quote",
      // "charts"
    ]
    const requests = urls.map((url) => fetch(`${this.backendUrl}/search/${tickerSymbol}/stock_${url}`)); 
    const responses = await Promise.all(requests); 

    const outputData: Data = {};
    await Promise.all(responses.map(async (response, index) => { outputData[urls[index]] = await response.json() }));
    console.log("Stock Summary API returned: ", outputData);

    return outputData
  }

  async getNews(tickerSymbol: string): Promise<AutoCompleteData[]> {
    const data = await fetch(`${this.backendUrl}/search/${tickerSymbol}/stock_news`);
    const jsonData = await data.json() ?? [];
    console.log("Stock News API returned: ", jsonData);
    return jsonData
  }
  
  async getSMAData(tickerSymbol: string): Promise<Data> {
    const data = await fetch(`${this.backendUrl}/search/${tickerSymbol}/sma_charts`);
    const jsonData = await data.json() ?? [];
    console.log("Stock polygon data for SMA charts: ", jsonData);
    return jsonData
  } 
  
  async getInsights(tickerSymbol: string): Promise<Data> {
    const urls = [
      "sentiment",
      "recommendation",
      "earnings",
    ]
    const requests = urls.map((url) => fetch(`${this.backendUrl}/search/${tickerSymbol}/stock_${url}`)); 
    const responses = await Promise.all(requests); 

    const outputData: Data = {};
    await Promise.all(responses.map(async (response, index) => { outputData[urls[index]] = await response.json() }));
    console.log("Stock Insights data: ", outputData);

    return outputData
  }

  async getWalletBalance(): Promise<Data[]> {
    const data = await fetch(`${this.backendUrl}/wallet/balance`);
    const jsonData = await data.json() ?? {};
    console.log("Wallet Balance API call returned: ", jsonData);
    return jsonData
  } 

  async getPortfolioData(): Promise<Data[]> {
    const data = await fetch(`${this.backendUrl}/portfolio/all`);
    const jsonData = await data.json() ?? {};
    console.log("Feteched the entire portfolio from db: ", jsonData);
    return jsonData
  } 

  async getWatchlistData(): Promise<Data[]> {
    const data = await fetch(`${this.backendUrl}/watchlist/all`);
    const jsonData = await data.json() ?? [];
    console.log("Feteched the entire watchlist from db: ", jsonData);
    return jsonData
  } 

  async updatePortfolio(portfolioData: Data): Promise<Data[]> {
    const data = await fetch(`${this.backendUrl}/portfolio/update`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(portfolioData)
    });
    const jsonData = await data.json() ?? {};
    console.log("Updated portfolio as: ", jsonData);
    return jsonData
  } 

  async updateWatchlist(tickerSymbol: string, companyName: string): Promise<Data> {
    const data = await fetch(`${this.backendUrl}/watchlist/${tickerSymbol}/update?${new URLSearchParams({companyName: companyName})}`);
    const jsonData = await data.json() ?? {};
    console.log(`Updated watchlist for: `, jsonData);
    return jsonData
  } 

}

  
