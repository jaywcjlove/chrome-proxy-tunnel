// test-launch-fixed.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  const profileDir = path.join(os.tmpdir(), 'puppeteer_dev_profile_' + Date.now());
  try {
    fs.mkdirSync(profileDir, { recursive: true, mode: 0o700 });
    console.log('Using profile dir:', profileDir);
  } catch (e) {
    console.error('Could not create profile dir:', e);
    process.exit(1);
  }

  try {
    console.log('puppeteer executablePath():', puppeteer.executablePath());
    const browser = await puppeteer.launch({
      dumpio: true,
      headless: true,
      // userDataDir: profileDir,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-background-networking'
      ]
    });
    console.log('Launched OK');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Launch failed:', err);
    process.exit(1);
  }
})();
