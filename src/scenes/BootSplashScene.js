import Phaser from 'phaser';

export default class BootSplashScene extends Phaser.Scene {
    constructor() {
        super('BootSplashScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000');

        // Fase 1: Logotipo "VELHOS GAMES"
        const logo = this.add.text(400, 300, 'VELHOS GAMES', {
            fontFamily: 'Pixelify Sans', fontSize: '64px', fontStyle: 'bold', color: '#ffea00',
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
        this.input.keyboard.on('keydown-NUMPAD_ENTER', () => this.skipIntro());
    }

    showCrawl() {
        if (this.isSkipping) return;

        // Fase 2: Efeito Star Wars
        const crawlText = "As antigas profecias falavam de uma era de sombras...\n\nNas profundezas da Floresta de Walldarten,\no véu entre os mundos começa a ruir.\n\nJohn Bardem, patrulheiro solitário, assume a vigília\ncontra as criaturas que rastejam do Abismo...";
        
        this.crawl = this.add.text(400, 600, crawlText, {
            fontFamily: 'Pixelify Sans', fontSize: '24px', color: '#ffea00', align: 'center', lineSpacing: 10
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

        // Fase 3: Tocar intro_1.mp4 via DOM acelerado por GPU (Zero stutter)
        const videoHTML = `
            <video id="splash-video" playsinline webkit-playsinline style="width: 800px; height: 600px; object-fit: contain; background: #000; pointer-events: none;">
                <source src="assets/videos/intro_1.mp4" type="video/mp4">
            </video>
        `;
        this.domVideo = this.add.dom(400, 300).createFromHTML(videoHTML).setDepth(100);
        this.videoEl = this.domVideo.getChildByID('splash-video');

        if (this.videoEl) {
            this.videoEl.play().catch(e => {
                console.warn("Autoplay prevenido pelo navegador:", e);
            });
            this.videoEl.onended = () => {
                this.finishSplash();
            };
        } else {
            this.finishSplash();
        }
    }

    skipIntro() {
        if (this.isSkipping) return;
        this.isSkipping = true;

        if (this.videoEl) {
            this.videoEl.pause();
        }
        
        this.finishSplash();
    }

    finishSplash() {
        if (this.videoEl) {
            this.videoEl.pause();
        }
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            if (this.domVideo) {
                this.domVideo.destroy();
            }
            this.scene.start('PlatformSelectScene');
        });
    }
}
