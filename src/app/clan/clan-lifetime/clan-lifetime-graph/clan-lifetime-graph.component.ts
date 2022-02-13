import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PlayerAggHistoryEntry } from '@app/clan/clan-state.service';
import { ChartDataSets, ChartLegendOptions, ChartOptions } from 'chart.js';
import { Label } from 'ng2-charts';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-clan-lifetime-graph',
  templateUrl: './clan-lifetime-graph.component.html',
  styleUrls: ['./clan-lifetime-graph.component.scss']
})
export class ClanLifetimeGraphComponent {
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
          const point: PlayerAggHistoryEntry = row.z as PlayerAggHistoryEntry;
          const hrs = (point.data.activitySecondsPlayed / (60 * 60)).toFixed(2);
          return point.data.activityCompletions + ' clears / '
            + hrs + ' hrs: ' + point.member.destinyUserInfo.displayName;
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


  @Input()
  set data(all: PlayerAggHistoryEntry[]) {
    this.chartLabels = [];
    const data = [];
    for (const pt of all) {
      const comp = pt.data.activityCompletions;
      const hours = pt.data.activitySecondsPlayed / (60 * 60);
      data.push({
        x: hours,
        y: comp,
        z: pt
      });
    }
    this.chartData = [
      {
        pointRadius: 7,
        pointHoverRadius: 9,
        data: data,
        label: 'Members'
      }
    ];
  }  

}
