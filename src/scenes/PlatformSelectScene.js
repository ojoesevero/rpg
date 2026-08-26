import Phaser from 'phaser';

export default class PlatformSelectScene extends Phaser.Scene {
    constructor() {
        super('PlatformSelectScene');
    }

    preload() {
        if (!this.cache.audio.exists('menu_move')) {
            this.load.audio('menu_move', 'assets/audio/sfx/menu_move.mp3');
        }
        if (!this.cache.audio.exists('menu_select')) {
            this.load.audio('menu_select', 'assets/audio/sfx/menu_select.mp3');
        }
    }

    create() {
        this.isTransitioning = false;
        this.cameras.main.setBackgroundColor('#1a1a24');

        this.add.text(400, 130, 'ESCOLHA SEU DISPOSITIVO', {
            fontFamily: 'Pixelify Sans', fontSize: '32px', fontStyle: 'bold', color: '#ffffff',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(400, 175, 'Use as Setas / WASD ou Clique para selecionar', {
            fontFamily: 'Pixelify Sans', fontSize: '16px', color: '#aaaaaa'
        }).setOrigin(0.5);

        this.selectedIndex = 0;
        this.options = [
            { mode: 'pc', title: '🖥️ MODO COMPUTADOR (PC)', subtitle: '[Teclado e Mouse]', y: 280 },
            { mode: 'mobile', title: '📱 MODO CELULAR (MOBILE)', subtitle: '[Touch na Tela com D-Pad]', y: 400 }
        ];

        this.cardElements = [];

        this.options.forEach((opt, index) => {
            const card = this.add.rectangle(400, opt.y, 440, 95, 0x000000, 0.85).setStrokeStyle(3, 0x555566);
            card.setInteractive({ useHandCursor: true });

            const textTitle = this.add.text(400, opt.y - 14, opt.title, {
                fontFamily: 'Pixelify Sans', fontSize: '22px', fontStyle: 'bold', color: '#ffffff'
            }).setOrigin(0.5);

            const textSub = this.add.text(400, opt.y + 18, opt.subtitle, {
                fontFamily: 'Pixelify Sans', fontSize: '16px', color: '#aaaaaa'
            }).setOrigin(0.5);

            card.on('pointerover', () => {
                if (this.isTransitioning) return;
                if (this.selectedIndex !== index) {
                    if (this.cache.audio.exists('menu_move')) this.sound.play('menu_move');
                    this.selectedIndex = index;
                    this.updateSelection();
                }
            });

            card.on('pointerdown', () => {
                if (this.isTransitioning) return;
                this.selectedIndex = index;
                this.selectPlatform(opt.mode);
            });

            this.cardElements.push({ card, textTitle, textSub, y: opt.y });
        });

        // Cursor indicador ▶
        this.cursor = this.add.text(140, 280, '▶', {
            fontFamily: 'Pixelify Sans', fontSize: '28px', color: '#ffea00',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: this.cursor,
            x: '+=8',
            duration: 400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.updateSelection();

        // Teclado (WASD e Setas)
        this.input.keyboard.on('keydown', (event) => {
            if (this.isTransitioning) return;

            if (event.code === 'ArrowDown' || event.code === 'KeyS') {
                if (this.cache.audio.exists('menu_move')) this.sound.play('menu_move');
                this.selectedIndex = (this.selectedIndex + 1) % this.options.length;
                this.updateSelection();
            } else if (event.code === 'ArrowUp' || event.code === 'KeyW') {
                if (this.cache.audio.exists('menu_move')) this.sound.play('menu_move');
                this.selectedIndex = (this.selectedIndex - 1 + this.options.length) % this.options.length;
                this.updateSelection();
            } else if (event.code === 'Enter' || event.code === 'NumpadEnter' || event.code === 'Space') {
                this.selectPlatform(this.options[this.selectedIndex].mode);
            }
        });
    }

    updateSelection() {
        this.cardElements.forEach((el, index) => {
            const isSelected = index === this.selectedIndex;
            if (isSelected) {
                el.card.setStrokeStyle(4, 0xffea00);
                el.card.setFillStyle(0x2a2a35, 0.95);
                el.card.setScale(1.03);
                el.textTitle.setColor('#ffea00').setScale(1.03);
                el.textSub.setColor('#ffffff').setScale(1.03);
                this.cursor.setY(el.y);
            } else {
                el.card.setStrokeStyle(3, 0x444455);
                el.card.setFillStyle(0x000000, 0.85);
                el.card.setScale(1.0);
                el.textTitle.setColor('#888899').setScale(1.0);
                el.textSub.setColor('#666677').setScale(1.0);
            }
        });
    }

    selectPlatform(mode) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        this.registry.set('controlMode', mode);

        // Ativa Fullscreen e Trava de Paisagem em dispositivos móveis
        try {
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen().catch(() => {});
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen().catch(() => {});
            }
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock("landscape").catch(() => {});
            }
        } catch (e) {
            console.warn("Fullscreen/Orientation não suportado:", e);
        }
        
        // Retoma o AudioContext se estiver suspenso pelo navegador
        if (this.sound.context && this.sound.context.state === 'suspended') {
            this.sound.context.resume();
        }

        if (this.cache.audio.exists('menu_select')) {
            this.sound.play('menu_select');
        }

        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('TitleScene');
        });
    }
}
