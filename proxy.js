import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import color from 'chalk';
import dotenv from 'dotenv'

puppeteer.use(StealthPlugin());

dotenv.config({
  path: `.env.prod`
})

/**
MARK: 文档说明

[青果] 短效代理测试脚本 -> https://www.qg.net/

短效代理：是指通过提供者接口动态获取的代理 IP，通常有效期较短，适合临时使用或频繁更换 IP 的场景。

在 .env 文件中配置代理相关环境变量，例如：

PROXY="127.0.0.1:3128"
PROXY_PROVIDER="https://share.proxy.qg.net/get?key=xxxxxxxx&num=49&area=&isp=0&format=txt&seq=\r\n&distinct=false"
PROXY_PROVIDER="https://share.proxy.qg.net/get?key=xxxxxxxx&num=10&isp=0&distinct=false&format=txt"

### 密钥
AUTHKEY="xxxxxxxx"
AUTHPWD="********"


运行脚本示例：
node scripts/proxy.js

提取工具：https://www.qg.net/tools/IPget.html?key=xxxxxx

⚠️ 注意

- 全球 http 都是不支持大陆网络使用 
- 国内网络能访问的网站（不支持翻墙）
- 国内代理访问国内，全球代理访问外网
- 短效代理需要通过 API 获取IP地址，长效代理直接配置
*/

// macOS Chrome path (adjust if needed)
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// MARK: 获取代理 IP:端口
// 从提供者拉取代理字符串（纯文本），返回一个数组，例如 ['60.188.79.124:20188', ...]
async function fetchProxyFromProvider(providerUrl, timeout = 8000) {
  if (!providerUrl) return [];
  return new Promise((resolve) => {
    try {
      const u = new URL(providerUrl);
      const lib = u.protocol === 'http:' ? http : https;
      const req = lib.get(u, { timeout }, (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { raw += chunk });
        res.on('end', () => {
          try {
            // 去掉 BOM
            raw = raw.replace(/^\uFEFF/, '');
            // 优先使用明确的 ip:port 正则提取所有匹配项
            const ipPortRe = /(?:(?:\d{1,3}\.){3}\d{1,3}:\d{1,5})/g;
            const matches = raw.match(ipPortRe);
            if (matches && matches.length) {
              const cleaned = matches.map(s => s.trim()).filter(Boolean);
              return resolve(cleaned);
            }
            // 否则以常见分隔符拆分（换行、回车、逗号、分号、空白）
            const parts = raw.split(/\r?\n|,|;|\s+/).map(l => l.trim()).filter(Boolean);
            if (parts.length) return resolve(parts);
            // 如果都解析不了，返回空数组
            return resolve([]);
          } catch (e) { return resolve([]); }
        });
      }).on('error', () => resolve([]));
      req.on('timeout', () => { try { req.destroy(); } catch (e) { } resolve([]); });
    } catch (e) { resolve([]); }
  });
}

async function main() {
  // MARK: 短效代理获取 IP
  // 如果未配置代理且存在代理提供者地址，则尝试从提供者接口获取
  const providerDefault = process.env.PROXY_PROVIDER;
  if (providerDefault) {
    console.log('➡️ 代理提供者地址 ->', color.green(providerDefault));
    try {
      // fetched 例如 ['61.188.79.124:20128', ...]
      const fetched = await fetchProxyFromProvider(providerDefault);
      console.log(`📒 从提供者获取到${color.green('[短效]')}代理列表 ->`, color.green(JSON.stringify(fetched)));
      if (Array.isArray(fetched) && fetched.length > 0) {
        // 随机选择一个代理条目
        const idx = Math.floor(Math.random() * fetched.length);
        process.env.PROXY = fetched[idx].trim();
        console.log(`✅ 使用[短效]代理（随机选择 index=${idx}）:`, color.green(process.env.PROXY));
      } else {
        console.log('❌ 提供者未返回可用代理');
      }
    } catch (e) {
      console.warn('⚠️ 从代理提供者获取代理失败:', e && e.message);
    }
  } else if (process.env.PROXY) {
    console.warn(`⚠️ 使用环境变量中配置${color.yellow('[长效]')}的代理 ->`, color.green(process.env.PROXY));
  } else {
    console.info(color.red('❌ 未配置代理提供者地址!!!!，跳过从提供者获取代理步骤'));
    return;
  }

  // MARK: 代理认证（可选）
  const authkey = process.env.AUTHKEY || '';
  const authpwd = process.env.AUTHPWD || '';
  if (authkey) {
    console.log('[青果]代理密钥已设置:', color.green(authkey));
  }
  if (authpwd) {
    console.log('[青果]代理密码已设置:', color.green('********'));
  }

  const proxy = `${process.env.PROXY || ''}`;
  console.log('[青果]代理地址:', color.green(proxy));
  const args = [
    `--no-first-run`,
    // `--no-sandbox`,
    // `--disable-setuid-sandbox`
    // `--disable-infobars`,
    `--no-default-browser-check`,
    `--disable-blink-features=AutomationControlled`
  ];
  const config = {};
  if (proxy) args.push(`--proxy-server=${proxy}`);
  /// MARK: 打开浏览器
  const browser = await puppeteer.launch({
    headless: true, // 无界面运行
    args,
    defaultViewport: null
  });
  if (process.platform !== 'linux') {
    browser.executablePath = chromePath;
  }


  try {
    const page = await browser.newPage();
    // 如果代理需要基本认证，可以尝试 page.authenticate（并非对所有代理类型都有效）
    if (authkey && authpwd) {
      try {
        await page.authenticate({ username: authkey, password: authpwd });
        console.log('已设置 page.authenticate 用于代理/页面认证（取决于代理类型）');
      } catch (e) {
        console.warn('⚠️ page.authenticate 设置失败:', e && e.message);
      }
      await page.setExtraHTTPHeaders({});
    }
    const target = 'https://test.ipw.cn/';
    console.log('➡️ 导航到', color.green(target));
    await page.goto(target, { waitUntil: 'networkidle2', timeout: 60000 });
    const bodyText = await page.evaluate(() => document.body ? document.body.innerText.trim() : '');
    console.log('页面文本预览 IP:\n ->', color.red(bodyText));
  } catch (e) {
    console.error('❌ 运行中出错:', e && e.message);
  } finally {
    // 确保浏览器在脚本结束时被正确关闭
    try {
      // 给页面一些时间做清理/人工查看（可根据需要调整或移除）
      await new Promise(r => setTimeout(r, 1000));
      if (browser && typeof browser.close === 'function') {
        await browser.close();
        const now = new Date();
        console.log('浏览器已关闭 ->', color.green(now.toLocaleString()));
      }
    } catch (err) {
      console.warn('关闭浏览器失败:', err && err.message);
      try { if (browser && typeof browser.disconnect === 'function') browser.disconnect(); } catch (_) { }
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
