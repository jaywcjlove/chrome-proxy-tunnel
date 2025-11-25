// test-launch.js
const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      dumpio: true,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote'
      ]
      // 如果你想强制使用系统 Chrome，取消下面注释并改为本机路径
      // executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    });
    console.log('Launched OK');
    await browser.close();
  } catch (err) {
    console.error('Launch failed:', err);
  }
})();