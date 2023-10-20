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
  nodes: any[] = [];
  versionText: String = "";
  logTexts: any[] = [];
  runningPercent: Number = 0;
  isDebugMode: boolean = false;
  isRunning: boolean = false;
  currentRunningScript: string = "";
  searchText: string = "";
  searchScriptResult: any[] = [];
  fullLoading: boolean = false;

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

        self.nodes = [];
        scripFileShouldRun.forEach((_value, _key) => {
          self.nodes.push({
            title: _key,
            key: _key,
            expanded: true,
            checked: true,
            children: _value.map(x => {
              return {
                title: x.fileName,
                key: x.fileName,
                isLeaf: true,
                checked: true,
              }
            })
          });
        });

        if (currentVersion && lastVersion) {
          self.versionText = `Version Update: ${currentVersion} ---> ${lastVersion}`
        }


        this.modal.create({
          nzTitle: 'Script Running Confirm',
          nzContent: tplContent,
          nzClosable: false,
          nzOnOk: () => {
            let selectedScript = [];
            self.nodes.forEach(item => {
              selectedScript = [...selectedScript, ...item.children.filter(x => x.checked).map(x => x.key)]
            });
            self.tryRunningScript(versionScripFileShouldRun, scripFileShouldRun, selectedScript);
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
      runningList = [...runningList, ...value.filter(x => selectedKeys.includes(x.fileName))];
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
    this.nodes = [];
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

  nzEvent(event: any): void {
  }

  searchScript(scriptSearchContent: TemplateRef<{}>) {
    this.searchText = '';
    this.searchScriptResult = [];
    this.modal.create({
      nzTitle: 'Search Script',
      nzContent: scriptSearchContent,
      nzClosable: true,
      nzFooter: null
    })
  }

  searchInFile() {
    const self = this;
    self.fullLoading = true;
    setTimeout(() => {
      self.searchInFileDetail().then(() => {
        self.fullLoading = false;
      });
    }, 1000);

  }

  async searchInFileDetail() {
    const self = this;
    if (!self.searchText) {
      self.message.create('error', `Search text cannot be none!`);
      return;
    }

    const result = await window['electronAPI'].forEachFiles(self.sqlConfig.filepath);
    if (!result) {
      self.message.create('error', `Cannot find any script file!`);
      return;
    }

    const res = []
    for (let file of result) {
      let fileValue = await self.fileService.readFile(file.fullPath);
      if (file.fileName.includes(self.searchText) || fileValue.includes(self.searchText)) {
        res.push({ scriptName: `${file.folderName}/${file.fileName}`, scriptDetail: fileValue })
      }
    }

    self.message.create('info', `Search ${res.length} files.`);

    self.searchScriptResult = res;
  }
}
