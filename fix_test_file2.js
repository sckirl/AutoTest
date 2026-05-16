const fs = require('fs');
let serverContent = fs.readFileSync('studio/server.js', 'utf8');
serverContent = serverContent.replace(/const pw = spawn\('npx', \['playwright', 'test', 'core\/dummy\.spec\.ts', '--workers', String\(workers\)\], \{/g, `const pw = spawn('npx', ['playwright', 'test', 'core/executed.spec.ts', '--workers', String(workers)], {`);
fs.writeFileSync('studio/server.js', serverContent);
