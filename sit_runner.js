const http = require('http');
const fs = require('fs');
const path = require('path');
function post(p, data) { return new Promise(r => { const req = http.request({host:'localhost',port:3000,path:p,method:'POST',headers:{'Content-Type':'application/json'}}, res => { let d=''; res.on('data', c=>d+=c); res.on('end', ()=>r({s:res.statusCode, b:JSON.parse(d||'{}')})); }); req.write(JSON.stringify(data||{})); req.end(); }); }
function get(p) { return new Promise(r => { const req = http.request({host:'localhost',port:3000,path:p}, res => { let d=''; res.on('data', c=>d+=c); res.on('end', ()=>r({s:res.statusCode, b:JSON.parse(d||'{}')})); }); req.end(); }); }
async function run() {
  console.log("Starting SIT Run 1: Normal Execute");
  const run1 = await post('/run', {workers:1, headless:true, platform:'web'});
  console.log("Run 1 Trigger:", run1.b);
  let status1 = await get('/run-status');
  while(status1.b.phase && !['completed','failed'].includes(status1.b.phase)) {
    await new Promise(r=>setTimeout(r, 1000));
    status1 = await get('/run-status');
  }
  console.log("Run 1 Result:", status1.b);

  console.log("Starting SIT Run 2: Codegen Record & Override");
  const rec1 = await post('/record', {label: 'Input Username', url: 'https://example.com', scenarioId: 'PT.1'});
  console.log("Record Trigger:", rec1.b);
  await new Promise(r=>setTimeout(r, 2000));
  await post('/record-cancel'); // Cancel manually
  console.log("Record Cancelled.");

  const run2 = await post('/run', {workers:1, headless:true, platform:'web'});
  console.log("Run 2 Trigger:", run2.b);
  let status2 = await get('/run-status');
  while(status2.b.phase && !['completed','failed'].includes(status2.b.phase)) {
    await new Promise(r=>setTimeout(r, 1000));
    status2 = await get('/run-status');
  }
  console.log("Run 2 Result:", status2.b);
}
run();
