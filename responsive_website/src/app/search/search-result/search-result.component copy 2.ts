import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { SearchComponent } from '../search.component';
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
HC_stock(Highcharts);
// HC_exporting(Highcharts); 
indicators(Highcharts);
vbpa(Highcharts);


@Component({
  selector: 'app-search-result',
  standalone: true,
  imports: [
    SearchComponent,
    MatTabsModule,
    CommonModule,
    RouterModule,
    HighchartsChartModule,
    NewsCardComponent,
    MatGridListModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './search-result.component.html',
  styleUrl: './search-result.component.css'
})
export class SearchResultComponent implements OnInit, OnDestroy{

  public searchTicker: string = this.route.snapshot.params['tickerSymbol'];
  public tickerSymbol!: string;
  public companyName!: string;
  public starIconType!: string;
  public starIconColor!: string;
  public alertMessage: string = '';
  public alertClasses: string[] = ["alert-success", "alert", "alert-dismissible", "text-center"];
  public alertPop: boolean = false;
  public caretType!: string;
  public caretColor!: string;
  public marketStatusColor!: string;
  public marketStatus!: string;
  public stockQuantity!: number;
  public noDataAlert: boolean = false;
  public invalidTicker!: boolean;
  public spinnerFlag: boolean = true;

  stockData: Data = {};
  insightsData: Data = {};
  newsData: Data[] = [];
  smaData: Data = {};
  initialDb: Data = {}

  Highcharts: typeof Highcharts=Highcharts;
  priceChartOptions!: Highcharts.Options;
  recommendationChartOptions!: Highcharts.Options;
  earningsChartOptions!: Highcharts.Options;
  smaChartOptions!: Highcharts.Options;

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
      const tickerSymbol = params.get('tickerSymbol') ?? '';

      if (tickerSymbol!=='') {     

        const marketStatus = true;// await this.dataService.getMarketStatus(ticker);


        this.dataService.getSummaryData(tickerSymbol).then((stockData: Data ) => {
          this.stockData = stockData;
          this.noDataAlert = (Object.keys(this.stockData['profile']).length>0?false:true);
          this.tickerSymbol = this.stockData['profile'].ticker;
          this.companyName = this.stockData['profile'].name;
          
          this.drawPriceChart(this.stockData);
          this.checkMarketStatus(this.stockData);
          this.trackPriceChanges(this.stockData['quote'].d);
  
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

          });

          this.dataService.getInsights(tickerSymbol).then((insightsData: Data ) => {
            this.insightsData = insightsData;
            this.drawRecommendationChart(this.insightsData);
            this.drawEarningsChart(this.insightsData);
          });
      
          this.dataService.getNews(tickerSymbol).then((newsData: Data[] ) => {
            this.newsData = newsData;
          });

          this.dataService.getSMAData(tickerSymbol).then((smaData: Data ) => {
            this.smaData = smaData;
            this.drawSMAChart(this.smaData);
          });

          this.spinnerFlag = false;

        });

      }
    });

  };


  loadData(ticker: string): void {

  }

  drawPriceChart(stockData: Data): void {
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
        text: `${stockData["profile"].ticker} Hourly Price Variation`
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
            name: `${stockData["profile"].ticker}`,
            data: stockData["charts"],
            yAxis: 0,
            threshold: null,
            tooltip: {
                valueDecimals: 2
            },
            color: this.stockData['quote'].d>0?'green':'red'
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
              text: 'Analysis'
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

  drawSMAChart(smaData: Data): void {
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
            text: `${this.tickerSymbol} Historical`
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
            name: this.tickerSymbol,
            id: this.tickerSymbol,
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
            linkedTo: this.tickerSymbol,
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
            linkedTo: this.tickerSymbol,
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

  checkMarketStatus(stockData: Data): void {

    const status = ((new Date().getTime()-stockData["quote"]?.unix_t)/(1000*60*60))>300 ? "closed":"open";

    console.log(status, (new Date().getTime()-stockData["quote"]?.unix_t)/(1000*60*60));
    if (status === "open") {
      this.marketStatusColor = "green";
      this.marketStatus = `Market is ${status}`;
    } else {
      this.marketStatusColor = "red";
      this.marketStatus = `Market ${status} on ${stockData["quote"]?.t.split(' ')[0]} 13:00:00`;
    }
  }

  trackPriceChanges(priceChange: number): void {
    if (priceChange>0) {
      this.caretType = "bi bi-caret-up-fill";
      this.caretColor = "green";
    } else {
      this.caretType = "bi bi-caret-down-fill"
      this.caretColor = "red"
    }
  }

  openTransactionModal(transactionType: string) {
    const dialogRef = this.matDialog.open(
      TransactionModalComponent,
      {
        width: '40%',
        height: '50%',
        data: {
          stockData: {
            action: transactionType,
            currentPrice: this.stockData['quote'].c,
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
    // this.fetchMarketData?.unsubscribe(); // Unsubscribe to prevent memory leaks
  }
     
}