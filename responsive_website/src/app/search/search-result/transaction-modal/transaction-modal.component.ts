import { Component, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Data } from '../../../data';
import { DataService } from '../../../data.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-transaction-modal',
  standalone: true,
  imports: [
    MatDialogModule,
    FormsModule,
    CommonModule,
    ReactiveFormsModule

  ],
  templateUrl: './transaction-modal.component.html',
  styleUrl: './transaction-modal.component.css'
})


export class TransactionModalComponent {

  // @Output() refreshDbInital = new EventEmitter<string>();

  quantity = new FormControl();
  dialogData: any = inject(MAT_DIALOG_DATA);
  stockData: Data = this.dialogData.stockData;
  dataService: DataService = inject(DataService);

  constructor(
    public dialogRef: MatDialogRef<TransactionModalComponent>
  ) {
    this.dataService.getWalletBalance().then((walletBalance: Data)=> {
      this.stockData['balance'] = walletBalance['balance'];
    })
    
  }

  async onExecute() {
    const portfolioEntry = {
      action: this.stockData["action"],
      tickerSymbol: this.stockData["tickerSymbol"],
      name: this.stockData["name"],
      quantity: this.quantity.value,
      totalCost: this.quantity.value * this.stockData["currentPrice"]
    }
    let portfolioData;
    portfolioData = await this.dataService.updatePortfolio(portfolioEntry);
    // this.dataService.updatePortfolio(portfolioEntry).then((portfolioResponse: Data) => {
    //   // this.refreshDbInital.emit();
    //   portfolioData = portfolioResponse;
    //   let flag=true;
    //   console.log("$$$$$", flag)

    // })
    this.dialogRef.close({action:this.stockData["action"], data:portfolioData});
  }


}
