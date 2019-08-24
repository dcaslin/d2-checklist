
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BungieService } from '../../service/bungie.service';
import { ClanInfo } from '../../service/model';
import { StorageService } from '../../service/storage.service';
import { ChildComponent } from '../../shared/child.component';


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
    private bungieService: BungieService) {
    super(storageService);
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
