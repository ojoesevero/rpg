import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    preload() {
        // Carrega a arte oficial do mapa
        this.load.image('overworld_map', 'assets/backgrounds/overworld_map.png');
        
        // Carregamento do spritesheet (tira horizontal limpa com 8 frames)
        this.load.spritesheet('john', 'assets/sprites/john_bardem.png', { 
            frameWidth: Math.floor(2092 / 8), // Aprox 261
            frameHeight: 752
        });

        this.load.spritesheet('goblin', 'assets/sprites/goblin.png', {
            frameWidth: 336,
            frameHeight: 1152
        });
    }

    create() {
        if (!this.registry.has('goblinsDefeated')) {
            this.registry.set('goblinsDefeated', [false, false]);
        }
        const goblinsDefeated = this.registry.get('goblinsDefeated');

        if (!this.registry.has('playerPos')) {
            this.registry.set('playerPos', { x: 400, y: 530 });
        }
        const playerPos = this.registry.get('playerPos');
        const stats = this.registry.get('playerStats');

        this.registry.set('isBossBattle', false);

        // Inicia música da exploração
        this.sound.stopAll();
        this.bgm = this.sound.add('overworld_bgm', { loop: true, volume: 0.5 });
        this.bgm.play();

        // Limpa fundo e adiciona a arte oficial do mapa cobrindo a tela (800x600)
        const mapBg = this.add.image(0, 0, 'overworld_map').setOrigin(0, 0);
        mapBg.setDisplaySize(800, 600);
        mapBg.setDepth(0);

        // Grupo Estático para Obstáculos e Barreiras Invisíveis
        this.obstacles = this.physics.add.staticGroup();

        // Função para construir áreas de colisão ocultas (paredes invisíveis nas copas das árvores)
        const buildInvisibleWall = (x, y, width, height) => {
            const wall = this.add.rectangle(x, y, width, height, 0x000000, 0).setOrigin(0);
            this.physics.add.existing(wall, true); // true indica que é estático (isStatic: true)
            this.obstacles.add(wall);
        };

        // Colisores com margem guiando estritamente pelo leito de terra batida (trilha em 'Y')
        buildInvisibleWall(0, 0, 260, 600);   // Mata densa esquerda
        buildInvisibleWall(540, 0, 260, 600); // Mata densa direita
        buildInvisibleWall(260, 0, 280, 200); // Maciço de pinheiros central (fechando o triângulo do 'Y')

        // Substituindo o placeholder pelo sprite animado do John Bardem (recuperando posição)
        this.player = this.physics.add.sprite(playerPos.x, playerPos.y, 'john');
        this.player.setScale(0.15); 
        this.player.body.setSize(120, 100);
        this.player.body.setOffset(70, 600); 

        // Limites da física e colisão do jogador com os obstáculos estáticos
        this.physics.world.bounds.width = 800;
        this.physics.world.bounds.height = 600;
        this.player.body.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.obstacles);

        // Fase 4: Grupo de Inimigos (Goblins)
        this.enemies = this.physics.add.group();
        
        // Spawn Exato de 2 Goblins baseados no estado
        const spawnPoints = [
            { x: 260, y: 220, index: 0 }, // Caminho da esquerda
            { x: 490, y: 220, index: 1 }  // Centro do caminho da direita
        ];

        spawnPoints.forEach(pos => {
            if (!goblinsDefeated[pos.index]) {
                const goblin = this.enemies.create(pos.x, pos.y, 'goblin');
                goblin.setScale(0.12); 
                goblin.setDepth(1); // Fica sobre a trilha
                goblin.body.setSize(40, 30); 
                goblin.body.setOffset(147, 1120); 
                goblin.body.setImmovable(true); 
                goblin.goblinIndex = pos.index;
            }
        });
        
        // Os inimigos também não atravessam as árvores/rochas
        this.physics.add.collider(this.enemies, this.obstacles);

        // Gatilho de Batalha: Entrar em Batalha ao tocar no Inimigo Normal
        this.physics.add.collider(this.player, this.enemies, (player, enemy) => {
            // Salva a posição antes do combate
            this.registry.set('playerPos', { x: player.x, y: player.y });
            
            player.body.setVelocity(0);
            this.cursors.up.reset();
            this.cursors.down.reset();
            this.cursors.left.reset();
            this.cursors.right.reset();
            
            // Transição sonora para combate
            this.bgm.stop();
            this.sound.play('hit_impact');

            this.cameras.main.flash(300, 255, 255, 255);
            this.time.delayedCall(300, () => {
                this.scene.start('BattleScene', { isBoss: false, goblinIndex: enemy.goblinIndex });
            });
        });

        // Spawna o Líder Goblin se os dois normais estiverem mortos
        if (goblinsDefeated[0] && goblinsDefeated[1]) {
            // Marca do Boss no topo do Y
            const boss = this.physics.add.sprite(400, 150, 'goblin');
            boss.setScale(0.18); // Maior
            boss.setTint(0xffaa55); // Cor diferenciada
            boss.setDepth(1);
            boss.body.setSize(40, 30);
            boss.body.setOffset(147, 1120);
            boss.body.setImmovable(true);
            this.physics.add.collider(boss, this.obstacles);

            this.physics.add.collider(this.player, boss, (p, b) => {
                // Salva a posição antes do combate final (para coerência)
                this.registry.set('playerPos', { x: p.x, y: p.y });
                p.body.setVelocity(0);
                
                this.bgm.stop();
                this.sound.play('hit_impact');

                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start('IntroVideoScene', { isBossTransition: true });
                });
            });
        }

        // Câmera presa aos limites do cenário de 800x600
        this.cameras.main.setBounds(0, 0, 800, 600);
        this.cameras.main.startFollow(this.player);

        // Criar animações do personagem baseadas no spritesheet
        this.anims.create({ key: 'walk-down', frames: this.anims.generateFrameNumbers('john', { start: 0, end: 1 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'walk-left', frames: this.anims.generateFrameNumbers('john', { start: 2, end: 3 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'walk-right', frames: this.anims.generateFrameNumbers('john', { start: 4, end: 5 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'walk-up',   frames: this.anims.generateFrameNumbers('john', { start: 6, end: 7 }), frameRate: 8, repeat: -1 });

        // Safegurda para criação de animação do inimigo apenas se a textura foi particionada corretamente
        if (this.textures.get('goblin').getFrameNames().length > 0) {
            this.anims.create({
                key: 'goblin-walk',
                frames: this.anims.generateFrameNumbers('goblin', { start: 0, end: 7 }),
                frameRate: 8,
                repeat: -1
            });

            this.enemies.getChildren().forEach(enemy => {
                enemy.anims.play('goblin-walk', true);
            });
        }

        // HUD de Exploração
        const hudBg = this.add.rectangle(10, 10, 250, 75, 0x000000, 0.7).setOrigin(0).setScrollFactor(0).setDepth(100);
        hudBg.setStrokeStyle(2, 0xaaaaaa);
        
        this.add.text(20, 15, `John Bardem  |  Nvl ${stats.level}`, { fontFamily: 'Courier', fontSize: '14px', fontStyle: 'bold', color: '#ffea00' }).setScrollFactor(0).setDepth(100);
        this.add.text(20, 35, `HP: ${stats.hp}/${stats.maxHp}   SP: ${stats.sp}/${stats.maxSp}`, { fontFamily: 'Courier', fontSize: '12px', color: '#ffffff' }).setScrollFactor(0).setDepth(100);
        this.add.text(20, 55, `Poções: ${stats.potesCura}`, { fontFamily: 'Courier', fontSize: '12px', color: '#00ff00' }).setScrollFactor(0).setDepth(100);

        // Texto de ajuda
        this.add.text(10, 570, 'JRPG: Ande (WASD) e encoste nos Goblins', { fontFamily: 'Courier', fontSize: '14px', color: '#ffffff', backgroundColor: '#000000aa', padding: { x: 5, y: 5 } }).setScrollFactor(0).setDepth(100);

        // Configurar inputs
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W, down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A, right: Phaser.Input.Keyboard.KeyCodes.D
        });
        
        this.playerSpeed = 200;
    }

    update() {
        this.player.body.setVelocity(0);

        let isMoving = false;
        let velocityX = 0;
        let velocityY = 0;
        let currentAnim = null;

        // Verificar X
        if (this.cursors.left.isDown || this.keys.left.isDown) {
            velocityX = -this.playerSpeed;
            currentAnim = 'walk-left';
            this.player.setFlipX(true);
            isMoving = true;
        } else if (this.cursors.right.isDown || this.keys.right.isDown) {
            velocityX = this.playerSpeed;
            currentAnim = 'walk-right';
            this.player.setFlipX(false);
            isMoving = true;
        }

        // Verificar Y
        if (this.cursors.up.isDown || this.keys.up.isDown) {
            velocityY = -this.playerSpeed;
            if (!currentAnim) currentAnim = 'walk-up'; 
            isMoving = true;
        } else if (this.cursors.down.isDown || this.keys.down.isDown) {
            velocityY = this.playerSpeed;
            if (!currentAnim) currentAnim = 'walk-down';
            isMoving = true;
        }

        if (isMoving && currentAnim) {
            this.player.anims.play(currentAnim, true);
        } else {
            this.player.anims.stop();
        }

        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= Math.SQRT1_2;
            velocityY *= Math.SQRT1_2;
        }

        this.player.body.setVelocityX(velocityX);
        this.player.body.setVelocityY(velocityY);

        // Mantém inimigos estáticos (redundância)
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.active) enemy.body.setVelocity(0);
        });
    }
}
