import { NgOptimizedImage } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule as MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule as MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule as MatCardModule } from '@angular/material/card';
import { MatCheckboxModule as MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule as MatChipsModule } from '@angular/material/chips';
import { MatDialogModule as MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule as MatInputModule } from '@angular/material/input';
import { MatListModule as MatListModule } from '@angular/material/list';
import {MatDividerModule} from '@angular/material/divider';
import { MatMenuModule as MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule as MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule as MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule as MatRadioModule } from '@angular/material/radio';
import { MatSelectModule as MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule as MatSlideToggleModule } from '@angular/material/slide-toggle';
import {MatSliderModule as MatSliderModule} from '@angular/material/slider';
import { MatSnackBarModule as MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule as MatTableModule } from '@angular/material/table';
import { MatTabsModule as MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule, MAT_TOOLTIP_DEFAULT_OPTIONS } from '@angular/material/tooltip';
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
