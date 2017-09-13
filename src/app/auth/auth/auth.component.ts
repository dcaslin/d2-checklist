import { Component, OnInit, OnDestroy } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';
import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { BungieService} from "../../service/bungie.service";
import { StorageService } from '../../service/storage.service';
import { AuthService } from '../../service/auth.service';
import {ChildComponent} from '../../shared/child.component';

@Component({
  selector: 'anms-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent  extends ChildComponent implements OnInit, OnDestroy {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;

  constructor(private bungieService: BungieService, 
    storageService: StorageService, private authService: AuthService,
    private route: ActivatedRoute, private router: Router) {
    super(storageService);
  }

  private sub: any;
  msg: string;

  ngOnInit() {
    this.sub = this.route.queryParams.takeUntil(this.unsubscribe$).subscribe(queryParams => {
      const code: string = queryParams['code'];
      const state: string = queryParams['state'];

      this.msg = "Authenticating to Bungie";
      if (code!=null){
        this.authService.fetchTokenFromCode(code, state).then((success:boolean)=>{
          
          this.msg = "Success: "+success;
          if (success){
            this.router.navigate(["/home"]);
          }
          console.log("Success fetching token: "+success);

        }).catch(x=>{
          this.msg = JSON.stringify(x);
        });
      }
    });
  }
}
