
import { WEB_APP_URL } from '../constants';
import { Participant, Result } from '../types';

const isPlaceholder = (url: string) => url === "YOUR_APPS_SCRIPT_URL_HERE" || !url.startsWith("https://script.google.com");

export const gasService = {
  async getParticipants(): Promise<Participant[]> {
    if (isPlaceholder(WEB_APP_URL)) {
      throw new Error("WEB_APP_URL chưa được cấu hình. Vui lòng cập nhật constants.ts");
    }
    
    try {
      const response = await fetch(`${WEB_APP_URL}?action=getParticipants`, {
        method: 'GET',
        cache: 'no-store'
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (e) {
      console.error('Fetch participants failed:', e);
      throw e;
    }
  },

  async getResults(): Promise<Result[]> {
    if (isPlaceholder(WEB_APP_URL)) return [];
    
    try {
      const response = await fetch(`${WEB_APP_URL}?action=getResults`, {
        method: 'GET',
        cache: 'no-store'
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (e) {
      console.error('Fetch results failed:', e);
      return []; // Return empty instead of crashing if results fail
    }
  },

  async saveResult(result: Result): Promise<boolean> {
    if (isPlaceholder(WEB_APP_URL)) return false;

    try {
      // POST to GAS often requires mode: 'no-cors' to avoid preflight issues 
      // unless you handle OPTIONS in GS. We use a simple request pattern here.
      await fetch(`${WEB_APP_URL}?action=saveResult`, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain', // Avoid preflight
        },
        body: JSON.stringify(result)
      });
      return true;
    } catch (e) {
      console.error('Save result failed:', e);
      return false;
    }
  },

  async resetResults(): Promise<boolean> {
    if (isPlaceholder(WEB_APP_URL)) return false;
    try {
      await fetch(`${WEB_APP_URL}?action=resetResults`, {
        method: 'POST',
        mode: 'no-cors'
      });
      return true;
    } catch (e) {
      return false;
    }
  }
};
