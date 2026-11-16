# 邬荣领 · 生命系统的数学

**The Mathematics of Living Systems** — 学生独立制作的非官方学术致敬网站。

一座面向在世学者的长页面，以原创科学期刊式设计，介绍邬荣领教授及其合作者在功能作图、数量遗传学、准动态网络、图统计、计算医学及统计学与 AI 联系方面的研究。不是教授或所属机构运营、认可的官方主页。

## 运行

需要 Node.js 22.12+。网站本身没有运行时依赖；开发预览也无需安装 npm 包：

```sh
node scripts/serve.mjs
```

打开终端打印的 `http://127.0.0.1:4173/rongling-wu-tribute/`。也可用 `npm run dev`。`PORT` 环境变量可指定端口。

不建议用 `file://` 双击预览交互：浏览器通常禁止本地 ES Module 导入。所有正文、出处与 SVG 后备图在禁用 JavaScript 时仍可阅读。

## 主要交互

- **首页参数曲面**：Canvas 2D 绘制 Logistic 函数参数族的空间投影，时间切片缓慢移动。生长速率滑块与第二章联动。
- **同点异轨迹实验**：改变速率与观测时刻；切换单个时刻 / 完整轨迹；实时显示三条曲线的数值，支持重置、键盘与触摸。
- **曲线 → 网络**：滚动时曲线采样点移向三层关系图；9 节点、12 条有向有符号边。节点可点击、Tab / Enter / Space 操作，方向键移动焦点；另有原生下拉菜单。
- **研究图谱与论文**：原生 `details` 展开研究解释；论文按已发表 / 预印本筛选；所有论文与机构入口为真实链接。
- **阅读控制**：移动目录、阅读进度、当前章节、暂停动效与系统 `prefers-reduced-motion`；无存储、无用户数据采集、无追踪器。

全部合成数据均标明「概念演示 / Illustrative model — not empirical data」。本项目不执行统计拟合、基因定位、因果推断或医学诊断。

## 构建与部署

```sh
npm run build
```

产物位于 `dist/`，使用相对资源路径，可部署到 GitHub Pages 的项目子路径。构建只复制 `index.html`、`sources.html`、`assets/`、`docs/` 和 `.nojekyll`，不包含开发依赖、测试截图、用户肖像或外部研究副本。

项目仓库：[RanchoTao/Wu](https://github.com/RanchoTao/Wu)。GitHub Pages 发布地址：[生命系统的数学](https://ranchotao.github.io/Wu/)，以仓库 Actions 中的成功部署记录为准。

1. 本目录内容作为独立 `RanchoTao/Wu` 仓库的根目录；变更通过 PR 合并至 `main`。
2. 仓库 Settings → Pages → Build and deployment → Source 选择 **GitHub Actions**。
3. 随后的 `main` 推送自动触发 `.github/workflows/deploy-pages.yml`；也可在 Actions 手动运行。
4. 官方 `configure-pages` / `upload-pages-artifact` / `deploy-pages` Actions 发布 `dist/`；权限为 `contents: read`、`pages: write`、`id-token: write`，部署环境为 `github-pages`。
5. 工作流从 Pages 的 `base_url` 自动注入 canonical、Open Graph URL 与分享图绝对地址。静态 PNG 分享图为 1200×630，已随包提供。

部署到其它静态托管时，可在构建前设置 `SITE_URL` 为实际网站根地址，以生成 canonical / OG 绝对路径。未设置时不猜测域名；本地 HTML 的分享图路径仍为相对路径。

### 验证真正的部署产物

PowerShell：

```powershell
$env:SERVE_DIST='1'
$env:PORT='4174'
node scripts/serve.mjs
```

另一个终端：

```powershell
npm ci
$env:QA_URL='http://127.0.0.1:4174/rongling-wu-tribute/'
$env:QA_ROUND='local-review'
npm test
```

首次测试若未安装 Chromium，可执行 `npx playwright install chromium`；也可通过 `CHROMIUM_PATH` 指向已有浏览器。测试脚本为本次 Windows 验收提供已存在的 Chromium 路径后备，跨平台推荐安装 Playwright 自带浏览器或设置 `CHROMIUM_PATH`。

## 验收与截图

验收说明见 [docs/qa.md](docs/qa.md)。`scripts/verify.mjs` 检查真实浏览器渲染、滑块数值与路径、键盘 / 触摸操作、节点选取、论文筛选、390 / 768 / 1440 布局、WCAG 自动扫描、降低动态、无 JavaScript、离屏停绘、资源与页内链接。

运行测试生成 `test-results/<轮次>/`：1440×900 桌面、390×844 手机、768×1024 平板、桌面与手机完整长页、网络、实验、降低动态与无 JS 截图及 JSON 报告。截图不进入部署产物。

## 文件结构

```text
index.html                     完整静态正文与渐进增强界面
sources.html                   面向读者的资料与模型说明
assets/styles.css              响应式排版与动画
assets/app.js                  交互、Canvas、滚动与动效控制
assets/model.js                Logistic 函数与固定图模型
assets/*.svg                   原创数学图版与无 JS 后备图
assets/social.png              分享图
scripts/generate-art.mjs        重生成 SVG 与准确静态曲线
scripts/build.mjs               无依赖构建与可选 SITE_URL 注入
scripts/serve.mjs               本地预览及项目子路径验证
scripts/verify.mjs              浏览器验收与截图
docs/sources.md                逐项事实、书目、访问限制与授权账本
docs/design.md                 三个视觉方向与 Yau 源码研究
.github/workflows/deploy-pages.yml
```

## 编辑与科学边界

重要事实及五篇成果的完整作者、年份、期刊、DOI / arXiv 链接见 [docs/sources.md](docs/sources.md)。论文介绍限于已读到的公开摘要和书目信息。部分出版社限制直接访问，来源账本保留这些限制，不声称读过全部全文。

`y(t) = 100 / (1 + exp(−r(t−5)))` 在 t=5 时对任意正 r 都等于 50，且该点斜率为 25r。首页参数曲面是教学投影；网络边与权重是人工指定，视觉变形不代表网络推断算法。准动态研究的排序变量也不自动等同于观测时间。

## 肖像授权

用户提供的 `邬荣领.jpg` 及 BIMSA 官方肖像均未确认公开复用许可，**未包含在项目或发布包中**。Chapter 07 使用原创数学图版并说明授权状态。未来换入肖像，需先确认摄影版权、公开网站使用权限与署名要求；不要使用 AI 伪造人物照片。

Yau 仓库仅作为只读设计参考，未作任何修改。全站未复用其源码、人物图片、黑金配色或纪念碑式文案。
