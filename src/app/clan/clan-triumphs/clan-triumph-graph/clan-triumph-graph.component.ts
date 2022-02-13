import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PlayerTriumph } from '@app/clan/clan-state.service';
import { ChartConfiguration, ChartType } from 'chart.js';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-clan-triumph-graph',
  templateUrl: './clan-triumph-graph.component.html',
  styleUrls: ['./clan-triumph-graph.component.scss']
})
export class ClanTriumphGraphComponent {
  public chartType: ChartType = 'bar';
  public chartData: ChartConfiguration['data'] = {
    datasets: [],
    labels: []
  };
  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Percent Complete'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Players'
        }
      },
    }    
  };


  @Input()
  set data(all: PlayerTriumph[]) {
    this.chartData.labels = [];
    const dataDict = {};
    const data = [];
    for (const pt of all) {
      const val = Math.ceil(pt.data.percent / 10) * 10;
      if (dataDict[val] == null) {
        dataDict[val] = 1;
      } else {
        dataDict[val]++;
      }
    }
    for (let cntr = 0; cntr <= 100; cntr += 10) {
      this.chartData.labels.push(cntr + '%');
      if (!dataDict[cntr]) {
        data.push(0);
      } else {
        data.push(dataDict[cntr]);
      }
    }
    this.chartData.datasets = [
      {
        data: data,
        label: 'Players'
      }
    ];
  }

}
