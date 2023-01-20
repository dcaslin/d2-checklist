import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ManifestInventoryItem, SimpleInventoryItem } from '@app/service/destiny-cache.service';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-manifest-item-icon',
  templateUrl: './manifest-item-icon.component.html',
  styleUrls: ['./manifest-item-icon.component.scss']
})
export class ManifestItemIconComponent {
  @Input() desc: SimpleInventoryItem;

}
