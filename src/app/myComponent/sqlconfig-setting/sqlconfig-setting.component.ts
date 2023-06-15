import { Component, OnInit } from '@angular/core';
import { SQLConfig } from 'src/dto/sqlConfig';
import { NzMessageService } from 'ng-zorro-antd/message';


@Component({
  selector: 'app-sqlconfig-setting',
  templateUrl: './sqlconfig-setting.component.html',
  styleUrls: ['./sqlconfig-setting.component.less']
})
export class SQLConfigSettingComponent implements OnInit {
  public passwordVisible: boolean = false
  private currentConfig: SQLConfig = new SQLConfig();
  private editReslove: (value: SQLConfig | PromiseLike<SQLConfig>) => void;

  constructor(private message: NzMessageService) { }

  ngOnInit() {
  }

  isVisible = false;
  isConfirmLoading = false;

  async showModal(): Promise<SQLConfig> {
    return await this.editConfig(new SQLConfig());
  }

  async editConfig(config: SQLConfig): Promise<SQLConfig> {
    const self = this;
    self.currentConfig = JSON.parse(JSON.stringify(config))
    self.isVisible = true;
    return new Promise<SQLConfig>((reslove, reject) => {
      self.editReslove = reslove
    });
  }

  handleOk(): void {
    this.isConfirmLoading = true;
    setTimeout(() => {
      this.isVisible = false;
      this.isConfirmLoading = false;
      this.submitForm();
    }, 1000);
  }

  handleCancel(): void {
    this.isVisible = false;
    this.editReslove = null;
  }


  submitForm(): void {
    this.editReslove && this.editReslove(this.currentConfig)
  }

  async TestSqlConnect(): Promise<void> {
    const self = this;
    const config = {
      user: self.currentConfig.username,
      password: self.currentConfig.password,
      server: self.currentConfig.host === '.' ? 'localhost' : self.currentConfig.host,
      database: self.currentConfig.database,
    }
    try {
      await window["electronAPI"].sqlQuery(config, "select * from TFsysInfo where InfoID = 'DBVERSION'")
      this.message.create('success', `Connect SQL Server service success.`);
    }
    catch {
      this.message.create('error', `Cannot connect SQL Server service.`);
    }
  }

}
