import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { IconDefinition } from '@fortawesome/pro-light-svg-icons';

@Component({
  selector: 'd2c-icon',
  template: `<fa-icon [icon]="iconObject"></fa-icon>`,
  styleUrls: ['./icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconComponent {

  public iconObject: IconDefinition

  /**
   * This should match the name of an icon from the icon service
   */
  @Input() set icon(value: string) {
    this.iconObject = this.iconService[value];
  }

  constructor(private iconService: IconService) { }

}
