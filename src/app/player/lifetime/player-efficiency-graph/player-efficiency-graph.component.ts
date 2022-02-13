import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PlayerStateService } from '@app/player/player-state.service';
import { AggHistoryEntry } from '@app/service/model';
import { ChartDataSets, ChartLegendOptions, ChartOptions } from 'chart.js';
import { Label } from 'ng2-charts';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-player-efficiency-graph',
  templateUrl: './player-efficiency-graph.component.html',
  styleUrls: ['./player-efficiency-graph.component.scss']
})
export class PlayerEfficiencyGraphComponent {
  public b: ChartLegendOptions;
  public chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    legend: {
      display: false
    },
    tooltips: {
      callbacks: {
        label: function (tooltipItem, data) {
          const row: any = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
          const point: AggHistoryEntry = row.z as AggHistoryEntry;
          const sEff = point.efficiency.toFixed(2);
          return point.name + ': ' + sEff + ' clear/hr';
        }
      }
    },
    scales: {
      xAxes: [{
        position: 'bottom',
        ticks: {
          callback: function (tick) {
            return tick.toString() + ' hr';
          }
        },
        scaleLabel: {
          labelString: 'Hours',
          display: true,
        }
      }],
      yAxes: [{
        ticks: {
          // callback: function (tick) {
          //   return tick.toString() + 'dB';
          // }
        },
        scaleLabel: {
          labelString: 'Completions',
          display: true
        }
      }]
    }
  };
  public chartLabels: Label[] = [];
  public chartData: ChartDataSets[] = [];


  constructor(public state: PlayerStateService,
  ) {

    const player = state.currPlayer();
    if (!player || !player.aggHistory) {
      return;
    }

    const data = [];
    for (const a of player.aggHistory) {
      const comp = a.activityCompletions;
      const hours = a.activitySecondsPlayed / (60 * 60);
      data.push({
        x: hours,
        y: comp,
        z: a
      });
    }
    this.chartData = [
      {
        pointRadius: 7,
        pointHoverRadius: 9,
        data: data,
        label: 'Activities'
      }
    ];
  }

}
