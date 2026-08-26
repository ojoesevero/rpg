import Phaser from 'phaser';

export default class IntroVideoScene extends Phaser.Scene {
    constructor() {
        super('IntroVideoScene');
    }

    init(data) {
        this.isBossTransition = data?.isBossTransition || false;
    }

    create() {
        this.isTransitioning = false;
        this.cameras.main.setBackgroundColor('#000000');

        const videoSrc = this.isBossTransition ? 'assets/videos/intro_3.mp4' : 'assets/videos/intro_2.mp4';
        const initialSubtitle = this.isBossTransition 
            ? 'Ameaças espreitam na escuridão. O Abismo começa a se mover.' 
            : 'John Bardem, patrulheiro solitário, assume a vigília nas matas de Walldarten.';

        // Reprodutor de vídeo nativo acelerado por hardware
        const videoHTML = `
            <video id="intro-video" playsinline webkit-playsinline style="width: 800px; height: 600px; object-fit: contain; background: #000; pointer-events: none;">
                <source src="${videoSrc}" type="video/mp4">
            </video>
        `;
        this.domVideo = this.add.dom(400, 300).createFromHTML(videoHTML).setDepth(1);
        this.videoEl = this.domVideo.getChildByID('intro-video');

        if (this.videoEl) {
            this.videoEl.play().catch(e => console.warn("Autoplay prevenido pelo navegador:", e));
            this.videoEl.onended = () => this.advanceScene();
        }

        // Legenda Narrativa
        this.subtitleText = this.add.text(400, 515, initialSubtitle, {
            fontFamily: 'Pixelify Sans',
            fontSize: '17px',
            color: '#f4d03f',
            align: 'center',
            backgroundColor: '#000000bb',
            padding: { x: 12, y: 6 },
            wordWrap: { width: 700 },
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(10);

        // Texto informando opção de pular
        this.skipText = this.add.text(400, 565, '[ Espaço / Enter / Clique ] Pular', {
            fontFamily: 'Pixelify Sans',
            fontSize: '15px',
            color: '#ffffff',
            backgroundColor: '#000000bb',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setDepth(10);

        // Pular com clique
        this.input.on('pointerdown', () => this.advanceScene());

        // Pular com teclado
        this.input.keyboard.on('keydown', (event) => {
            if (event.code === 'Space' || event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.advanceScene();
            }
        });
    }

    advanceScene() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        if (this.videoEl) {
            this.videoEl.pause();
        }

        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            if (this.domVideo) {
                this.domVideo.destroy();
            }
            if (this.isBossTransition) {
                this.scene.start('BattleScene', { isBoss: true });
            } else {
                this.scene.start('MainScene');
            }
        });
    }
}
