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
      const size = 64;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ff69b4';
      ctx.fillRect(0, 0, size, size);
      this.textures.addCanvas(file.key, canvas);
    });
  }

  create(): void {
    this.scene.launch('UIScene');
    this.scene.start('WorldScene');
  }
}
