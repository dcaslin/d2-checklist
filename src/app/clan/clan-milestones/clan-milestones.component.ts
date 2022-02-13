import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { BungieGroupMember } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ClanStateService } from '../clan-state.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-clan-milestones',
  templateUrl: './clan-milestones.component.html',
  styleUrls: ['./clan-milestones.component.scss']
})
export class ClanMilestonesComponent extends ChildComponent {  
  public filteredMembers: BehaviorSubject<BungieGroupMember[]> = new BehaviorSubject([]);

  constructor(
    public state: ClanStateService,
    storageService: StorageService, public iconService: IconService) {
    super(storageService);
    this.state.sortedMembers.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(
        x => {
          this.filterMilestones();
        });
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
    let temp = this.state.sortedMembers.getValue().slice(0);
    temp = temp.filter(member => {
      if (member.currentPlayer() == null) { return false; }
      if (member.currentPlayer().characters == null) { return false; }
      if (member.currentPlayer().characters.length === 0) { return false; }
      if (member.currentPlayer().characters[0].milestones == null) { return false; }
      return true;
    });
    this.filteredMembers.next(temp);
  }

}
