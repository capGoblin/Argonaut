import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const MY_TOKEN = process.env.TELEGRAM_TOKEN;
const SERVER_URL = process.env.SERVER_URL;

if (!MY_TOKEN || !SERVER_URL) {
  throw new Error(
    "TELEGRAM_TOKEN or SERVER_URL is not defined in environment variables"
  );
}

const BASE_URL = `https://api.telegram.org/bot${MY_TOKEN}/test`;
const WEBHOOK_URL = `${SERVER_URL}/webhook/${MY_TOKEN}`;

interface CustomAxiosInstance {
  get(method: string, params?: any): Promise<any>;
  post(method: string, data?: any): Promise<any>;
}

function getAxiosInstance(): CustomAxiosInstance {
  return {
    get(method: string, { params } = {}) {
      return axios({
        method: "get",
        url: `${BASE_URL}/${method}`,
        params,
      });
    },
    post(method: string, data?: any) {
      return axios({
        method: "post",
        url: `${BASE_URL}/${method}`,
        data,
      });
    },
  };
}

export async function init(): Promise<void> {
  const res = await axios.get(`${BASE_URL}/setWebhook?url=${WEBHOOK_URL}`);
  console.log(res.data);
}

export const axiosInstance = getAxiosInstance();
