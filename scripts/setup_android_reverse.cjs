const { execFileSync } = require('node:child_process');

try {
  const output = execFileSync('adb', ['devices'], { encoding: 'utf8' });
  const devices = output
    .split(/\r?\n/)
    .slice(1)
    .map(line => line.trim().split(/\s+/))
    .filter(([, state]) => state === 'device')
    .map(([serial]) => serial);

  if (devices.length === 0) {
    console.log('[Android ports] No connected device; skipping adb reverse.');
    process.exit(0);
  }

  for (const serial of devices) {
    execFileSync('adb', ['-s', serial, 'reverse', 'tcp:5000', 'tcp:5000']);
    execFileSync('adb', ['-s', serial, 'reverse', 'tcp:8081', 'tcp:8081']);
    console.log(`[Android ports] ${serial}: backend 5000 and Metro 8081 ready.`);
  }
} catch (error) {
  console.warn(`[Android ports] Could not configure adb reverse: ${error.message}`);
}
