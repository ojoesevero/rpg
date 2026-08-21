import Phaser from 'phaser';

export default class EndingScene extends Phaser.Scene {
    constructor() {
        super('EndingScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#050508');

        // Partículas suaves no fundo (simulando estrelas ou magia)
        const particles = this.add.particles(0, 0, 'john', {
            x: { min: 0, max: 800 },
            y: { min: 0, max: 600 },
            lifespan: 4000,
            speedY: { min: -10, max: -30 },
            scale: { start: 0.02, end: 0 },
            quantity: 1,
            blendMode: 'ADD'
        });
        particles.setAlpha(0.2);

        // Textos centralizados
        this.add.text(400, 200, 'DEMO CONCLUÍDA!', {
            fontFamily: 'Courier', fontSize: '36px', fontStyle: 'bold', color: '#ffea00',
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 5, stroke: true, fill: true }
        }).setOrigin(0.5);

        this.add.text(400, 280, 'O Líder Goblin foi derrotado e as matas de Walldarten\nestão temporariamente seguras.', {
            fontFamily: 'Courier', fontSize: '18px', color: '#ffffff', align: 'center', lineSpacing: 10
        }).setOrigin(0.5);

        this.add.text(400, 360, 'Em breve: Os Seis Contra o Abismo - Capítulo 1.', {
            fontFamily: 'Courier', fontSize: '18px', color: '#aaaaaa'
        }).setOrigin(0.5);

        this.add.text(400, 420, 'Desenvolvido por: Joe Severo | Velhos Games', {
            fontFamily: 'Courier', fontSize: '16px', color: '#00bfff'
        }).setOrigin(0.5);

        const blinkText = this.add.text(400, 520, '[ Pressione ENTER para Voltar ao Menu Principal ]', {
            fontFamily: 'Courier', fontSize: '18px', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: blinkText,
            alpha: 0,
            duration: 800,
            ease: 'Linear',
            yoyo: true,
            repeat: -1
        });

        // Retorno ao Menu
        this.input.keyboard.on('keydown', (event) => {
            if (event.code === 'Enter' || event.code === 'Space') {
                this.sound.play('menu_select');
                this.sound.stopAll();
                this.registry.destroy();
                
                this.cameras.main.fadeOut(1000, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start('TitleScene');
                });
            }
        });
    }
}
