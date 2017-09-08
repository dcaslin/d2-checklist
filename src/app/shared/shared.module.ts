import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MdButtonModule,
  MdToolbarModule,
  MdMenuModule,
  MdSelectModule,
  MdTabsModule,
  MdInputModule,
  MdProgressSpinnerModule,
  MdChipsModule,
  MdSidenavModule,
  MdCheckboxModule,
  MdCardModule,
  MdListModule,
  MdIconModule,
  MdTooltipModule,
  MdSnackBarModule,
  MdProgressBarModule,

  MdSortModule,
  MdPaginatorModule,
  MdTableModule
} from '@angular/material';


import { AdsenseModule } from 'ng2-adsense';
import { MomentModule } from 'angular2-moment';

import {
  CdkTableModule
} from '@angular/cdk/table/';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,

    MomentModule,
    AdsenseModule.forRoot({
      adClient: 'ca-pub-4577479845324857',
      adSlot: 7862857321 //7862857321 responsive right 6246523328 responsive banner
    }),

    MdButtonModule,
    MdToolbarModule,
    MdSelectModule,
    MdTabsModule,
    MdInputModule,
    MdProgressSpinnerModule,
    MdChipsModule,
    MdCardModule,
    MdSidenavModule,
    MdCheckboxModule,
    MdListModule,
    MdMenuModule,
    MdIconModule,
    MdTooltipModule,
    MdSnackBarModule,
    MdProgressBarModule,

    MdSortModule,
    MdPaginatorModule,
    MdTableModule,
    CdkTableModule
  ],
  declarations: [
  ],
  exports: [
    CommonModule,
    FormsModule,
    MomentModule,
    AdsenseModule,

    MdButtonModule,
    MdMenuModule,
    MdTabsModule,
    MdChipsModule,
    MdInputModule,
    MdProgressSpinnerModule,
    MdCheckboxModule,
    MdCardModule,
    MdSidenavModule,
    MdListModule,
    MdSelectModule,
    MdToolbarModule,
    MdIconModule,
    MdTooltipModule,
    MdProgressBarModule,

    MdSortModule,
    MdPaginatorModule,
    MdTableModule,
    CdkTableModule
  ]
})
export class SharedModule { }
