import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Data } from '../../data';
import { DataService } from '../../data.service';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-watchlist-card',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    RouterModule
  ],
  templateUrl: './watchlist-card.component.html',
  styles: ''
})
export class WatchlistCardComponent {

  public caretType!: string;
  public caretColor!: string;
  
  dataService: DataService = inject(DataService);

  @Input() watchlistedStock!: Data;
  @Output() refreshWatchlistedStocks = new EventEmitter<string>();

  removeStock() {
    console.log('watchlisting clicked: ', this.watchlistedStock['ticker'], this.watchlistedStock['name']);
    this.dataService.updateWatchlist(this.watchlistedStock['ticker'], this.watchlistedStock['name']).then((watchlistStatus: Data ) => {
      // location.reload();
      this.refreshWatchlistedStocks.emit(this.watchlistedStock['ticker']);
    });
  }

}
