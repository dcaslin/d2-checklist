
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { NotificationService } from '@app/service/notification.service';
import { takeUntil } from 'rxjs/operators';
import { StorageService } from '../../service/storage.service';
import { ChildComponent } from '../../shared/child.component';
import { IconService } from '@app/service/icon.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent extends ChildComponent implements OnInit, OnDestroy {

  theme = 'default-theme';
  disableads = false;

  themes = [
    { value: 'default-theme', label: 'Default' },
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

  constructor(storageService: StorageService,
    public iconService: IconService,
    private notificationService: NotificationService
    ) {
    super(storageService);
    this.theme = this.storageService.getItem('theme', 'default-theme');

    this.storageService.settingFeed.pipe(
      takeUntil(this.unsubscribe$))
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

  ngOnInit() {
  }

  onThemeSelect({ value }) {
    this.storageService.setItem('theme', value);
  }

  onDisableAdsSelect({ value }) {
    this.storageService.setItem('disableads', value);
  }

  onDebugSelect({ value }) {
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


}
