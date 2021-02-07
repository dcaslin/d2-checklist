import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { SizeProp } from '@fortawesome/fontawesome-svg-core';
import { IconDefinition } from '@fortawesome/pro-light-svg-icons';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-icon',
  template: `<fa-icon [size]="size" [icon]="iconObject"></fa-icon>`,
  styleUrls: ['./icon.component.scss']
})
export class IconComponent {

  public iconObject: IconDefinition

  /**
   * This should match the name of an icon from the icon service
   */
  @Input() set icon(value: string) {
    this.iconObject = this.iconService[value];
  }

  /**
   * If you want an icon that isn't the default size
   */
  @Input() size: SizeProp;

  constructor(private iconService: IconService) { }

}
