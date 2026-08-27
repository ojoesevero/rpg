import Phaser from 'phaser';

export default class EndingScene extends Phaser.Scene {
    constructor() {
        super('EndingScene');
    }

    create() {
        this.isTransitioning = false;
        
        // Fundo noturno
        this.bg = this.add.tileSprite(400, 300, 800, 600, 'battle_bg').setDepth(-3);
        this.bg.setTint(0x223344); 
        
        // Névoa suave com gradiente
        if (!this.textures.exists('smoothFog')) {
            const canvasTexture = this.textures.createCanvas('smoothFog', 256, 256);
            const ctx = canvasTexture.context;
            const gradient = ctx.createLinearGradient(0, 0, 0, 256);
            gradient.addColorStop(0, 'rgba(200, 220, 240, 0)');
            gradient.addColorStop(0.5, 'rgba(200, 220, 240, 0.12)');
            gradient.addColorStop(1, 'rgba(200, 220, 240, 0.35)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 256, 256);
            canvasTexture.refresh();
        }

        this.fogLayer = this.add.tileSprite(400, 300, 800, 600, 'smoothFog')
            .setDepth(-2)
            .setAlpha(0.6)
            .setBlendMode(Phaser.BlendModes.ADD);

        // DOM HTML
        const endingHTML = `
            <div class="ending-container">
                <div class="ending-title">⚔️ VITÓRIA EM BRENTEL ⚔️</div>
                <div class="ending-text">
                    O Líder Goblin sucumbiu sob o peso do aço e da estratégia.<br>
                    As matas de Walldarten respiram aliviadas... por ora.<br>
                    Mas John Bardem sabe que a vigília apenas começou.
                </div>
                <div class="ending-highlight">Os Seis Contra o Abismo<br>Capítulo 1: As Ruínas de Aethelgard</div>
                <div class="ending-credits">© 2026 VELHOS GAMES | Dev: Joe Severo</div>
                <button id="btn-restart" class="ending-button">[ Toque ou ENTER para Reiniciar ]</button>
            </div>
        `;

        this.domUI = this.add.dom(400, 300).createFromHTML(endingHTML).setDepth(10);
        
        const btnRestart = this.domUI.getChildByID('btn-restart');
        if (btnRestart) {
            btnRestart.addEventListener('click', () => this.restartGame());
        }

        // Teclado
        this.input.keyboard.on('keydown', (event) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter' || event.code === 'Space') {
                this.restartGame();
            }
        });
    }

    restartGame() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        
        if (this.sound.get('menu_select')) this.sound.play('menu_select');
        this.sound.stopAll();
        this.registry.destroy();
        
        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('TitleScene');
        });
    }

    update() {
        if (this.fogLayer) {
            this.fogLayer.tilePositionX += 0.3;
        }
    }
}
