const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');
function load(file, imports, globals = {}) {
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: (name) => imports[name] ?? require(name), process, console, URL, URLSearchParams, crypto, ...globals });
  return exports;
}
const config = { POSTHOG_KEY: 'public-test', POSTHOG_HOST: 'https://eu.i.posthog.com', ANALYTICS_VERSION: 'test' };
function browser(storage = new Map(), options = {}) {
  const events = [], vercel = [];
  let init;
  const ph = { init: (_, c) => { init = c; }, capture: (event, properties) => { if(options.fail) throw Error('offline'); events.push({event, properties}); }, get_distinct_id: () => 'browser-id' };
  const api = load('lib/analytics.ts', { 'posthog-js': ph, '@vercel/analytics': { track: (event) => vercel.push(event) }, './analytics-config': config }, {
    window: {}, navigator: { doNotTrack: options.dnt ? '1' : '0' }, location: { hostname: 'hellotmj.com', origin: 'https://hellotmj.com', search: '?tmj_analytics_test=1' },
    sessionStorage: { getItem: k => storage.get(k), setItem: (k,v) => storage.set(k,v), removeItem: k => storage.delete(k) }
  });
  return { api, events, vercel, getConfig: () => init };
}
test('completion remains unique across repeated calls and a reload; retake starts a new attempt', () => {
  const storage = new Map(); const a = browser(storage);
  a.api.startTestTracking('en'); a.api.startTestTracking('en');
  a.api.completeTestTracking('en',25); a.api.completeTestTracking('en',25);
  assert.deepEqual(a.events.map(e=>e.event), ['test_started','test_completed']);
  assert.equal(a.vercel.length,0);
  const b = browser(storage); b.api.startTestTracking('en'); b.api.completeTestTracking('en',25);
  assert.equal(b.vercel.length,0);
  const before = b.api.analyticsContext().testAttemptId;
  b.api.resetTestTracking(); b.api.startTestTracking('en');
  assert.notEqual(b.api.analyticsContext().testAttemptId,before);
});
test('analytics failure cannot break the test flow; DNT disables PostHog and checkout identity', () => {
  const a=browser(new Map(),{fail:true}); assert.doesNotThrow(()=>a.api.completeTestTracking('en',25));
  const b=browser(new Map(),{dnt:true}); b.api.track('test_started');
  assert.equal(b.events.length,0); assert.equal(b.api.analyticsContext().enabled,false);
});
test('sensitive URL queries are removed and diagnostic traffic is labelled', () => {
  const a=browser(); a.api.trackPage('/en/result');
  assert.equal(a.events[0].properties.integration_test,true);
  const event={ properties: { $current_url:'https://hellotmj.com/en/result?session_id=secret#fragment', $referrer:'https://example.com/?email=private' } };
  a.getConfig().before_send(event);
  assert.equal(event.properties.$current_url,'https://hellotmj.com/en/result');
  assert.equal(event.properties.$referrer,'https://example.com/');
  assert.equal(a.getConfig().disable_session_recording,true);
});
test('payment retries have stable identity and timestamp, omit customer data, and respect opt-out', async () => {
  let captures=0;
  class PH { async captureImmediate(){ captures++; } async shutdown(){} }
  const a=load('lib/analytics-server.ts', {'./analytics-config':config,'posthog-node':{PostHog:PH}});
  const session={id:'cs_test_123',created:1700000000,livemode:false,amount_total:100,currency:'usd',metadata:{posthog_distinct_id:'browser-id',test_attempt_id:'attempt-id'},customer_details:{email:'private@example.com'}};
  const x=a.paymentCapture(session),y=a.paymentCapture(session);
  assert.equal(x.uuid,y.uuid); assert.equal(x.timestamp.toISOString(),y.timestamp.toISOString());
  assert.equal(x.distinctId,'browser-id'); assert.equal(x.properties.amount,1); assert.equal(x.properties.integration_test,true);
  assert.ok(!JSON.stringify(x).includes('private@example.com'));
  await a.capturePayment({...session,metadata:{posthog_disabled:'true'}}); assert.equal(captures,0);
});
test('webhook rejects invalid signatures, ignores unpaid sessions, and requests retry on ingestion failure', async () => {
  const Stripe=require('stripe'); const secret='whsec_test_local';
  process.env.STRIPE_SECRET_KEY='sk_test_local';process.env.STRIPE_WEBHOOK_SECRET=secret;
  let captured=0,fail=false;
  const route=load('app/api/stripe/webhook/route.ts',{'@/lib/analytics-server':{capturePayment:async()=>{if(fail)throw Error('offline');captured++;}},'@vercel/analytics/server':{track:async()=>{}},'next/server':{NextResponse:{json:(data,opts)=>Response.json(data,opts)}}},{console:{error:()=>{}}});
  async function send(status,invalid=false){
    const body=JSON.stringify({type:'checkout.session.completed',data:{object:{id:'cs_test',payment_status:status,amount_total:100}}});
    const signature=Stripe.webhooks.generateTestHeaderString({payload:body,secret:invalid?'wrong':secret});
    return route.POST(new Request('http://localhost/api/stripe/webhook',{method:'POST',body,headers:{'stripe-signature':signature}}));
  }
  assert.equal((await send('paid',true)).status,400); assert.equal(captured,0);
  assert.equal((await send('unpaid')).status,200); assert.equal(captured,0);
  assert.equal((await send('paid')).status,200); assert.equal(captured,1);
  fail=true; assert.equal((await send('paid')).status,503);
});
