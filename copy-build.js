import fs from 'fs';
import path from 'path';

console.log('Packaging build for automated traditional hosting...');

const srcDist = path.join(process.cwd(), 'dist');
const destDir = path.join(process.cwd(), 'ready_to_upload');

try {
  // Clear previous directory if exists
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }
  fs.mkdirSync(destDir, { recursive: true });

  // Recursive copy helper
  function copyFolderRecursive(from, to) {
    if (!fs.existsSync(to)) {
      fs.mkdirSync(to, { recursive: true });
    }
    fs.readdirSync(from).forEach(element => {
      const srcPath = path.join(from, element);
      const destPath = path.join(to, element);
      if (fs.lstatSync(srcPath).isDirectory()) {
        copyFolderRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }

  if (fs.existsSync(srcDist)) {
    copyFolderRecursive(srcDist, destDir);
    console.log('SUCCESS: Production build files have been safely copied to /ready_to_upload/');
    console.log('You can now download your workspace files. The "ready_to_upload" folder is fully pre-compiled and ready for traditional hosting or cPanel!');
  } else {
    console.error('ERROR: Build directory "dist" not found. Make sure "vite build" ran successfully.');
  }
} catch (err) {
  console.error('Bundle copier failed:', err);
  process.exit(1);
}
