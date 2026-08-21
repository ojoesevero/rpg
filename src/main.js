import Phaser from 'phaser';
import TitleScene from './scenes/TitleScene';
import IntroVideoScene from './scenes/IntroVideoScene';
import MainScene from './scenes/MainScene';
import BattleScene from './scenes/BattleScene';
import EndingScene from './scenes/EndingScene';
import PauseScene from './scenes/PauseScene';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // Top-down, sem gravidade vertical
            debug: false
        }
    },
    scene: [TitleScene, IntroVideoScene, MainScene, BattleScene, EndingScene, PauseScene],
    pixelArt: true, // Importante para jogos 8-bits
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);
