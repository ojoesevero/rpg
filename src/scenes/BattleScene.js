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
        
        const bg = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'battle_bg');
        bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
        bg.setDepth(-1);

        this.add.rectangle(400, 500, 760, 160, 0x000000).setStrokeStyle(4, 0xffffff).setDepth(9);

        // Música de Combate
        this.sound.stopAll();
        const bgmKey = this.isBoss ? 'boss_bgm' : 'battle_bgm';
        const bgmVolume = this.isBoss ? 0.7 : 0.6;
        this.bgm = this.sound.add(bgmKey, { loop: true, volume: bgmVolume });
        this.bgm.play();

        this.statusText = this.add.text(400, 50, 'Batalha Iniciada!', {
            fontFamily: 'Courier', fontSize: '24px', color: '#ffffff', align: 'center'
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

        this.isPlayerTurn = true;
        this.currentMenu = 'main'; // 'main' ou 'skills'
        this.menuIndex = 0;
        this.menuGroup = this.add.group();

        this.menuStyle = { fontFamily: 'Courier', fontSize: '20px', color: '#ffffff' };
        this.hoverStyle = { color: '#ffea00', fontStyle: 'bold' };

        this.buildMainMenu();
        
        this.input.keyboard.on('keydown', this.handleInput, this);
    }

    buildMainMenu() {
        this.menuGroup.clear(true, true);
        this.menuOptions = [
            { textObj: this.add.text(100, 440, '[ Atacar ]', this.menuStyle).setDepth(10), action: 'attack' },
            { textObj: this.add.text(100, 490, '[ Habilidades / Magias ]', this.menuStyle).setDepth(10), action: 'magic' },
            { textObj: this.add.text(450, 440, '[ Itens ]', this.menuStyle).setDepth(10), action: 'item_menu' },
            { textObj: this.add.text(450, 490, '[ Fugir ]', this.menuStyle).setDepth(10), action: 'flee' }
        ];
        this.menuOptions.forEach(opt => this.menuGroup.add(opt.textObj));
        this.menuIndex = 0;
        this.updateMenuCursor();
    }

    buildItemsMenu() {
        this.menuGroup.clear(true, true);
        this.menuOptions = [
            { textObj: this.add.text(100, 440, `[ Poção de Ervas (x${this.playerStats.potesCura}) ]`, this.menuStyle).setDepth(10), action: 'use_potion' }
        ];
        this.menuOptions.forEach(opt => this.menuGroup.add(opt.textObj));
        this.menuIndex = 0;
        this.updateMenuCursor();
    }

    buildSkillsMenu() {
        this.menuGroup.clear(true, true);
        this.menuOptions = [
            { textObj: this.add.text(100, 440, '[ Disparo Preciso (10 SP) ]', this.menuStyle).setDepth(10), action: 'skill_preciso' },
            { textObj: this.add.text(100, 490, '[ Tiro Duplo (15 SP) ]', this.menuStyle).setDepth(10), action: 'skill_duplo' }
        ];
        this.menuOptions.forEach(opt => this.menuGroup.add(opt.textObj));
        this.menuIndex = 0;
        this.updateMenuCursor();
    }

    updateMenuCursor() {
        this.menuOptions.forEach((opt, index) => {
            let baseText = opt.textObj.text.replace('> ', '');
            if (index === this.menuIndex) {
                opt.textObj.setStyle(this.hoverStyle);
                opt.textObj.setText('> ' + baseText);
            } else {
                opt.textObj.setStyle(this.menuStyle);
                opt.textObj.setText(baseText);
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
        } else if (event.code === 'Enter' || event.code === 'Space') {
            this.sound.play('menu_select');
            this.executeMenuAction();
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
                this.menuGroup.setAlpha(0.5);
                
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
        this.menuGroup.setAlpha(0.5);
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
        this.menuGroup.setAlpha(0.5);

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
                        this.menuGroup.setAlpha(1);
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
                    this.add.rectangle(400, 300, 800, 600, 0x000000).setDepth(99);
                    this.add.text(400, 250, 'DEMO CONCLUÍDA', { fontFamily: 'Courier', fontSize: '32px', fontStyle: 'bold', color: '#ffea00' }).setOrigin(0.5).setDepth(100);
                    this.add.text(400, 320, 'Em breve a jornada dos Seis Contra o Abismo...', { fontFamily: 'Courier', fontSize: '18px', color: '#ffffff' }).setOrigin(0.5).setDepth(100);
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
}
