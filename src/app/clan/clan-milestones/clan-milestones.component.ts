import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ChildComponent } from '@app/shared/child.component';
import { StorageService } from '@app/service/storage.service';
import { ClanStateService } from '../clan-state.service';
import { takeUntil } from 'rxjs/operators';
import { MileStoneName, BungieGroupMember } from '@app/service/model';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'd2c-clan-milestones',
  templateUrl: './clan-milestones.component.html',
  styleUrls: ['./clan-milestones.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClanMilestonesComponent extends ChildComponent implements OnInit {
  filterMode = 'none';
  filterActivity: MileStoneName = null;
  public filteredMembers: BehaviorSubject<BungieGroupMember[]> = new BehaviorSubject([]);

  constructor(
    public state: ClanStateService,
    storageService: StorageService) {
    super(storageService);
    this.state.sortedMembers.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(
        x => {
          this.filterMilestones();
        });
  }

  ngOnInit() {
  }


  private filterUpdated() {
    if (this.filterMode === 'none') {
      this.filterActivity = null;
    }
    this.filterMilestones();
  }


  public showAllClanMilestones(): void {
    this.storageService.showAllClanMilestones();
  }

  public showDefaultClanMilestones(): void {
    this.storageService.showDefaultClanMilestones();
  }

  public hideClanMilestone(ms: string): void {
    this.storageService.hideClanMilestone(ms);
  }



  private filterMilestones() {
    // todo use this
    let temp = this.state.sortedMembers.getValue().slice(0);
    temp = temp.filter(member => {
      if (this.filterActivity == null) { return true; }
      if (member.player == null) { return false; }
      if (member.player.characters == null) { return false; }
      if (member.player.characters.length === 0) { return false; }
      if (member.player.characters[0].milestones == null) { return false; }
      let comp = 0;
      let total = 0;
      member.player.characters.forEach(char => {
        total++;
        const ms = char.milestones[this.filterActivity.key];
        if (ms == null && char.baseCharacterLevel >= char.maxLevel) { comp++; } else if (ms != null && ms.complete === true) { comp++; }
      });
      if (this.filterMode === 'zero' && comp === 0) { return true; }
      if (this.filterMode === 'all' && comp === total) { return true; }
      return false;
    });
    this.filteredMembers.next(temp);
  }

}
