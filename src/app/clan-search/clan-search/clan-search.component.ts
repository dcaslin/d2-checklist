
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BungieService } from '../../service/bungie.service';
import { ClanInfo } from '../../service/model';
import { ChildComponent } from '../../shared/child.component';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-clan-search',
  templateUrl: './clan-search.component.html',
  styleUrls: ['./clan-search.component.scss']
})
export class ClanSearchComponent extends ChildComponent implements OnInit {
  name!: string;
  public clan: BehaviorSubject<ClanInfo | null> = new BehaviorSubject<ClanInfo | null>(null);

  constructor(private bungieService: BungieService) {
    super();
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
      this.clan = null!;
    }
    finally {
      this.loading.next(false);
    }

  }

  ngOnInit() {
    this.name = localStorage.getItem('last-clan-search')!;
  }
}
