import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

console.log('Packaging build for automated traditional hosting...');

const readyPath = path.join(process.cwd(), 'ready_to_upload');
const destZip = path.join(process.cwd(), 'ready_to_upload.zip');

try {
  if (fs.existsSync(readyPath)) {
    // Delete old zip if it exists
    if (fs.existsSync(destZip)) {
      fs.unlinkSync(destZip);
    }

    const zip = new AdmZip();
    zip.addLocalFolder(readyPath);
    zip.writeZip(destZip);

    console.log('SUCCESS: Production hosting ZIP bundle pre-compiled and saved to /ready_to_upload.zip!');
  } else {
    console.error('ERROR: ready_to_upload directory not found. Please complete a successful build first.');
    process.exit(1);
  }
} catch (err) {
  console.error('ZIP compilation failed:', err);
  process.exit(1);
}
