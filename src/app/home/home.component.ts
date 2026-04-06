
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteSelectedEvent, MatAutocompleteTrigger, MatAutocomplete } from '@angular/material/autocomplete';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@app/service/auth.service';
import { BungieService } from '@app/service/bungie.service';
import { ElasticSearchResult, ElasticSearchService } from '@app/service/elastic-search.service';
import { IconService } from '@app/service/icon.service';
import { Const, MilestoneActivity, Platform, SelectedUser } from '@app/service/model';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { StorageService } from '@app/service/storage.service';
import { Today, WeekService } from '@app/service/week.service';
import { ChildComponent } from '@app/shared/child.component';
import { LostSectorNextDaysComponent } from '@app/shared/lost-sector-next-days/lost-sector-next-days.component';
import { environment as env } from '@env/environment';
import { BehaviorSubject } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';
import { BurnDialogComponent } from './burn-dialog/burn-dialog.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatAnchor, MatButton } from '@angular/material/button';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatBadge } from '@angular/material/badge';
import { MatTooltip } from '@angular/material/tooltip';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle, MatCardSubtitle } from '@angular/material/card';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatExpansionPanelDescription } from '@angular/material/expansion';
import { SignedOnLoadingIconComponent } from '../shared/signed-on-loading-icon/signed-on-loading-icon.component';
import { DealsContainerComponent } from '../deals/deals-container/deals-container.component';
import { MatList, MatListItem, MatListItemIcon, MatListItemLine } from '@angular/material/list';
import { LegendaryLostSectorComponent } from '../shared/legendary-lost-sector/legendary-lost-sector.component';
import { RobotHomeComponent } from './robot-home/robot-home.component';
import { MatOption } from '@angular/material/core';
import { AgoHumanizedPipe } from '../shared/pipe/timing.pipe';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: true,
    imports: [NgIf, MatFormField, MatLabel, MatIcon, MatSuffix, MatInput, FormsModule, MatAutocompleteTrigger, ReactiveFormsModule, MatAnchor, FaIconComponent, MatMenuTrigger, MatBadge, MatMenu, MatMenuItem, RouterLink, NgFor, MatButton, MatTooltip, MatProgressSpinner, MatCard, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, SignedOnLoadingIconComponent, MatExpansionPanelDescription, MatCardContent, DealsContainerComponent, MatCardHeader, MatCardTitle, MatCardSubtitle, MatList, MatListItem, LegendaryLostSectorComponent, MatListItemIcon, MatListItemLine, RobotHomeComponent, MatAutocomplete, MatOption, AsyncPipe, AgoHumanizedPipe]
})
export class HomeComponent extends ChildComponent implements OnInit {
  readonly isSignedOn$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  readonly version = env.versions.app;
  readonly platforms: Platform[] = Const.PLATFORMS_ARRAY;
  readonly platformMap = Const.PLATFORMS_DICT;


  gamerTagControl = new FormControl<string | null>(null);

  hideAnnouncement = true;
  dealsExpanded = 'false' !== localStorage.getItem('expand-deals');

  selectedPlatform: Platform;
  gamerTag!: string;
  showMoreInfo = false;
  today: Today | null = null;

  onHideAnnouncement() {
    this.hideAnnouncement = true;
    localStorage.setItem('hide-announcement-content-vault', 'true');
  }

  onToggleDeals(val: boolean) {
    this.dealsExpanded = val;
    localStorage.setItem('expand-deals', val.toString());
  }

  constructor(
    public signedOnUserService: SignedOnUserService,
    public bungieService: BungieService,
    public  elasticSearchService: ElasticSearchService,
    private authService: AuthService,
    public iconService: IconService,
    public dialog: MatDialog,
    private weekService: WeekService,
    private router: Router,
    private ref: ChangeDetectorRef) {
    super();
    this.selectedPlatform = this.platforms[0];
    this.hideAnnouncement = 'true' === localStorage.getItem('hide-announcement-content-vault');

    this.storageService.settingFeed.pipe(
      takeUntilDestroyed(this.destroyRef))
      .subscribe(
        x => {
          if (x.defaultplatform != null) {
            this.setPlatform(x.defaultplatform);
            this.ref.markForCheck();
          }
          if (x.defaultgt != null) {
            this.gamerTag = x.defaultgt;
            this.ref.markForCheck();
          }
        });

  }

  private setPlatform(type: number) {
    // already set
    if (this.selectedPlatform != null && this.selectedPlatform.type === type) { return; }
    this.selectedPlatform = (Const.PLATFORMS_DICT as any)['' + type];
  }

  public routeSearch(): void {
    if (this.selectedPlatform == null) {
      return;
    }
    if (this.gamerTag == null || this.gamerTag.trim().length < 1) {
      return;
    }

    this.router.navigate(['gt', this.selectedPlatform.type, this.gamerTag]);
  }

  onPlatformChange() {
    this.storageService.setItem('defaultplatform', this.selectedPlatform.type);
  }

  onGtChange() {
    this.storageService.setItem('defaultgt', this.gamerTag);
  }

  removeActivitySuffix(name: string) {
    if (name == null) {
      return null;
    }
    const spot = name.lastIndexOf(':');
    if (spot > 0) {
      return name.substring(0, spot);
    } else {
      return name;
    }
  }

  removeActivityPrefixes(name: string) {
    // return name;
    if (name == null) {
      return null;
    }
    const parts = name.split(':');
    return parts[parts.length - 1].trim();
  }

  showBurns(msa: MilestoneActivity) {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = msa;
    this.dialog.open(BurnDialogComponent, dc);
  }

  showLostSectorNextDays() {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    this.dialog.open(LostSectorNextDaysComponent, dc);
  }

  logon() {
    this.authService.getCurrentMemberId(true);
  }

  async loadMileStones() {
    try {
      this.today = await this.weekService.getToday();
      this.ref.markForCheck();
    }
    finally {
      this.loading.set(false);
    }
  }

  ngOnInit() {
    this.loading.set(true);
    this.loadMileStones();
    // selected user changed
    this.signedOnUserService.signedOnUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((selectedUser: SelectedUser | null) => {
      this.isSignedOn$.next(selectedUser != null);
    });

    this.gamerTagControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef), startWith('')).subscribe((value) => {
      this.elasticSearchService.searchInput$.next(value ?? '');
    } );

  }

  select(event: MatAutocompleteSelectedEvent) {
    const value: ElasticSearchResult = event.option.value;
    if (value) {
      this.router.navigate(['/',value.membershipType, value.membershipId])
    }

  }

  displayFn(user: ElasticSearchResult): string {
    return user? user.displayName : '';
  }
}
