import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ChildComponent } from '@app/shared/child.component';
import { StorageService } from '@app/service/storage.service';
import { ClanStateService } from '../clan-state.service';

@Component({
  selector: 'd2c-clan-milestones',
  templateUrl: './clan-milestones.component.html',
  styleUrls: ['./clan-milestones.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClanMilestonesComponent extends ChildComponent implements OnInit {

  constructor(
    public state: ClanStateService,
    storageService: StorageService) {
      super(storageService);
    }

  ngOnInit() {
  }


  // private filterPlayers() {
  //   if (this.filterMode === 'none') {
  //     this.filterActivity = null;
  //   }
  //   this.sortData();
  // }


  public showAllClanMilestones(): void {
    this.storageService.showAllClanMilestones();
  }

  public showDefaultClanMilestones(): void {
    this.storageService.showDefaultClanMilestones();
  }

  public hideClanMilestone(ms: string): void {
    this.storageService.hideClanMilestone(ms);
  }



  // private filterDataForMilestones() {
  //   // todo use this
  //   let temp = this.members.slice(0);
  //   temp = temp.filter(member => {
  //     if (this.filterActivity == null) { return true; }
  //     if (member.player == null) { return false; }
  //     if (member.player.characters == null) { return false; }
  //     if (member.player.characters.length === 0) { return false; }
  //     if (member.player.characters[0].milestones == null) { return false; }
  //     let comp = 0;
  //     let total = 0;
  //     member.player.characters.forEach(char => {
  //       total++;
  //       const ms = char.milestones[this.filterActivity.key];
  //       if (ms == null && char.baseCharacterLevel >= char.maxLevel) { comp++; } else if (ms != null && ms.complete === true) { comp++; }
  //     });
  //     if (this.filterMode === 'zero' && comp === 0) { return true; }
  //     if (this.filterMode === 'all' && comp === total) { return true; }
  //     return false;
  //   });
  //   // TODO put this somewhere this.sortedMembers.next(temp);
  // }

}
