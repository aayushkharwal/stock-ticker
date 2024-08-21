import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Observable, Subscription, interval, retry } from 'rxjs';
import { FooterComponent } from '../../footer/footer.component';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { NewsCardComponent } from './news-card/news-card.component';
import { TransactionModalComponent } from './transaction-modal/transaction-modal.component';
import { DataService } from '../../data.service';
import { CacheService } from '../../cache.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import {MatTabsModule} from '@angular/material/tabs';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { Data } from '../../data';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDialog } from '@angular/material/dialog';
import { HighchartsChartModule } from 'highcharts-angular';
import * as Highcharts from 'highcharts';
import HC_stock from 'highcharts/modules/stock';
// import HC_exporting from 'highcharts/modules/exporting';
import indicators from "highcharts/indicators/indicators";
import vbpa from "highcharts/indicators/volume-by-price";
import { tick } from '@angular/core/testing';
HC_stock(Highcharts);
// HC_exporting(Highcharts); 
indicators(Highcharts);
vbpa(Highcharts);


@Component({
  selector: 'app-search-result',
  standalone: true,
  imports: [
    SearchBarComponent,
    MatTabsModule,
    CommonModule,
    RouterModule,
    HighchartsChartModule,
    NewsCardComponent,
    MatGridListModule,
    MatProgressSpinnerModule, 
    FooterComponent
  ],
  templateUrl: './search-result.component.html',
  styleUrl: './search-result.component.css'
})
export class SearchResultComponent implements OnInit, OnDestroy{

  private refreshDataSubscription: Subscription | undefined; 

  public searchTicker: string = this.route.snapshot.params['tickerSymbol'];
  public tickerSymbol!: string;
  public companyName!: string;
  public starIconType!: string;
  public starIconColor!: string;
  public alertMessage: string = '';
  public alertClasses: string[] = ["alert-success", "alert", "alert-dismissible", "text-center", "my-3"];
  public alertPop: boolean = false;
  public caretType!: string;
  public caretColor!: string;
  public marketStatusColor!: string;
  public marketStatus!: string;
  public marketStatusFlag!: string;
  public stockQuantity!: number;
  public noDataAlert: boolean = false;
  public invalidTicker!: boolean;
  public spinnerFlag!: boolean;

  stockData: Data = {};
  insightsData: Data = {};
  newsData: Data[] = [];
  smaData: Data = {};
  initialDb: Data = {};
  liveData: Data = {};

  Highcharts: typeof Highcharts=Highcharts;
  priceChartOptions!: Highcharts.Options;
  recommendationChartOptions!: Highcharts.Options;
  earningsChartOptions!: Highcharts.Options;
  smaChartOptions!: Highcharts.Options;

  priceChartAvailable: boolean = false;
  smaChartAvailable: boolean = false;
  recommendationChartAvailable: boolean = false;
  earningsChartAvailable: boolean = false;


  constructor( 
    private dataService: DataService,
    private cacheService: CacheService,
    private route: ActivatedRoute,
    private matDialog: MatDialog
  ) {}


  refetch(tickerSymbol: string): void {
    this.dataService.getSummaryData(tickerSymbol).then((stockData: Data ) => {
      this.stockData = stockData;
    })
  }

  ngOnInit(): void {
    
    this.route.paramMap
    .subscribe((params: ParamMap)=>{ 
      this.tickerSymbol = params.get('tickerSymbol') ?? '';

      if (this.tickerSymbol!=='') {     
        this.loadData(this.tickerSymbol);

        let cycle = 0;
        this.refreshDataSubscription?.unsubscribe();
        this.refreshDataSubscription = interval(15000).subscribe(() => {
          console.log("Refetch Cycle: ", cycle, this.tickerSymbol);
          this.dataService.getLiveData(this.tickerSymbol).then((liveData: Data) => {
              this.liveData = liveData;
              this.checkMarketStatus(this.liveData["quote"]?.unix_t, this.liveData["quote"]?.t);

              console.log("Market Status: ", this.marketStatusFlag);
              if (this.marketStatusFlag==="open") {
                console.log(`Refreshing data.`);           
                this.trackPriceChanges(this.liveData['quote'].d); 
                // this.drawPriceChart(this.liveData);
                // this.priceChartOptions.series[0]?.color='red';
              } else {
                console.log(`No need to refresh data.`);
              } 

              this.cacheService.liveData = this.liveData;
            
            });

            cycle+=1;

        });  
        
        
      }
    });

  };


  loadData(tickerSymbol: string): void {

    if(this.cacheService.tickerSymbol===tickerSymbol){
      console.log('Fetching data from cache');

      this.stockData = this.cacheService.stockData;
      this.tickerSymbol = this.stockData['profile'].ticker;
      this.companyName = this.stockData['profile'].name;
      this.noDataAlert = (Object.keys(this.stockData['profile']).length>0?false:true);
      
      this.liveData = this.cacheService.liveData;
      if (Object.keys(this.liveData['charts']).length===0) {
        this.priceChartAvailable = false;
        console.log("Received no data from polygon for Price", this.priceChartAvailable);
      } else {
        this.priceChartAvailable = true;
        console.log("Received data from polygon for Price", this.priceChartAvailable);
        this.drawPriceChart(this.liveData, tickerSymbol);
      }
      this.trackPriceChanges(this.liveData['quote'].d);     
      this.checkMarketStatus(this.liveData["quote"]?.unix_t, this.liveData["quote"]?.t);
    
      this.initialDb = this.cacheService.initialDb;
      if (this.initialDb['watchlist'].status) {
        this.starIconColor = "yellow";
        this.starIconType = "bi bi-star-fill";
      } else {
        this.starIconColor = "black";
        this.starIconType = "bi bi-star"
      }

      
      this.dataService.getInitialState(tickerSymbol).then((initialDb: Data ) => {
        this.initialDb = initialDb;
        if (this.initialDb['watchlist'].status) {
          this.starIconColor = "yellow";
          this.starIconType = "bi bi-star-fill";
        } else {
          this.starIconColor = "black";
          this.starIconType = "bi bi-star"
        }
        this.stockQuantity = this.initialDb['portfolio'].quantity;
  
        this.cacheService.initialDb = this.initialDb;
  
      });

      this.insightsData = this.cacheService.insightsData;

      if (Object.keys(this.insightsData['recommendation']).length===0) {
        this.recommendationChartAvailable = false;
        console.log("Received no data from polygon for Price", this.recommendationChartAvailable);
      } else {
        this.recommendationChartAvailable = true;
        console.log("Received data from polygon for Price", this.recommendationChartAvailable);
        this.drawRecommendationChart(this.insightsData);
      }

      if (Object.keys(this.insightsData['earnings']).length===0) {
        this.earningsChartAvailable = false;
        console.log("Received no data for Earnings", this.earningsChartAvailable);
      } else {
        this.earningsChartAvailable = true;
        console.log("Received data for Earnings", this.earningsChartAvailable);
        this.drawEarningsChart(this.insightsData);
      }

      this.newsData = this.cacheService.newsData;

      this.smaData = this.cacheService.smaData;
      if (Object.keys(this.smaData).length===0) {
        this.smaChartAvailable = false;
        console.log("Received no data from polygon for SMA", this.smaChartAvailable);
      } else {
        this.smaChartAvailable = true;
        console.log("Received data from polygon for SMA", this.smaChartAvailable);
        this.drawSMAChart(this.smaData, tickerSymbol);
      }

    } else {
    this.spinnerFlag = true;
    console.log("Spinner Running: ", this.spinnerFlag);
    console.log('Data not found in cache. Fetching from APIs.');

    this.dataService.getSummaryData(tickerSymbol).then((stockData: Data ) => {
      this.stockData = stockData;
      this.tickerSymbol = this.stockData['profile'].ticker;
      this.companyName = this.stockData['profile'].name;
      this.noDataAlert = (Object.keys(this.stockData['profile']).length>0?false:true);
  
      this.cacheService.stockData = this.stockData;
      this.cacheService.tickerSymbol = this.tickerSymbol;
      this.companyName = this.companyName;

      this.spinnerFlag = false;
      console.log("Spinner Stopped: ", this.spinnerFlag);

    });

    this.dataService.getLiveData(tickerSymbol).then((liveData: Data) => {
      this.liveData = liveData;
      if (Object.keys(this.liveData['charts']).length===0) {
        this.priceChartAvailable = false;
        console.log("Received no data from polygon for Price", this.priceChartAvailable);
      } else {
        this.priceChartAvailable = true;
        console.log("Received data from polygon for Price", this.priceChartAvailable);
        this.drawPriceChart(this.liveData, tickerSymbol);
      }

      this.trackPriceChanges(this.liveData['quote'].d);     
      this.checkMarketStatus(this.liveData["quote"]?.unix_t, this.liveData["quote"]?.t);

      this.cacheService.liveData = this.liveData;
    });

    this.dataService.getInitialState(tickerSymbol).then((initialDb: Data ) => {
      this.initialDb = initialDb;
      if (this.initialDb['watchlist'].status) {
        this.starIconColor = "yellow";
        this.starIconType = "bi bi-star-fill";
      } else {
        this.starIconColor = "black";
        this.starIconType = "bi bi-star"
      }
      this.stockQuantity = this.initialDb['portfolio'].quantity;

      this.cacheService.initialDb = this.initialDb;

    });

    this.dataService.getInsights(tickerSymbol).then((insightsData: Data ) => {
      this.insightsData = insightsData;
      if (Object.keys(this.insightsData['recommendation']).length===0) {
        this.recommendationChartAvailable = false;
        console.log("Received no data for Recommendations", this.recommendationChartAvailable);
      } else {
        this.recommendationChartAvailable = true;
        console.log("Received data for Recommendations", this.recommendationChartAvailable);
        this.drawRecommendationChart(this.insightsData);
      }
      if (Object.keys(this.insightsData['earnings']).length===0) {
        this.earningsChartAvailable = false;
        console.log("Received no data for Earnings", this.earningsChartAvailable);
      } else {
        this.earningsChartAvailable = true;
        console.log("Received data for Earnings", this.earningsChartAvailable);
        this.drawEarningsChart(this.insightsData);
      }

      this.cacheService.insightsData = this.insightsData;
    });

    this.dataService.getNews(tickerSymbol).then((newsData: Data[] ) => {
      this.newsData = newsData;

      this.cacheService.newsData = this.newsData;
    });

    this.dataService.getSMAData(tickerSymbol).then((smaData: Data ) => {
      this.smaData = smaData;
      if (Object.keys(this.smaData).length===0) {
        this.smaChartAvailable = false;
        console.log("Received no data from polygon for SMA", this.smaChartAvailable);
      } else {
        this.smaChartAvailable = true;
        console.log("Received data from polygon for SMA", this.smaChartAvailable);
        this.drawSMAChart(this.smaData, tickerSymbol);
      }

      this.cacheService.smaData = this.smaData;
    });

    }

  }

  drawPriceChart(stockData: Data, ticker: string): void {
    this.priceChartOptions= {
      chart: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)'
      },
      accessibility: {
        enabled: false
      },
      legend: {
        enabled: false
      },
      plotOptions: {
        line: {
        marker: {
          enabled: false
        }
      }
    },
      title:
      {
        text: `${ticker} Hourly Price Variation`
      },

      xAxis: {
        type: 'datetime'
      },

      yAxis: {
        labels: {
          align: 'left',
        },
        title: {
              text: ''
          },
          opposite: true,
          lineWidth: 0,
          resize: {
            enabled: false
          }
        },
      tooltip: {
        split: true
      },
      series: [
          {
            type: 'line',
            name: `${this.tickerSymbol}`,
            data: stockData["charts"],
            yAxis: 0,
            threshold: null,
            tooltip: {
                valueDecimals: 2
            },
            color: stockData['quote'].d>0?'green':'red'
          }
        ],
      };
  };

  drawRecommendationChart(insightsData: Data): void {
    this.recommendationChartOptions = {

      accessibility: {
          enabled: false
      },
      chart: {
          type: 'column',
          backgroundColor: 'rgba(0, 0, 0, 0.05)'
      },
  
      yAxis: {
          title: {
              text: '#Analysis'
          },
          stackLabels: {
              enabled: false
          },
          opposite: false,
          lineWidth: 0,
          resize: {
              enabled: false
          }
      },
      title: {
          text: 'Recommendation Trends',
          align: 'center'
      },
      // tooltip: {
      //     headerFormat: '<b>{point.x}</b><br/>',
      //     pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}',
      //     split: true
      // },
  
  
  
      plotOptions: {
          column: {
              stacking: 'normal',
              dataLabels: {
                  enabled: true
              }
          }
      },
  
  
      xAxis: {
          categories: insightsData['recommendation'].xAxis
      },

  
      series: [{
          name: 'Strong Buy',
          data: insightsData['recommendation'].yAxis.strongBuy,
          type:'column',
          color: '#008000'
      }, {
          name: 'Buy',
          data: insightsData['recommendation'].yAxis.buy,
          type:'column',
          color: '#04af70'
      }, {
          name: 'Hold',
          data: insightsData['recommendation'].yAxis.hold,
          type:'column',
          color: '#a68004'
      },
      {
        name: 'Sell',
        data: insightsData['recommendation'].yAxis.sell,
        type:'column',
        color: '#f28500'
    },
    {
      name: 'Strong Sell',
      data: insightsData['recommendation'].yAxis.strongSell,
      type:'column',
      color: '#800080'
  }] 
  
  };
  
  };
 
  drawEarningsChart(insightsData: Data): void {
    this.earningsChartOptions = {
        chart: {
            type: 'spline',
            backgroundColor: 'rgba(0, 0, 0, 0.05)'
        },
        accessibility: {
            enabled: false
        },
        title: {
            text: 'Historical EPS Suprises',
            align: 'center'
        },

        xAxis: {
          crosshair: true,
          categories: insightsData["earnings"].xAxis,
        },
        yAxis: {
            title: {
                text: 'Quarterly EPS'
            },
            opposite: false,
            lineWidth: 0,
            resize: {
                enabled: false
            }
        },
        tooltip: {
            shared: true
        },
        plotOptions: {
            spline: {
                marker: {
                    radius: 3
                }
            }
        },
        series: [{
            type: 'spline',
            name: 'Actual',
            marker: {
                symbol: 'circle'
            },
            data: insightsData["earnings"].yAxis.actual

        }, {
          type: 'spline',
          name: 'Estimate',
            marker: {
                symbol: 'diamond'
            },
            data: insightsData["earnings"].yAxis.estimate
        }]
    }
  };

  drawSMAChart(smaData: Data, ticker: string): void {
    this.smaChartOptions = {
        accessibility: {
            enabled: false
        },

        legend: {
          enabled: false
        },

        exporting: {
            enabled: true
        },

        rangeSelector: {
          enabled: true,
          inputEnabled: true,
          allButtonsEnabled: true,
          selected: 2,
          buttons: [
            {
              type: 'month',
              count: 1,
              text: '1m',
              title: 'View 1 month'
          }, {
              type: 'month',
              count: 3,
              text: '3m',
              title: 'View 3 months'
          }, {
              type: 'month',
              count: 6,
              text: '6m',
              title: 'View 6 months'
          }, {
              type: 'ytd',
              text: 'YTD',
              title: 'View year to date'
          }, {
              type: 'year',
              count: 1,
              text: '1y',
              title: 'View 1 year'
          }, {
              type: 'all',
              text: 'All',
              title: 'View all'
          }
          ]
        },

        title: {
            text: `${ticker} Historical`
        },

        subtitle: {
            text: 'With SMA and Volume by Price technical indicators'
        },

        navigator: {
            enabled: true
            // series: {
            //     accessibility: {
            //         exposeAsGroupOnly: true
            //     }
            // }
        },

        xAxis: {
          type: 'datetime'
        },

        yAxis: [{
            opposite: true,
            startOnTick: false,
            endOnTick: false,
            labels: {
                align: 'right',
                x: -3
            },
            title: {
                text: 'OHLC'
            },
            height: '60%',
            lineWidth: 2,
            resize: {
                enabled: true
            }
        }, {
            opposite: true,
            labels: {
                align: 'right',
                x: -3
            },
            title: {
                text: 'Volume'
            },
            top: '65%',
            height: '35%',
            offset: 0,
            lineWidth: 2
        }],

        tooltip: {
            split: true
        },

        plotOptions: {
            series: {
                dataGrouping: {
                    units: [[
                        'week',                         // unit name
                        [2]                             // allowed multiples
                    ], [
                        'month',
                        [1, 2, 3, 4, 6]
                    ]]
                }
            }
        },

        series: [{
            type: 'candlestick',
            name: ticker,
            id: ticker,
            zIndex: 2,
            data: smaData['ohlc']
        }, {
            type: 'column',
            name: 'Volume',
            id: 'volume',
            data: smaData['volume'],
            yAxis: 1
        }, {
            type: 'vbp',
            linkedTo: ticker,
            params: {
                volumeSeriesID: 'volume'
            },
            dataLabels: {
                enabled: false
            },
            zoneLines: {
                enabled: false
            }
        }, {
            type: 'sma',
            linkedTo: ticker,
            zIndex: 1,
            marker: {
                enabled: false
            }
        }]
    }
  }

  watchlist(): void {
    console.log('watchlisting clicked: ', this.tickerSymbol, this.companyName);
    this.dataService.updateWatchlist(this.tickerSymbol, this.companyName).then((watchlistStatus: Data ) => {
      let alertClass;
      if(watchlistStatus['status']==='added to') {
        this.starIconType = "bi bi-star-fill";
        this.starIconColor = "yellow";
        alertClass = "alert-success";
  
      } else {
        alertClass = "alert-danger";
        this.starIconType = "bi bi-star";
        this.starIconColor = "black";
      }
      this.alertClasses[0] = alertClass;
      this.alertMessage = `${this.tickerSymbol} ${watchlistStatus['status']} watchlist`;
      setTimeout(() => { this.alertPop=false; this.alertMessage=''}, 2000);
      this.alertPop = true;
  });
  }

  checkMarketStatus(unixTime: number, formattedTime: String): string {

    this.marketStatusFlag = (new Date().getTime()-(unixTime*1000))/(1000)>240 ? "closed":"open";

    if (this.marketStatusFlag === "open") {
      this.marketStatusColor = "green";
      this.marketStatus = `Market is ${this.marketStatusFlag}`;
    } else {
      this.marketStatusColor = "red";
      this.marketStatus = `Market ${this.marketStatusFlag} on ${formattedTime.split(' ')[0]} 13:00:00`;
      // this.marketStatus = `Market ${this.marketStatusFlag} on ${formattedTime}`;
    }

    console.log(`${this.marketStatus}: `, (new Date().getTime()-(unixTime*1000))/(1000));

    return status
  }

  trackPriceChanges(priceChange: number): void {
    if (priceChange>0) {
      this.caretType = "bi bi-caret-up-fill";
      this.caretColor = "green";
    } else if(priceChange<0) {
      this.caretType = "bi bi-caret-down-fill"
      this.caretColor = "red"
    } else {
      this.caretType = ""
      this.caretColor = "black"
    }
  }

  openTransactionModal(transactionType: string) {
    const dialogRef = this.matDialog.open(
      TransactionModalComponent,
      {
        width: '500px',
        position: {
          top: "2%"
        },
        data: {
          stockData: {
            action: transactionType,
            currentPrice: this.liveData['quote'].c,
            quantity: this.stockQuantity,
            tickerSymbol: this.stockData['profile'].ticker,
            name: this.stockData['profile'].name
          }
        }
      }
    );

    dialogRef.afterClosed().subscribe(async (dialogData) => {
      if(Object.keys(dialogData).length!==0) {
        let alertClass;
        console.log("rechecking portfolio after modal close", dialogData);
        if(dialogData.action=="Buy") {
          alertClass = "alert-success";
          this.alertMessage = `${dialogData.data['tickerSymbol']} bought successfully.`;
        } else {
          alertClass = "alert-danger";
          this.alertMessage = `${dialogData.data['tickerSymbol']} sold successfully.`;
        }
        this.stockQuantity=dialogData.data.quantity;
        this.alertClasses[0] = alertClass;
        this.alertPop = true;
        setTimeout(() => { this.alertPop=false; this.alertMessage=''}, 2000);  
      }

    })
  }

  ngOnDestroy() {
    this.refreshDataSubscription?.unsubscribe();
  }
     
}