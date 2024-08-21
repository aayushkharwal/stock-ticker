import { Injectable } from '@angular/core';
import { Data } from './data';

@Injectable({
  providedIn: 'root'
})
export class CacheService {


  tickerSymbol!: string;
  companyName!: string;
  stockData!: Data;
  insightsData!: Data;
  newsData!: Data[];
  smaData!: Data;
  initialDb!: Data;
  liveData!: Data;


  constructor() { }

  clearCache() {

    this.tickerSymbol = '';
    this.companyName= '';
    this. stockData = {} as Data;
    this.insightsData = {} as Data;
    this.newsData = [] as Data[];
    this.smaData = {} as Data;
    this.initialDb = {} as Data;
    this.liveData = {} as Data;
    
  }
}
