import { Component, OnInit, ViewChild } from '@angular/core';
import { SQLConfigSettingComponent } from './myComponent/sqlconfig-setting/sqlconfig-setting.component'
import { FileService } from './file-service.service';
import { SQLConfig } from 'src/dto/sqlConfig';
// import * as mysql from 'mysql'

@Component( {
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
} )
export class AppComponent implements OnInit {
  @ViewChild( SQLConfigSettingComponent, null ) sqlEditor: SQLConfigSettingComponent;

  isCollapsed = false;
  private configs: [SQLConfig]

  ngOnInit(): void {
    this.loadConfig()
  }

  constructor ( private fileService: FileService ) {
    const self = this;
    window["electronAPI"].menuClicked( ( e, value, index ) => {
      if ( value === 1 ) {
        this.sqlEditor.editConfig( this.configs[index] ).then( () => {
          console.log( self.configs );
        } );
      }
      else {
        // Delete
      }
    } )
  }

  onRightClick( event: MouseEvent, index: number ) {
    window["electronAPI"].RCM( index )
    event.preventDefault()
  }

  addClick() {
    // this.sqlEditor.showModal()
    window["electronAPI"].sqlQuery( 'select * from AbpUsers' ).then( res => {
      console.log( res );
    } )
  }

  loadConfig() {
    this.fileService.readFile( './sqlConfigs.json' ).then( res => {
      this.configs = JSON.parse( res );
      console.log( this.configs );
    } );
  }


}