import { NgOptimizedImage } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyChipsModule as MatChipsModule } from '@angular/material/legacy-chips';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import {MatDividerModule} from '@angular/material/divider';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import {MatLegacySliderModule as MatSliderModule} from '@angular/material/legacy-slider';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacyTooltipModule as MatTooltipModule, MAT_LEGACY_TOOLTIP_DEFAULT_OPTIONS as MAT_TOOLTIP_DEFAULT_OPTIONS } from '@angular/material/legacy-tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { ItemEnergyIndicatorComponent } from './item-energy-indicator/item-energy-indicator.component';
import { ItemIconComponent } from './item-icon/item-icon.component';
import { GodRollItemComponent } from '../gear/god-roll-item/god-roll-item.component';
import { GodRollMwComponent } from '../gear/god-roll-mw/god-roll-mw.component';
import { MilestoneCheckModule } from './milestone-check/milestone-check.module';
import { PipeModule } from './pipe';
import { SeasonIndicatorComponent } from './season-indicator/season-indicator.component';
import { SignInRequiredModule } from './sign-in-required/sign-in-required.module';
import { SortIndicatorComponent } from './sort-indicator/sort-indicator.component';
import { FriendStarComponent } from './friend-star/friend-star.component';
import { TriumphNameComponent } from './triumph-name/triumph-name.component';
import { AdSlotComponent } from './ad-slot/ad-slot.component';
import { NitroUnitComponent } from './ad-slot/nitro-unit/nitro-unit.component';
import { SignedOnLoadingIconComponent } from './signed-on-loading-icon/signed-on-loading-icon.component';
import { ManifestItemIconComponent } from './manifest-item-icon/manifest-item-icon.component';
import { HorizontalSortComponent } from '@app/gear/gear/gear-compare-dialog/horizontal-sort/horizontal-sort.component';
import { LegendaryLostSectorComponent } from './legendary-lost-sector/legendary-lost-sector.component';
import { LostSectorNextDaysComponent } from './lost-sector-next-days/lost-sector-next-days.component';
import { GodRollPlugComponent } from '../gear/god-roll-plug/god-roll-plug.component';
import { CharacterPursuitDialogComponent } from './character-pursuit-dialog/character-pursuit-dialog.component';

@NgModule({
  imports: [
    NgOptimizedImage,
    PipeModule,
    CommonModule,
    FormsModule,
    FontAwesomeModule,
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
    MatSliderModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatListModule,
    MatDividerModule,
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
    SignInRequiredModule,
    MilestoneCheckModule
  ],
  declarations: [
    SortIndicatorComponent,
    SeasonIndicatorComponent,
    ItemEnergyIndicatorComponent,
    ItemIconComponent,
    GodRollItemComponent,
    GodRollMwComponent,
    HorizontalSortComponent,
    FriendStarComponent,
    TriumphNameComponent,
    AdSlotComponent,
    GodRollPlugComponent,
    NitroUnitComponent,
    SignedOnLoadingIconComponent,
    ManifestItemIconComponent,
    LegendaryLostSectorComponent,
    LostSectorNextDaysComponent,
    CharacterPursuitDialogComponent],
  exports: [
    SortIndicatorComponent,
    HorizontalSortComponent,
    ManifestItemIconComponent,
    TriumphNameComponent,
    ItemIconComponent,
    GodRollItemComponent,
    GodRollMwComponent,
    FriendStarComponent,
    GodRollPlugComponent,
    SeasonIndicatorComponent,
    AdSlotComponent,
    ItemEnergyIndicatorComponent,
    SignedOnLoadingIconComponent,
    LegendaryLostSectorComponent,
    RouterModule,
    PipeModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
    MatSliderModule,
    MatCardModule,
    MatDialogModule,
    MatSidenavModule,
    MatListModule,
    MatDividerModule,
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
    ScrollingModule,
    SignInRequiredModule,
    MilestoneCheckModule
  ],
  providers: []
})
export class SharedModule {  
}
