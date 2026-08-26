import Phaser from 'phaser';

export default class PauseScene extends Phaser.Scene {
    constructor() {
        super('PauseScene');
    }

    init(data) {
        this.previousSceneKey = data.from;
    }

    create() {
        // Overlay semi-transparente
        this.add.rectangle(0, 0, 800, 600, 0x000000, 0.75).setOrigin(0);

        this.add.text(400, 180, 'JOGO PAUSADO', {
            fontFamily: 'Pixelify Sans', fontSize: '38px', fontStyle: 'bold', color: '#ffffff',
            stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5);

        const createOption = (y, text, action, index) => {
            const textObj = this.add.text(400, y, text, {
                fontFamily: 'Pixelify Sans', fontSize: '26px', color: '#ffffff',
                stroke: '#000000', strokeThickness: 3
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            textObj.on('pointerdown', () => {
                this.sound.play('menu_select');
                this.menuIndex = index;
                this.updateCursor();
                this.executeAction(action);
            });

            textObj.on('pointerover', () => {
                if (this.menuIndex !== index) {
                    this.sound.play('menu_move');
                    this.menuIndex = index;
                    this.updateCursor();
                }
            });

            return { textObj, action };
        };

        this.menuOptions = [
            createOption(290, '[ Continuar ]', 'resume', 0),
            createOption(360, '[ Menu Principal ]', 'quit', 1)
        ];

        this.menuIndex = 0;
        this.updateCursor();

        this.input.keyboard.on('keydown', (event) => {
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
                this.executeAction();
            } else if (event.code === 'Escape' || event.code === 'KeyP') {
                this.executeAction('resume'); // Despausar direto
            }
        });
    }

    updateCursor() {
        this.menuOptions.forEach((opt, i) => {
            if (i === this.menuIndex) {
                opt.textObj.setColor('#ffea00').setFontStyle('bold').setScale(1.05);
            } else {
                opt.textObj.setColor('#ffffff').setFontStyle('normal').setScale(1.0);
            }
        });
    }

    executeAction(forcedAction = null) {
        const action = forcedAction || this.menuOptions[this.menuIndex].action;
        if (action === 'resume') {
            this.scene.stop();
            this.scene.resume(this.previousSceneKey);
        } else if (action === 'quit') {
            this.sound.stopAll();
            this.registry.destroy();
            this.scene.stop();
            this.scene.stop(this.previousSceneKey);
            this.scene.start('TitleScene');
        }
    }
}
