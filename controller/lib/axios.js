const axios = require('axios');
const MY_TOKEN = process.env.TELEGRAM_TOKEN;

const BASE_URL = `https://api.telegram.org/bot${MY_TOKEN}`;
const WEBHOOK_URL = process.env.SERVER_URL + "/webhook/" + MY_TOKEN;

function getAxiosInstance() {
    return {
        get(method, params) {
            return axios.get(`/${method}`, {
                baseURL: BASE_URL,
                params,
            });
        },
        post(method, data) {
            return axios.post(`/${method}`, data, {
                baseURL: BASE_URL,
            });
        }
    };
}

async function init() {
    const res = await axios.get(`${BASE_URL}/setWebhook?url=${WEBHOOK_URL}`);
    console.log(res.data);
}

module.exports = {
    axiosInstance: getAxiosInstance(),
    init
};