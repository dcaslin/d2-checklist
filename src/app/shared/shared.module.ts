import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';

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
  MatAutocompleteModule,
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


import { faCoffee } from '@fortawesome/free-solid-svg-icons';
import { SignInRequiredComponent } from './sign-in-required/sign-in-required.component';
import { SortIndicatorComponent } from './sort-indicator/sort-indicator.component';
import { SeasonIndicatorComponent } from './season-indicator/season-indicator.component';
import { ItemEnergyIndicatorComponent } from './item-energy-indicator/item-energy-indicator.component';
import { ItemIconComponent } from './item-icon/item-icon.component';


@NgModule({
  imports: [
    PipeModule,
    CommonModule,
    FormsModule,
    
    FontAwesomeModule,

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
    MatAutocompleteModule,
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
  MilestoneCheckComponent,
  SortIndicatorComponent,
  SeasonIndicatorComponent,
  SignInRequiredComponent,
  SortIndicatorComponent,
  ItemEnergyIndicatorComponent,
  ItemIconComponent],
  exports: [
    MilestoneCheckComponent,
    SortIndicatorComponent,
    ItemIconComponent,
    SeasonIndicatorComponent,
    ItemEnergyIndicatorComponent,
    SignInRequiredComponent,
    RouterModule,
    PipeModule,

    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MomentModule,
    AdsenseModule,

    FontAwesomeModule,
    
    MatButtonModule,
    MatButtonToggleModule,
    MatMenuModule,
    MatTreeModule,
    MatTabsModule,
    MatChipsModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatAutocompleteModule,
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
export class SharedModule { 
  constructor(library: FaIconLibrary) {
    library.addIcons(faCoffee);
  }
}
