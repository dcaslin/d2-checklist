import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BungieService } from '@app/service/bungie.service';
import { IconService } from '@app/service/icon.service';
import { FriendListEntry, Player, UserInfo } from '@app/service/model';
import { StorageService } from '../../service/storage.service';
import { ChildComponent } from '../../shared/child.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatAnchor } from '@angular/material/button';
import { NgIf, NgFor, DecimalPipe, AsyncPipe } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { MilestoneCheckComponent } from '../../shared/milestone-check/milestone-check.component';
import { AgoHumanizedPipe } from '../../shared/pipe/timing.pipe';


@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-friends',
    templateUrl: './friends.component.html',
    styleUrls: ['./friends.component.scss'],
    standalone: true,
    imports: [FaIconComponent, MatAnchor, NgIf, MatProgressSpinner, NgFor, MatTooltip, RouterLink, MilestoneCheckComponent, AgoHumanizedPipe, DecimalPipe, AsyncPipe]
})
export class FriendsComponent extends ChildComponent {
  public members = signal<FriendListEntry[]>([]);
  modelPlayer!: Player;
  playerCntr!: 0;

  constructor(private bungieService: BungieService, public iconService: IconService,
    private router: Router,
    private ref: ChangeDetectorRef) {
    super();
    effect(() => {
      const x = this.favoritesList$();
      const members: FriendListEntry[] = [];
      for (const f of x) {
        const member = new FriendListEntry();
        member.user = f;
        members.push(member);
      }
      this.members.set(members);
      this.load();
    });
  }

  public  async loadPlayer(friend: FriendListEntry): Promise<void> {
    const x = await this.bungieService.getChars(friend.user.membershipType, friend.user.membershipId,
      ['Profiles', 'Characters', 'CharacterProgressions', 'ProfileProgression', 'ItemObjectives',
      'CharacterEquipment', 'ItemInstances', 'CharacterInventories', 'ProfileInventories',
      'CharacterActivities', 'Records', 'Collectibles', 'PresentationNodes'
    ], true, true);
    if (this.modelPlayer == null && x != null && x.characters != null) {
      this.modelPlayer = x;
    }
    friend.player$.next(x);
    if (x != null && x.characters != null) {
      // in case this is a retry
      friend.errorMsg$.next(null);
    } else {
      friend.errorMsg$.next('Unable to load player data');
    }
  }

  private async slowlyLoadRest(): Promise<void> {
    this.ref.markForCheck();
    if (this.playerCntr >= this.members().length) {
      return;
    }

    try {
      await this.loadPlayer(this.members()[this.playerCntr]);
      this.playerCntr++;
      this.slowlyLoadRest();
    } catch (err) {
      console.dir(err);
      // reloading mid load can break this
      if (this.members()[this.playerCntr] != null) {
        console.log('Skipping error on ' + this.members()[this.playerCntr].user.displayName + ' and continuing');
        this.playerCntr++;
        this.slowlyLoadRest();
      }
    }
  }

  public showAllMilestones(): void {
    this.storageService.showAllMilestones();
  }

  public hideMilestone(ms: string): void {
    this.storageService.hideMilestone(ms);
  }


  public load() {
    this.loading.set(true);
    this.modelPlayer = null!;
    this.playerCntr = 0;
    for (const m of this.members()) {
      m.player$.next(null);
      m.errorMsg$.next(null);
    }
    try {
      this.slowlyLoadRest();
    }
    finally {
      this.loading.set(false);
    }
  }

}
