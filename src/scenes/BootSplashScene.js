import Phaser from 'phaser';

export default class BootSplashScene extends Phaser.Scene {
    constructor() {
        super('BootSplashScene');
    }

    preload() {
        // Pré-carrega o primeiro vídeo
        this.load.video('intro1', 'assets/videos/intro_1.mp4');
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000');

        // Fase 1: Logotipo "VELHOS GAMES"
        const logo = this.add.text(400, 300, 'VELHOS GAMES', {
            fontFamily: 'Courier', fontSize: '64px', fontStyle: 'bold', color: '#ffea00',
            shadow: { offsetX: 0, offsetY: 0, color: '#ffea00', blur: 20, stroke: true, fill: true }
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: logo,
            alpha: 1,
            duration: 2000,
            yoyo: true,
            hold: 1000,
            onComplete: () => this.showCrawl()
        });

        // Pular a abertura
        this.isSkipping = false;
        this.input.on('pointerdown', () => this.skipIntro());
        this.input.keyboard.on('keydown-SPACE', () => this.skipIntro());
        this.input.keyboard.on('keydown-ENTER', () => this.skipIntro());
    }

    showCrawl() {
        if (this.isSkipping) return;

        // Fase 2: Efeito Star Wars
        const crawlText = "As antigas profecias falavam de uma era de sombras...\n\nNas profundezas da Floresta de Walldarten,\no véu entre os mundos começa a ruir.\n\nJohn Bardem, patrulheiro solitário, assume a vigília\ncontra as criaturas que rastejam do Abismo...";
        
        this.crawl = this.add.text(400, 600, crawlText, {
            fontFamily: 'Courier', fontSize: '24px', color: '#ffea00', align: 'center', lineSpacing: 10
        }).setOrigin(0.5, 0);

        // Tween para subir e diminuir (perspectiva)
        this.tweens.add({
            targets: this.crawl,
            y: -300,
            scale: 0.5,
            alpha: { start: 1, to: 0 },
            duration: 12000,
            onComplete: () => this.playVideo()
        });
    }

    playVideo() {
        if (this.isSkipping) return;

        // Limpar o letreiro se não tiver limpado
        if (this.crawl) this.crawl.destroy();

        // Fase 3: Tocar intro_1.mp4
        const videoPlayer = this.add.video(400, 300, 'intro1');
        videoPlayer.setDisplaySize(800, 600);
        videoPlayer.play();

        videoPlayer.on('complete', () => {
            this.finishSplash();
        });
        
        this.currentVideo = videoPlayer;
    }

    skipIntro() {
        if (this.isSkipping) return;
        this.isSkipping = true;

        if (this.currentVideo) {
            this.currentVideo.stop();
        }
        
        this.finishSplash();
    }

    finishSplash() {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('PlatformSelectScene');
        });
    }
}
