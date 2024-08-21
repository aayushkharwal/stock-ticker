import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, tap } from 'rxjs/operators';
import { DataService } from '../../data.service';
import { CacheService } from '../../cache.service';
import { AutoCompleteData } from '../../auto-complete-data';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { Data } from '../../data';
import { FooterComponent } from '../../footer/footer.component';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet,
    RouterModule,
    MatAutocompleteModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    FooterComponent
  ],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.css'
})
export class SearchBarComponent implements OnInit {

  @Input() ticker!: String;

  alertMessage: String = '';
  isLoading: Boolean = false;
  alertDisplay: Boolean = false;
  control = new FormControl();
  processedOptions!: Observable<Data[]>;
  
  constructor(
    private dataService: DataService,
    private cacheService: CacheService,
    private router: Router
    ){ }

  ngOnInit() {
    this.control.setValue(this.ticker);
    this.processedOptions = this.control.valueChanges.pipe(
      debounceTime(100),
      distinctUntilChanged(),
      tap(() => {
          this.isLoading = true
      }),
      filter((value) => value!=''),
      // map(value => this.getData(value)),
      switchMap((value) => this.dataService.getAutocompleteResults(value!)),
      tap(() => {
        this.isLoading = false
      }),
    );
    
  }

  options: AutoCompleteData[] = [];

  private getData(value: string): string[] {
    let return_data: string[] = [];
    this.dataService.getAutocompleteResults(value).then((options: AutoCompleteData[]) => {
      this.options = options;
      
    for (let i=0; i< this.options.length; i++){
      return_data.push(`${this.options[i]['symbol']} | ${this.options[i]['description']}`);
      }
    })

    this.isLoading = false;
    return return_data;
  }

  autoCompleteSelected(event: MatAutocompleteSelectedEvent) {
    if(this.control.value && this.control.value!='') {
      this.router.navigate(['/search/', event.option.value])
    }
  }

  onClear(): void {
    this.control.setValue('');
    this.cacheService.clearCache();
    this.router.navigate(['/search/home']);
  }

  onSubmit(): void {
    if (this.control.value) {
      this.router.navigate(['/search/', this.control.value]);
    }
    else if (this.control.value==='' || !(this.ticker)) {
      this.alertMessage = "Please enter a valid ticker."
      this.alertDisplay = true;
      setTimeout(() => { this.alertDisplay=false; this.alertMessage=''}, 2000);

    }
  }


}
