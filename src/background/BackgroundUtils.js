import browser from 'webextension-polyfill';
import { waitTabLoaded } from '@/workflowEngine/helper';

class BackgroundUtils {
  /**
   * @param url {string}
   * @param options {{
   *   updateTab?: boolean;
   *   tabIdToClose?: number;
   * }}
   * @returns {Promise<void>}
   */
  static async openDashboard(url, options = {}) {
    const { updateTab, tabIdToClose } = {
      updateTab: true,
      ...options,
    };

    const tabUrl = browser.runtime.getURL(
      `/newtab.html#${typeof url === 'string' ? url : ''}`
    );
    const createWin = async () => {
      const curWin = await browser.windows.getCurrent();
      const windowOptions = {
        top: 0,
        left: 0,
        width: Math.min(curWin.width, 715),
        height: Math.min(curWin.height, 715),
        url: tabUrl,
        type: 'popup',
      };

      if (updateTab) {
        windowOptions.focused = true;
      }

      await browser.windows.create(windowOptions);
    };

    try {
      if (tabIdToClose) {
        await createWin();
        await browser.tabs.remove(tabIdToClose);
        return;
      }

      const [tab] = await browser.tabs.query({
        url: browser.runtime.getURL('/newtab.html'),
      });

      if (tab) {
        const tabOptions = { active: true };
        if (updateTab) tabOptions.url = tabUrl;

        await browser.tabs.update(tab.id, tabOptions);

        if (updateTab) {
          await browser.windows.update(tab.windowId, {
            focused: true,
            state: 'maximized',
          });
        }
      } else {
        await createWin();
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async openTab(url) {
    await browser.tabs.create({ url });
  }

  static async sendMessageToDashboard(type, data) {
    const [tab] = await browser.tabs.query({
      url: browser.runtime.getURL('/newtab.html'),
    });

    await waitTabLoaded({ tabId: tab.id });
    const result = await browser.tabs.sendMessage(tab.id, { type, data });

    return result;
  }
}

export default BackgroundUtils;
