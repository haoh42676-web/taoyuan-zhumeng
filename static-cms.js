/* Published facts for the static copy. Business writes remain in the local adapter. */
(() => {
  'use strict';
  if (window.PEACH_CONFIG?.mode !== 'local' || window.PEACH_CONFIG?.presentation !== 'practice') return;
  const api = window.PeachAPI;
  api.mode = 'local';
  const ready = api.ready;
  api.ready = Promise.resolve(ready).then(async () => {
    const response = await fetch('static-content.json', {cache: 'no-cache'});
    if (!response.ok) throw Error('静态公开资料未加载，请刷新重试。');
    const cms = await response.json();
    for (const key of ['products', 'batches', 'faqs', 'ip_profile', 'pages', 'feature_controls', 'settings']) {
      if (!Array.isArray(cms[key])) throw Error('静态资料结构不完整。');
    }
    api.cms = cms;
    window.PeachCMS = cms;
    productData = cms.products;
    window.PeachHomeGroups = {buy: ['consumer', 'service', 'evidence'], create: ['consumer', 'service', 'evidence'], learn: ['consumer', 'service', 'evidence']};
    const request = api.request.bind(api);
    api.request = async (method, path, payload = {}) => {
      if (method.toUpperCase() === 'GET' && new URL(path, location.href).pathname === '/api/catalog') {
        const scene = new URL(path, location.href).searchParams.get('scene');
        return {data: cms.products.filter(p => !scene || p.scene === scene), meta: {mode: 'local'}};
      }
      return request(method, path, payload);
    };
    return true;
  });
})();
