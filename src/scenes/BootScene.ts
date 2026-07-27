import Phaser from 'phaser';
import { ASSET_MANIFEST } from '../assets/AssetManifest';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    ASSET_MANIFEST.forEach((entry) => {
      if (entry.frameWidth && entry.frameHeight) {
        this.load.spritesheet(entry.key, entry.path, {
          frameWidth: entry.frameWidth,
          frameHeight: entry.frameHeight,
        });
      } else {
        this.load.image(entry.key, entry.path);
      }
    });

    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      const entry = ASSET_MANIFEST.find(e => e.key === file.key);
      const fw = entry?.frameWidth ?? 0;
      const fh = entry?.frameHeight ?? 0;
      const size = fw || fh ? Math.max(fw, fh) : 64;

      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ff69b4';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#000';
      ctx.fillRect(2, 2, size - 4, size - 4);
      ctx.fillStyle = '#ff69b4';
      ctx.beginPath();
      ctx.arc(size / 2, size * 0.35, size * 0.25, 0, Math.PI * 2);
      ctx.fill();
      this.textures.addCanvas(file.key, canvas);
    });
  }

  create(): void {
    this.scene.launch('UIScene');
    this.scene.start('WorldScene');
  }
}
