
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { ChildComponent } from '../shared/child.component';
import { ClanStateService } from './clan-state.service';
import { IconService } from '@app/service/icon.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIf, AsyncPipe } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatTabNav, MatTabLink, MatTabNavPanel } from '@angular/material/tabs';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatAnchor } from '@angular/material/button';


@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-clan-history',
    templateUrl: './clan.component.html',
    styleUrls: ['./clan.component.scss'],
    imports: [NgIf, FaIconComponent, MatProgressBar, MatTabNav, MatTabLink, RouterLink, RouterLinkActive, MatTabNavPanel, MatProgressSpinner, RouterOutlet, MatAnchor, AsyncPipe]
})
export class ClanComponent extends ChildComponent implements OnInit {
  constructor(
    public iconService: IconService,
    public state: ClanStateService,
    private route: ActivatedRoute) {
    super();
  }

  ngOnInit() {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.state.load(params['id']);
    });
  }
}
