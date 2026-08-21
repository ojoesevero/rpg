import Phaser from 'phaser';

export default class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
    }

    preload() {
        // Carrega as BGMs
        this.load.audio('title_bgm', 'assets/audio/bgm/title_bgm.mp3');
        this.load.audio('overworld_bgm', 'assets/audio/bgm/overworld_bgm.mp3');
        this.load.audio('battle_bgm', 'assets/audio/bgm/battle_bgm.mp3');
        this.load.audio('boss_bgm', 'assets/audio/bgm/boss_bgm.mp3');
        this.load.audio('victory_fanfare', 'assets/audio/bgm/victory_fanfare.mp3');

        // Carrega os SFXs
        this.load.audio('menu_move', 'assets/audio/sfx/menu_move.mp3');
        this.load.audio('menu_select', 'assets/audio/sfx/menu_select.mp3');
        this.load.audio('arrow_shot', 'assets/audio/sfx/arrow_shot.mp3');
        this.load.audio('hit_impact', 'assets/audio/sfx/hit_impact.mp3');
        this.load.audio('potion_use', 'assets/audio/sfx/potion_use.mp3');
    }

    create() {
        // Fundo atmosférico escuro
        this.cameras.main.setBackgroundColor('#050508');

        // Garante que o status do jogador exista logo de cara
        if (!this.registry.has('playerStats')) {
            this.registry.set('playerStats', {
                level: 1,
                hp: 100,
                maxHp: 100,
                sp: 50,
                maxSp: 50,
                xp: 0,
                nextXp: 100,
                baseAttack: 25,
                potesCura: 2
            });
        }

        // Para evitar múltiplas instâncias da mesma música se voltar pro menu
        this.sound.stopAll();
        this.bgm = this.sound.add('title_bgm', { loop: true, volume: 0.6 });
        this.bgm.play();

        // Título Principal
        this.add.text(400, 200, 'OS SEIS CONTRA O ABISMO', {
            fontFamily: 'Courier',
            fontSize: '42px',
            fontStyle: 'bold',
            color: '#ffea00',
            align: 'center'
        }).setOrigin(0.5);

        // Subtítulo
        this.add.text(400, 260, 'Sombras de Brentel - Demo John Bardem', {
            fontFamily: 'Courier',
            fontSize: '20px',
            color: '#aaaaaa',
            align: 'center'
        }).setOrigin(0.5);

        // Botão de Iniciar com efeito de pulso
        const startText = this.add.text(400, 450, '[ Pressione ENTER para Iniciar ]', {
            fontFamily: 'Courier',
            fontSize: '24px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: startText,
            alpha: 0,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Transição de Cena
        this.input.keyboard.on('keydown', (event) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter' || event.code === 'Space') {
                this.sound.play('menu_select');
                
                // Fade out visual e sonoro
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.tweens.add({
                    targets: this.bgm,
                    volume: 0,
                    duration: 500,
                    onComplete: () => this.bgm.stop()
                });

                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start('IntroVideoScene');
                });
            }
        });
    }
}
