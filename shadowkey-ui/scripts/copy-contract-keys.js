import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const keysSrc = path.resolve(root, '../shadowkey-contract/src/managed/shadowkey/keys');
const zkirSrc = path.resolve(root, '../shadowkey-contract/src/managed/shadowkey/zkir');
const keysDest = path.resolve(root, 'public/midnight/shadowkey/keys');
const zkirDest = path.resolve(root, 'public/midnight/shadowkey/zkir');

fs.mkdirSync(keysDest, { recursive: true });
fs.mkdirSync(zkirDest, { recursive: true });

if (fs.existsSync(keysSrc)) {
  fs.cpSync(keysSrc, keysDest, { recursive: true });
  console.log('Copied keys to public/midnight/shadowkey/keys');
}

if (fs.existsSync(zkirSrc)) {
  fs.cpSync(zkirSrc, zkirDest, { recursive: true });
  console.log('Copied zkir to public/midnight/shadowkey/zkir');
}
