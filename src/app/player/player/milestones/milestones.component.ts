import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input } from '@angular/core';
import { ChildComponent } from '@app/shared/child.component';
import { StorageService } from '@app/service/storage.service';
import { Player, MileStoneName } from '@app/service/model';
import { BungieService } from '@app/service/bungie.service';

@Component({
  selector: 'anms-milestones',
  templateUrl: './milestones.component.html',
  styleUrls: ['./milestones.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MilestonesComponent extends ChildComponent implements OnInit {
  @Input() player: Player;

  hideCompleteChars: string = null;
  sort = 'rewardsDesc';


  @Input()
  set currPlayer(arg: Player) {
    this.player = arg;
    if (this.player != null) {
      this.sort = 'rewardsDesc';
      this.sortMileStones();
      if (this.player.characters != null) {
        this.updateAggHistory();
      }
    }
  }

  constructor(
    storageService: StorageService,
    private bungieService: BungieService,
    private ref: ChangeDetectorRef) {
    super(storageService, ref);
  }

  ngOnInit() {
  }

  async updateAggHistory() {
    await this.bungieService.updateAggHistory(this.player.characters);
    this.ref.markForCheck();
  }

  public showAllMilestones(): void {
    this.storageService.showAllMilestones();
    this.hideCompleteChars = null;
  }

  public hideMilestone(ms: string): void {
    this.storageService.hideMilestone(ms);
  }

  public toggleHide(hideMe: string) {
    if (this.hideCompleteChars === hideMe) {
      this.hideCompleteChars = null;
    } else {
      this.hideCompleteChars = hideMe;
    }
  }

  public hideRow(mileStoneName: MileStoneName): boolean {
    if (this.hideCompleteChars == null) { return false; }
    let allDone = true;
    for (const char of this.player.characters) {
      let doneChar = false;
      if (char.milestones[mileStoneName.key] != null) {
        if (char.milestones[mileStoneName.key].complete === true) {
          if (this.hideCompleteChars === char.characterId) { return true; }
          doneChar = true;
        }
      } else if (char.baseCharacterLevel >= char.maxLevel) {
        if (char.milestones[mileStoneName.key] == null && !mileStoneName.neverDisappears) {
          if (this.hideCompleteChars === char.characterId) { return true; }
          doneChar = true;
        }
      }
      allDone = allDone && doneChar;
    }
    if (this.hideCompleteChars === 'ALL' && allDone) { return true; }
    return false;
  }

  public sortByName(): void {
    if (this.sort === 'nameAsc') {
      this.sort = 'nameDesc';
    } else {
      this.sort = 'nameAsc';
    }
    this.sortMileStones();
  }
  public sortByReset(): void {
    if (this.sort === 'resetDesc') {
      this.sort = 'resetAsc';
    } else {
      this.sort = 'resetDesc';
    }
    this.sortMileStones();
  }

  public sortByRewards(): void {
    if (this.sort === 'rewardsDesc') {
      this.sort = 'rewardsAsc';
    } else {
      this.sort = 'rewardsDesc';
    }
    this.sortMileStones();
  }
  private sortMileStones() {
    if (this.player == null || this.player.milestoneList.getValue() == null) { return; }
    if (this.sort === 'rewardsDesc') {
      this.player.milestoneList.getValue().sort((a, b) => {
        if (a.pl < b.pl) { return 1; }
        if (a.pl > b.pl) { return -1; }
        if (a.rewards < b.rewards) { return 1; }
        if (a.rewards > b.rewards) { return -1; }
        if (a.name > b.name) { return 1; }
        if (a.name < b.name) { return -1; }
        return 0;
      });
    } else if (this.sort === 'rewardsAsc') {
      this.player.milestoneList.getValue().sort((a, b) => {
        if (a.pl < b.pl) { return -1; }
        if (a.pl > b.pl) { return 1; }
        if (a.rewards < b.rewards) { return -1; }
        if (a.rewards > b.rewards) { return 1; }
        if (a.name > b.name) { return 1; }
        if (a.name < b.name) { return -1; }
        return 0;
      });
    } else if (this.sort === 'resetDesc') {
      this.player.milestoneList.getValue().sort((a, b) => {
        if (a.resets == null && b.resets != null) { return 1; }
        if (a.resets != null && b.resets == null) { return -1; }
        if (a.resets == null && b.resets == null) { return 0; }
        if (a.resets < b.resets) { return 1; }
        if (a.resets > b.resets) { return -1; }
        if (a.name > b.name) { return 1; }
        if (a.name < b.name) { return -1; }
        return 0;
      });
    } else if (this.sort === 'resetAsc') {
      this.player.milestoneList.getValue().sort((a, b) => {

        if (a.resets == null && b.resets != null) { return -1; }
        if (a.resets != null && b.resets == null) { return 1; }
        if (a.resets == null && b.resets == null) { return 0; }
        if (a.resets < b.resets) { return -1; }
        if (a.resets > b.resets) { return 1; }
        if (a.name > b.name) { return 1; }
        if (a.name < b.name) { return -1; }
        return 0;
      });
    } else if (this.sort === 'nameAsc') {
      this.player.milestoneList.getValue().sort((a, b) => {
        if (a.name > b.name) { return 1; }
        if (a.name < b.name) { return -1; }
        return 0;
      });
    } else if (this.sort === 'nameDesc') {
      this.player.milestoneList.getValue().sort((a, b) => {
        if (a.name > b.name) { return -1; }
        if (a.name < b.name) { return 1; }
        return 0;
      });
    }

  }


}
