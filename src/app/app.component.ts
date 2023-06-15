import { Component, OnInit, ViewChild } from '@angular/core';
import { SQLConfigSettingComponent } from './myComponent/sqlconfig-setting/sqlconfig-setting.component'
import { FileService } from './file-service.service';
import { SQLConfig } from 'src/dto/sqlConfig';
import { NzMessageService } from 'ng-zorro-antd/message';

// import * as mysql from 'mysql'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {
  @ViewChild(SQLConfigSettingComponent, null) sqlEditor: SQLConfigSettingComponent;

  isCollapsed = false;
  private configs: [SQLConfig]

  ngOnInit(): void {
    this.loadConfig()
  }

  constructor(private fileService: FileService, private message: NzMessageService) {
    const self = this;
    window["electronAPI"].menuClicked((e, value, index) => {
      if (value === 1) {
        self.sqlEditor.editConfig(self.configs[index])
          .then((config) => {
            self.configs[index] = config;
            return self.storeConfig();
          });
      }
      else {
        self.configs.splice(index, 1);
        self.storeConfig();
      }
    })
  }

  onRightClick(event: MouseEvent, index: number) {
    window["electronAPI"].RCM(index)
    event.preventDefault()
  }

  async addClick(): Promise<void> {
    const self = this;
    const result = await this.sqlEditor.showModal();
    self.configs.push(result);
    await self.storeConfig();
  }

  loadConfig() {
    this.fileService.readFile('./sqlConfigs.json').then(res => {
      this.configs = JSON.parse(res);
    });
  }

  async storeConfig() {
    try {
      await this.fileService.writeFile('./sqlConfigs.json', JSON.stringify(this.configs))
      this.message.create('success', `Save success.`);
    }
    catch {
      this.message.create('error', `Save error.`);
    }

  }


}