export const IS_FIREFOX = BROWSER_TYPE === 'firefox';
// eslint-disable-next-line
export const ENV_HOST = process.env.ENV_HOST; // 不要用解包语法，否则webpack不能正确写入环境变量
export const AUTH_URL = `https://${ENV_HOST}/users/sign_in`;
