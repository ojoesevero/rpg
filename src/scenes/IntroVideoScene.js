import Phaser from 'phaser';

export default class IntroVideoScene extends Phaser.Scene {
    constructor() {
        super('IntroVideoScene');
    }

    preload() {
        // Carrega os vídeos da cutscene inicial
        this.load.video('intro2', 'assets/videos/intro_2.mp4');
        this.load.video('intro3', 'assets/videos/intro_3.mp4');
    }

    init(data) {
        this.isBossTransition = data?.isBossTransition || false;
    }

    create() {
        this.isTransitioning = false; // Flag anti-spam

        // Fundo preto durante o carregamento/vídeo
        this.cameras.main.setBackgroundColor('#000000');

        // Cria o reprodutor de vídeo ajustado à tela 800x600
        const initialVideo = this.isBossTransition ? 'intro3' : 'intro2';
        const videoPlayer = this.add.video(400, 300, initialVideo);
        videoPlayer.setDisplaySize(800, 600);
        videoPlayer.play();

        const initialSubtitle = this.isBossTransition ? 'Ameaças espreitam na escuridão. O Abismo começa a se mover.' : 'John Bardem, patrulheiro solitário, assume a vigília nas matas de Walldarten.';

        // Legenda Narrativa
        const subtitleText = this.add.text(400, 500, initialSubtitle, {
            fontFamily: 'Courier',
            fontSize: '20px',
            color: '#ffea00',
            align: 'center',
            backgroundColor: '#000000aa',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(10);

        // Texto informando opção de pular
        const skipText = this.add.text(400, 570, '[ Espaço ] Pular Introdução', {
            fontFamily: 'Courier',
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#000000aa'
        }).setOrigin(0.5).setDepth(10);

        // Lógica de sequência de vídeos
        videoPlayer.on('complete', () => {
            if (this.isTransitioning) return;
            
            if (this.isBossTransition) {
                this.isTransitioning = true;
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start('BattleScene', { isBoss: true });
                });
            } else {
                this.isTransitioning = true;
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start('MainScene');
                });
            }
        });

        // Evento para pular a cutscene
        this.input.keyboard.on('keydown', (event) => {
            if (event.code === 'Space' || event.code === 'Enter' || event.code === 'NumpadEnter') {
                if (this.isTransitioning) return;
                this.isTransitioning = true;
                
                videoPlayer.stop();
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    if (this.isBossTransition) {
                        this.scene.start('BattleScene', { isBoss: true });
                    } else {
                        this.scene.start('MainScene');
                    }
                });
            }
        });
    }
}
