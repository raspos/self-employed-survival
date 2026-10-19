import fs from 'node:fs';
const html=fs.readFileSync('dist/index.html','utf8');
for(const f of ['app.js','simulation.js','content.js','editorial.css','brands.js','delivery.js','extensions.js']) {if(['app.js','editorial.css'].includes(f)&&!html.includes(f))throw Error(`Missing reference ${f}`);if(!fs.existsSync('dist/'+f))throw Error(f);}
await import('../dist/simulation.js'); await import('../dist/content.js');
console.log('Static build verified: dist/ (no runtime dependencies)');
