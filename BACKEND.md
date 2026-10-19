# 数商桃乡 · 实际后台与接口

## 同域服务

npm start提供网站/、后台/admin/与/api/...。本地PGlite持久化PostgreSQL，未来由DATABASE_URL连接Neon。静态模式仍使用api.js，服务模式由remote-api.js切换为真实请求。

成功响应为{data,meta:{mode,persisted,requestId,updatedAt}}；失败为{error:{status,message,requestId}}。401未登录、403权限/来源问题、404不存在、409版本/编号/容量冲突、422字段或业务阶段不合法、429限流。

写入需X-Peach-Request: 1，成员写入另需X-CSRF-Token。HttpOnly会话与访客匿名Cookie分别处理；首次改密前不能操作业务。数据库凭据不发给浏览器。

## 公开与访客API

| 方法与路径 | 实际行为 |
| --- | --- |
| GET /api/bootstrap | 发布内容和本人记录；成员可带preview内容ID预览 |
| GET /api/catalog | 发布规格，可按scene筛选 |
| GET /api/facts?dataset=consumer/opc/farmer/interview | 原题、选项、人数、有效分母与来源 |
| GET /api/batches/:id | 事实状态、核验总量、占用及余量 |
| GET /api/ip/xiaotaoman | 小桃满角色与栏目 |
| GET /api/content/matrix、/api/content/published | IP矩阵、审核后站内发布 |
| GET /api/tours/routes、/api/service/faq、/api/presentation/competition | 路线、FAQ、讲解 |
| POST /api/consultations | productId、quantity、name、region、note、contact、consent:true |
| POST /api/tours/inquiries | routeId、date、people、name、region、note、contact、consent:true |
| POST /api/service/claims | issue、batchId、name、region、note、contact、consent:true及可选真实照片 |
| GET /api/records | 本访客记录，limit最大100 |
| GET /api/attachments/:id | 原提交者或管理员/运营读取实际照片 |
| POST /api/analytics/events | 匿名浏览、点击、可见停留；尊重拒绝统计和DNT |

公开提交支持Idempotency-Key。照片multipart使用payload JSON和photos（最多3张，每张≤5MB）；服务端真实解码、限制像素、去元数据并转WebP。

路线的inquiryEnabled控制是否收集咨询意向，默认true；旧资料缺该字段也按true处理。显式false时前台停用提交入口，POST /api/tours/inquiries拒绝新增。bookingAvailable仅表示接待条件核实情况，不能替代每次接待确认。咨询意向不创建正式预约或占用名额。

## 后台API

| 前缀 | 已实现操作 |
| --- | --- |
| /api/auth | login、me、password、logout |
| /api/admin/schema | 16类CMS字段 |
| /api/admin/content | GET列表、POST新增、PATCH /:id、GET /:id/history、POST /:id/publish/unpublish/archive/restore |
| /api/admin/drafts | GET/POST多稿、PATCH /:id、GET /:id/history、POST /:id/action提交/复核、POST /:id/publish |
| /api/admin/publications | GET发布记录、POST /:id/withdraw |
| /api/admin/records | GET筛选/分页、GET /:id、PATCH /:id（version、status、reply、assignedTo、orderId） |
| /api/admin/media、/api/admin/assets | 上传及选择公开素材 |
| /api/admin/analytics | summary、events、export；日期为北京时间 |
| /api/admin/requests、/api/admin/audit | 请求、操作审计 |
| /api/admin/users | 创建、改权限、停用、重置临时密码、撤销会话 |
| /api/admin/system、/backup、/restore、/purge | 系统、备份、恢复、到期明细清理 |

## 经营API

| 方法与路径 | 行为 |
| --- | --- |
| GET /api/admin/workflow/schema | 六类表单、对应章节、输入输出与流程 |
| GET /api/admin/workflow/options | 按权限提供可关联的商品、批次、成员、客户、原咨询、订单、建议与内容 |
| GET /api/admin/workflow/summary | 签收净收款、成本、贡献额、复购和待办 |
| GET /api/admin/workflow/:kind | customers/orders/signals/decisions/experiments/tasks |
| POST /api/admin/workflow/:kind | {data}新增 |
| PATCH /api/admin/workflow/:kind/:id | {version,data}更新，拒绝旧版本 |
| GET /api/admin/workflow/:kind/:id/history | 修改历史 |
| GET /api/admin/workflow/:kind/export | 管理员/运营可导出经营CSV，防公式注入；只读/编辑不可导出 |
| POST /api/admin/workflow/customers/from-record/:id | 来源唯一对应的客户卡，营销授权默认关闭 |
| POST /api/admin/workflow/diagnose | 从实际待办、回访、成本异常、市场观察生成规则卡；同类未闭环卡不重复 |

CMS使用version，运营稿使用revision。兼容/ops/tasks/current新建每次独立创建；修改/提交/复核要给draftId与revision；/ops/publish也必须指定二者。不代替客户端猜最新一篇。访客不能从前台修改业务状态。

## 权限和规则

管理员有全部权限；运营处理业务并复核发布；编辑维护网站资料和草稿，只能更新本人任务的交付、工时、工具使用和提交，不可看经营客户数据或自批费用；只读成员查内容、统计和台账，不可修改或读私有售后图片。

批次对应一款SKU。stock是该规格核验总量；confirmed/shipped/completed占用，取消释放。成交及批次数量发布使用同一事务锁，不能跨规格混算。成交后保留商品与批次快照。

订单依次待核对→成交核实→发货→签收。确认需原单号、收款凭据、完整金额、地区和对应规格的已核验批次；全款核实后确认。成交后商品、批次、数量、价格、配送收费、原收款、来源咨询、来源凭据、渠道和外部单号固定，退款单独记金额和原因。取消需核实全额退款，释放占用量并保留原商品、批次快照；发货后不能直接取消。发货需物流，签收需实际日期、签收凭据及四项成本，实际日期不得在未来。贡献额不是净利润。

客户服务同意与营销授权分别记录。勾选marketingConsent即须填写consentRef；联系用途为marketing时还须已有营销授权，不能以服务用途绕过授权依据。

任务先培训后派发，由与执行人不同的指定运营验收或退回，退回须写明修改要求。验收后核心交付、工时、约定费用及成员关联固定，只补实际结算金额和凭据；原成员停用或跨账号恢复后，历史关联不变的已验收任务仍可补结算。未完成任务须核对并重新分派给当前有效成员。

建议依次判断、执行、复盘，复盘要有结果与具体回写位置。实验各组按同口径逐对校验成交≤咨询≤触达；一项未知不会免除其余已知人数之间的约束。总结须有完整两组数据、结论和非未来观察日期，仅计算观察比例，不作因果保证。

调查重点指标对三类数据集均支持选项编码数组汇总或引用人数/有效分母两种结构，前台按数据结构计算比例。批次查询与导出在读取最新结果后同步当前缓存，避免沿用旧批次内容。默认统计查询范围与逐日汇总均使用UTC+8。

## 数据和备份

表包括users/sessions、content_items/content_history、business_records/record_notes、media、drafts/draft_history/publications、workflow_items/workflow_history、analytics_events/request_logs/audit_logs/app_meta。JSON关联编号由服务端逐项核验。

备份含实际图片、内容、业务、经营历史和统计，不含密码哈希或有效会话。恢复事务保留账号并撤销会话；不存在的actor_id、created_by、updated_by、owner_id、assigned_to、published_by置空，记录内历史成员编号不自动转给其他成员。旧备份缺经营表时恢复为空，恢复前保存安全副本。

## 以后接入

在线模型、支付/退款执行、原店铺同步、实时物流、社交消息和对象存储由服务端接入，保留人工审核及权限。当前未调用这些服务。密钥和连接串只放环境变量。用户延期云部署；Render配置只有网页服务，数据库用Neon，不创建Render PostgreSQL。
