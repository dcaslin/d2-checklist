import { Component} from '@angular/core';
import { LeaderboardComponent } from './leaderboard.component';
import { StorageService } from '../../service/storage.service';
import { Http, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'anms-leviathan-prestige',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeviathanComponent extends LeaderboardComponent {

    getName(): string{
        return "Leviathan Raid Leaderboard";
    }

    getAssetPath(): string{
        return "/assets/leviathan.json";
    }

}
