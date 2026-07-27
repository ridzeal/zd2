import Phaser from 'phaser';
import { gridToScreen, gridToDepth } from './Isometric';
import { Adventurer } from '../entities/Adventurer';

const CLASS_TO_SPRITE: Record<string, string> = {
  warrior: 'char-warrior',
  mage: 'char-mage',
  thief: 'char-thief',
  cleric: 'char-cleric',
  paladin: 'char-paladin',
  necromancer: 'char-necromancer',
};

type Direction = 'down' | 'left' | 'right' | 'up';

const DIRECTION_RANGES: Record<Direction, { start: number; end: number }> = {
  down: { start: 0, end: 3 },
  left: { start: 4, end: 7 },
  right: { start: 8, end: 11 },
  up: { start: 12, end: 15 },
};

export class CharacterRenderer {
  private sprites = new Map<string, Phaser.GameObjects.Sprite>();
  private hpBars = new Map<string, Phaser.GameObjects.Graphics>();
  private prevPositions = new Map<string, { x: number; y: number }>();
  private scene!: Phaser.Scene;

  create(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  private createDirectionalAnims(spriteKey: string): void {
    for (const dir of Object.keys(DIRECTION_RANGES) as Direction[]) {
      const animKey = `${spriteKey}-walk-${dir}`;
      if (!this.scene.anims.exists(animKey)) {
        const { start, end } = DIRECTION_RANGES[dir];
        this.scene.anims.create({
          key: animKey,
          frames: this.scene.anims.generateFrameNumbers(spriteKey, { start, end }),
          frameRate: 6,
          repeat: -1,
        });
      }
    }
  }

  private getDirection(prev: { x: number; y: number } | undefined, curr: { x: number; y: number }): Direction {
    if (!prev) return 'down';
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    if (dx === 0 && dy === 0) return 'down';
    if (Math.abs(dx) >= Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    }
    return dy > 0 ? 'down' : 'up';
  }

  update(adventurers: Adventurer[]): void {
    const activeIds = new Set<string>();

    const sorted = [...adventurers].sort((a, b) => {
      const da = gridToDepth(a.data.x / 32, a.data.y / 32);
      const db = gridToDepth(b.data.x / 32, b.data.y / 32);
      return da - db;
    });

    for (const adv of sorted) {
      activeIds.add(adv.data.id);
      const spriteKey = CLASS_TO_SPRITE[adv.data.classId] || 'char-warrior';
      const { x, y } = gridToScreen(adv.data.x / 32, adv.data.y / 32);
      const depth = gridToDepth(adv.data.x / 32, adv.data.y / 32);

      const prev = this.prevPositions.get(adv.data.id);
      this.prevPositions.set(adv.data.id, { x: adv.data.x, y: adv.data.y });

      let sprite = this.sprites.get(adv.data.id);
      if (!sprite) {
        sprite = this.scene.add.sprite(x, y, spriteKey);
        sprite.setScale(2);
        this.sprites.set(adv.data.id, sprite);

        this.createDirectionalAnims(spriteKey);
        sprite.play(`${spriteKey}-walk-down`);
      }

      const dir = this.getDirection(prev, { x: adv.data.x, y: adv.data.y });
      const animKey = `${spriteKey}-walk-${dir}`;
      if (sprite.anims.currentAnim?.key !== animKey) {
        sprite.play(animKey);
      }

      sprite.setPosition(x, y - 8);
      sprite.setDepth(depth);

      let hpBar = this.hpBars.get(adv.data.id);
      if (!hpBar) {
        hpBar = this.scene.add.graphics();
        this.hpBars.set(adv.data.id, hpBar);
      }
      hpBar.clear();
      const hpRatio = adv.data.hp / adv.data.maxHp;
      hpBar.fillStyle(0x000000, 0.5);
      hpBar.fillRect(x - 10, y + 8, 20, 3);
      hpBar.fillStyle(hpRatio > 0.3 ? 0x00ff00 : 0xff0000, 0.8);
      hpBar.fillRect(x - 10, y + 8, 20 * hpRatio, 3);
      hpBar.setDepth(depth);
    }

    for (const [id, sprite] of this.sprites) {
      if (!activeIds.has(id)) {
        sprite.destroy();
        this.sprites.delete(id);
        this.hpBars.get(id)?.destroy();
        this.hpBars.delete(id);
        this.prevPositions.delete(id);
      }
    }
  }

  destroy(): void {
    this.sprites.forEach(s => s.destroy());
    this.hpBars.forEach(h => h.destroy());
    this.sprites.clear();
    this.hpBars.clear();
    this.prevPositions.clear();
  }
}
