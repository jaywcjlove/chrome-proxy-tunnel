import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import color from 'chalk';
import dotenv from 'dotenv'

puppeteer.use(StealthPlugin());

dotenv.config({
  path: `.env.prod`
})

// macOS Chrome path (adjust if needed)
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function main() {

  // MARK: 隧道代理 URL:PORT
  const providerDefault = process.env.PROXY_TUNNEL;
  if (providerDefault) {
    console.log('➡️ 代理提供者地址 ->', color.green(providerDefault));
  } else {
    console.info(color.red('❌ 未配置代理提供者地址!!!!，跳过从提供者获取代理步骤'));
    return;
  }

  // MARK: 代理认证
  const authkey = process.env.PROXY_TUNNEL_AUTHKEY || '';
  const authpwd = process.env.PROXY_TUNNEL_AUTHPWD || '';
  if (authkey) {
    console.log('[青果]代理密钥已设置:', color.green(authkey));
  }
  if (authpwd) {
    console.log('[青果]代理密码已设置:', color.green('********'));
  }
  /// curl -x HBRMO154:***********:Cchannel-1:T60:A990100@overseas-us.tunnel.qg.net:15561 www.baidu.com
  let proxyURL = ""
  if (process.env.PROXY_TUNNEL_AREA && process.env.PROXY_TUNNEL_CHANNEL && process.env.PROXY_TUNNEL_TTL) {
    // proxyURL = [
    //   // authkey, 
    //   // authpwd,
    //   process.env.PROXY_TUNNEL_CHANNEL,
    //   process.env.PROXY_TUNNEL_TTL,
    //   // process.env.PROXY_TUNNEL_AREA,
    // ].join(":") + "@"
  }

  const proxy = `${proxyURL}${providerDefault || ''}`;
  console.log('[青果]代理地址:', color.green(proxy));
  const args = [
    // '--incognito',
    '--no-sandbox', // 取消沙盒模式（仅限非 root 用户）
    '--disable-setuid-sandbox',
    '--disable-gpu', // 禁用 GPU 加速
    '--disable-dev-shm-usage', // 禁用 /dev/shm 使用
    '--disable-accelerated-2d-canvas', // 禁用加速 2D 画布
    '--disable-software-rasterizer', // 禁用软件光栅化
    '--mute-audio', // 禁用音频输出
    // '--disable-background-networking', // 禁用后台网络连接
    // '--disable-default-apps', // 禁用默认应用程序
    '--disable-hang-monitor', // 禁用挂起监视器
    '--disable-popup-blocking', // 禁用弹出窗口阻止
    '--disable-translate', // 禁用翻译
    '--disable-sync', // 禁用同步
    '--hide-scrollbars', // 隐藏滚动条
    // '--metrics-recording-only', // 仅记录指标
    '--disable-renderer-backgrounding', // 禁用渲染器背景化
    '--disable-blink-features=AutomationControlled',
    // '--enable-logging=stderr', // 启用日志记录到 stderr
    // '--log-level=0' // 设置日志级别为 0（最详细）


    // `--no-first-run`,
    // `--no-sandbox`,
    // `--disable-setuid-sandbox`
    // `--disable-infobars`,
    // `--no-default-browser-check`,
    // `--disable-blink-features=AutomationControlled`
  ];

  const config = {
    headless: true, // 无界面运行
    args,
    defaultViewport: null,
  }

  if (proxy) args.push(`--proxy-server=${proxy}`);
  /// MARK: 打开浏览器
  const browser = await puppeteer.launch(config);
  if (process.platform !== 'linux') {
    browser.executablePath = chromePath;
  }

  try {
    const page = await browser.newPage();
    // 调试监听器：记录请求失败、响应和页面内 console 日志，便于抓取更多细节
    page.on('requestfailed', req => {
      try {
        const f = req.failure ? req.failure() : null;
        console.warn('Request failed ->', req.url(), f ? f.errorText || f : '(no details)');
      } catch (err) {
        console.warn('Request failed (listener error):', err && err.message);
      }
    });
    page.on('response', res => {
      try {
        console.log('Response ->', res.status(), res.url());
      } catch (err) {
        console.warn('Response listener error:', err && err.message);
      }
    });
    page.on('console', msg => {
      try {
        console.log('PAGE LOG ->', msg.type(), msg.text());
      } catch (err) {
        console.warn('Console listener error:', err && err.message);
      }
    });
    // 如果代理需要基本认证，可以尝试 page.authenticate（并非对所有代理类型都有效）
    if (authkey && authpwd) {
      try {
        await page.authenticate({ username: authkey, password: authpwd });
        console.log('已设置 page.authenticate 用于代理/页面认证（取决于代理类型）');
      } catch (e) {
        console.warn('⚠️ page.authenticate 设置失败:', e && e.message);
      }
    }
    const target = 'https://test.ipw.cn/';
    console.log('➡️ 导航到', color.green(target));
    let response = null;
    try {
      response = await page.goto(target, { waitUntil: 'networkidle2', timeout: 60000 });
    } catch (gotoErr) {
      console.error('❌ page.goto 抛出异常:', gotoErr && gotoErr.message);
      if (gotoErr && gotoErr.stack) console.error(gotoErr.stack);
    }
    if (response) {
      console.log('HTTP 状态码:', color.yellow(response.status()));
      console.log('HTTP 状态文本:', color.yellow(response.statusText()));
      console.log('HTTP 响应头:', response.headers());
      const bodyText = await page.evaluate(() => document.body ? document.body.innerText.trim() : '');
      console.log('页面文本预览 IP:\n ->', color.cyan(bodyText));
    } else {
      console.warn('⚠️ 未获取到 response 对象，可能请求未发出或被拦截');
    }
  } catch (e) {
    console.error('❌ 运行中出错:', e && e.message);
    if (process.platform === 'linux') {
      console.error(color.yellow('💡 提示: 在 Linux 上运行 Puppeteer 可能需要安装额外的系统依赖。'));
      console.error(color.yellow('   请尝试运行项目根目录下的 install_deps.sh 脚本安装依赖: sudo bash install_deps.sh'));
      console.error(color.yellow('   参考: https://pptr.dev/troubleshooting#chrome-doesnt-launch-on-linux'));
    }
    if (e && e.stack) console.error(e.stack);
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
