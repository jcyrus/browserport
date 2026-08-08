import { ElectronAPI } from '../preload/index'

declare global {
  // `var` is required here: global augmentation does not accept let/const.
  var electronAPI: ElectronAPI
}
