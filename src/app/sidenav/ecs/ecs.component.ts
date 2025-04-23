import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

import { Service } from '@aws-sdk/client-ecs';

import { ECSService } from '../../services/ecs.service';
import { CredentialService } from '../../services/credential.service';

import { ClusterDetailComponent } from './cluster-detail/cluster-detail.component';
import { TaskdefDetailComponent } from './tastdef-detail/tastdef-detail.component'
import { ServiceDetailComponent } from './service-detail/service-detail.component';
import { Subscription } from 'rxjs';
import { CommonSidenavComponent } from '../common.component';
import { awsomeConfig } from '../../config/configuration';


@Component({
  selector: 'app-ecs',
  standalone: true,
  templateUrl: './ecs.component.html',
  styleUrls: ['./ecs.component.scss'],
  imports: [ CommonModule, MatExpansionModule, MatTableModule, MatCheckboxModule,
    MatIconModule, MatTooltipModule, MatButtonModule, MatProgressSpinnerModule ],
})
export class EcsComponent extends CommonSidenavComponent implements OnInit, OnDestroy {
  private credentialsSubscription?: Subscription;
  private refreshIntervals: { [clusterArn: string]: any } = {}; 

  readonly panelOpenState = signal<{ [clusterArn: string]: boolean }>({});
  clusters = signal<string[] | undefined>([]);
  services = signal<{ [clusterArn: string]: Service[] }>({});
  displayedColumns = ['select', 'serviceName', 'taskDefinition', 'tasks'];
  selectedServices: { [cluster: string]: Set<string> } = {};

  constructor(private ecs: ECSService, private credentialService: CredentialService,
    private dialog: MatDialog) {
    super();
  }


  async ngOnInit() {
    this.credentialsSubscription = this.credentialService.credentials$.subscribe(async (credentials) => {
      // Clear all intervals to stop refreshing. This is an issue, if
      // AWS credentials are changed while brwosing ECS component
      Object.values(this.refreshIntervals).forEach(intervalId => {
        clearInterval(intervalId);
      });
      this.refreshIntervals = {}; 
      
      await this.listClusters();

    });
  }

  ngOnDestroy(): void { // Unsubscribe to prevenet memory leaks
    this.credentialsSubscription?.unsubscribe();

    // Clear all intervals to stop refreshing
    Object.values(this.refreshIntervals).forEach(intervalId => {
      clearInterval(intervalId);
    });
    this.refreshIntervals = {}; 
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
      this.fetchServices(clusterArn);
  
      // Do not create another one, if it is already created
      if (!this.refreshIntervals[clusterArn]) {
        this.refreshIntervals[clusterArn] = setInterval(() => {
          this.fetchServices(clusterArn);
        }, awsomeConfig.refreshPeriod); // Refresh period is defined in configuration.ts
      }
    } else {
      // Stop internval, if it is not needed anymore
      clearInterval(this.refreshIntervals[clusterArn]);
      delete this.refreshIntervals[clusterArn];
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
  

  // -----  Service selection methods -----------------------------
  isSelected(cluster: string, svc: any): boolean {
    return this.selectedServices[cluster]?.has(svc.serviceName) ?? false;
  }
  
  toggle(cluster: string, svc: any): void {
    const set = this.selectedServices[cluster] ?? new Set<string>();
    if (set.has(svc.serviceName)) {
      set.delete(svc.serviceName);
    } else {
      set.add(svc.serviceName);
    }
    this.selectedServices[cluster] = set;
  }
  
  toggleAll(cluster: string, checked: boolean): void {
    const all = (this.services()[cluster] || [])
      .map(s => s.serviceName)
      .filter((name): name is string => !!name); 
    this.selectedServices[cluster] = checked ? new Set(all) : new Set();
  }
  
  isAllSelected(cluster: string): boolean {
    const all = (this.services()[cluster] || [])
      .map(s => s.serviceName)
      .filter((name): name is string => !!name);
    const selected = this.selectedServices[cluster] ?? new Set();
    return all.length > 0 && all.every(name => selected.has(name));
  }
  
  isIndeterminate(cluster: string): boolean {
    const all = (this.services()[cluster] || [])
      .map(s => s.serviceName)
      .filter((name): name is string => !!name);
    const selected = this.selectedServices[cluster] ?? new Set();
    return selected.size > 0 && selected.size < all.length;
  }
  // ---------------------------------------------------------------

  // -----  Service scaling methods --------------------------------
  async scaleServices(cluster: string, desiredCount: number, $event: MouseEvent) {
    $event.stopPropagation(); // Prevent mat-expansion-panel opening

    const selected = this.selectedServices[cluster];
    let latestError: string = "";
    const failedServices: string[] = [];

    const scalePromises = Array.from(selected).map(serviceName =>
      this.ecs.updateService(cluster, serviceName, {desiredCount: desiredCount, forceNewDeployment: true})
        .then(() => console.log(`Scaled ${serviceName} to ${desiredCount}`))
        .catch((err: unknown) => {
          failedServices.push(`${serviceName}`);
          latestError = `${err}`
        })
    );
  
    await Promise.all(scalePromises);
    
    if (failedServices.length > 0) {
      this.showSnackBar(`${failedServices.join('\n')}, latest error was ${latestError}`, 10000); 
    } else {
      this.fetchServices(cluster); // refresh services to get the spinners visible
    } 
  }
  
  hasSelected(cluster: string): boolean {
    return this.selectedServices[cluster]?.size > 0;
  }
  // ---------------------------------------------------------------

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
