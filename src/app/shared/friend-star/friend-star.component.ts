import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { BungieNetUserInfo, UserInfo } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { IconService } from '@app/service/icon.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'd2c-friend-star',
  templateUrl: './friend-star.component.html',
  styleUrls: ['./friend-star.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FriendStarComponent implements OnInit {
  public loading: BehaviorSubject<boolean> = new BehaviorSubject(false);

  @Input() title = false;
  @Input() userInfo: UserInfo;
  @Input() favoritesMap: { [id: string]: UserInfo };

  constructor(public storageService: StorageService,
    public iconService: IconService) { }

  ngOnInit(): void {
  }

  async toggleFav() {
    try {
      this.loading.next(true);
      await this.storageService.toggleFav(this.userInfo, null);
    } finally {
      this.loading.next(false);
    }
  }
}
