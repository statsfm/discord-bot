import axios from 'axios';
import { URLSearchParams } from 'url';

axios.defaults.validateStatus = function validate(): boolean {
  return true;
};

export interface IResponse<T> {
  data?: T;
  status: boolean;
}

export interface IUserData {
  id: string;
  displayName: string;
  disabled: string;
  email: string;
  image: string;
  country: string;
  product: string;
  userSettingsId: number;
  apiClientId: string;
  isPlus: boolean;
  shareSettings: string;
}

export class SpotistatsAPI {
  constructor(private apiURL: string, private authToken: string) {
    this.apiURL = apiURL;
    this.authToken = authToken;
  }

  async getUserDataFromCode(code: string): Promise<IResponse<IUserData>> {
    const res = await axios.post(
      `${this.apiURL}/import/code`,
      new URLSearchParams(`code=${code}`).toString(),
      {
        data: `code=${code}`,
        headers: {
          Authorization: this.authToken,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    if (res.status !== 200) return { status: false };

    return { data: res.data.data, status: true };
  }

  async getUserDataFromId(id: string): Promise<IResponse<IUserData>> {
    const res = await axios.get(`${this.apiURL}/plus/status/${encodeURIComponent(id)}`, {
      headers: {
        Authorization: this.authToken
      }
    });
    if (res.status !== 200) return { status: false };

    return { data: res.data.data, status: true };
  }
}
