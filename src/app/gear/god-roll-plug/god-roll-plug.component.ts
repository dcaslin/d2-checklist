import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { InventoryPlug } from '@app/service/model';
import { NotificationService } from '@app/service/notification.service';
import { ClipboardService } from 'ngx-clipboard';
import { IconService } from '@app/service/icon.service';

@Component({
  selector: 'd2c-god-roll-plug',
  templateUrl: './god-roll-plug.component.html',
  styleUrls: ['./god-roll-plug.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GodRollPlugComponent implements OnInit {

  @Input()
  plug: InventoryPlug;

  @Input()
  debugmode: boolean;

  constructor(
    public iconService: IconService,
    private clipboardService: ClipboardService,
    private notificationService: NotificationService) { }


  copyToClipboard() {
    this.clipboardService.copyFromContent(this.plug.hash);
    this.notificationService.success('Copied ' + this.plug.name + ' to clipboard');
  }

  ngOnInit() {
  }

}
