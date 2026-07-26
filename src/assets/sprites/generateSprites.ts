import Phaser from 'phaser';

interface SpriteDef {
  key: string;
  color: number;
  shape: 'square' | 'circle' | 'triangle' | 'diamond';
  size: number;
}

const ROOM_SPRITES: SpriteDef[] = [
  { key: 'sprite-shop', color: 0x4a9eff, shape: 'square', size: 32 },
  { key: 'sprite-inn', color: 0x50c878, shape: 'square', size: 32 },
  { key: 'sprite-smithy', color: 0xff6347, shape: 'square', size: 32 },
  { key: 'sprite-arena', color: 0xffd700, shape: 'square', size: 32 },
  { key: 'sprite-entrance', color: 0x9b59b6, shape: 'diamond', size: 32 },
  { key: 'sprite-library', color: 0x1abc9c, shape: 'square', size: 32 },
  { key: 'sprite-temple', color: 0xe67e22, shape: 'triangle', size: 32 },
];

const CLASS_SPRITES: SpriteDef[] = [
  { key: 'sprite-warrior', color: 0xe74c3c, shape: 'circle', size: 16 },
  { key: 'sprite-mage', color: 0x3498db, shape: 'circle', size: 16 },
  { key: 'sprite-thief', color: 0x2ecc71, shape: 'circle', size: 16 },
  { key: 'sprite-cleric', color: 0xf39c12, shape: 'circle', size: 16 },
  { key: 'sprite-paladin', color: 0xf1c40f, shape: 'circle', size: 16 },
  { key: 'sprite-necromancer', color: 0x8e44ad, shape: 'circle', size: 16 },
];

export function generateSprites(scene: Phaser.Scene): void {
  const allDefs = [...ROOM_SPRITES, ...CLASS_SPRITES];

  for (const def of allDefs) {
    if (scene.textures.exists(def.key)) continue;

    const texture = scene.textures.createCanvas(def.key, def.size, def.size);
    if (!texture) continue;

    const ctx = texture.context as CanvasRenderingContext2D;
    const r = (def.color >> 16) & 0xff;
    const g = (def.color >> 8) & 0xff;
    const b = def.color & 0xff;

    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;

    const cx = def.size / 2;
    const cy = def.size / 2;
    const half = def.size / 2 - 1;

    switch (def.shape) {
      case 'square':
        ctx.fillRect(1, 1, def.size - 2, def.size - 2);
        ctx.strokeRect(1, 1, def.size - 2, def.size - 2);
        break;
      case 'circle':
        ctx.beginPath();
        ctx.arc(cx, cy, half, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(cx, 1);
        ctx.lineTo(1, def.size - 1);
        ctx.lineTo(def.size - 1, def.size - 1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      case 'diamond':
        ctx.beginPath();
        ctx.moveTo(cx, 1);
        ctx.lineTo(def.size - 1, cy);
        ctx.lineTo(cx, def.size - 1);
        ctx.lineTo(1, cy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
    }

    texture.refresh();
  }
}
