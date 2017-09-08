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


import { MomentModule } from 'angular2-moment';

import {
  CdkTableModule
} from '@angular/cdk/table/';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,

    MomentModule,

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
