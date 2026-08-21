import Phaser from 'phaser';

export default class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
    }

    preload() {
        // Carrega as BGMs
        this.load.audio('title_bgm', 'assets/audio/bgm/title_bgm.mp3');
        this.load.audio('overworld_bgm', 'assets/audio/bgm/overworld_bgm.mp3');
        this.load.audio('battle_bgm', 'assets/audio/bgm/battle_bgm.mp3');
        this.load.audio('boss_bgm', 'assets/audio/bgm/boss_bgm.mp3');
        this.load.audio('victory_fanfare', 'assets/audio/bgm/victory_fanfare.mp3');

        // Carrega os SFXs
        this.load.audio('menu_move', 'assets/audio/sfx/menu_move.mp3');
        this.load.audio('menu_select', 'assets/audio/sfx/menu_select.mp3');
        this.load.audio('arrow_shot', 'assets/audio/sfx/arrow_shot.mp3');
        this.load.audio('hit_impact', 'assets/audio/sfx/hit_impact.mp3');
        this.load.audio('potion_use', 'assets/audio/sfx/potion_use.mp3');
        
        this.load.image('battle_bg', 'assets/backgrounds/battle_bg.png');
    }

    create() {
        // Garante que o status do jogador exista logo de cara
        if (!this.registry.has('playerStats')) {
            this.registry.set('playerStats', {
                level: 1,
                hp: 100,
                maxHp: 100,
                sp: 50,
                maxSp: 50,
                xp: 0,
                nextXp: 100,
                baseAttack: 25,
                potesCura: 2
            });
        }

        this.sound.stopAll();
        this.bgm = this.sound.add('title_bgm', { loop: true, volume: 0.6 });
        this.bgm.play();

        // Cenário e Atmosfera
        this.bg = this.add.tileSprite(400, 300, 800, 600, 'battle_bg').setDepth(-3);
        this.bg.setTint(0x445577);

        // Névoa
        const fogGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        fogGraphics.fillStyle(0xcccccc, 1);
        fogGraphics.fillRect(0, 0, 256, 256);
        fogGraphics.generateTexture('fogTextureTitle', 256, 256);
        this.fogLayer = this.add.tileSprite(400, 500, 800, 200, 'fogTextureTitle')
            .setDepth(-2)
            .setAlpha(0.20)
            .setBlendMode(Phaser.BlendModes.ADD);

        // Partículas (Sparks)
        const sparks = this.add.particles(0, 0, 'fogTextureTitle', {
            x: { min: 0, max: 800 },
            y: 650,
            lifespan: 4000,
            speedY: { min: -20, max: -60 },
            speedX: { min: -10, max: 10 },
            scale: { start: 0.015, end: 0 },
            alpha: { start: 0.5, end: 0 },
            blendMode: 'ADD',
            tint: 0xffea00
        });
        sparks.setDepth(-1);

        // Título Principal
        this.add.text(400, 150, 'OS SEIS CONTRA O ABISMO', {
            fontFamily: 'Pixelify Sans',
            fontSize: '38px',
            fontStyle: 'bold',
            color: '#f4d03f',
            stroke: '#000000',
            strokeThickness: 6,
            shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 0, stroke: true, fill: true },
            align: 'center'
        }).setOrigin(0.5);

        // Subtítulo
        this.add.text(400, 200, '⚔️ Sombras de Brentel ⚔️', {
            fontFamily: 'Pixelify Sans',
            fontSize: '18px',
            color: '#e0e0e0',
            align: 'center'
        }).setOrigin(0.5);

        // Rodapé
        this.add.text(400, 580, '© 2026 VELHOS GAMES | Dev: Joe Severo', {
            fontFamily: 'Pixelify Sans',
            fontSize: '14px',
            color: '#888888',
            align: 'center'
        }).setOrigin(0.5);


        // Menu de Opções
        this.menuOptions = [
            { text: 'NOVO JOGO', action: 'new_game' },
            { text: 'MODO DE CONTROLE', action: 'controls' },
            { text: 'CRÉDITOS', action: 'credits' }
        ];
        
        this.menuIndex = 0;
        this.menuTexts = [];
        this.isTransitioning = false;

        const startY = 320;
        const spacingY = 45;

        this.menuOptions.forEach((opt, index) => {
            const txt = this.add.text(280, startY + (index * spacingY), opt.text, {
                fontFamily: 'Pixelify Sans', fontSize: '24px', color: '#ffffff', fontStyle: 'bold',
                stroke: '#000', strokeThickness: 4
            }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

            txt.on('pointerdown', () => {
                if (this.isTransitioning) return;
                this.sound.play('menu_select');
                this.menuIndex = index;
                this.updateCursor();
                this.executeMenuAction();
            });

            txt.on('pointerover', () => {
                if (this.isTransitioning) return;
                if (this.menuIndex !== index) {
                    this.sound.play('menu_move');
                    this.menuIndex = index;
                    this.updateCursor();
                }
            });

            this.menuTexts.push(txt);
        });

        // Cursor do Menu
        this.cursor = this.add.text(245, 0, '▶', {
            fontFamily: 'Pixelify Sans', fontSize: '24px', color: '#f4d03f', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: this.cursor,
            x: '-=8',
            yoyo: true,
            repeat: -1,
            duration: 400,
            ease: 'Sine.easeInOut'
        });

        this.updateCursor();

        // Teclado
        this.input.keyboard.on('keydown', this.handleInput, this);
    }

    updateCursor() {
        const selectedText = this.menuTexts[this.menuIndex];
        // Posiciona o cursor fixo a esquerda
        this.cursor.setY(selectedText.y);

        this.menuTexts.forEach((txt, idx) => {
            if (idx === this.menuIndex) {
                txt.setColor('#f4d03f');
            } else {
                txt.setColor('#ffffff');
            }
        });
    }

    handleInput(event) {
        if (this.isTransitioning) return;

        if (event.code === 'ArrowDown' || event.code === 'KeyS') {
            this.sound.play('menu_move');
            this.menuIndex = (this.menuIndex + 1) % this.menuOptions.length;
            this.updateCursor();
        } else if (event.code === 'ArrowUp' || event.code === 'KeyW') {
            this.sound.play('menu_move');
            this.menuIndex = (this.menuIndex - 1 + this.menuOptions.length) % this.menuOptions.length;
            this.updateCursor();
        } else if (event.code === 'Enter' || event.code === 'NumpadEnter' || event.code === 'Space') {
            this.sound.play('menu_select');
            this.executeMenuAction();
        }
    }

    executeMenuAction() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        const action = this.menuOptions[this.menuIndex].action;

        if (action === 'new_game') {
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.tweens.add({ targets: this.bgm, volume: 0, duration: 500, onComplete: () => this.bgm.stop() });
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('IntroVideoScene');
            });
        } else if (action === 'controls') {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.isTransitioning = false;
                this.scene.start('PlatformSelectScene');
            });
        } else if (action === 'credits') {
            // Mostra os créditos rapidamente na própria opção
            const originalText = this.menuTexts[this.menuIndex].text;
            this.menuTexts[this.menuIndex].setText('OBRIGADO POR JOGAR!');
            this.updateCursor(); // reajusta a seta
            
            this.time.delayedCall(1500, () => {
                this.menuTexts[this.menuIndex].setText(originalText);
                this.isTransitioning = false;
                this.updateCursor();
            });
        }
    }

    update() {
        // Movimento da névoa
        if (this.fogLayer) {
            this.fogLayer.tilePositionX += 0.2;
        }
    }
}
