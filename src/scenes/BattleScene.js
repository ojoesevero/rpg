import Phaser from 'phaser';

export default class BattleScene extends Phaser.Scene {
    constructor() {
        super('BattleScene');
    }

    preload() {
        this.load.image('battle_bg', 'assets/backgrounds/battle_bg.png');
    }

    init(data) {
        this.isBoss = data?.isBoss || false;
        this.goblinIndex = data?.goblinIndex;
    }

    create() {
        this.input.keyboard.enabled = true; // Garante que inputs estão ativos ao (re)iniciar
        this.cameras.main.setBackgroundColor('#1a1a24');
        
        // Fundo em camadas Parallax (usando a mesma textura 'battle_bg' para simular profundidade se não houver camadas separadas)
        this.bgSky = this.add.tileSprite(400, 300, 800, 600, 'battle_bg').setDepth(-4);
        this.bgSky.setTint(0x333344); 

        this.bgMountains = this.add.tileSprite(400, 300, 800, 600, 'battle_bg').setDepth(-3);
        this.bgMountains.setTint(0x555566); 
        this.bgMountains.setAlpha(0.6);

        this.bgGround = this.add.tileSprite(400, 300, 800, 600, 'battle_bg').setDepth(-2);
        
        // Camada de Névoa (Gerada dinamicamente)
        const fogGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        fogGraphics.fillStyle(0xcccccc, 1);
        fogGraphics.fillRect(0, 0, 256, 256);
        fogGraphics.generateTexture('fogTexture', 256, 256);
        this.fogLayer = this.add.tileSprite(400, 500, 800, 200, 'fogTexture')
            .setDepth(-1)
            .setAlpha(0.25)
            .setBlendMode(Phaser.BlendModes.ADD);

        // Caixa de Diálogo / Log no Canto Inferior Esquerdo
        this.add.rectangle(250, 510, 460, 140, 0x000000, 0.85).setStrokeStyle(4, 0x4a3c31).setDepth(9);

        // Música de Combate
        this.sound.stopAll();
        const bgmKey = this.isBoss ? 'boss_bgm' : 'battle_bgm';
        const bgmVolume = this.isBoss ? 0.7 : 0.6;
        this.bgm = this.sound.add(bgmKey, { loop: true, volume: bgmVolume });
        this.bgm.play();

        this.statusText = this.add.text(250, 510, 'Batalha Iniciada!', {
            fontFamily: 'Courier', fontSize: '20px', color: '#ffffff', align: 'center', wordWrap: { width: 420 }
        }).setOrigin(0.5).setDepth(10);

        // Inicialização ou carregamento de Status Persistentes
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
        this.playerStats = this.registry.get('playerStats');
        
        this.enemyMaxHP = this.isBoss ? 120 : 50;
        this.enemyHP = this.enemyMaxHP;
        const enemyName = this.isBoss ? 'Líder Goblin' : 'Goblin';

        // Textos de HP e SP
        this.playerHPText = this.add.text(600, 180, `HP: ${this.playerStats.hp}/${this.playerStats.maxHp}`, { fontFamily: 'Courier', fontSize: '20px', color: '#00ff00' }).setOrigin(0.5).setDepth(10);
        this.playerSPText = this.add.text(600, 210, `SP: ${this.playerStats.sp}/${this.playerStats.maxSp}`, { fontFamily: 'Courier', fontSize: '20px', color: '#00bfff' }).setOrigin(0.5).setDepth(10);
        this.playerLevelText = this.add.text(600, 240, `Nvl: ${this.playerStats.level} | XP: ${this.playerStats.xp}/${this.playerStats.nextXp}`, { fontFamily: 'Courier', fontSize: '16px', color: '#ffffff' }).setOrigin(0.5).setDepth(10);
        
        this.enemyHPText = this.add.text(200, 200, `HP: ${this.enemyHP}/${this.enemyMaxHP}`, { fontFamily: 'Courier', fontSize: '20px', color: '#ff0000' }).setOrigin(0.5).setDepth(10);
        this.enemyNameText = this.add.text(200, 170, enemyName, { fontFamily: 'Courier', fontSize: '18px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5).setDepth(10);

        this.playerSprite = this.add.sprite(600, 380, 'john', 2).setScale(0.3).setFlipX(true);
        this.enemySprite = this.add.sprite(200, 380, 'goblin', 0).setScale(this.isBoss ? 0.3 : 0.2);
        if (this.isBoss) this.enemySprite.setTint(0xffaa55);

        // Efeito Atmosférico: Breathing (Respiração em Idle)
        this.tweens.add({
            targets: [this.playerSprite, this.enemySprite],
            scaleY: '+=0.015',
            yoyo: true,
            repeat: -1,
            duration: 1200,
            ease: 'Sine.easeInOut'
        });

        this.isPlayerTurn = true;
        this.currentMenu = 'main'; 

        // Menu Container HTML ancorado no bottom-right
        const menuWrapperHTML = `
            <div style="width: 800px; height: 600px; position: relative; pointer-events: none;">
                <div id="combat-menu-area" class="combat-menu-container" style="position: absolute; bottom: 20px; right: 20px;"></div>
            </div>
        `;
        this.domMenuContainer = this.add.dom(400, 300).createFromHTML(menuWrapperHTML);
        this.domMenuContainer.setDepth(10);

        this.buildMainMenu();
        
        this.input.keyboard.on('keydown', this.handleInput, this);
    }

    updateDOMMenu(htmlContent, options) {
        const menuArea = this.domMenuContainer.getChildByID('combat-menu-area');
        if (menuArea) {
            menuArea.innerHTML = htmlContent;
            
            this.menuOptions = options;
            this.menuIndex = 0;
            this.updateMenuCursor();

            // Adiciona cliques do mouse
            options.forEach((opt, index) => {
                const btn = this.domMenuContainer.getChildByID(opt.id);
                if (btn) {
                    btn.addEventListener('click', () => {
                        if (!this.isPlayerTurn) return;
                        this.sound.play('menu_select');
                        this.menuIndex = index;
                        this.executeMenuAction();
                    });
                    btn.addEventListener('mouseenter', () => {
                        if (!this.isPlayerTurn) return;
                        this.menuIndex = index;
                        this.sound.play('menu_move');
                        this.updateMenuCursor();
                    });
                }
            });
        }
    }

    buildMainMenu() {
        const html = `
            <button id="btn-attack" class="combat-btn">Atacar</button>
            <button id="btn-magic" class="combat-btn">Habilidades / Magias</button>
            <button id="btn-item" class="combat-btn">Itens</button>
            <button id="btn-flee" class="combat-btn">Fugir</button>
        `;
        const options = [
            { id: 'btn-attack', action: 'attack' },
            { id: 'btn-magic', action: 'magic' },
            { id: 'btn-item', action: 'item_menu' },
            { id: 'btn-flee', action: 'flee' }
        ];
        this.updateDOMMenu(html, options);
    }

    buildItemsMenu() {
        const html = `
            <button id="btn-potion" class="combat-btn">Poção de Ervas (x${this.playerStats.potesCura})</button>
        `;
        const options = [
            { id: 'btn-potion', action: 'use_potion' }
        ];
        this.updateDOMMenu(html, options);
    }

    buildSkillsMenu() {
        const html = `
            <button id="btn-skill1" class="combat-btn">Disparo Preciso (10 SP)</button>
            <button id="btn-skill2" class="combat-btn">Tiro Duplo (15 SP)</button>
        `;
        const options = [
            { id: 'btn-skill1', action: 'skill_preciso' },
            { id: 'btn-skill2', action: 'skill_duplo' }
        ];
        this.updateDOMMenu(html, options);
    }

    updateMenuCursor() {
        if (!this.menuOptions) return;
        this.menuOptions.forEach((opt, index) => {
            const btn = this.domMenuContainer.getChildByID(opt.id);
            if (btn) {
                // Remove estilos inline caso tenham sido aplicados antes e usa apenas a classe
                btn.removeAttribute('style');
                if (index === this.menuIndex) {
                    btn.classList.add('selected');
                } else {
                    btn.classList.remove('selected');
                }
            }
        });
    }

    handleInput(event) {
        if (!this.isPlayerTurn) return;

        if (event.code === 'ArrowDown') {
            this.sound.play('menu_move');
            this.menuIndex = (this.menuIndex + 1) % this.menuOptions.length;
            this.updateMenuCursor();
        } else if (event.code === 'ArrowUp') {
            this.sound.play('menu_move');
            this.menuIndex = (this.menuIndex - 1 + this.menuOptions.length) % this.menuOptions.length;
            this.updateMenuCursor();
        } else if (event.code === 'Enter' || event.code === 'NumpadEnter' || event.code === 'Space') {
            this.sound.play('menu_select');
            this.executeMenuAction();
        } else if (event.code === 'KeyP' || (event.code === 'Escape' && this.currentMenu === 'main')) {
            this.scene.pause();
            this.scene.launch('PauseScene', { from: this.scene.key });
        } else if ((event.code === 'Escape' || event.code === 'Backspace') && (this.currentMenu === 'skills' || this.currentMenu === 'items')) {
            this.sound.play('menu_select');
            this.currentMenu = 'main';
            this.buildMainMenu();
        }
    }

    executeMenuAction() {
        const action = this.menuOptions[this.menuIndex].action;
        
        if (action === 'attack') {
            this.executePlayerAttack('Você atacou!', this.playerStats.baseAttack);
        } else if (action === 'magic') {
            this.currentMenu = 'skills';
            this.buildSkillsMenu();
        } else if (action === 'item_menu') {
            this.currentMenu = 'items';
            this.buildItemsMenu();
        } else if (action === 'use_potion') {
            if (this.playerStats.potesCura > 0) {
                this.isPlayerTurn = false;
                this.playerStats.potesCura--;
                const cura = 35;
                this.playerStats.hp = Math.min(this.playerStats.maxHp, this.playerStats.hp + cura);
                this.playerHPText.setText(`HP: ${this.playerStats.hp}/${this.playerStats.maxHp}`);
                this.registry.set('playerStats', this.playerStats);
                
                this.sound.play('potion_use');
                this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 40, `+${cura}`, '#00ff00');
                this.statusText.setText('Você usou uma Poção de Ervas!');
                this.domMenuContainer.setAlpha(0.5);
                
                this.time.delayedCall(1500, () => this.enemyTurn());
            } else {
                this.statusText.setText('Você não tem mais poções!');
            }
        } else if (action === 'flee') {
            this.isPlayerTurn = false;
            this.statusText.setText('Fugindo...');
            this.time.delayedCall(1000, () => {
                this.scene.start('MainScene');
            });
        } else if (action === 'skill_preciso') {
            if (this.playerStats.sp >= 10) {
                this.consumeSP(10);
                this.executePlayerAttack('Disparo Preciso!', 45);
            } else {
                this.statusText.setText('SP Insuficiente!');
            }
        } else if (action === 'skill_duplo') {
            if (this.playerStats.sp >= 15) {
                this.consumeSP(15);
                this.executeDoubleAttack();
            } else {
                this.statusText.setText('SP Insuficiente!');
            }
        }
    }

    consumeSP(amount) {
        this.playerStats.sp -= amount;
        this.playerSPText.setText(`SP: ${this.playerStats.sp}/${this.playerStats.maxSp}`);
        this.registry.set('playerStats', this.playerStats);
    }

    showFloatingText(x, y, message, color) {
        const floatingText = this.add.text(x, y, message, {
            fontFamily: 'Courier', fontSize: '24px', fontStyle: 'bold', color: color
        }).setOrigin(0.5).setDepth(15);

        this.tweens.add({
            targets: floatingText,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Power1',
            onComplete: () => floatingText.destroy()
        });
    }

    executePlayerAttack(message, damage) {
        this.isPlayerTurn = false;
        this.statusText.setText(message);
        this.domMenuContainer.setAlpha(0.5);
        this.sound.play('arrow_shot');

        this.tweens.add({
            targets: this.playerSprite, x: this.playerSprite.x - 50, duration: 100, yoyo: true,
            onComplete: () => {
                this.applyDamageToEnemy(damage);
                if (this.enemyHP <= 0) {
                    this.handleVictory();
                } else {
                    this.time.delayedCall(1000, () => this.enemyTurn());
                }
            }
        });
    }

    executeDoubleAttack() {
        this.isPlayerTurn = false;
        this.statusText.setText('Tiro Duplo!');
        this.domMenuContainer.setAlpha(0.5);

        // Primeiro Tiro
        this.sound.play('arrow_shot');
        this.tweens.add({
            targets: this.playerSprite, x: this.playerSprite.x - 30, duration: 80, yoyo: true,
            onComplete: () => {
                this.applyDamageToEnemy(20);
                
                if (this.enemyHP <= 0) {
                    this.handleVictory();
                } else {
                    // Segundo Tiro
                    this.time.delayedCall(200, () => {
                        this.sound.play('arrow_shot');
                        this.tweens.add({
                            targets: this.playerSprite, x: this.playerSprite.x - 30, duration: 80, yoyo: true,
                            onComplete: () => {
                                this.applyDamageToEnemy(20);
                                if (this.enemyHP <= 0) {
                                    this.handleVictory();
                                } else {
                                    this.time.delayedCall(1000, () => this.enemyTurn());
                                }
                            }
                        });
                    });
                }
            }
        });
    }

    applyDamageToEnemy(damage) {
        this.sound.play('hit_impact');
        this.enemyHP = Math.max(0, this.enemyHP - damage);
        this.enemyHPText.setText(`HP: ${this.enemyHP}/${this.enemyMaxHP}`);
        this.cameras.main.shake(150, 0.01);
        this.showFloatingText(this.enemySprite.x, this.enemySprite.y - 40, `-${damage}`, '#ffff00');
    }

    enemyTurn() {
        this.statusText.setText('O Goblin contra-ataca!');
        
        this.tweens.add({
            targets: this.enemySprite, x: this.enemySprite.x + 50, duration: 100, yoyo: true,
            onComplete: () => {
                this.sound.play('hit_impact');
                const danoInimigo = this.isBoss ? 25 : 15;
                this.playerStats.hp = Math.max(0, this.playerStats.hp - danoInimigo);
                this.playerHPText.setText(`HP: ${this.playerStats.hp}/${this.playerStats.maxHp}`);
                this.registry.set('playerStats', this.playerStats);

                this.cameras.main.shake(150, 0.01);
                this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 40, `-${danoInimigo}`, '#ff0000');

                if (this.playerStats.hp === 0) {
                    this.bgm.stop();
                    this.statusText.setText('Você sucumbiu às sombras de Brentel...');
                    this.input.keyboard.enabled = false;
                    this.time.delayedCall(2500, () => {
                        this.registry.destroy();
                        this.cameras.main.fadeOut(500, 0, 0, 0);
                        this.cameras.main.once('camerafadeoutcomplete', () => {
                            this.scene.start('TitleScene');
                        });
                    });
                } else {
                    this.time.delayedCall(1000, () => {
                        this.statusText.setText('Seu turno.');
                        if (this.currentMenu === 'main') this.buildMainMenu();
                        else this.buildSkillsMenu();
                        this.domMenuContainer.setAlpha(1);
                        this.isPlayerTurn = true;
                    });
                }
            }
        });
    }

    markGoblinDefeated() {
        if (!this.isBoss && this.goblinIndex !== undefined) {
            const goblinsDefeated = this.registry.get('goblinsDefeated');
            goblinsDefeated[this.goblinIndex] = true;
            this.registry.set('goblinsDefeated', goblinsDefeated);
        }
    }

    handleVictory() {
        this.input.keyboard.enabled = false; // Bloqueia spam de menu enquanto aguarda transição
        this.bgm.stop();
        this.sound.play('victory_fanfare');
        
        this.statusText.setText(this.isBoss ? 'O Líder Goblin caiu!' : 'Vitória! O Goblin foi derrotado.');
        const xpGanho = this.isBoss ? 100 : 30;
        
        this.time.delayedCall(1000, () => {
            if (this.isBoss) {
                // Fim da Demo
                this.cameras.main.fadeOut(1500, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start('EndingScene');
                });
                return;
            }

            this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 80, `+${xpGanho} XP`, '#00ff00');
            this.playerStats.xp += xpGanho;
            
            if (this.playerStats.xp >= this.playerStats.nextXp) {
                // Level Up
                this.playerStats.level++;
                this.playerStats.xp -= this.playerStats.nextXp;
                this.playerStats.nextXp = Math.floor(this.playerStats.nextXp * 1.5);
                this.playerStats.maxHp += 20;
                this.playerStats.hp = this.playerStats.maxHp;
                this.playerStats.maxSp += 10;
                this.playerStats.sp = this.playerStats.maxSp;
                this.playerStats.baseAttack += 5;
                
                this.time.delayedCall(1000, () => {
                    this.statusText.setText(`LEVEL UP! Nível ${this.playerStats.level}`);
                    this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 40, 'LEVEL UP!', '#ffea00');
                    this.registry.set('playerStats', this.playerStats);
                    this.markGoblinDefeated();
                    this.time.delayedCall(2000, () => this.scene.start('MainScene'));
                });
            } else {
                this.registry.set('playerStats', this.playerStats);
                this.markGoblinDefeated();
                this.time.delayedCall(1500, () => this.scene.start('MainScene'));
            }
        });
    }

    update() {
        // Movimentação suave das camadas Parallax
        if (this.bgSky) this.bgSky.tilePositionX += 0.05;
        if (this.bgMountains) this.bgMountains.tilePositionX += 0.12;
        if (this.fogLayer) this.fogLayer.tilePositionX += 0.35;
    }
}
