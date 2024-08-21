import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  template: `
  <footer class="bg-body-tertiary text-center">
    <div class="text-center p-3" style="background-color: rgba(0, 0, 0, 0.05);">
      Powered by <a class="text-body" href="https://finnhub.io">Finnhub.io</a>
    </div>
  </footer>
  `,
  styles: ``
})
export class FooterComponent {

}
