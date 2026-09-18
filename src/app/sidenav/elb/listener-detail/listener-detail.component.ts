import { Component, Inject } from '@angular/core';


import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { Certificate, Listener } from '@aws-sdk/client-elastic-load-balancing-v2';
import { ElbService } from '../../../services/aws/elb.service';

@Component({
  selector: 'app-listener-detail',
  imports: [MatDialogModule],
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
