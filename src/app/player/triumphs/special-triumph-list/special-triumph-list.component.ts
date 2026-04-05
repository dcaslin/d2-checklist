import { ThisReceiver } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlayerStateService } from '@app/player/player-state.service';
import { IconService } from '@app/service/icon.service';
import { Sort, TriumphRecordNode } from '@app/service/model';
import { ChildComponent } from '@app/shared/child.component';
import { title } from 'process';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIf, NgFor, AsyncPipe, DecimalPipe, DatePipe } from '@angular/common';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatInput } from '@angular/material/input';
import { MatAutocompleteTrigger, MatAutocomplete } from '@angular/material/autocomplete';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { SortIndicatorComponent } from '../../../shared/sort-indicator/sort-indicator.component';
import { TriumphNameComponent } from '../../../shared/triumph-name/triumph-name.component';
import { MatProgressBar } from '@angular/material/progress-bar';
import { TriumphObjectivesComponent } from '../triumph-objectives/triumph-objectives.component';


function sortByName(x: TriumphRecordNode, y: TriumphRecordNode): number {
  const xName = x.name.toLowerCase();
  const yName = y.name.toLowerCase();
  if (xName < yName) {
    return 1;
  } else if (xName > yName) {
    return -1;
  } else {
    return 0;
  }
}

function sortByProgress(x: TriumphRecordNode, y: TriumphRecordNode): number {
  const xName = x.percent;
  const yName = y.percent;
  if (xName < yName) {
    return 1;
  } else if (xName > yName) {
    return -1;
  } else {
    return 0;
  }
}

@Component({
    selector: 'd2c-special-triumph-list',
    templateUrl: './special-triumph-list.component.html',
    styleUrls: ['./special-triumph-list.component.scss'],
    standalone: true,
    imports: [NgIf, MatCheckbox, FormsModule, MatFormField, MatLabel, MatSelect, NgFor, MatOption, MatInput, MatAutocompleteTrigger, MatIconButton, MatSuffix, MatIcon, MatAutocomplete, SortIndicatorComponent, TriumphNameComponent, MatProgressBar, TriumphObjectivesComponent, AsyncPipe, DecimalPipe, DatePipe]
})
export class SpecialTriumphListComponent extends ChildComponent {

  public title$: BehaviorSubject<string> = new BehaviorSubject('');
  public sort$: BehaviorSubject<Sort> = new BehaviorSubject<Sort>({
    name: 'progress',
    ascending: false
  });

  public rows$: BehaviorSubject<TriumphRecordNode[]> = new BehaviorSubject<TriumphRecordNode[]>([]);
  public showCrafted$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public craftedFilter = 'TODO';
  public craftedWildCardFilter = '';
  public craftedWildCardFilterChoice = [
    {
      name: 'Current Season',
      value: 'Lost Signal,Ill Omen,Faith-Keeper,Timeworn Wayfarer,Veiled Threat,Sightline Survey',
    },
    {
      name: 'Ghost',
      value: 'The Call,No Hesitation,Someday,Embraced Identity,Pro Memoria,False Idols,Bold Endings,Axial Lacuna',
    }
  ]
  public craftedFilterChoices = [
    {
      name: 'Todo (Not Crafted + Incomplete)',
      value: 'TODO',

    },
    {
      name: 'Attune',
      value: 'ATTUNE_TO_CRAFT'
    },
    {
      name: 'Incomplete',
      value: 'INCOMPLETE'
    },
    {
      name: 'Not Crafted',
      value: 'NOT_CRAFTED'
    }, 
    {
      name: 'Crafted',
      value: 'CRAFTED'
    },
    {
      name: 'All',
      value: 'ALL'
    }
  ];

  constructor(private router: Router,
    private route: ActivatedRoute,
    public iconService: IconService,
    public state: PlayerStateService) {
    super();

    this.route.firstChild

    combineLatest([this.route.data, this.sort$, this.state.player])
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(10))
      .subscribe(([data, sort, player]) => {
        let sortMe: TriumphRecordNode[] = [];
        if (data.flavor == 'catalysts') {
          sortMe = player.exoticCatalystTriumphs;
          this.title$.next('Exotic Catalysts');
          this.showCrafted$.next(false);
        } else if (data.flavor == 'patterns') {
          sortMe = player.patternTriumphs;
          this.title$.next('Patterns');
          this.showCrafted$.next(true);
        }
        if (sort.name == 'name') {
          sortMe.sort(sortByName);
        } else if (sort.name == 'progress') {
          sortMe.sort(sortByProgress);
        }
        if (sort.ascending) {
          sortMe.reverse();
        }
        this.rows$.next(sortMe);
      });

    this.sort$.next(this.sort$.getValue());
  }

  private filterPatternName(t: TriumphRecordNode): boolean {
    if (this.craftedWildCardFilter == '') {
      return true;
    }
    let found = false
    for (const [_, value] of this.craftedWildCardFilter.toLowerCase().split(',').entries()) {
      if (value != '' && t.name.toLowerCase().includes(value)) {
        found = true
        break
      }
    }
    return found
  }

  public shouldShow(t: TriumphRecordNode): boolean {    
    if (this.showCrafted$.getValue()) {
      if (this.craftedFilter=='TODO') {
        if (!t.complete || (t.complete && t.crafted?.length==0)) {
          return this.filterPatternName(t);
        }
      } else if (this.craftedFilter=='INCOMPLETE') {
        if (!t.complete) {
          return this.filterPatternName(t);
        }
      } else if (this.craftedFilter=='NOT_CRAFTED') {
        if (t.complete && t!.crafted!.length==0) {
          return this.filterPatternName(t);
        }
      } else if (this.craftedFilter=='CRAFTED') {
        if (t.complete && t!.crafted!.length>0) {
          return this.filterPatternName(t);
        }
      } else if (this.craftedFilter=='ATTUNE_TO_CRAFT') {
        if (!t.complete && t!.redborder!.length>0) {
          return this.filterPatternName(t);
        }
      } 
      else if (this.craftedFilter=='ALL') {
        return this.filterPatternName(t);
      }
      return false;
    } else {
      return !this.state.hideCompleteTriumphs || !t.complete || !t.redeemed
    }
  }


  navigate(triumphHash: string) {
    this.router.navigate(['..', 'tree', triumphHash], { relativeTo: this.route });
  }

  sortRows(val: string) {
    const sort = this.sort$.getValue();
    const newSort = {
      ...sort
    };
    if (val == sort.name) {
      newSort.ascending = !newSort.ascending;
    } else {
      newSort.name = val;
      newSort.ascending = true;
    }
    this.sort$.next(newSort);
  }
}
