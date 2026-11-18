#!/usr/bin/env node
// Real SDK + Workerd transport; all outbound requests terminate in a local fixture.
const assert = require('node:assert/strict');
const path = require('node:path');
const { build } = require('esbuild');
const { Miniflare } = require('miniflare');
const root = path.resolve(__dirname, '../..');
(async () => {
  const source = `import { createClient } from '@supabase/supabase-js';
    import { downloadPrivateOriginal } from './apps/web/lib/platform/media/private-original-download';
    export default { async fetch() {
      const c = createClient('https://storage-fixture.invalid', 'synthetic-key', {auth:{persistSession:false}});
      const r = await downloadPrivateOriginal(c, 'tenant/project/photo.png', 3);
      return Response.json({error:r.error, bytes:r.data ? Array.from(new Uint8Array(await r.data.arrayBuffer())) : null});
    }};`;
  const bundle = await build({ stdin:{contents:source, resolveDir:root}, absWorkingDir:root,
    tsconfig:path.join(root,'apps/web/tsconfig.json'), bundle:true, format:'esm', platform:'browser', write:false });
  let mode = 'ok', infoCalls = 0, downloadCalls = 0, externalCalls = 0;
  const mf = new Miniflare({ modules:true, script:bundle.outputFiles[0].text,
    compatibilityDate:'2024-12-30', compatibilityFlags:['nodejs_compat','global_fetch_strictly_public'],
    outboundService: async request => {
      const url = new URL(request.url);
      if (url.hostname !== 'storage-fixture.invalid') { externalCalls++; return new Response('denied',{status:403}); }
      if (url.pathname.includes('/object/info/')) {
        infoCalls++;
        return Response.json({size:mode==='known_oversized'?4:3, content_type:'image/png',
          version:mode==='changed' && infoCalls===2?'changed':'v1', etag:'e1'});
      }
      assert.equal(url.pathname,'/storage/v1/object/media/tenant/project/photo.png');
      downloadCalls++;
      if (mode === 'redirect') return new Response(null,{status:302,headers:{Location:'https://outside-fixture.invalid/secret'}});
      return new Response(new Uint8Array(mode==='actual_oversized'?[1,2,3,4]:[1,2,3]));
    }
  });
  try {
    for (const next of ['ok','redirect','known_oversized','actual_oversized','changed']) {
      mode=next; infoCalls=0; downloadCalls=0;
      const result=await (await mf.dispatchFetch('http://local.test')).json();
      if (mode==='ok') assert.deepEqual(result,{error:null,bytes:[1,2,3]});
      else {
        assert.equal(result.bytes,null);
        assert.equal(result.error.status,mode.includes('oversized')?413:503);
        if (mode==='redirect') assert.equal(result.error.storage_status,302);
        if (mode==='known_oversized') assert.equal(downloadCalls,0);
      }
      assert.equal(externalCalls,0);
      console.log('PASS Workerd private original '+mode);
    }
  } finally { await mf.dispose(); }
})().catch(error => {console.error(error);process.exitCode=1;});
