import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    preload() {
        // Por enquanto não temos assets, então não carregaremos nada no preload.
        // Na próxima fase, carregaremos spritesheets e tilesets aqui.
    }

    create() {
        // Cor de fundo provisória (floresta sombria)
        this.cameras.main.setBackgroundColor('#2d362c');

        // Adiciona um texto simples
        this.add.text(10, 10, 'Fase 1: Setup e Movimentação\nUse Setas ou WASD', {
            fontFamily: 'Courier',
            fontSize: '16px',
            color: '#ffffff'
        });

        // Criar um "placeholder" para o jogador
        // Um retângulo vermelho simples de 32x32
        this.player = this.add.rectangle(400, 300, 32, 32, 0x8b0000);
        
        // Habilitar física no placeholder
        this.physics.add.existing(this.player);

        // Configurações de física do jogador
        this.player.body.setCollideWorldBounds(true);

        // Configurar inputs do teclado (Setas e WASD)
        this.cursors = this.input.keyboard.createCursorKeys();
        
        this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        
        // Velocidade base do jogador
        this.playerSpeed = 200;
    }

    update() {
        // Resetar a velocidade
        this.player.body.setVelocity(0);

        let isMoving = false;
        let velocityX = 0;
        let velocityY = 0;

        // Verificar entradas do eixo X
        if (this.cursors.left.isDown || this.keys.left.isDown) {
            velocityX = -this.playerSpeed;
            isMoving = true;
        } else if (this.cursors.right.isDown || this.keys.right.isDown) {
            velocityX = this.playerSpeed;
            isMoving = true;
        }

        // Verificar entradas do eixo Y
        if (this.cursors.up.isDown || this.keys.up.isDown) {
            velocityY = -this.playerSpeed;
            isMoving = true;
        } else if (this.cursors.down.isDown || this.keys.down.isDown) {
            velocityY = this.playerSpeed;
            isMoving = true;
        }

        // Normalizar velocidade na diagonal
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= Math.SQRT1_2;
            velocityY *= Math.SQRT1_2;
        }

        this.player.body.setVelocityX(velocityX);
        this.player.body.setVelocityY(velocityY);
    }
}
