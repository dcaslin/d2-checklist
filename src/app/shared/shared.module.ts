import { ScrollingModule } from '@angular/cdk/scrolling';
import { CdkTableModule } from '@angular/cdk/table/';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AdsenseModule } from 'ng2-adsense';
import { MomentModule } from 'ngx-moment';

import { ItemEnergyIndicatorComponent } from './item-energy-indicator/item-energy-indicator.component';
import { ItemIconComponent } from './item-icon/item-icon.component';
import { MilestoneCheckComponent } from './milestone-check/milestone-check.component';
import { PipeModule } from './pipe';
import { SeasonIndicatorComponent } from './season-indicator/season-indicator.component';
import { SignInRequiredModule } from './sign-in-required/sign-in-required.module';
import { SortIndicatorComponent } from './sort-indicator/sort-indicator.component';

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
    MatRadioModule,
    MatCardModule,
    MatDialogModule,
    MatSidenavModule,
    MatSlideToggleModule,
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
    ScrollingModule,
    SignInRequiredModule
  ],
  declarations: [
  MilestoneCheckComponent,
  SortIndicatorComponent,
  SeasonIndicatorComponent,
  SortIndicatorComponent,
  ItemEnergyIndicatorComponent,
  ItemIconComponent],
  exports: [
    MilestoneCheckComponent,
    SortIndicatorComponent,
    ItemIconComponent,
    SeasonIndicatorComponent,
    ItemEnergyIndicatorComponent,
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
    MatRadioModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatSlideToggleModule,
    MatCardModule,
    MatDialogModule,
    MatSidenavModule,
    MatListModule,
    MatBadgeModule,
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
  constructor() {
  }
}
