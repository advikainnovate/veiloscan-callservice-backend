const fs = require('fs');
const path = require('path');
const glob = require('glob');
const baseDir = path.join(__dirname, '../../bruno');
const files = glob.sync('**/*.bru', { cwd: baseDir, absolute: true });
const replacements = [
  [/\{\{baseUrl\}\}\/users\//g, '{{baseUrl}}/api/v1/users/'],
  [/\{\{baseUrl\}\}\/calls\//g, '{{baseUrl}}/api/v1/calls/'],
  [/\{\{baseUrl\}\}\/qr-codes\//g, '{{baseUrl}}/api/v1/qr-codes/'],
  [/\{\{baseUrl\}\}\/chat-sessions\//g, '{{baseUrl}}/api/v1/chat-sessions/'],
  [/\{\{baseUrl\}\}\/healthz/g, '{{baseUrl}}/api/v1/healthz'],
];

files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let updated = content;
  replacements.forEach(([pattern, repl]) => {
    updated = updated.replace(pattern, repl);
  });
  if (updated !== content) {
    fs.writeFileSync(file, updated, 'utf8');
    console.log('Updated', path.relative(baseDir, file));
  }
});
