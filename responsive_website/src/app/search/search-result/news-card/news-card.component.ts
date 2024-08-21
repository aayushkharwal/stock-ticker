import { Component, Input } from '@angular/core';
import { Data } from '../../../data';
import { ModalComponent } from './modal/modal.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';


@Component({
  selector: 'app-news-card',
  standalone: true,
  imports: [
    
  ],
  templateUrl: './news-card.component.html',
  styleUrl: './news-card.component.css'
})
export class NewsCardComponent {

  @Input() newsCardData!: Data;

  constructor(private matDialog: MatDialog) {}

  openModal() {
    const dialogConfig = new MatDialogConfig();  

    const dialogRef = this.matDialog.open(
      ModalComponent,
      {
        width: '500px',
        position: {
          top: "2%"
        },
        data: {
          newsCardData: this.newsCardData
        }
      }

      
    );
  }

}
