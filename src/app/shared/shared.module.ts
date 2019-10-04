import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PipeModule} from './pipe';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule,
  MatButtonToggleModule,
  MatToolbarModule,
  MatMenuModule,
  MatTreeModule,
  MatSelectModule,
  MatTabsModule,
  MatInputModule,
  MatProgressSpinnerModule,
  MatChipsModule,
  MatSidenavModule,
  MatCheckboxModule,
  MatCardModule,
  MatDialogModule,
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
import { MomentModule } from 'ngx-moment';

import {
  CdkTableModule
} from '@angular/cdk/table/';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { RouterModule } from '@angular/router';
import { MilestoneCheckComponent } from './milestone-check/milestone-check.component';


@NgModule({
  imports: [
    PipeModule,
    CommonModule,
    FormsModule,

    MomentModule,
    AdsenseModule.forRoot({
      adClient: 'ca-pub-4577479845324857',
      adSlot: 7862857321 // 7862857321 responsive right 6246523328 responsive banner
    }),

    MatButtonModule,
    MatButtonModule,
    MatToolbarModule,
    MatSelectModule,
    MatTabsModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatCardModule,
    MatDialogModule,
    MatSidenavModule,
    MatCheckboxModule,
    MatListModule,
    MatMenuModule,
    MatTreeModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatExpansionModule,
    MatSortModule,
    MatPaginatorModule,
    MatTableModule,
    CdkTableModule,
    ScrollingModule
  ],
  declarations: [
  MilestoneCheckComponent],
  exports: [
    MilestoneCheckComponent,
    RouterModule,
    PipeModule,

    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MomentModule,
    AdsenseModule,

    MatButtonModule,
    MatButtonToggleModule,
    MatMenuModule,
    MatTreeModule,
    MatTabsModule,
    MatChipsModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatCardModule,
    MatDialogModule,
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
    CdkTableModule,
    ScrollingModule
  ]
})
export class SharedModule { }
