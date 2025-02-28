import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

import { RouterOutlet } from '@angular/router';
import { SidenavRoutingModule } from './sitenav-routing.module';

/** @title Sidenav with configurable mode */
@Component({
  selector: 'sidenav',
  templateUrl: 'sidenav.component.html',
  styleUrl: 'sidenav.component.scss',
  imports: [
    CommonModule, MatIconModule, MatListModule,
    MatSidenavModule, MatButtonModule, MatRadioModule, FormsModule, 
    ReactiveFormsModule,
    RouterOutlet, SidenavRoutingModule
  ],
})

export class SidenavComponent {
  @Input() isAuthenticated: boolean = false;
  isCollapsed = false;

  expandSidenav(): void {
    this.isCollapsed = false;
  }

  collapseSidenav(): void {
    this.isCollapsed = true;
  }
}