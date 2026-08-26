// Gerenciador Global de Controles Touch Mobile para Tela Cheia

class MobileControlsManager {
    constructor() {
        this.overlay = null;
        this.virtualInput = { up: false, down: false, left: false, right: false, action: false };
        this.onPauseCallback = null;
    }

    init(onPause) {
        if (this.overlay) return;

        this.onPauseCallback = onPause;

        const overlayHTML = `
            <div id="global-mobile-overlay" class="mobile-controls-overlay">
                <div class="top-controls-container">
                    <button id="mobile-btn-fullscreen" class="icon-control-btn" title="Tela Cheia">⛶</button>
                    <button id="mobile-btn-pause" class="icon-control-btn" title="Pausar">⏸</button>
                </div>
                <div class="dpad-container">
                    <div class="dpad-btn dpad-up" id="mobile-dpad-up">▲</div>
                    <div class="dpad-btn dpad-left" id="mobile-dpad-left">◀</div>
                    <div class="dpad-btn dpad-right" id="mobile-dpad-right">▶</div>
                    <div class="dpad-btn dpad-down" id="mobile-dpad-down">▼</div>
                </div>
                <div class="action-btn-container">
                    <div class="action-btn" id="mobile-btn-action">AÇÃO</div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', overlayHTML);
        this.overlay = document.getElementById('global-mobile-overlay');

        const bindBtn = (id, key) => {
            const btn = document.getElementById(id);
            if (!btn) return;

            const activate = (e) => {
                if (e.cancelable) e.preventDefault();
                this.virtualInput[key] = true;
                btn.classList.add('pressed');
            };

            const deactivate = (e) => {
                if (e && e.cancelable) e.preventDefault();
                this.virtualInput[key] = false;
                btn.classList.remove('pressed');
            };

            btn.addEventListener('touchstart', activate, { passive: false });
            btn.addEventListener('touchend', deactivate, { passive: false });
            btn.addEventListener('touchcancel', deactivate, { passive: false });
            btn.addEventListener('mousedown', activate);
            btn.addEventListener('mouseup', deactivate);
            btn.addEventListener('mouseleave', deactivate);
        };

        bindBtn('mobile-dpad-up', 'up');
        bindBtn('mobile-dpad-down', 'down');
        bindBtn('mobile-dpad-left', 'left');
        bindBtn('mobile-dpad-right', 'right');
        bindBtn('mobile-btn-action', 'action');

        const btnFs = document.getElementById('mobile-btn-fullscreen');
        if (btnFs) {
            btnFs.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFullscreen();
            });
        }

        const btnPause = document.getElementById('mobile-btn-pause');
        if (btnPause) {
            btnPause.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.onPauseCallback) this.onPauseCallback();
            });
        }
    }

    toggleFullscreen() {
        const elem = document.documentElement;
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
            else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen().catch(() => {});
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock("landscape").catch(() => {});
            }
        } else {
            if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen().catch(() => {});
        }
    }

    show() {
        if (this.overlay) {
            this.overlay.style.display = 'block';
        }
    }

    hide() {
        if (this.overlay) {
            this.overlay.style.display = 'none';
            // Reseta inputs
            this.virtualInput = { up: false, down: false, left: false, right: false, action: false };
        }
    }

    getInput() {
        return this.virtualInput;
    }

    setPauseCallback(cb) {
        this.onPauseCallback = cb;
    }
}

export const mobileControls = new MobileControlsManager();
