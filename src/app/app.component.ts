import { Component, OnInit, ViewChild } from '@angular/core';
import { SQLConfigSettingComponent } from './myComponent/sqlconfig-setting/sqlconfig-setting.component';
import { MainContentComponent } from './myComponent/main-content/main-content.component';
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
  @ViewChild(MainContentComponent, null) mainContent: MainContentComponent;

  isCollapsed = false;
  configs: SQLConfig[] = [];
  isSpinning: boolean = false;
  public currentIndex = 0;
  runningScript: boolean = false;

  ngOnInit(): void {
    this.loadConfig()
  }

  constructor(public fileService: FileService, public message: NzMessageService) {
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

  itemClick(event: MouseEvent, index: number) {
    if (this.currentIndex !== index) {
      this.mainContent.clearRunningTempValue();
      this.currentIndex = index;
    }

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

  public showLaoding() {
    this.isSpinning = true;
  }

  public hideLaoding() {
    this.isSpinning = false;
  }

  public setRunningScript(status: boolean): void {
    this.runningScript = status;
  }
}