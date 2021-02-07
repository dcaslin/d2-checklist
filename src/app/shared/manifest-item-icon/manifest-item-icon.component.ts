import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { ManifestInventoryItem } from '@app/service/destiny-cache.service';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-manifest-item-icon',
  templateUrl: './manifest-item-icon.component.html',
  styleUrls: ['./manifest-item-icon.component.scss']
})
export class ManifestItemIconComponent implements OnInit {
  @Input() desc: ManifestInventoryItem;
  @Input() small = false;

  constructor() { }

  ngOnInit(): void {
  }

}
