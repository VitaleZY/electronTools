import { Injectable } from '@angular/core';
import { ipcRenderer } from 'electron';

@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor() { }

  readFile(filePath: string): Promise<string> {
    return window['electronAPI'].readFile(filePath)
  }

  writeFile(filePath: string, content: string): Promise<void> {
    return window['electronAPI'].writeFile(filePath, content)
  }
}
