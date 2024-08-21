import { Component, inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Data } from '../../../../data';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [
    MatDialogModule
  ],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css'
})

export class ModalComponent {

  dialogData: any = inject(MAT_DIALOG_DATA);
  newsCardData: Data = this.dialogData.newsCardData;

}
