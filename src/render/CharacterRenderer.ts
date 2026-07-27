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

export class CharacterRenderer {
  private sprites = new Map<string, Phaser.GameObjects.Sprite>();
  private hpBars = new Map<string, Phaser.GameObjects.Graphics>();
  private scene!: Phaser.Scene;

  create(scene: Phaser.Scene): void {
    this.scene = scene;
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

      let sprite = this.sprites.get(adv.data.id);
      if (!sprite) {
        sprite = this.scene.add.sprite(x, y, spriteKey);
        sprite.setScale(2);
        this.sprites.set(adv.data.id, sprite);

        const animKey = `${spriteKey}-walk`;
        if (!this.scene.anims.exists(animKey)) {
          this.scene.anims.create({
            key: animKey,
            frames: this.scene.anims.generateFrameNumbers(spriteKey, { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1,
          });
        }
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
      }
    }
  }

  destroy(): void {
    this.sprites.forEach(s => s.destroy());
    this.hpBars.forEach(h => h.destroy());
    this.sprites.clear();
    this.hpBars.clear();
  }
}
