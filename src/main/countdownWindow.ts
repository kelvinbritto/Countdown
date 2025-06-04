import BrowserWinHandler from './Utilities/BrowserWinHandler.ts'
import BrowserWindowConstructorOptions = Electron.BrowserWindowConstructorOptions;

export default function createCountdownWindow (timerId: number, windowId: number, options: BrowserWindowConstructorOptions) {
  const winHandler = new BrowserWinHandler({...options, title: `Countdown ${timerId}-${windowId}`});

  winHandler.onCreated(() => {
    winHandler.loadPage(`/countdown`, {
        "timer": timerId.toString(),
        "window": windowId.toString()
      });
      //winHandler.browserWindow.webContents.openDevTools();
    });

  return winHandler
}
