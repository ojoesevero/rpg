import Phaser from 'phaser';

export default class BootSplashScene extends Phaser.Scene {
    constructor() {
        super('BootSplashScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000');

        // Fase 1: Logotipo "VELHOS GAMES"
        const logo = this.add.text(400, 300, 'VELHOS GAMES', {
            fontFamily: 'Pixelify Sans', fontSize: '58px', fontStyle: 'bold', color: '#ffea00',
            shadow: { offsetX: 0, offsetY: 0, color: '#ffea00', blur: 25, stroke: true, fill: true }
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: logo,
            alpha: 1,
            duration: 1500,
            yoyo: true,
            hold: 800,
            onComplete: () => this.showCrawl()
        });

        // Indicador de Pular
        this.skipText = this.add.text(400, 560, '[ Toque na tela ou Espaço para avançar ]', {
            fontFamily: 'Pixelify Sans', fontSize: '15px', color: '#888888'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: this.skipText,
            alpha: 0.8,
            duration: 1000,
            delay: 1000
        });

        // Pular a abertura
        this.isSkipping = false;
        this.input.on('pointerdown', () => this.finishSplash());
        this.input.keyboard.on('keydown-SPACE', () => this.finishSplash());
        this.input.keyboard.on('keydown-ENTER', () => this.finishSplash());
        this.input.keyboard.on('keydown-NUMPAD_ENTER', () => this.finishSplash());
    }

    showCrawl() {
        if (this.isSkipping) return;

        // Fase 2: Texto Introdutório Narrativo
        const crawlText = "As antigas profecias falavam de uma era de sombras...\n\nNas profundezas da Floresta de Walldarten,\no véu entre os mundos começa a ruir.\n\nJohn Bardem, patrulheiro solitário, assume a vigília\ncontra as criaturas que rastejam do Abismo...";
        
        this.crawl = this.add.text(400, 580, crawlText, {
            fontFamily: 'Pixelify Sans', fontSize: '22px', color: '#ffea00', align: 'center', lineSpacing: 12
        }).setOrigin(0.5, 0);

        // Tween para subir e diminuir
        this.tweens.add({
            targets: this.crawl,
            y: -280,
            scale: 0.6,
            alpha: { start: 1, to: 0 },
            duration: 9000,
            ease: 'Linear',
            onComplete: () => this.finishSplash()
        });
    }

    finishSplash() {
        if (this.isSkipping) return;
        this.isSkipping = true;

        if (this.crawl) {
            this.tweens.killTweensOf(this.crawl);
        }

        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('PlatformSelectScene');
        });
    }
}
