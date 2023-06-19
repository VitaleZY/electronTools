import { Component, OnInit, Input } from '@angular/core';
import { SQLConfig } from 'src/dto/sqlConfig';

@Component({
  selector: 'app-main-content',
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.less']
})
export class MainContentComponent implements OnInit {
  @Input() sqlConfig: SQLConfig;

  constructor() { }

  ngOnInit() {
  }

}
