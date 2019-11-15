import { NgModule } from '@angular/core';

import { SharedModule } from '../shared';


import { HomeComponent } from './home/home.component';
import { BurnDialogComponent } from './home/burn-dialog/burn-dialog.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [HomeComponent, BurnDialogComponent,
  ], 
  entryComponents: [
    BurnDialogComponent
  ]
})
export class HomeModule { }
