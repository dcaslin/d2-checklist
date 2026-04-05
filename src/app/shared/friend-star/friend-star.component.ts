import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { UserInfo } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { BehaviorSubject } from 'rxjs';
import { NgIf, AsyncPipe } from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-friend-star',
    templateUrl: './friend-star.component.html',
    styleUrls: ['./friend-star.component.scss'],
    standalone: true,
    imports: [NgIf, MatIconButton, FaIconComponent, AsyncPipe]
})
export class FriendStarComponent {
  public loading: BehaviorSubject<boolean> = new BehaviorSubject(false);

  @Input() title = false;
  @Input() userInfo!: UserInfo;
  @Input() favoritesMap!: { [id: string]: UserInfo };

  constructor(public storageService: StorageService,
    public iconService: IconService) { }


  async toggleFav() {
    try {
      this.loading.next(true);
      await this.storageService.toggleFav(this.userInfo, null!);
    } finally {
      this.loading.next(false);
    }
  }
}
