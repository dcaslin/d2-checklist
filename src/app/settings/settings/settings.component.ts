
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { NotificationService } from '@app/service/notification.service';
import { getDefaultTheme } from '@app/shared/utilities';
import { clear } from 'idb-keyval';
import { takeUntil } from 'rxjs/operators';
import { StorageService } from '../../service/storage.service';
import { ChildComponent } from '../../shared/child.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormField } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { MatOption } from '@angular/material/core';
import { MatIcon } from '@angular/material/icon';
import { MatAnchor, MatButton } from '@angular/material/button';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss'],
    standalone: true,
    imports: [MatFormField, MatSelect, FormsModule, NgFor, MatOption, NgIf, MatIcon, MatAnchor, FaIconComponent, MatButton]
})
export class SettingsComponent extends ChildComponent {

  theme;
  disableads = false;

  themes = [
    { value: 'default-theme', label: 'Light' },
    { value: 'light-theme', label: 'Pink' },
    { value: 'black-theme', label: 'Black' },
  ];

  adChoices = [
    { value: false, label: 'Show Ads' },
    { value: true, label: 'Disable Ads' }
  ];

  debugChoices = [
    { value: false, label: 'Normal' },
    { value: true, label: 'Debug' }
  ];

  constructor(public iconService: IconService,
    private notificationService: NotificationService
    ) {
    super();
    this.theme = this.storageService.getItem('theme', getDefaultTheme());

    this.storageService.settingFeed.pipe(
      takeUntilDestroyed(this.destroyRef))
      .subscribe(
      x => {
        if (x.theme != null) {
          this.theme = x.theme;
        }
        if (x.disableads != null) {
          this.disableads = x.disableads;
        }
      });
  }

  onThemeSelect({ value }: { value: string }) {
    this.storageService.setItem('theme', value);
  }

  onDisableAdsSelect({ value }: { value: string }) {
    this.storageService.setItem('disableads', value);
  }

  onDebugSelect({ value }: { value: string }) {
    this.storageService.setItem('debugmode', value);
  }

  onFailClick() {
    this.notificationService.fail('Lorem ipsum dolor sit amet, te sint laudem corrumpit quo, ad vel novum inciderint liberavisse, ' +
    ' eleifend imperdiet consetetur cu eum. Nec quot justo molestiae ut. Laoreet inciderint ad vix. Diceret facilis definitiones ' +
    ' at duo. At magna essent volumus ius. Ea rebum lucilius his.');
  }

  onInfoClick() {
    this.notificationService.info('Lorem ipsum dolor sit amet, te sint laudem corrumpit quo, ad vel novum inciderint liberavisse, ' +
    ' eleifend imperdiet consetetur cu eum. Nec quot justo molestiae ut. Laoreet inciderint ad vix. Diceret facilis definitiones ' +
    ' at duo. At magna essent volumus ius. Ea rebum lucilius his.');
  }

  onSuccessClick() {
    this.notificationService.success('Lorem ipsum dolor sit amet, te sint laudem corrumpit quo, ad vel novum inciderint liberavisse, ' +
    ' eleifend imperdiet consetetur cu eum. Nec quot justo molestiae ut. Laoreet inciderint ad vix. Diceret facilis definitiones ' +
    ' at duo. At magna essent volumus ius. Ea rebum lucilius his.');
  }

  async onClearEverything() {
    await localStorage.clear();
    await clear();
    this.notificationService.info('All data has been cleared');
  }


  async onCleanIDB() {
    await clear();
    this.notificationService.info('Site IDB has been cleared');
  }

  async onClearLocalStorage() {
    await localStorage.clear();
    this.notificationService.info('Site localstorage has been cleared');
  }

}
