import Phaser from 'phaser';
import { mobileControls } from '../ui/mobileControls';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    preload() {
        this.load.image('overworld_map', 'assets/backgrounds/overworld_map.png');
        
        this.load.spritesheet('john', 'assets/sprites/john_bardem.png', { 
            frameWidth: Math.floor(2092 / 8),
            frameHeight: 752
        });

        this.load.spritesheet('goblin', 'assets/sprites/goblin.png', {
            frameWidth: 336,
            frameHeight: 1152
        });
    }

    create() {
        if (!this.registry.has('goblinsDefeated')) {
            this.registry.set('goblinsDefeated', [false, false]);
        }
        const goblinsDefeated = this.registry.get('goblinsDefeated');

        if (!this.registry.has('playerPos')) {
            this.registry.set('playerPos', { x: 400, y: 500 });
        }
        const playerPos = this.registry.get('playerPos');
        const stats = this.registry.get('playerStats');

        this.registry.set('isBossBattle', false);

        // Música
        this.sound.stopAll();
        this.bgm = this.sound.add('overworld_bgm', { loop: true, volume: 0.5 });
        this.bgm.play();

        // Arte de fundo de alta qualidade (16-bit/NDS)
        const mapBg = this.add.image(0, 0, 'overworld_map').setOrigin(0, 0);
        mapBg.setDisplaySize(800, 600);
        mapBg.setDepth(-1000);

        // Grupo Estático para Obstáculos e Barreiras Invisíveis (Árvores)
        this.treeColliders = this.physics.add.staticGroup();
        const buildInvisibleWall = (x, y, width, height) => {
            const wall = this.add.rectangle(x, y, width, height, 0x000000, 0).setOrigin(0);
            this.physics.add.existing(wall, true);
            this.treeColliders.add(wall);
        };

        // Mapeamento preciso das barreiras da trilha
        buildInvisibleWall(0, 300, 310, 300);   // Esquerda Inferior
        buildInvisibleWall(490, 300, 310, 300); // Direita Inferior
        buildInvisibleWall(330, 0, 140, 240);   // Bloco Bifurcação Central
        buildInvisibleWall(0, 0, 160, 220);     // Canto Superior Esquerdo
        buildInvisibleWall(640, 0, 160, 220);   // Canto Superior Direito

        this.ysortEntities = [];

        // Jogador (hitbox focada nos pés)
        this.player = this.physics.add.sprite(playerPos.x, playerPos.y, 'john');
        this.player.setScale(0.15); 
        this.player.body.setSize(180, 100);
        this.player.body.setOffset(60, 480); 
        this.player.body.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.treeColliders);
        this.ysortEntities.push(this.player);

        // Inimigos
        this.enemies = this.physics.add.group();
        
        const spawnPoints = [
            { x: 260, y: 220, index: 0 },
            { x: 490, y: 220, index: 1 }
        ];

        spawnPoints.forEach(pos => {
            if (!goblinsDefeated[pos.index]) {
                const goblin = this.enemies.create(pos.x, pos.y, 'goblin');
                goblin.setScale(0.12); 
                goblin.body.setSize(100, 100); 
                goblin.body.setOffset(110, 1000); 
                goblin.body.setImmovable(true); 
                goblin.goblinIndex = pos.index;
                this.ysortEntities.push(goblin);
            }
        });
        
        this.physics.add.collider(this.enemies, this.treeColliders);

        this.physics.add.collider(this.player, this.enemies, (player, enemy) => {
            mobileControls.hide();
            this.registry.set('playerPos', { x: player.x, y: player.y });
            player.body.setVelocity(0);
            this.cursors.up.reset();
            this.cursors.down.reset();
            this.cursors.left.reset();
            this.cursors.right.reset();
            
            this.bgm.stop();
            this.sound.play('hit_impact');

            this.cameras.main.flash(300, 255, 255, 255);
            this.time.delayedCall(300, () => {
                this.scene.start('BattleScene', { isBoss: false, goblinIndex: enemy.goblinIndex });
            });
        });

        // Chefe
        if (goblinsDefeated[0] && goblinsDefeated[1]) {
            const boss = this.physics.add.sprite(400, 150, 'goblin');
            boss.setScale(0.18);
            boss.setTint(0xffaa55);
            boss.body.setSize(100, 100);
            boss.body.setOffset(110, 1000);
            boss.body.setImmovable(true);
            this.physics.add.collider(boss, this.treeColliders);
            this.ysortEntities.push(boss);

            this.physics.add.collider(this.player, boss, (p, b) => {
                mobileControls.hide();
                this.registry.set('playerPos', { x: p.x, y: p.y });
                p.body.setVelocity(0);
                this.bgm.stop();
                this.sound.play('hit_impact');

                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start('IntroVideoScene', { isBossTransition: true });
                });
            });
        }

        // Névoa procedural sutil
        const fogGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        fogGraphics.fillStyle(0xcccccc, 1);
        fogGraphics.fillRect(0, 0, 256, 256);
        fogGraphics.generateTexture('fogTextureMain', 256, 256);
        this.fogLayer = this.add.tileSprite(400, 300, 800, 600, 'fogTextureMain')
            .setDepth(9999)
            .setAlpha(0.15)
            .setBlendMode(Phaser.BlendModes.ADD);

        // God Rays (Feixes de Luz)
        const rayGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        rayGraphics.fillStyle(0xffffee, 1);
        
        rayGraphics.beginPath();
        rayGraphics.moveTo(0, 0);
        rayGraphics.lineTo(60, 0);
        rayGraphics.lineTo(200, 600);
        rayGraphics.lineTo(80, 600);
        rayGraphics.closePath();
        rayGraphics.fillPath();
        
        rayGraphics.generateTexture('god_ray', 250, 600);

        for (let i = 0; i < 3; i++) {
            const ray = this.add.image(150 + i * 250, 300, 'god_ray');
            ray.setBlendMode(Phaser.BlendModes.ADD);
            ray.setAlpha(0.10);
            ray.setDepth(9998);
            ray.setAngle(15);
            
            this.tweens.add({
                targets: ray,
                alpha: 0.25,
                duration: 3000 + (i * 800),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Pássaros cruzando (Gráfico em V)
        const birdGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        birdGraphics.lineStyle(2, 0x111111, 1);
        birdGraphics.beginPath();
        birdGraphics.moveTo(0, 0);
        birdGraphics.lineTo(5, 5);
        birdGraphics.lineTo(10, 0);
        birdGraphics.strokePath();
        birdGraphics.generateTexture('bird_v', 10, 10);

        this.time.addEvent({
            delay: 8000,
            loop: true,
            callback: () => {
                const startY = Phaser.Math.Between(400, 600);
                const bird = this.add.image(-20, startY, 'bird_v').setDepth(15000);
                const shadow = this.add.image(-20, startY + 40, 'bird_v').setDepth(9995).setTint(0x000000).setAlpha(0.3);
                
                this.tweens.add({
                    targets: [bird, shadow],
                    x: 850,
                    y: startY - 400,
                    duration: 5000,
                    ease: 'Linear',
                    onComplete: () => {
                        bird.destroy();
                        shadow.destroy();
                    }
                });
                
                this.tweens.add({
                    targets: bird,
                    scaleY: 0.2,
                    duration: 200,
                    yoyo: true,
                    repeat: -1
                });
            }
        });

        // Gráfico para poeira
        const dustGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        dustGraphics.fillStyle(0xd2b48c, 0.8);
        dustGraphics.fillCircle(2, 2, 2);
        dustGraphics.generateTexture('dust_particle', 4, 4);

        this.dustEmitter = this.add.particles(0, 0, 'dust_particle', {
            emitting: false,
            lifespan: 500,
            speedY: { min: -10, max: -30 },
            speedX: { min: -10, max: 10 },
            scale: { start: 1, end: 0 },
            alpha: { start: 0.6, end: 0 }
        }).setDepth(this.player.y - 1);

        // Folhas ao vento
        const leafGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        leafGraphics.fillStyle(0x3b7d34);
        leafGraphics.fillRect(0, 0, 5, 5);
        leafGraphics.generateTexture('leaf_particle', 5, 5);
        
        this.add.particles(850, 300, 'leaf_particle', {
            x: { min: 800, max: 900 },
            y: { min: -100, max: 700 },
            speedX: { min: -150, max: -300 },
            speedY: { min: 20, max: 50 },
            lifespan: 8000,
            scale: { start: 1, end: 0.5 },
            frequency: 400,
            rotate: { min: 0, max: 360 }
        }).setDepth(10000);

        // Limites da câmera
        this.physics.world.bounds.width = 800;
        this.physics.world.bounds.height = 600;
        this.cameras.main.setBounds(0, 0, 800, 600);
        this.cameras.main.startFollow(this.player);

        // Animações
        this.anims.create({ key: 'walk-down', frames: this.anims.generateFrameNumbers('john', { start: 0, end: 1 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'walk-left', frames: this.anims.generateFrameNumbers('john', { start: 2, end: 3 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'walk-right', frames: this.anims.generateFrameNumbers('john', { start: 4, end: 5 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'walk-up',   frames: this.anims.generateFrameNumbers('john', { start: 6, end: 7 }), frameRate: 8, repeat: -1 });

        if (this.textures.get('goblin').getFrameNames().length > 0) {
            this.anims.create({
                key: 'goblin-walk',
                frames: this.anims.generateFrameNumbers('goblin', { start: 0, end: 7 }),
                frameRate: 8,
                repeat: -1
            });
            this.enemies.getChildren().forEach(enemy => enemy.anims.play('goblin-walk', true));
        }

        // HUD
        const hudBg = this.add.rectangle(10, 10, 250, 75, 0x000000, 0.7).setOrigin(0).setScrollFactor(0).setDepth(20000);
        hudBg.setStrokeStyle(2, 0xaaaaaa);
        this.add.text(20, 15, `John Bardem  |  Nvl ${stats.level}`, { fontFamily: 'Pixelify Sans', fontSize: '14px', fontStyle: 'bold', color: '#ffea00' }).setScrollFactor(0).setDepth(20000);
        this.add.text(20, 35, `HP: ${stats.hp}/${stats.maxHp}   SP: ${stats.sp}/${stats.maxSp}`, { fontFamily: 'Pixelify Sans', fontSize: '12px', color: '#ffffff' }).setScrollFactor(0).setDepth(20000);
        this.add.text(20, 55, `Poções: ${stats.potesCura}`, { fontFamily: 'Pixelify Sans', fontSize: '12px', color: '#00ff00' }).setScrollFactor(0).setDepth(20000);

        this.add.text(10, 570, 'JRPG: Ande (WASD / D-Pad) e encoste nos Goblins', { fontFamily: 'Pixelify Sans', fontSize: '14px', color: '#ffffff', backgroundColor: '#000000aa', padding: { x: 5, y: 5 } }).setScrollFactor(0).setDepth(20000);

        // Inputs
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W, down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A, right: Phaser.Input.Keyboard.KeyCodes.D
        });
        
        const controlMode = this.registry.get('controlMode');
        
        // Inicializa e exibe os controles mobile no viewport real se modo mobile
        if (controlMode === 'mobile') {
            mobileControls.init(() => {
                this.scene.pause();
                this.scene.launch('PauseScene', { from: this.scene.key });
            });
            mobileControls.setPauseCallback(() => {
                this.scene.pause();
                this.scene.launch('PauseScene', { from: this.scene.key });
            });
            mobileControls.show();
        } else {
            mobileControls.hide();
        }
        
        this.events.on('resume', () => {
            if (this.registry.get('controlMode') === 'mobile') {
                mobileControls.show();
            }
        });
        this.events.on('pause', () => mobileControls.hide());
        this.events.on('shutdown', () => mobileControls.hide());

        this.input.keyboard.on('keydown', (event) => {
            if (event.code === 'Escape' || event.code === 'KeyP') {
                this.scene.pause();
                this.scene.launch('PauseScene', { from: this.scene.key });
            }
        });

        this.playerSpeed = 200;
    }

    update() {
        if (this.fogLayer) {
            this.fogLayer.tilePositionX += 0.2;
        }

        this.player.body.setVelocity(0);

        let isMoving = false;
        let vx = 0;
        let vy = 0;
        let currentAnim = null;

        const virtual = mobileControls.getInput();

        if (this.cursors.left.isDown || this.keys.left.isDown || virtual.left) {
            vx -= this.playerSpeed;
            currentAnim = 'walk-left';
            this.player.setFlipX(true);
            isMoving = true;
        } 
        if (this.cursors.right.isDown || this.keys.right.isDown || virtual.right) {
            vx += this.playerSpeed;
            currentAnim = 'walk-right';
            this.player.setFlipX(false);
            isMoving = true;
        }

        if (this.cursors.up.isDown || this.keys.up.isDown || virtual.up) {
            vy -= this.playerSpeed;
            if (!currentAnim) currentAnim = 'walk-up'; 
            isMoving = true;
        } 
        if (this.cursors.down.isDown || this.keys.down.isDown || virtual.down) {
            vy += this.playerSpeed;
            if (!currentAnim) currentAnim = 'walk-down';
            isMoving = true;
        }

        if (vx !== 0 && vy !== 0) {
            vx *= 0.7071;
            vy *= 0.7071;
        }

        this.player.body.setVelocity(vx, vy);

        if (isMoving && currentAnim) {
            this.player.anims.play(currentAnim, true);
            this.player.y += Math.sin(this.time.now / 60) * 0.5;

            try {
                if ((vx !== 0 || vy !== 0) && this.dustEmitter) {
                    if (Math.random() > 0.6) {
                        this.dustEmitter.emitParticleAt(this.player.x, this.player.y + 40);
                    }
                }
            } catch (e) {
                console.warn("Erro ao emitir poeira:", e);
            }
        } else {
            this.player.anims.stop();
            if (this.player.anims.currentAnim) {
                this.player.setFrame(this.player.anims.currentAnim.frames[0].frame.name);
            }
        }

        this.enemies.getChildren().forEach(enemy => {
            if (enemy.active) enemy.body.setVelocity(0);
        });

        this.ysortEntities.forEach(entity => {
            if (entity.active) {
                entity.setDepth(entity.y);
            }
        });
    }
}
