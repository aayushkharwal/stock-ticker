import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WatchlistCardComponent } from './watchlist-card/watchlist-card.component';
import { Data } from '../data';
import { DataService } from '../data.service';
import { RouterModule } from '@angular/router';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [
    CommonModule,
    WatchlistCardComponent,
    RouterModule,
    MatProgressSpinner,
    FooterComponent
  ],
  templateUrl: './watchlist.component.html',
  styles: ''
})
export class WatchlistComponent {

  watchlistedStocks: Data[] = [];
  dataService: DataService = inject(DataService);
  watchlistAlert: boolean = true;
  spinnerFlag: boolean = true;


  constructor() {
    this.loadWatchlist();
  }


  loadWatchlist() {
    this.dataService.getWatchlistData().then((watchlistedStocks: Data[]) => {
      this.watchlistedStocks = watchlistedStocks;
      this.watchlistedStocks.length>0? this.watchlistAlert=false: this.watchlistAlert=true;
      this.spinnerFlag = false;
    });
  }

  refreshWatchlistedStocks(tickerSymbol: string) {
    console.log("removing stock from watchlist:", tickerSymbol);
    // this.watchlistedStocks.filter((arrayItem) => arrayItem['ticker']===tickerSymbol);
    this.loadWatchlist();
  }

}
