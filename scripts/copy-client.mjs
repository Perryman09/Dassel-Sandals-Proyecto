import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const targetDir = path.join(rootDir, 'backend', 'client');

if (fs.existsSync(distDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  fs.cpSync(distDir, targetDir, { recursive: true });
  console.log(`[Build] Frontend copiado exitosamente a: ${targetDir}`);
} else {
  console.warn('[Build Warning] La carpeta dist/ no existe. Ejecuta vite build primero.');
}
