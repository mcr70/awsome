import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';

import { Service } from '@aws-sdk/client-ecs';

import { ECSService } from '../../services/ecs.service';
import { CredentialService } from '../../services/credential.service';

import { ClusterDetailComponent } from './cluster-detail/cluster-detail.component';
import { TaskdefDetailComponent } from './tastdef-detail/tastdef-detail.component'
import { ServiceDetailComponent } from './service-detail/service-detail.component';
import { Subscription } from 'rxjs';
import { CommonSidenavComponent } from '../common.component';


@Component({
  selector: 'app-ecs',
  standalone: true,
  templateUrl: './ecs.component.html',
  styleUrls: ['./ecs.component.scss'],
  imports: [ CommonModule, MatExpansionModule, MatTableModule ]
})
export class EcsComponent extends CommonSidenavComponent implements OnInit, OnDestroy {
  private credentialsSubscription?: Subscription;

  readonly panelOpenState = signal<{ [clusterArn: string]: boolean }>({});
  clusters = signal<string[] | undefined>([]);
  services = signal<{ [clusterArn: string]: Service[] }>({});

  constructor(private ecs: ECSService, private credentialService: CredentialService,
    private dialog: MatDialog) {
    super();
  }


  async ngOnInit() {
    this.credentialsSubscription = this.credentialService.credentials$.subscribe(async (credentials) => {
        await this.listClusters();
    });
  }

  ngOnDestroy(): void { // Unsubscribe to prevenet memory leaks
    this.credentialsSubscription?.unsubscribe();
  }

  /**
   * A method that opens cluster-detail dialog
   * @param clusterArn 
   * @param $event 
   */
  async openClusterDetails(clusterArn: string, $event: MouseEvent) {
    $event.stopPropagation(); // Prevent mat-expansion-panel opening

    try {
      const cluster = await this.ecs.describeCluster(clusterArn); 

      this.dialog.open(ClusterDetailComponent, {
        width: '600px',
        data: { cluster }
      });
    }
    catch(error: unknown) {
      this.showErrorOnSnackBar(error);
    }
  }
    
  /**
   * A method that opens taskdef-detail dialog
   * @param taskdef
   * @param $event 
   */
  async openTaskdefDetails(taskdefArn: string, $event: MouseEvent) {
    $event.stopPropagation(); // Prevent mat-expansion-panel opening
    try {
      const taskdef = await this.ecs.describeTaskDefinition(taskdefArn); 

      this.dialog.open(TaskdefDetailComponent, {
        width: '600px',
        data: { taskdef }
      });
    }
    catch(error: unknown) {
      this.showErrorOnSnackBar(error)
    }
  }

  /**
   * A method that opens service-detail dialog
   * @param service
   * @param $event 
   */
  async openServiceDetails(clusterArn: string, serviceName: string, $event: MouseEvent) {
    $event.stopPropagation(); // Prevent mat-expansion-panel opening

    // Service is already fetched
    const service = this.services()?.[clusterArn]?.find(service => service.serviceName === serviceName);
  
    if (service) {
      this.dialog.open(ServiceDetailComponent, {
        width: '600px',
        data: { service }
      });
    }
    else {
      console.warn(`Could not find service ${serviceName} on ${clusterArn}. This was unexpected.`);
    }
  }

  /**
   * A method to be called from html code, when the exapnsion panel toggles
   * @param clusterArn Arn of the cluster that is opened or closed
   * @param opened true or false
   */
  expansionPanelState(clusterArn: string, opened: boolean) {
    if (opened) {
      this.fetchServices(clusterArn)
    }     
  }

  // Method to extract task definition name and version
  protected getTaskDefinitionName(taskDefinitionArn: string): string {
    const match = taskDefinitionArn.match(/task-definition\/([^:]+:\d+)/);
    return match ? match[1] : taskDefinitionArn;
  }

  // Called by html code to create unique index for expansion panel
  // byt default this is for loops index, but causes problems if 
  // the AWS account changes. Tracking changes with unique id prevents
  // these problems
  trackByCluster(index: number, cluster: string): string {
    return cluster;  // Cluster is unique
  }
  

  // ---------------------------------------------------------------

  /**
   * Get all the cluster and set this into cluster signal of the component.
   */
  private async listClusters() {
    try {
      const result = await this.ecs.listClusters(); 
      this.clusters.set(result);
    }
    catch(error: unknown) {
      this.showErrorOnSnackBar(error)
    }
  }

  /**
   * Fetch all the services for given cluster
   * @param clusterArn 
   */
  private async fetchServices(clusterArn: string) {
    try {
      const result: Service[] = await this.ecs.getServices(clusterArn);
      this.services.update(services => ({ ...services, [clusterArn]: result }));
    }
    catch(error: unknown) {
      this.showErrorOnSnackBar(error)
      this.services.update(services => ({ ...services, [clusterArn]: [] }))
    }    
  }
}
