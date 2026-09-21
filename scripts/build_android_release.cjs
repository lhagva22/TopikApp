const path = require('node:path');
const { spawnSync } = require('node:child_process');

const args = process.argv.slice(2);
if (args.some(arg => arg !== '--production')) {
  console.error('Usage: node scripts/build_android_release.cjs [--production]');
  process.exit(1);
}
const production = args.includes('--production');
const variant = production ? 'Release' : 'Preview';
const result = spawnSync(
  process.platform === 'win32' ? 'gradlew.bat' : './gradlew',
  [`:app:assemble${variant}`, `:app:bundle${variant}`, '--max-workers=2', '--console=plain'],
  {
    cwd: path.join(__dirname, '..', 'android'),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  }
);
if (result.error) {
  console.error(result.error.message);
}
if (result.status !== 0) {
  process.exit(result.status || 1);
}
const folder = variant.toLowerCase();
console.log(`APK: android/app/build/outputs/apk/${folder}/app-${folder}.apk`);
console.log(`AAB: android/app/build/outputs/bundle/${folder}/app-${folder}.aab`);
if (!production) {
  console.log('Preview is debug-signed for local testing only; not a Google Play release.');
}
