import Phaser from 'phaser';

export function applyHD2DEffects(scene: Phaser.Scene): void {
  const camera = scene.cameras.main;

  // Vignette — darkens edges
  camera.filters.internal.addVignette(0.5, 0.5, 0.4, 0.3);

  // Color grading — slight saturation boost
  const cm = camera.filters.internal.addColorMatrix();
  cm.colorMatrix.saturate(0.1);
}
