Puppeteer 青果隧道代理测试
===

隧道代理：是固定的[代理域名地址：端口]，IP 切换在代理服务端完成，适合需要稳定代理地址的场景。

[青果] 隧道代理测试脚本 -> https://www.qg.net/

添加环境变量 `.env` 文件

```yaml
PROXY_TUNNEL="overseas-us.tunnel.qg.net:00000"
# 密钥
TUNNEL_AUTHKEY="xxxxxxxx"
TUNNEL_AUTHPWD="******"
```

运行脚本示例：

```sh
node main.js
```

提取工具：https://www.qg.net/tools/IPget.html?key=xxxxxx

## ⚠️ 注意

- 全球 http 都是不支持大陆网络使用 
- 国内网络能访问的网站（不支持翻墙）
- 国内代理访问国内，全球代理访问外网
- 短效代理需要通过 API 获取IP地址，长效代理直接配置