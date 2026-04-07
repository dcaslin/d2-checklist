
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BungieService } from '../../service/bungie.service';
import { ClanInfo } from '../../service/model';
import { ChildComponent } from '../../shared/child.component';
import { NgIf, AsyncPipe } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatMiniFabButton, MatAnchor } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { MatCard, MatCardHeader, MatCardAvatar, MatCardTitle, MatCardSubtitle, MatCardContent, MatCardActions } from '@angular/material/card';


@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-clan-search',
    templateUrl: './clan-search.component.html',
    styleUrls: ['./clan-search.component.scss'],
    imports: [NgIf, MatProgressSpinner, MatFormField, MatLabel, MatInput, FormsModule, MatMiniFabButton, MatIcon, RouterLink, MatCard, MatCardHeader, MatCardAvatar, MatCardTitle, MatCardSubtitle, MatCardContent, MatCardActions, MatAnchor, AsyncPipe]
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
    this.loading.set(true);
    try {
      const x = await this.bungieService.searchClans(this.name);
      this.clan.next(x);
      localStorage.setItem('last-clan-search', this.name);
    } catch (exc) {
      this.clan = null!;
    }
    finally {
      this.loading.set(false);
    }

  }

  ngOnInit() {
    this.name = localStorage.getItem('last-clan-search')!;
  }
}
