
# Adding a new Service and Component

This guide will walk you through the steps to add a new service and component to the project. 
We will use `ecs` -service as an example. This guide will not make a full example that can be 
used as-is. Only the most important steps are listed. It is up to development to provide the
needed logic.

## Step 1: Create the Service

1. Create service

    At project root, run following snippet. It will create the required service to correct location.
    ```sh
    ng generate service services/ecs
    ```

2. Inject `CredentialService` into class

    ```typescript
    import { CredentialModel, CredentialService } from './credential.service';

    export class ElbService {

        constructor(private credentialService: CredentialService) {}
    ```

3. Create method `getClient()`

    This method uses CredentialService to obtain fresh temporary AWS credentials, that can be used
    to make queries into AWS. Make not of the GEnerics used in here. We return the interface, 
    not the Client object.

    ```typescript
    import { ECS } from '@aws-sdk/client-ecs';

    ...

    private async getClient(): Promise<ECS> {
        const credentials = await firstValueFrom(
            this.credentialService.credentials$.pipe(
                filter((cred): cred is CredentialModel => cred !== null)
            )
        );
        
        if (!credentials?.AccessKeyId || !credentials?.SecretAccessKey || !credentials?.SessionToken) {
            throw new Error('AWS Credentials are missing or invalid');
        }

        const client = new ECS({
            region: credentials.Region,
            credentials: {
                accessKeyId: credentials.AccessKeyId as string,
                secretAccessKey: credentials.SecretAccessKey as string,
                sessionToken: credentials.SessionToken as string
            }
        });

        return client;
    }  
    ```

4. Create SDK calls

    Create methods, that will call the SDK. When creating a service against AWS sdk, 
    avoid calling different SDK Clients. If possible, make the service as close as possible
    to SDK client. Remember, this is Angular service, whic serves the Components used.

    Note, that we use the interface, not the SDKs `send()` -method with Input and Output
    Objects.

    ```typescript
    import { ListServicesCommandOutput, ECS } from '@aws-sdk/client-ecs';    

    ...

    async listClusters() {
        console.log('ECSService::listClusters()');

        const ecs = await this.getClient()
        const response = await ecs.listClusters({
            maxResults: 100
        });

        return response.clusterArns;
    }
    ```

## Step 2: Create the Component

Idea with the folder structure is, that sidenav component holds all the different AWS services
needed. These services should be created there

1. Create component

    ```sh
    ng generate component sidenav/ecs
    ```

4. Define the component in `elb.component.ts`:
   ```typescript
    import { CommonModule } from '@angular/common';
    import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
    import { MatDialog } from '@angular/material/dialog';
    import { MatSnackBar } from '@angular/material/snack-bar';
    import { MatExpansionModule } from '@angular/material/expansion';
    import { MatTableModule } from '@angular/material/table';
    import { ChangeDetectorRef } from '@angular/core';

    import { Service } from '@aws-sdk/client-ecs';

    import { ECSService } from '../../services/ecs.service';
    import { CredentialService } from '../../services/credential.service';

    @Component({
        selector: 'app-ecs',
        standalone: true,
        templateUrl: './ecs.component.html',
        styleUrls: ['./ecs.component.scss'],
        imports: [ CommonModule, MatExpansionModule, MatTableModule ]
    })
    export class EcsComponent implements OnInit, OnDestroy {
        private credentialsSubscription?: Subscription;
        private _snackBar = inject(MatSnackBar);

        readonly panelOpenState = signal<{ [clusterArn: string]: boolean }>({});
        clusters = signal<string[] | undefined>([]);

        constructor(private ecs: ECSService, private credentialService: CredentialService,
            private dialog: MatDialog) {
        }


        async ngOnInit() { // On init, fetch the main content of the component
            this.credentialsSubscription = this.credentialService.credentials$.subscribe(async (credentials) => {
                await this.listClusters();
            });
        }

        ngOnDestroy(): void { // Unsubscribe to prevenet memory leaks
            this.credentialsSubscription?.unsubscribe();
        }
   ```

5. Make some service calls

    While making remote calls, catch Errors and show the message on SnackBar if something went wrong.

    ```typescript
    private async listClusters() {
        try {
            const result = await this.ecs.listClusters(); 
            this.clusters.set(result);
        }
        catch(error: unknown) {
            this.showErrorOnSnackBar(error)
        }
    }
    ```

6. Create HTML code

    HTML code is in `ecs.component.html`, and scss in `ecs.component.scss`. Not all the code in shown in here,
    but one thing to note is the use on `trackBy` in `*ngFor` and `mat-expansion-panel`. As the credentials may
    change by changing role to another account, the default tracking with plain index will result in wrong panel
    state. I.e. both accounts might have a cluster at index 0, but the data is different. if the trackBy is omitted,
    Angular thoughts that panel needs to be at state it was before the switch role.


    ```html
    <p>Clusters</p>

    <mat-accordion class="example-headers-align" multi="false">
        <ng-container *ngFor="let cluster of clusters(); trackBy: trackByCluster">
            <mat-expansion-panel (opened)="expansionPanelState(cluster, true)" (closed)="expansionPanelState(cluster, false)" [expanded]="false">
                <mat-expansion-panel-header>
                <mat-panel-title> 
                    {{ cluster }} 
                    <a (click)="openClusterDetails(cluster, $event)" class="details-link">[ info ]</a>
                </mat-panel-title>
                </mat-expansion-panel-header>
    ```

## Step 3: Add component into sidenav

First, you need to add component into html code of sidenav.component.html

```html
      <mat-nav-list>
        <a mat-list-item routerLink="/codecommit" routerLinkActive="active-link" *ngIf="isAuthenticated" [routerLinkActiveOptions]="{ exact: true }">CodeCommit</a>
        <a mat-list-item routerLink="/ecs" routerLinkActive="active-link" *ngIf="isAuthenticated" [routerLinkActiveOptions]="{ exact: true }">ECS</a>
        ...
      </mat-nav-list>
```

After that, add it to Angular routing by modifying sidenav-routing.module.ts

```typescript
export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'codecommit', component: CodecommitComponent, canActivate: [authGuard] },
    { path: 'ecs', component: EcsComponent, canActivate: [authGuard] },
    ...
  ];

```