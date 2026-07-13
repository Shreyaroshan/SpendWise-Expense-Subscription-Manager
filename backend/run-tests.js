import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, 'src');

const getTestFiles = (dir) => {
  let files = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(getTestFiles(fullPath));
    } else if (file.endsWith('.test.js')) {
      files.push(fullPath);
    }
  }
  return files;
};

const testFiles = getTestFiles(srcDir);
if (testFiles.length === 0) {
  console.log('No test files found.');
  process.exit(0);
}

const args = testFiles.map(f => `"${f}"`).join(' ');

try {
  execSync(`node --test ${args}`, { stdio: 'inherit' });
} catch (error) {
  process.exit(1);
}
