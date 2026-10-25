/* Build only the original project's public GitHub Pages copy. No database or credentials. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const [treeFile, snapshotFile, output] = process.argv.slice(2);
assert(treeFile && snapshotFile && output, 'Usage: node scripts/build-static.cjs TREE_JSON PUBLIC_SNAPSHOT_JSON OUTPUT');
const out = path.resolve(output);
assert(out.startsWith(path.join(root, '.data') + path.sep), 'Stage must be inside the original project private .data directory');
assert(!fs.existsSync(out), 'Use a new stage directory to preserve backups');
fs.mkdirSync(out, {recursive: true});
const files = JSON.parse(fs.readFileSync(treeFile, 'utf8')).tree.filter(e => e.type === 'blob').map(e => e.path);
for (const name of [...new Set([...files, 'compact-site.js', 'compact-site.css', 'journey.js', 'assets/cards/product-information.svg', 'assets/cards/in-box-guide.svg', 'static-cms.js', 'AGENTS.md', 'docs/原项目三个网址与发布对应关系.md', 'docs/实践报告版页面与维护说明.md', 'docs/UI视觉与动效规范_20261024.md', 'GitHub-Pages静态备份说明.md', 'scripts/build-static.cjs', 'tests/static-compact.cjs'])]) {
  assert(!name.startsWith('.') || name === '.nojekyll');
  if (name === 'static-content.json') continue; // Always regenerate the public snapshot below.
  const source = name === 'admin/index.html' ? 'static-admin.html' : name;
  const target = path.join(out, name);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  if (name === '.nojekyll') fs.writeFileSync(target, '');
  else fs.copyFileSync(path.join(root, source), target);
}
function patch(name, from, to) {
  const target = path.join(out, name), text = fs.readFileSync(target, 'utf8');
  assert.equal(text.split(from).length, 2, 'Expected one build anchor: ' + name + ' ' + from.slice(0, 70));
  fs.writeFileSync(target, text.replace(from, to));
}
const live = 'https://shushang-taoxiang.onrender.com/';
const content = JSON.parse(fs.readFileSync(snapshotFile, 'utf8'));
const snapshot = Object.fromEntries(['products', 'batches', 'faqs', 'ip_profile'].map(key => [key, content[key]]));
Object.assign(snapshot, {pages: [], feature_controls: [], settings: [{slogan: content.settings?.[0]?.slogan || '数商桃乡，让好桃被看见'}]});
fs.writeFileSync(path.join(out, 'static-content.json'), JSON.stringify(snapshot, null, 2) + '\n');
fs.writeFileSync(path.join(out, 'runtime-config.js'), `// Original project static copy; real AI stays on the original Render service.\nwindow.PEACH_CONFIG = ${JSON.stringify({mode: 'local', presentation: 'practice', liveSite: live, liveAdmin: live + 'admin/'})};\n`);
patch('index.html', '<script src="demo-data.js"></script>', '<script src="demo-data.js"></script>\n  <script src="static-cms.js"></script>');
patch('index.html', 'href="/admin/">运营后台 ↗', `href="${live}admin/" target="_blank" rel="noopener">正式运营后台 ↗</a><a class="back-link" href="admin/">本地演练工作台 ↗`);
patch('index.html', '<p>看真实桃园，选合适规格，让小桃满陪你问清一箱桃。商品咨询、内容复核与售后回访，在这里连成一条完整的体验。</p>', `<p>看真实桃园，选合适规格，让小桃满陪你问清一箱桃。商品咨询、内容复核与售后回访，在这里连成一条完整的体验。</p><p class="form-note">静态站的表单和记录保存在当前浏览器。<a href="${live}#service" target="_blank" rel="noopener">前往在线服务与AI客服 ↗</a></p>`);
patch('compact-site.js', "if(api.mode!=='server'||!['shushang-taoxiang.onrender.com','localhost','127.0.0.1'].includes(location.hostname))return;", "if(api.mode!=='local'||window.PEACH_CONFIG?.presentation!=='practice')return;");
patch('compact-site.js', 'const cms=api.cms,originalResearch=renderers.evidence;', 'const cms=api.cms,originalResearch=renderers.evidence,originalOperator=renderers.operator;');
patch('compact-site.js', "renderers.operator=()=>shell(", "renderers.operator=()=>state.ops!=='overview'?originalOperator():shell(");
patch('compact-site.js', '<h3>一条内容的工作流程</h3>', '<h3>一条内容的工作流程</h3><p class="form-note">真实模型生成与审核请进入正式后台；此站也保留本地草稿及复核演练。</p><button class="button button-small" type="button" data-ops="content">本地草稿与复核演练 ↗</button>');
const compactPath = path.join(out, 'compact-site.js');
fs.writeFileSync(compactPath, fs.readFileSync(compactPath, 'utf8').replaceAll('href="/admin/', `href="${live}admin/`).replace('提交问题、保存记录，由运营处理并回复。', '演练提交与记录；真实处理请前往在线服务。').replace('选购前提交咨询，收货后反馈问题，处理进度统一在这里查看。', '在本机演练咨询与售后；需要运营实际处理时，请前往在线服务。').replace('<div class="compact-service-grid"><section', `<div class="action-row"><a class="button button-primary" href="${live}#service" target="_blank" rel="noopener">进入在线咨询与售后 ↗</a></div><div class="compact-service-grid"><section`).replace('先问小桃满，也可以提交咨询，由运营核实。', '先用本地客服演练；实际咨询请前往在线服务，由运营核实。'));
patch('app.js', '项目服务 · 浏览器保存', '静态演练 · 浏览器保存');
patch('app.js', 'window.PeachCompact?.({api,state,renderers,shell,btn,link,esc,media,groups});', "document.addEventListener('peach:refresh',refresh);\nwindow.PeachCompact?.({api,state,renderers,shell,btn,link,esc,media,groups});");
patch('ai-features.js', "typeof window.PeachCompact==='function'&&['shushang-taoxiang.onrender.com','localhost','127.0.0.1'].includes(location.hostname)", "document.documentElement.dataset.presentation==='practice'");
patch('ai-features.js', 'document.body.append(launcher,dialog);', `const online=document.createElement('a');online.href='${live}#service';online.target='_blank';online.rel='noopener';online.textContent='使用在线AI客服 ↗';dialog.querySelector('.chat-disclosure').append(' ',online);\n  document.body.append(launcher,dialog);`);
patch('demo-admin.js', "const groups=[['开始工作',[['overview','工作概览']]],['事实与素材',[['materials','资料与影像'],['products','商品规格'],['batches','批次与核验码']]],['协作与表达',[['opc','OPC协作任务'],['content','内容与IP']]],['成交与服务',[['customers','客户与回访'],['orders','订单与履约'],['records','咨询与售后']]],['演示管理',[['settings','设置与数据']]]];", "const groups=[['开始工作',[['overview','工作概览']]],['商品与批次',[['products','商品规格'],['batches','批次与核验码']]],['内容生成与审核',[['content','内容与IP'],['opc','OPC协作任务']]],['咨询与售后',[['records','咨询与售后'],['customers','客户与回访']]],['试行记录与复盘',[['orders','订单与履约']]],['资料与设置',[['materials','资料与影像'],['settings','设置与数据']]]];");
console.log(JSON.stringify({stage: out, sourceFiles: files.length, content: {products: snapshot.products.length, batches: snapshot.batches.length, faqs: snapshot.faqs.length}, liveSite: live}));
