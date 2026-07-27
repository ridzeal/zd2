import Phaser from 'phaser';

export function applyHD2DEffects(scene: Phaser.Scene): void {
  const camera = scene.cameras.main;

  // Stronger vignette for DV2 atmosphere
  camera.filters.internal.addVignette(0.5, 0.5, 0.5, 0.4);

  // Warmer color grading — boost reds/yellows, slight saturation
  const cm = camera.filters.internal.addColorMatrix();
  cm.colorMatrix.saturate(0.15, true);
  cm.colorMatrix.hue(5, true); // slight warm shift

  // Subtle brightness boost for pastoral feel
  cm.colorMatrix.brightness(1.05, true);
}
