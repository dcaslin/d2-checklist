import { Component, OnInit, OnDestroy } from '@angular/core';
import { StorageService } from '../../service/storage.service';
import { Subject } from 'rxjs/Subject';
import { ChildComponent } from '../../shared/child.component';

@Component({
  selector: 'anms-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent extends ChildComponent implements OnInit, OnDestroy {

  theme: string = "default-theme";

  themes = [
    { value: 'default-theme', label: 'Default' },
    { value: 'light-theme', label: 'Light' },
    { value: 'black-theme', label: 'Black' },
  ];

  adChoices = [
    { value: false, label: 'Show Ads' },
    { value: true, label: 'Disable Ads' }
  ];

  constructor(storageService: StorageService) {
    super(storageService);
    this.theme = this.storageService.getItem("theme", "default-theme");

    this.storageService.settingFeed
      .takeUntil(this.unsubscribe$)
      .subscribe(
      x => {
        if (x.theme != null) {
          this.theme = x.theme;
        }
      });
    this.storageService.refresh();
  }

  ngOnInit() {
  }

  onThemeSelect({ value }) {
    this.storageService.setItem("theme", value);
  }

  onDisableAdsSelect({ value }) {
    this.storageService.setItem("disableads", value);
  }

}
