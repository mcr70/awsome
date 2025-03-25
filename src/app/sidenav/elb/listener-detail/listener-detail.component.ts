import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { Certificate, Listener } from '@aws-sdk/client-elastic-load-balancing-v2';
import { ElbService } from '../../../services/elb.service';

@Component({
  selector: 'app-listener-detail',
  imports: [ CommonModule, MatDialogModule ],
  templateUrl: './listener-detail.component.html',
  styleUrl: './listener-detail.component.scss'
})
export class ListenerDetailComponent {
  constructor(
    public dialogRef: MatDialogRef<ListenerDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { listener: Listener, certificates: Certificate[] }
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
  }
}
