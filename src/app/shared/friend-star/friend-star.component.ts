import { ChangeDetectionStrategy, Component, Input, signal} from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { UserInfo } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import {} from 'rxjs';
import { NgIf } from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-friend-star',
    templateUrl: './friend-star.component.html',
    styleUrls: ['./friend-star.component.scss'],
    standalone: true,
    imports: [NgIf, MatIconButton, FaIconComponent]
})
export class FriendStarComponent {
  public loading = signal<boolean>(false);

  @Input() title = false;
  @Input() userInfo!: UserInfo;
  @Input() favoritesMap!: { [id: string]: UserInfo };

  constructor(public storageService: StorageService,
    public iconService: IconService) { }


  async toggleFav() {
    try {
      this.loading.set(true);
      await this.storageService.toggleFav(this.userInfo, null!);
    } finally {
      this.loading.set(false);
    }
  }
}
