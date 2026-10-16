<div align="center">

# cn-dev-mcp

**面向中国开发者的离线 MCP 工具集**

节假日调休 · 工作日计算 · 身份证 / 信用代码 / 手机号校验 · 拼音 · 农历 · 行政区划 · uni-app / 小程序 / Element Plus / Vant 文档速查

![license](https://img.shields.io/badge/license-MIT-green) ![tools](https://img.shields.io/badge/tools-13-blue) ![node](https://img.shields.io/badge/node-%3E%3D18-brightgreen) ![MCP](https://img.shields.io/badge/MCP-stdio-purple)

</div>

## 特点

- **完全离线**：数据都打包在里面，不联网、不调用第三方接口，没有服务器费用
- **数据有出处**：节假日数据来自国务院办公厅放假通知，行政区划来自国家统计局公开数据
- **只校验格式**：身份证、信用代码只检查格式和校验位，**不查询、也不核验任何人或企业的真实信息**
- **一行命令启动**：`npx -y github:MsNan/cn-dev-mcp`，支持 Cursor、Claude Code、Claude Desktop、Trae、Cherry Studio 等所有支持 stdio 的 MCP 客户端

## 安装配置

需要 Node.js 18 或更高版本。第一次启动时 npx 会先下载，大约需要十几秒。

### Cursor
在 `~/.cursor/mcp.json`（全局）或项目里的 `.cursor/mcp.json` 中添加：
```json
{
  "mcpServers": {
    "cn-dev": { "command": "npx", "args": ["-y", "github:MsNan/cn-dev-mcp"] }
  }
}
```

### Claude Code
```bash
claude mcp add cn-dev -- npx -y github:MsNan/cn-dev-mcp
```

### Claude Desktop
编辑 `claude_desktop_config.json`（macOS 在 `~/Library/Application Support/Claude/`，Windows 在 `%APPDATA%\Claude\`）：
```json
{
  "mcpServers": {
    "cn-dev": { "command": "npx", "args": ["-y", "github:MsNan/cn-dev-mcp"] }
  }
}
```

### Trae
打开 AI 对话框右上角设置 → MCP → 添加 → 手动配置，粘贴：
```json
{
  "mcpServers": {
    "cn-dev": { "command": "npx", "args": ["-y", "github:MsNan/cn-dev-mcp"] }
  }
}
```

### Cherry Studio
设置 → MCP 服务器 → 添加服务器：类型选 **stdio**，命令填 `npx`，参数填两行：`-y` 和 `github:MsNan/cn-dev-mcp`，保存后启用。

> 💡 Windows 上如果启动失败，可以把命令改成 `cmd`，参数改成 `/c npx -y github:MsNan/cn-dev-mcp`。

## 工具列表

| 工具 | 作用 | 你可以这样问 AI |
| --- | --- | --- |
| `holiday_check` | 判断某天是法定节假日、调休上班、周末还是工作日 | “2026 年 10 月 10 号要上班吗？” |
| `holiday_year` | 某年全部放假区间和调休日，附官方通知 | “列出 2026 年的放假安排” |
| `workday_count` | 两个日期之间有几个工作日（已算节假日和调休） | “10 月有几个工作日？” |
| `workday_add` | 第 N 个工作日是哪天 | “9 月 30 号下单，3 个工作日内发货，最晚哪天？” |
| `validate_id_card` | 身份证号格式和校验位校验，解析生日、性别、地区 | “帮我写个表单校验，顺便测一下这个号码格式对不对” |
| `validate_uscc` | 统一社会信用代码校验（GB 32100） | “这个信用代码校验位对吗？” |
| `validate_mobile` | 手机号格式校验，按号段推测运营商 | “+86 138-0013-8000 格式对吗？” |
| `pinyin` | 汉字转拼音或首字母，能处理多音字 | “把城市列表按拼音首字母分组” |
| `solar_to_lunar` | 公历转农历，含干支、生肖、节气、节日 | “2026-10-16 是农历几号？” |
| `lunar_to_solar` | 农历转公历，支持闰月 | “农历 2027 年正月初一是哪天？” |
| `region_lookup` | 按代码或名称查省、市、县行政区划 | “330106 是哪里？”“生成浙江省各市的 code 列表” |
| `dev_docs_search` | 离线检索 uni-app、小程序、Element Plus、Vant 常用 API 要点 | “uni-app 分包怎么配置？” |
| `dev_docs_get` | 按 id 读取单条文档摘要 | 和上面的检索配合使用 |

### 返回示例

`holiday_check { "date": "2026-10-10" }`
```json
{ "date": "2026-10-10", "weekday": "周六", "type": "调休上班", "isWorkday": true, "dataAvailable": true }
```

`workday_add { "date": "2026-09-30", "n": 3 }`
```json
{ "from": "2026-09-30", "n": 3, "result": "2026-10-10", "weekday": "周六", "notes": [] }
```

`lunar_to_solar { "year": 2026, "month": 8, "day": 15 }`
```json
{ "solar": "2026-09-25", "weekday": "周五", "lunar": { "text": "二〇二六年八月十五" }, "zodiac": "马", "festivals": ["中秋节"] }
```

## 数据说明

| 数据 | 范围 | 来源 |
| --- | --- | --- |
| 节假日 / 调休 | 2025、2026 年 | [2025 年通知（国办发明电〔2024〕12号）](https://www.gov.cn/zhengce/content/202411/content_6986382.htm)、[2026 年通知（国办发明电〔2025〕7号）](https://www.gov.cn/zhengce/content/202511/content_7047090.htm) |
| 2027 年 | **国务院尚未公布**（截至 2026-10-16） | 暂时只按周末计算，返回结果会带上提示；官方公布后会尽快更新 |
| 行政区划 | 31 个省级行政区的省、市、县三级（不含港澳台） | [modood/Administrative-divisions-of-China](https://github.com/modood/Administrative-divisions-of-China)（整理自国家统计局） |
| 农历 | 1900 – 2100 年 | [lunar-javascript](https://github.com/6tail/lunar-javascript) |
| 拼音 | — | [pinyin-pro](https://github.com/zh-lx/pinyin-pro) |
| 文档速查 | 30 条常用 API | 本项目自己写的要点摘要，**不是官方原文**，每条都附官方文档链接 |

## 本地开发

```bash
git clone https://github.com/MsNan/cn-dev-mcp && cd cn-dev-mcp
npm install
npm test        # 编译，然后跑单元测试 + MCP stdio 冒烟测试
npx @modelcontextprotocol/inspector node dist/index.js   # 可视化调试
```

欢迎提 PR 补充文档条目（`src/data/docs.ts`）和新工具。

## 相关项目

- [vue-uniapp-skills](https://github.com/MsNan/vue-uniapp-skills)：Vue3 + uni-app 中文 AI 编程技能包，一行命令装进 Cursor、Claude Code、Trae、Codex。和本项目一起用效果更好。
- 作者博客：[msnan.github.io](https://msnan.github.io) · 公众号：程序员项目库

## License

[MIT](./LICENSE) © Theo（涛哥）

## ☕ 打赏支持

如果这个工具帮你省了时间，欢迎请我喝杯咖啡，也欢迎点个 ⭐ Star。

<table>
  <tr>
    <td align="center"><img src="docs/donate/wechat.jpg" width="220" alt="微信赞赏"><br>微信</td>
    <td align="center"><img src="docs/donate/alipay.jpg" width="220" alt="支付宝"><br>支付宝</td>
  </tr>
</table>
