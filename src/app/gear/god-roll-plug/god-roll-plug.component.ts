import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { InventoryPlug } from '@app/service/model';
import { NotificationService } from '@app/service/notification.service';
import { ClipboardService } from 'ngx-clipboard';
import { NgIf } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIconButton } from '@angular/material/button';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-god-roll-plug',
    templateUrl: './god-roll-plug.component.html',
    styleUrls: ['./god-roll-plug.component.scss'],
    standalone: true,
    imports: [NgIf, FaIconComponent, MatTooltip, MatIconButton]
})
export class GodRollPlugComponent {

  @Input() plug!: InventoryPlug;

  @Input() debugmode!: boolean;
  
  @Input() currentLevel!: number|null;

  constructor(
    public iconService: IconService,
    private clipboardService: ClipboardService,
    private notificationService: NotificationService) { }


  copyToClipboard() {
    this.clipboardService.copyFromContent(this.plug.hash);
    this.notificationService.success('Copied ' + this.plug.name + ' to clipboard');
  }

  

}
