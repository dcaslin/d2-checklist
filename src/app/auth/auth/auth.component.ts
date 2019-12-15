
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../service/auth.service';
import { StorageService } from '../../service/storage.service';
import { ChildComponent } from '../../shared/child.component';


@Component({
  selector: 'd2c-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthComponent extends ChildComponent implements OnInit, OnDestroy {
  msg: string;

  constructor(
    storageService: StorageService, private authService: AuthService,
    private route: ActivatedRoute, private router: Router,
    private ref: ChangeDetectorRef) {
    super(storageService);
  }

  async fetch(code: string, state: string) {
    this.msg = 'Authenticating to Bungie';
    if (code != null) {
      try {
        const success = await this.authService.fetchTokenFromCode(code, state);
        this.msg = 'Success: ' + success;
        if (success) {
          this.router.navigate(['/home']);
        }
      } catch (x) {
        this.msg = 'Error: ' + JSON.stringify(x);
        this.ref.markForCheck();
      }
    }
  }


  ngOnInit() {
    this.route.queryParams.pipe(takeUntil(this.unsubscribe$)).subscribe(queryParams => {
      const code: string = queryParams['code'];
      const state: string = queryParams['state'];
      this.fetch(code, state);
    });
  }
}
