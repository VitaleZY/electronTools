import { Component, OnInit } from '@angular/core';
import { SQLConfig } from 'src/dto/sqlConfig';

@Component( {
  selector: 'app-sqlconfig-setting',
  templateUrl: './sqlconfig-setting.component.html',
  styleUrls: ['./sqlconfig-setting.component.less']
} )
export class SQLConfigSettingComponent implements OnInit {
  public passwordVisible: boolean = false
  private currentConfig: SQLConfig = new SQLConfig();
  private editReslove: ( value: void | PromiseLike<void> ) => void;

  constructor () { }

  ngOnInit() {
  }

  isVisible = false;
  isConfirmLoading = false;

  showModal(): void {
    this.currentConfig = new SQLConfig();
    this.isVisible = true;
  }

  async editConfig( config: SQLConfig ): Promise<void> {
    const self = this;
    self.currentConfig = config;
    self.isVisible = true;
    return new Promise( ( reslove, reject ) => {
      self.editReslove = reslove
    } );
  }

  handleOk(): void {
    this.isConfirmLoading = true;
    setTimeout( () => {
      this.isVisible = false;
      this.isConfirmLoading = false;
      this.submitForm();
    }, 1000 );
  }

  handleCancel(): void {
    this.isVisible = false;
    this.editReslove = null;
  }


  submitForm(): void {
    this.editReslove && this.editReslove()
  }

}
