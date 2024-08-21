import { Component } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { CacheService } from './cache.service';
import { FooterComponent } from './footer/footer.component';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule,
    FooterComponent,
    CommonModule
  ],
  templateUrl: './app.component.html',
  styles: `
    .navbar-nav .nav-item .activeCustom {
      border: 2px solid white;
      border-radius: 15px;
    }
  `
})
export class AppComponent {
  title = 'ticker-app';
  activeTab: string = "home";

  constructor(
    private router: Router, 
    private cacheService: CacheService
  ) {}

  onClick(action: string) {
    this.activeTab = action;
    if (action==='home') {
      if (this.cacheService.tickerSymbol) {
        this.router.navigate(['/search', this.cacheService.tickerSymbol]);
      } else {
        this.router.navigate(['/search/home']);
      }
    } else {
      this.router.navigate([action]); 
    }

  }
}
