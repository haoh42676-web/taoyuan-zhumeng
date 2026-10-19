# 部署到Neon与Render

部署结构：浏览器 → Render Node网页/API服务 → Neon PostgreSQL。前台、后台、接口同域，减少跨站Cookie和跨域配置。仓库内 `render.yaml` 没有 `databases` 或 `fromDatabase`，不使用Render PostgreSQL。

2026年10月19日：用户已完成平台注册并授权接入。后台使用独立 `deploy/render-neon` 分支；现有 `main` 分支继续提供 GitHub Pages 静态网站。云资源创建和线上验收结果另行记录；本段不表示服务已经上线。

## 需要的账号配置

- GitHub：现有 `haoh42676-web/taoyuan-zhumeng` 仓库。
- Neon：项目与数据库连接串，推荐带 `-pooler` 的连接地址，并保留官方连接串的TLS参数。
- Render：连接同一GitHub仓库，以本项目的Blueprint部署Web Service。

不要在聊天、截图或Git文件里发送数据库连接串。把它直接填入Render环境变量或本地 `.env`。`.env.example` 是空模板，可以提交；`.env` 不提交。

## 环境变量

| 变量 | 用途 |
| --- | --- |
| `DATABASE_URL` | Neon连接串；生产环境缺少时系统拒绝启动 |
| `SESSION_SECRET` | 长度至少32的随机值；Blueprint自动生成；保持稳定以便识别既有访客 |
| `ADMIN_EMAIL` | 首次管理员邮箱 |
| `ADMIN_PASSWORD` | 首次临时密码，至少12位并包含字母和数字；首次登录必须更改 |
| `NODE_ENV` | `production` |
| `TRUST_PROXY` | Render上为`1`，用于正确识别代理后的请求 |
| `APP_URL` | 自定义域名时填写实际HTTPS地址；Render默认域名会读取内置的`RENDER_EXTERNAL_URL` |

管理员创建后，重启不会用旧临时密码覆盖已经修改的密码。可以从平台移除首次 `ADMIN_PASSWORD`。首次创建失败时，查看部署日志中的中文提示。

## 实施顺序

1. 确认账号授权和可使用的Neon项目，不改动无关项目。
2. 用测试分支连接Neon，运行迁移和初始资料导入。初始资料只在首次导入，不覆盖后台编辑。
3. 运行 `npm test`，完成浏览器业务路径检查；云测试另需真实连接验证。
4. 将代码推送至约定分支。确认现有GitHub Pages的发布方式，避免无意改变正在展示的网站。
5. 在Render使用仓库Blueprint创建网页服务，填写上面的秘密变量。先核对免费/付费方案，再应用配置；当前文件默认`plan: free`。
6. 首次部署自动运行数据库迁移、初始资料导入和管理员初始化。构建命令`npm ci --omit=dev`，启动命令`npm start`。
7. 检查 `/health`、首页、后台登录/改密码、公开内容、咨询、售后照片、运营跟进、访问统计和备份下载。
8. 重启服务，再次确认数据和图片仍在。检查匿名访客越权、编辑发布越权、错误日期和并发版本冲突。
9. 确认无误后，把新线上地址加入项目材料。GitHub Pages可继续作为静态副本，实时后台入口使用Render地址。

## 运维

- 数据库、图片和会话存在Neon中，不依赖Render临时磁盘。Node端使用连接池，最大8个连接。
- 本地开发用PGlite持久化PostgreSQL，生产模式不会降级为本地数据库。
- 手动备份：后台“备份与运行”，或 `npm run backup`。恢复：后台操作或 `npm run restore -- 路径`；命令行有明确覆盖确认。
- 管理员遗忘密码：在服务端临时设置同一 `ADMIN_EMAIL` 与新的 `ADMIN_PASSWORD`，运行 `npm run admin:reset`；首次登录再次更改。重置会撤销该账号所有登录。
- 本系统业务备份不替代Neon平台的备份/恢复策略，上线时应确认所选Neon计划的实际保留能力。
- 当前小规模项目把图片存入数据库，单张转换并限制像素；图片明显增多时应改用对象存储，以降低数据库存储和备份体积。
- Render免费网页服务有休眠机制，赛事现场使用前应按当时官方限制选择方案；当前配置没有购买付费服务。

## 官方资料与技能

- Neon连接文档：<https://neon.com/docs/connect/connect-from-any-app>
- Neon官方技能：<https://github.com/neondatabase/agent-skills/tree/main/skills/neon-postgres>
- Render Blueprint规范：<https://render.com/docs/blueprint-spec>
- Render内置环境变量：<https://render.com/docs/environment-variables>
- Render官方部署技能：<https://github.com/render-oss/skills/tree/main/skills/render-deploy>

技能提供操作工作流，账号授权和实际服务验收仍是必需步骤。2026年10月19日已创建 Render 免费 Web Service 与 Neon 免费 PostgreSQL 项目，线上验收结果见《上线记录_20261019.md》；未创建 Render PostgreSQL。
