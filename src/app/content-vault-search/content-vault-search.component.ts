import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ChildComponent } from '@app/shared/child.component';
import { BungieService } from '@app/service/bungie.service';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from '@app/service/storage.service';
import { Platform, Const, Player, SelectedUser } from '@app/service/model';
import { takeUntil } from 'rxjs/operators';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { IconService } from '@app/service/icon.service';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '@app/service/auth.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-content-vault-search',
  templateUrl: './content-vault-search.component.html',
  styleUrls: ['./content-vault-search.component.scss']
})
export class ContentVaultSearchComponent extends ChildComponent implements OnInit {
  readonly platforms: Platform[] = Const.PLATFORMS_ARRAY;

  searchForm: FormGroup;
  readonly _selectedUser: BehaviorSubject<SelectedUser> = new BehaviorSubject(null);
  readonly _failedSearch: BehaviorSubject<FailedSearch> = new BehaviorSubject(null);

  constructor(storageService: StorageService,
    private signedOnUserService: SignedOnUserService,
    public iconService: IconService,
    private formBuilder: FormBuilder,
    private bungieService: BungieService,
    private authService: AuthService,
    private route: ActivatedRoute,
    public router: Router,
    private ref: ChangeDetectorRef) {
    super(storageService);
    this.searchForm = this.formBuilder.group({
      platform: [this.platforms[0], [Validators.required]],
      gt: ['', [Validators.required]]
    });
    this.signedOnUserService.signedOnUser$.pipe(takeUntil(this.unsubscribe$)).subscribe((selectedUser: SelectedUser) => {
      this._selectedUser.next(selectedUser);
    });
    this.storageService.settingFeed.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(
        x => {
          if (x.defaultplatform != null) {
            const type: number = x.defaultplatform;
            if (this.platform.value == null || this.platform.value.type !== type) {
              this.platform.setValue(Const.PLATFORMS_DICT['' + type]);
            }
          }
          if (x.defaultgt != null) {
            this.gt.setValue(x.defaultgt);
          }
        });
  }

  ngOnInit(): void {
  }

  logon() {
    this.authService.getCurrentMemberId(true);
  }

  get gt(): FormControl {
    return this.searchForm.get('gt') as FormControl;
  }

  get platform(): FormControl {
    return this.searchForm.get('platform') as FormControl;
  }

  public async onSubmit() {
    this.loading.next(true);
    this._failedSearch.next(null);
    try {
      const pl = this.platform.value.type;
      const gt = this.gt.value;
      const p = await this.bungieService.searchPlayer(pl, gt);
      if (p == null) {
        console.log('Player not found');
        this._failedSearch.next({
          gt,
          platform: this.platform.value
        });
      } else {
        console.dir(p);
        this.storageService.setItem('defaultplatform', pl);
        this.storageService.setItem('defaultgt', gt);
        this.router.navigate(['content-vault', pl, p.membershipId]);
      }
    }
    finally {
      this.loading.next(false);
    }
  }

}

interface FailedSearch {
  gt: string;
  platform: Platform;
}