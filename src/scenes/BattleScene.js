import Phaser from 'phaser';
import { SKILLS } from '../data/skills';
import { ITEMS } from '../data/items';
import { ENEMIES } from '../data/enemies';

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
        this.input.keyboard.enabled = true;
        this.cameras.main.setBackgroundColor('#1a1a24');

        // Carrega os dados do inimigo
        this.enemyConfig = this.isBoss ? ENEMIES.goblin_boss : ENEMIES.goblin;
        
        // Fundo em camadas Parallax
        this.bgSky = this.add.tileSprite(400, 300, 800, 600, 'battle_bg').setDepth(-4);
        this.bgSky.setTint(0x333344); 

        this.bgMountains = this.add.tileSprite(400, 300, 800, 600, 'battle_bg').setDepth(-3);
        this.bgMountains.setTint(0x555566); 
        this.bgMountains.setAlpha(0.6);

        this.bgGround = this.add.tileSprite(400, 300, 800, 600, 'battle_bg').setDepth(-2);
        
        // Camada de Névoa
        const fogGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        fogGraphics.fillStyle(0xcccccc, 1);
        fogGraphics.fillRect(0, 0, 256, 256);
        fogGraphics.generateTexture('fogTextureBattle', 256, 256);
        this.fogLayer = this.add.tileSprite(400, 500, 800, 200, 'fogTextureBattle')
            .setDepth(-1)
            .setAlpha(0.25)
            .setBlendMode(Phaser.BlendModes.ADD);

        // Caixa de Diálogo / Log no Canto Inferior Esquerdo
        this.add.rectangle(250, 510, 460, 140, 0x000000, 0.85).setStrokeStyle(4, 0x4a3c31).setDepth(9);

        // Música de Combate
        this.sound.stopAll();
        this.bgm = this.sound.add(this.enemyConfig.bgm, { loop: true, volume: this.enemyConfig.bgmVolume });
        this.bgm.play();

        this.statusText = this.add.text(250, 510, 'Batalha Iniciada!', {
            fontFamily: 'Pixelify Sans', fontSize: '20px', color: '#ffffff', align: 'center', wordWrap: { width: 420 },
            stroke: '#000', strokeThickness: 2
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
        
        this.enemyMaxHP = this.enemyConfig.maxHp;
        this.enemyHP = this.enemyMaxHP;

        // Textos de HP e SP
        this.playerHPText = this.add.text(600, 180, `HP: ${this.playerStats.hp}/${this.playerStats.maxHp}`, {
            fontFamily: 'Pixelify Sans', fontSize: '20px', color: '#00ff00', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(10);

        this.playerSPText = this.add.text(600, 210, `SP: ${this.playerStats.sp}/${this.playerStats.maxSp}`, {
            fontFamily: 'Pixelify Sans', fontSize: '20px', color: '#00bfff', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(10);

        this.playerLevelText = this.add.text(600, 240, `Nvl: ${this.playerStats.level} | XP: ${this.playerStats.xp}/${this.playerStats.nextXp}`, {
            fontFamily: 'Pixelify Sans', fontSize: '16px', color: '#ffffff', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(10);
        
        this.enemyHPText = this.add.text(200, 200, `HP: ${this.enemyHP}/${this.enemyMaxHP}`, {
            fontFamily: 'Pixelify Sans', fontSize: '20px', color: '#ff4444', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(10);

        this.enemyNameText = this.add.text(200, 170, this.enemyConfig.name, {
            fontFamily: 'Pixelify Sans', fontSize: '20px', fontStyle: 'bold', color: '#ffd700', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(10);

        // Sprites de Combate
        this.playerSprite = this.add.sprite(600, 380, 'john', 2).setScale(0.3).setFlipX(true);
        this.enemySprite = this.add.sprite(200, 380, 'goblin', 0).setScale(this.enemyConfig.scale);
        if (this.enemyConfig.tint) this.enemySprite.setTint(this.enemyConfig.tint);

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
        this.currentMenu = 'main';
        const html = `
            <button id="btn-attack" class="combat-btn">Atacar</button>
            <button id="btn-magic" class="combat-btn">Habilidades / Magias</button>
            <button id="btn-item" class="combat-btn">Itens</button>
            <button id="btn-flee" class="combat-btn">Fugir</button>
        `;
        const options = [
            { id: 'btn-attack', action: 'attack' },
            { id: 'btn-magic', action: 'magic_menu' },
            { id: 'btn-item', action: 'item_menu' },
            { id: 'btn-flee', action: 'flee' }
        ];
        this.updateDOMMenu(html, options);
    }

    buildItemsMenu() {
        this.currentMenu = 'items';
        let html = '';
        const options = [];

        Object.keys(ITEMS).forEach(itemKey => {
            const item = ITEMS[itemKey];
            const count = this.playerStats[itemKey] || 0;
            const btnId = `btn-item-${itemKey}`;
            html += `<button id="${btnId}" class="combat-btn" ${count <= 0 ? 'disabled' : ''}>${item.name} (x${count})</button>`;
            options.push({ id: btnId, action: 'use_item', payload: itemKey });
        });

        html += `<button id="btn-back-items" class="combat-btn" style="border-color: #888;">Voltar</button>`;
        options.push({ id: 'btn-back-items', action: 'back_to_main' });

        this.updateDOMMenu(html, options);
    }

    buildSkillsMenu() {
        this.currentMenu = 'skills';
        let html = '';
        const options = [];

        SKILLS.forEach(skill => {
            const btnId = `btn-skill-${skill.id}`;
            const hasEnoughSp = this.playerStats.sp >= skill.spCost;
            html += `<button id="${btnId}" class="combat-btn" ${!hasEnoughSp ? 'disabled' : ''}>${skill.name} (${skill.spCost} SP)</button>`;
            options.push({ id: btnId, action: 'use_skill', payload: skill });
        });

        html += `<button id="btn-back-skills" class="combat-btn" style="border-color: #888;">Voltar</button>`;
        options.push({ id: 'btn-back-skills', action: 'back_to_main' });

        this.updateDOMMenu(html, options);
    }

    updateMenuCursor() {
        if (!this.menuOptions) return;
        this.menuOptions.forEach((opt, index) => {
            const btn = this.domMenuContainer.getChildByID(opt.id);
            if (btn) {
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

        if (event.code === 'ArrowDown' || event.code === 'KeyS') {
            this.sound.play('menu_move');
            this.menuIndex = (this.menuIndex + 1) % this.menuOptions.length;
            this.updateMenuCursor();
        } else if (event.code === 'ArrowUp' || event.code === 'KeyW') {
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
            this.buildMainMenu();
        }
    }

    executeMenuAction() {
        const option = this.menuOptions[this.menuIndex];
        const action = option.action;
        
        if (action === 'attack') {
            this.executePlayerAttack('Você atacou!', this.playerStats.baseAttack);
        } else if (action === 'magic_menu') {
            this.buildSkillsMenu();
        } else if (action === 'item_menu') {
            this.buildItemsMenu();
        } else if (action === 'back_to_main') {
            this.buildMainMenu();
        } else if (action === 'use_item') {
            this.useItem(option.payload);
        } else if (action === 'use_skill') {
            this.useSkill(option.payload);
        } else if (action === 'flee') {
            this.isPlayerTurn = false;
            this.statusText.setText('Fugindo...');
            this.time.delayedCall(1000, () => {
                this.scene.start('MainScene');
            });
        }
    }

    useItem(itemKey) {
        const item = ITEMS[itemKey];
        const count = this.playerStats[itemKey] || 0;

        if (count > 0) {
            this.isPlayerTurn = false;
            this.playerStats[itemKey]--;
            this.playerStats.hp = Math.min(this.playerStats.maxHp, this.playerStats.hp + item.healAmount);
            this.playerHPText.setText(`HP: ${this.playerStats.hp}/${this.playerStats.maxHp}`);
            this.registry.set('playerStats', this.playerStats);
            
            if (item.sound) this.sound.play(item.sound);
            this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 40, `+${item.healAmount}`, '#00ff00');
            this.statusText.setText(`Você usou uma ${item.name}!`);
            this.domMenuContainer.setAlpha(0.5);
            
            this.time.delayedCall(1500, () => this.enemyTurn());
        } else {
            this.statusText.setText('Sem itens restantes!');
        }
    }

    useSkill(skill) {
        if (this.playerStats.sp >= skill.spCost) {
            this.consumeSP(skill.spCost);
            this.executeSkillHits(skill);
        } else {
            this.statusText.setText('SP Insuficiente!');
        }
    }

    consumeSP(amount) {
        this.playerStats.sp -= amount;
        this.playerSPText.setText(`SP: ${this.playerStats.sp}/${this.playerStats.maxSp}`);
        this.registry.set('playerStats', this.playerStats);
    }

    showFloatingText(x, y, message, color) {
        const floatingText = this.add.text(x, y, message, {
            fontFamily: 'Pixelify Sans', fontSize: '24px', fontStyle: 'bold', color: color,
            stroke: '#000000', strokeThickness: 4
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

    executeSkillHits(skill) {
        this.isPlayerTurn = false;
        this.statusText.setText(skill.name + '!');
        this.domMenuContainer.setAlpha(0.5);

        let currentHitIndex = 0;

        const processNextHit = () => {
            if (currentHitIndex >= skill.hits.length || this.enemyHP <= 0) {
                if (this.enemyHP <= 0) {
                    this.handleVictory();
                } else {
                    this.time.delayedCall(1000, () => this.enemyTurn());
                }
                return;
            }

            const hit = skill.hits[currentHitIndex];
            currentHitIndex++;

            if (hit.sound) this.sound.play(hit.sound);

            this.tweens.add({
                targets: this.playerSprite,
                x: this.playerSprite.x - 30,
                duration: 80,
                yoyo: true,
                onComplete: () => {
                    this.applyDamageToEnemy(hit.damage);
                    if (this.enemyHP <= 0) {
                        this.handleVictory();
                    } else if (currentHitIndex < skill.hits.length) {
                        const nextHit = skill.hits[currentHitIndex];
                        this.time.delayedCall(nextHit.delay || 200, processNextHit);
                    } else {
                        this.time.delayedCall(1000, () => this.enemyTurn());
                    }
                }
            });
        };

        processNextHit();
    }

    applyDamageToEnemy(damage) {
        this.sound.play('hit_impact');
        this.enemyHP = Math.max(0, this.enemyHP - damage);
        this.enemyHPText.setText(`HP: ${this.enemyHP}/${this.enemyMaxHP}`);
        this.cameras.main.shake(150, 0.01);
        this.showFloatingText(this.enemySprite.x, this.enemySprite.y - 40, `-${damage}`, '#ffff00');
    }

    enemyTurn() {
        this.statusText.setText(`O ${this.enemyConfig.name} contra-ataca!`);
        
        this.tweens.add({
            targets: this.enemySprite, x: this.enemySprite.x + 50, duration: 100, yoyo: true,
            onComplete: () => {
                this.sound.play('hit_impact');
                const danoInimigo = this.enemyConfig.attackDamage;
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
                        else if (this.currentMenu === 'skills') this.buildSkillsMenu();
                        else if (this.currentMenu === 'items') this.buildItemsMenu();
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
        this.input.keyboard.enabled = false;
        this.bgm.stop();
        this.sound.play('victory_fanfare');
        
        this.statusText.setText(this.isBoss ? `O ${this.enemyConfig.name} caiu!` : `Vitória! O ${this.enemyConfig.name} foi derrotado.`);
        const xpGanho = this.enemyConfig.xpReward;
        
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
        if (this.bgSky) this.bgSky.tilePositionX += 0.05;
        if (this.bgMountains) this.bgMountains.tilePositionX += 0.12;
        if (this.fogLayer) this.fogLayer.tilePositionX += 0.35;
    }
}
