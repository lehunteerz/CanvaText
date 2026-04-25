/**
 * Com signAndEditExecutable=false (evita winCodeSign/symlinks no Windows),
 * o electron-builder não grava o ícone no .exe. Aplicamos com rcedit após o pack.
 */
const path = require('path');
const fs = require('fs');
const rcedit = require('rcedit');

module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return;

  const projectDir = context.packager.projectDir;
  const iconPath = path.join(projectDir, 'build', 'iconblue.ico');
  if (!fs.existsSync(iconPath)) {
    console.warn('[afterPack] Falta build/iconblue.ico — ícone não aplicado ao .exe');
    return;
  }

  const productName = context.packager.appInfo.productFilename;
  const exe = path.join(context.appOutDir, `${productName}.exe`);
  if (!fs.existsSync(exe)) {
    console.warn('[afterPack] .exe não encontrado:', exe);
    return;
  }

  try {
    await rcedit(exe, { icon: iconPath });
    console.log('[afterPack] Ícone aplicado:', exe);
  } catch (err) {
    console.error('[afterPack] rcedit falhou:', err.message);
  }
};
