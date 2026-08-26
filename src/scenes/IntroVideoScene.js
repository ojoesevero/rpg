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

        // Reprodutor de vídeo nativo em tela cheia com legendas alinhadas
        const videoHTML = `
            <div id="intro-video-wrapper" class="intro-video-container">
                <video id="intro-video-el" playsinline webkit-playsinline class="intro-video-player">
                    <source src="${videoSrc}" type="video/mp4">
                </video>
                <div class="intro-subtitle-box">
                    <div class="intro-subtitle-text">${initialSubtitle}</div>
                    <div class="intro-skip-text">[ Toque na tela ou pressione Espaço para pular ]</div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', videoHTML);
        this.videoWrapper = document.getElementById('intro-video-wrapper');
        this.videoEl = document.getElementById('intro-video-el');

        if (this.videoEl) {
            this.videoEl.play().catch(e => console.warn("Autoplay prevenido pelo navegador:", e));
            this.videoEl.onended = () => this.advanceScene();
        }

        if (this.videoWrapper) {
            this.videoWrapper.addEventListener('click', () => this.advanceScene());
            this.videoWrapper.addEventListener('touchstart', (e) => {
                if (e.cancelable) e.preventDefault();
                this.advanceScene();
            }, { passive: false });
        }

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
        if (this.videoWrapper) {
            this.videoWrapper.remove();
            this.videoWrapper = null;
        }

        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            if (this.isBossTransition) {
                this.scene.start('BattleScene', { isBoss: true });
            } else {
                this.scene.start('MainScene');
            }
        });
    }
}
