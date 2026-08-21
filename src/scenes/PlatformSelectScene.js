import Phaser from 'phaser';

export default class PlatformSelectScene extends Phaser.Scene {
    constructor() {
        super('PlatformSelectScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a1a24');

        this.add.text(400, 150, 'ESCOLHA SEU DISPOSITIVO', {
            fontFamily: 'Courier', fontSize: '32px', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5);

        // Opção PC
        const pcCard = this.add.rectangle(400, 300, 400, 80, 0x000000, 0.8).setStrokeStyle(3, 0xffea00);
        pcCard.setInteractive({ useHandCursor: true });
        
        const pcText = this.add.text(400, 300, '🖥️ MODO COMPUTADOR (PC)\n[Teclado e Mouse]', {
            fontFamily: 'Courier', fontSize: '20px', color: '#ffea00', align: 'center'
        }).setOrigin(0.5);

        // Opção Mobile
        const mobileCard = this.add.rectangle(400, 420, 400, 80, 0x000000, 0.8).setStrokeStyle(3, 0xaaaaaa);
        mobileCard.setInteractive({ useHandCursor: true });

        const mobileText = this.add.text(400, 420, '📱 MODO CELULAR (MOBILE)\n[Touch na Tela]', {
            fontFamily: 'Courier', fontSize: '20px', color: '#aaaaaa', align: 'center'
        }).setOrigin(0.5);

        // Hover PC
        pcCard.on('pointerover', () => {
            pcCard.setFillStyle(0x333333, 0.8);
        });
        pcCard.on('pointerout', () => {
            pcCard.setFillStyle(0x000000, 0.8);
        });

        // Hover Mobile
        mobileCard.on('pointerover', () => {
            mobileCard.setFillStyle(0x333333, 0.8);
        });
        mobileCard.on('pointerout', () => {
            mobileCard.setFillStyle(0x000000, 0.8);
        });

        // Clicks
        pcCard.on('pointerdown', () => this.selectPlatform('pc'));
        mobileCard.on('pointerdown', () => this.selectPlatform('mobile'));
    }

    selectPlatform(mode) {
        this.registry.set('controlMode', mode);
        
        // Tentar tocar som se ele já estiver carregado no cache global (será carregado depois, mas caso exista)
        if (this.cache.audio.exists('menu_select')) {
            this.sound.play('menu_select');
        }

        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('TitleScene');
        });
    }
}
