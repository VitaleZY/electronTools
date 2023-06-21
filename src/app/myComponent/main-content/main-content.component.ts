import { Component, OnInit, Input, Output, TemplateRef, EventEmitter } from '@angular/core';
import { SQLConfig } from 'src/dto/sqlConfig';
import { NzModalService } from 'ng-zorro-antd/modal';
import { FileService } from 'src/app/file-service.service';
import { NzMessageService } from 'ng-zorro-antd/message';




@Component({
  selector: 'app-main-content',
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.less']
})
export class MainContentComponent implements OnInit {
  @Input() sqlConfig: SQLConfig;
  @Output() notify: EventEmitter<boolean> = new EventEmitter<boolean>();
  checkBoxTempOptions: any[] = [];
  versionText: String = "";
  logTexts: any[] = [];
  runningPercent: Number = 0;
  isDebugMode: boolean = false;
  isRunning: boolean = false;
  currentRunningScript: string = "";

  constructor(public modal: NzModalService, public fileService: FileService, public message: NzMessageService) { }

  ngOnInit() { }

  runScript(tplContent: TemplateRef<{}>) {
    const self = this;
    self.setScriptRunningStatus(true);
    self.clearRunningTempValue();
    const filesTask = window['electronAPI'].forEachFiles(self.sqlConfig.filepath);
    const versionTask = window["electronAPI"].sqlQuery(self.sqlConfig, "select * from TFsysInfo where InfoID = 'DBVERSION'");
    const versionScripFileShouldRun = new Map<String, any[]>();
    const scripFileShouldRun = new Map<String, any[]>();
    let currentVersion;
    let lastVersion;
    Promise.all([filesTask, versionTask])
      .then((results) => {
        currentVersion = results[1].recordset[0].InfoValue;
        results[0].sort((a, b) => {
          if (a.folderName < b.folderName) {
            return -1;
          }
          if (a.folderName > b.folderName) {
            return 1;
          }
          return 0;
        }).forEach(item => {
          const version = self.tryConvertToVersionNumber(item.folderName);
          if (version) {
            if (Number(version.replace(/\./g, "")) > Number(currentVersion.replace(/\./g, ""))) {
              lastVersion = version;
              self.trySetMapValue(versionScripFileShouldRun, item.folderName, item);
            }
          }
          else {
            self.trySetMapValue(scripFileShouldRun, item.folderName, item);
          }

        });
        self.checkBoxTempOptions = [];

        scripFileShouldRun.forEach((_, key) => {
          self.checkBoxTempOptions.push({
            label: key, value: key, checked: true
          })
        });

        if (currentVersion && lastVersion) {
          self.versionText = `Version Update: ${currentVersion} ---> ${lastVersion}`
        }


        this.modal.create({
          nzTitle: 'Script Running Confirm',
          nzContent: tplContent,
          nzClosable: false,
          nzOnOk: () => {
            self.tryRunningScript(versionScripFileShouldRun, scripFileShouldRun, self.checkBoxTempOptions.filter(x => x.checked).map(x => x.value));
            return true;
          },
          nzOnCancel: () => {
            self.setScriptRunningStatus(false);
          }
        });
      })
      .catch(err => {
        this.message.create('error', `Run Script Error.`);
        self.setScriptRunningStatus(false);
      });
  }

  tryConvertToVersionNumber(folderName) {
    const matchRegex = folderName.match(/^\d+\.\d+\.\d+/);
    return matchRegex && matchRegex[0]
  }

  trySetMapValue(mapList, key, item) {
    if (mapList.has(key)) {
      mapList.get(key).push(item);
    }
    else {
      mapList.set(key, [item]);
    }
  }

  async tryRunningScript(versionScripts: Map<String, any[]>, otherScripts: Map<String, any[]>, selectedKeys: String[]) {
    const self = this;
    let hasRunCount = 0;
    let runningList = [];

    for (const [key, value] of versionScripts) {
      runningList = [...runningList, ...value];
    }

    for (const [key, value] of otherScripts) {
      if (selectedKeys.includes(key)) {
        runningList = [...runningList, ...value];
      }

    }

    for (const item of runningList) {
      try {
        let fileValue = await self.fileService.readFile(item.fullPath);
        self.currentRunningScript = item.fileName;
        if (self.isDebugMode) {
          self.logTexts.push({ type: 'info', text: `${item.folderName}/${item.fileName}` });
          self.logTexts.push({ text: fileValue });
        }
        else {
          const execResult = await window["electronAPI"].sqlQuery(self.sqlConfig, fileValue);
          self.logTexts.push({ type: 'success', text: `${item.folderName}/${item.fileName}` });
        }
      }
      catch (ex) {
        self.logTexts.push({ type: 'error', text: `${item.folderName}/${item.fileName}` });
        self.logTexts.push({ text: `${ex}` });
      }
      finally {
        hasRunCount++;
        self.runningPercent = hasRunCount / runningList.length * 100;
      }
    }

    self.currentRunningScript = "";
    !self.isDebugMode && await self.saveLogIntoFile();
    self.setScriptRunningStatus(false);
  }

  public clearRunningTempValue() {
    this.checkBoxTempOptions = [];
    this.versionText = "";
    this.logTexts = [];
    this.runningPercent = 0;
  }

  setScriptRunningStatus(status: boolean): void {
    this.notify.emit(status);
    this.isRunning = status;
  }

  async saveLogIntoFile(): Promise<void> {
    await this.fileService.writeFile(`./logs/${new Date().valueOf()}_log.log`, this.logTexts.map(x => `${x.type ? x.type.toUpperCase() : ''} ${x.text}`).join('\r\n'))
  }

}
