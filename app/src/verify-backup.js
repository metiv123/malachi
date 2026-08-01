import { resolve } from 'node:path';
import { verifyBackupFile } from './backup.js';

const filePath = process.argv[2];
if (!filePath) throw new Error('Usage: npm run backup:verify -- /path/to/backup.json');
const result = await verifyBackupFile(resolve(filePath));
console.log(JSON.stringify(result));
