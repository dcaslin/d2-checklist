import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { BungieGroupMember } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { ClanStateService } from '../clan-state.service';
import { NgIf, NgTemplateOutlet, NgFor, AsyncPipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { FriendStarComponent } from '../../shared/friend-star/friend-star.component';
import { MilestoneCheckComponent } from '../../shared/milestone-check/milestone-check.component';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-clan-milestones',
    templateUrl: './clan-milestones.component.html',
    styleUrls: ['./clan-milestones.component.scss'],
    imports: [NgIf, MatButton, FaIconComponent, NgTemplateOutlet, NgFor, MatTooltip, RouterLink, FriendStarComponent, MilestoneCheckComponent, AsyncPipe]
})
export class ClanMilestonesComponent extends ChildComponent {
  public filteredMembers = signal<BungieGroupMember[]>([]);

  constructor(
    public state: ClanStateService,
    public iconService: IconService) {
    super();
    effect(() => {
      const _members = this.state.sortedMembers();
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
      if (member!.currentPlayer()!.characters == null) { return false; }
      if (member!.currentPlayer()!.characters!.length === 0) { return false; }
      if (member!.currentPlayer()!.characters[0].milestones == null) { return false; }
      return true;
    });
    this.filteredMembers.set(temp);
  }

}
