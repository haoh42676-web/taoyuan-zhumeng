# 原项目身份与发布范围

用户于2026年10月24日明确确认：附件《附件05 MVP演示网站网址.docx》中的三个网址同属本目录的原项目，维护时必须一起核对。

- 正式前台：https://shushang-taoxiang.onrender.com/
- 正式后台：https://shushang-taoxiang.onrender.com/admin/
- GitHub Pages静态站：https://haoh42676-web.github.io/taoyuan-zhumeng/
- 唯一对应仓库：haoh42676-web/taoyuan-zhumeng
- 动态前后台分支：deploy/render-neon；静态站分支：main。

保留小桃满AI接入、客服、文案生成、推荐及人工复核。模型密钥只在服务端；静态站保留本地规则演练，并提供原站真实AI服务入口。

MVP_数字媒体赛、taoyuan-zhumeng-digital-media及带digital-media的域名属于另一个项目，不能因本项目维护而向其发布、写入内容或修改配置。

完整说明见 docs/原项目三个网址与发布对应关系.md。不要将.env、.data、数据库、私有备份或模型密钥发布到静态分支。

## 用户指定的界面规范（2026年10月24日）

前台、正式后台与静态演练共用 ui-system.css / ui-system.js。遵循 docs/UI视觉与动效规范_20261024.md：Surface相邻明度差1%—3%，不用纯黑或硬实线分区；暗色全站字重减40；输出使用120ms高斯模糊对焦、30ms字符交错；SVG下沉0.125em；数字等宽；折叠使用CSS Grid，不测量scrollHeight；正文text-wrap:pretty；拖拽1200/80过阻尼，点击欠阻尼，复制对勾2500ms自动还原。允许用户切换并保存明暗主题，不能重新强制全站浅色。
