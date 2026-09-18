import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';

import { PreferencesService, SidebarPreference } from '../services/preferences.service';

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [CommonModule, DragDropModule, MatButtonModule, MatCheckboxModule, MatIconModule],
  templateUrl: './preferences.component.html',
  styleUrl: './preferences.component.scss'
})
export class PreferencesComponent {
  preferences: SidebarPreference[] = [];

  constructor(private preferencesService: PreferencesService) {
    this.preferences = preferencesService.preferences;
  }

  onVisibilityChange(item: SidebarPreference, visible: boolean): void {
    this.preferencesService.setVisible(item.id, visible);
    this.preferences = this.preferencesService.preferences;
  }

  drop(event: CdkDragDrop<SidebarPreference[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    this.preferencesService.move(event.previousIndex, event.currentIndex);
    this.preferences = this.preferencesService.preferences;
  }

  reset(): void {
    this.preferencesService.reset();
    this.preferences = this.preferencesService.preferences;
  }
}
