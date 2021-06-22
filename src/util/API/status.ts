/* eslint-disable camelcase */
import axios from 'axios';

interface IStatus {
  id: string;
  type: string;
  attributes: {
    url: string;
    pronounceable_name: string;
    last_checked_at: string;
    status: string;
  };
}
interface IResponse {
  data: IStatus[];
}

export class StatusAPI {
  constructor(private token: string, private apiUrl: string) {
    this.token = token;
    this.apiUrl = apiUrl;
  }

  async getStatus(): Promise<IResponse> {
    const res = await axios.get(`${this.apiUrl}/monitors`, {
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    });

    return res.data;
  }
}
