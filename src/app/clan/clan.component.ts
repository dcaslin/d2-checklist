
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { ChildComponent } from '../shared/child.component';
import { ClanStateService } from './clan-state.service';
import { IconService } from '@app/service/icon.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-clan-history',
  templateUrl: './clan.component.html',
  styleUrls: ['./clan.component.scss']
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
