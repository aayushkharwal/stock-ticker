import { Component } from '@angular/core';
import { SearchBarComponent } from './search-bar/search-bar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    SearchBarComponent,
    FooterComponent
  ],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})


export class SearchComponent {

}
