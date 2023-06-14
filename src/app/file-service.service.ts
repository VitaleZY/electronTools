import { Injectable } from '@angular/core';
import { ipcRenderer } from 'electron';

@Injectable( {
  providedIn: 'root'
} )
export class FileService {

  constructor () { }

  readFile( filePath: string ): Promise<string> {
    return window['electronAPI'].readFile( filePath )
  }
}
