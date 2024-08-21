import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Data } from '../../data';
import { DataService } from '../../data.service';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { TransactionModalComponent } from '../../search/search-result/transaction-modal/transaction-modal.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-portfolio-card',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './portfolio-card.component.html',
  styleUrl: './portfolio-card.component.css'
})
export class PortfolioCardComponent {

  public caretType!: string;
  public caretColor!: string;
  
  dataService: DataService = inject(DataService);
  matDialog: MatDialog = inject(MatDialog);


  @Input() portfolioStock!: Data;
  @Output() refreshPortfolio = new EventEmitter<Data>();


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
            currentPrice: this.portfolioStock['c'],
            quantity: this.portfolioStock['quantity'],
            tickerSymbol: this.portfolioStock['tickerSymbol'],
            name: this.portfolioStock['name']
          }
        }
      }
    );

    dialogRef.afterClosed().subscribe(async (dialogData) => {
      if(Object.keys(dialogData).length!==0) {
        // this.portfolioStock['quantity']=dialogData.quantity ?? 0;
        // this.portfolioStock['totalCost']=dialogData.totalCost ?? 0;
        this.refreshPortfolio.emit({action: transactionType, ticker: dialogData.data.tickerSymbol});
      }

    })
  }
}
