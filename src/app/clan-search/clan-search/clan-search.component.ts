
import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';

import { BungieService } from '../../service/bungie.service';
import { ClanInfo } from '../../service/model';
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'd2c-clan-search',
  templateUrl: './clan-search.component.html',
  styleUrls: ['./clan-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClanSearchComponent extends ChildComponent implements OnInit, OnDestroy {
  name: string;
  public clan: BehaviorSubject<ClanInfo> = new BehaviorSubject(null);

  constructor(storageService: StorageService,
    private bungieService: BungieService,
    private ref: ChangeDetectorRef) {
    super(storageService, ref);
  }
  search() {
    this.load();
  }

  private async load() {
    this.loading.next(true);
    try {
      const x = await this.bungieService.searchClans(this.name);
      this.clan.next(x);
      localStorage.setItem('last-clan-search', this.name);
    } catch (exc) {
      this.clan = null;
    }
    finally {
      this.loading.next(false);
    }

  }

  ngOnInit() {
    this.name = localStorage.getItem('last-clan-search');
  }
}
