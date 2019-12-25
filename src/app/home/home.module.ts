import { NgModule } from '@angular/core';

import { SharedModule } from '../shared';


import { HomeComponent } from './home/home.component';
import { BurnDialogComponent } from './home/burn-dialog/burn-dialog.component';
import { BountySetsDialogComponent } from './home/bounty-sets-dialog/bounty-sets-dialog.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [HomeComponent, BurnDialogComponent, BountySetsDialogComponent,
  ], 
  entryComponents: [
    BurnDialogComponent, 
    BountySetsDialogComponent
  ]
})
export class HomeModule { }
