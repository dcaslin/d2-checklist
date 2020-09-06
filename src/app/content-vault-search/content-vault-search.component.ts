import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ChildComponent } from '@app/shared/child.component';
import { BungieService } from '@app/service/bungie.service';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from '@app/service/storage.service';
import { Platform, Const } from '@app/service/model';
import { takeUntil } from 'rxjs/operators';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'd2c-content-vault-search',
  templateUrl: './content-vault-search.component.html',
  styleUrls: ['./content-vault-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContentVaultSearchComponent extends ChildComponent implements OnInit {
  readonly platforms: Platform[] = Const.PLATFORMS_ARRAY;

  searchForm: FormGroup;


  constructor(storageService: StorageService,
    private formBuilder: FormBuilder,
    private bungieService: BungieService,
    private route: ActivatedRoute,
    public router: Router,
    private ref: ChangeDetectorRef) {
    super(storageService);
    this.searchForm = this.formBuilder.group({
      platform: [this.platforms[0], [Validators.required]],
      gt: ['', [Validators.required]]
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

  get gt(): FormControl {
    return this.searchForm.get('gt') as FormControl;
  }

  get platform(): FormControl {
    return this.searchForm.get('platform') as FormControl;
  }

  public async onSubmit() {
    this.loading.next(true);
    try {
      const p = await this.bungieService.searchPlayer(this.platform.value.type, this.gt.value);
      if (p == null) {
        console.log('Player not found');
      } else {
        console.dir(p);
      }
    }
    finally {
      this.loading.next(false);
    }
  }

}
