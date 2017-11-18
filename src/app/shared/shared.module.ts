import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PipeModule} from './pipe';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule,
  MatToolbarModule,
  MatMenuModule,
  MatSelectModule,
  MatTabsModule,
  MatInputModule,
  MatProgressSpinnerModule,
  MatChipsModule,
  MatSidenavModule,
  MatCheckboxModule,
  MatCardModule,
  MatListModule,
  MatIconModule,
  MatTooltipModule,
  MatSnackBarModule,
  MatProgressBarModule,
  MatExpansionModule,

  MatSortModule,
  MatPaginatorModule,
  MatTableModule
} from '@angular/material';


import { AdsenseModule } from 'ng2-adsense';
import { MomentModule } from 'angular2-moment';

import {
  CdkTableModule
} from '@angular/cdk/table/';


@NgModule({
  imports: [
    PipeModule,
    CommonModule,
    FormsModule,

    MomentModule,
    AdsenseModule.forRoot({
      adClient: 'ca-pub-4577479845324857',
      adSlot: 7862857321 //7862857321 responsive right 6246523328 responsive banner
    }),

    MatButtonModule,
    MatToolbarModule,
    MatSelectModule,
    MatTabsModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatCardModule,
    MatSidenavModule,
    MatCheckboxModule,
    MatListModule,
    MatMenuModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatExpansionModule,
    MatSortModule,
    MatPaginatorModule,
    MatTableModule,
    CdkTableModule
  ],
  declarations: [
  ],
  exports: [
    PipeModule,
    
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MomentModule,
    AdsenseModule,

    MatButtonModule,
    MatMenuModule,
    MatTabsModule,
    MatChipsModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatCardModule,
    MatSidenavModule,
    MatListModule,
    MatSelectModule,
    MatToolbarModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatExpansionModule,
    MatSortModule,
    MatPaginatorModule,
    MatTableModule,
    CdkTableModule
  ]
})
export class SharedModule { }
