import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioCardComponent } from './portfolio-card/portfolio-card.component';
import { Data } from '../data';
import { DataService } from '../data.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [
    CommonModule,
    PortfolioCardComponent,
    MatProgressSpinner,
    FooterComponent
  ],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.css'
})
export class PortfolioComponent {

  portfolioStocks!: Data;
  dataService: DataService = inject(DataService);
  portfolioAlert: boolean = true;
  spinnerFlag: boolean = true;
  balance: number = 0; 
  public alertMessage: string = '';
  public alertClasses: string[] = ["alert-success", "alert", "alert-dismissible", "text-center", "my-3"];
  public alertPop: boolean = false;



  constructor() {
    this.loadPortfolio();
  }


  loadPortfolio() {
    this.dataService.getWalletBalance().then((wallet: Data) => {
      this.balance = wallet['balance'];
    });

    this.dataService.getPortfolioData().then((portfolioStocks: Data) => {
      this.portfolioStocks = portfolioStocks;
      this.portfolioStocks['stocks'].length>0? this.portfolioAlert=false: this.portfolioAlert=true;
      this.spinnerFlag = false;
    });


  }

  
  refreshPortfolio(data: Data) {
    console.log("Updating Portfolio:", data);
    // this.watchlistedStocks.filter((arrayItem) => arrayItem['ticker']===tickerSymbol);
    this.loadPortfolio();
    
    let alertClass;
    if(data['action']=="Buy") {
      alertClass = "alert-success";
      this.alertMessage = `${data['ticker']} bought successfully.`;
    } else {
      alertClass = "alert-danger";
      this.alertMessage = `${data['ticker']} sold successfully.`;
    }
    this.alertClasses[0] = alertClass;
    this.alertPop = true;
    setTimeout(() => { this.alertPop=false; this.alertMessage=''}, 2000);  

  }

}
