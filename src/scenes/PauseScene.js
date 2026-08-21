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
        this.add.rectangle(0, 0, 800, 600, 0x000000, 0.7).setOrigin(0);

        this.add.text(400, 200, 'JOGO PAUSADO', {
            fontFamily: 'Courier', fontSize: '36px', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5);

        this.menuOptions = [
            { textObj: this.add.text(400, 300, '[ Continuar ]', { fontFamily: 'Courier', fontSize: '24px', color: '#ffffff' }).setOrigin(0.5), action: 'resume' },
            { textObj: this.add.text(400, 360, '[ Menu Principal ]', { fontFamily: 'Courier', fontSize: '24px', color: '#ffffff' }).setOrigin(0.5), action: 'quit' }
        ];

        this.menuIndex = 0;
        this.updateCursor();

        this.input.keyboard.on('keydown', (event) => {
            if (event.code === 'ArrowDown') {
                this.sound.play('menu_move');
                this.menuIndex = (this.menuIndex + 1) % this.menuOptions.length;
                this.updateCursor();
            } else if (event.code === 'ArrowUp') {
                this.sound.play('menu_move');
                this.menuIndex = (this.menuIndex - 1 + this.menuOptions.length) % this.menuOptions.length;
                this.updateCursor();
            } else if (event.code === 'Enter' || event.code === 'Space') {
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
                opt.textObj.setColor('#ffea00').setFontStyle('bold');
            } else {
                opt.textObj.setColor('#ffffff').setFontStyle('normal');
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
