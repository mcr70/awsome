import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';

import { TaskDefinition } from '@aws-sdk/client-ecs';

@Component({
  selector: 'app-tastdef-detail',
  imports: [ MatDialogModule, MatTabsModule, CommonModule, MatExpansionModule, MatFormFieldModule, MatIconModule, MatRippleModule ],
  templateUrl: './tastdef-detail.component.html',
  styleUrl: './tastdef-detail.component.scss'
})
export class TaskdefDetailComponent {
  constructor(
    public dialogRef: MatDialogRef<TaskdefDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { taskdef: TaskDefinition }
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
  }

  copyToClipboard($event: MouseEvent) {
    $event.stopPropagation();
    
    const textToCopy = document.querySelector('pre')?.textContent;
    if (textToCopy) {
      // copy to clipboard
      navigator.clipboard.writeText(textToCopy).then(
        () => console.log('Sisältö kopioitu leikepöydälle'),
        (err) => console.error('Kopiointi epäonnistui', err)
      );
    }
  }
    
}
