import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';

import { Cluster } from '@aws-sdk/client-ecs';


@Component({
  selector: 'app-cluster-details',
  templateUrl: './cluster-detail.component.html',
  styleUrls: ['./cluster-detail.component.scss'],
  imports: [MatDialogModule, CommonModule]
})
export class ClusterDetailComponent {
  constructor(
    public dialogRef: MatDialogRef<ClusterDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { cluster: Cluster }
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
  }
}
