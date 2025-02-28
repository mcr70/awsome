import { Component, Inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { DatePipe } from '@angular/common';

import { Service } from '@aws-sdk/client-ecs';


@Component({
  selector: 'app-service-dialog',
  templateUrl: './service-detail.component.html',
  styleUrls: ['./service-detail.component.scss'],
  imports: [ MatDialogModule, MatTableModule, MatTabsModule ],
  providers: [ DatePipe ]
})
export class ServiceDetailComponent {
  generalData: any;
  deploymentsData: any;
  eventsData: any;

  constructor(
    public dialogRef: MatDialogRef<ServiceDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { service: Service },
    private datePipe: DatePipe
  ) {}

    
  ngOnInit(): void {
    const service = this.data.service;
    if (service) {
      const securityGroups = Array.isArray(service.networkConfiguration?.awsvpcConfiguration?.securityGroups)
        ? service.networkConfiguration.awsvpcConfiguration.securityGroups.join(', ') 
        : 'N/A'; 

        // General data
      this.generalData = [
        { key: 'Status', value: service.status },
        { key: 'Created At', value: this.datePipe.transform(service.createdAt, 'short') },
        { key: 'Security Groups', value: securityGroups },
      ];
      
      // Deployments data
      if (service.deployments) {

        this.deploymentsData = service.deployments.map((deployment: any) => ({
          createdAt: this.datePipe.transform(deployment.createdAt, 'short'),

          rolloutState: deployment.rolloutState
        }));
      }
      
      // Events data
      if (service.events) {
        this.eventsData = service.events.map((event: any) => ({
          createdAt: this.datePipe.transform(event.createdAt, 'short'),
          message: event.message
        }));
      }
    }
  }
  
  closeDialog(): void {
    this.dialogRef.close();
  }
}
