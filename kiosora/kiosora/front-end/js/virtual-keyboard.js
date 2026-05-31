// ============= KIOSORA VIRTUAL KEYBOARD =============
// Auto-shows when any input/textarea is tapped
// Works in Chromium kiosk mode on Raspberry Pi

(function () {
    let currentInput = null;
    let isShift = false;
    let isCaps = false;
    let isNumbers = false;
    let isSymbols = false;
    let isFn = false;
    let isAlt = false;
    let isCtrl = false;

    const keys = {
        letters: [
            ['q','w','e','r','t','y','u','i','o','p'],
            ['a','s','d','f','g','h','j','k','l'],
            ['CAPS','z','x','c','v','b','n','m','⌫'],
            ['CTRL','ALT','SHIFT','SPACE','123','ENTER']
        ],
        numbers: [
            ['1','2','3','4','5','6','7','8','9','0'],
            ['\\','*','#','$','/','&','-','+','(',')','_'],
            [',','"',"'",'`',':',';','!','?','@','⌫'],
            ['ABC','SYM','\u2190','\u2192','SPACE','ENTER']
        ],
        symbols: [
            ['~','`','.','√','π','÷','×','¶','@','^'],
            ['©','®','£','€','¥','°','{','}','[',']'],
            ['<','>','=','|','%','\\','_','+','-','⌫'],
            ['ABC','FN','\u2190','\u2192','SPACE','ENTER']
        ],
        fn: [
            ['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12'],
            ['Esc','Tab','Pause','Insert','Del','⌫'],
            ['ABC','Menu','Break','\u2190','\u2191','\u2193','\u2192','ENTER']
        ]
    };

    function createKeyboard() {
        if (document.getElementById('vk-overlay')) return;

        // Overlay (transparent, closes keyboard on tap outside)
        const overlay = document.createElement('div');
        overlay.id = 'vk-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            z-index: 99998; background: transparent;
        `;
        overlay.addEventListener('mousedown', (e) => {
            if (!e.target.closest('#vk-keyboard')) {
                hideKeyboard();
            }
        });

        // Keyboard container
        const kb = document.createElement('div');
        kb.id = 'vk-keyboard';
        kb.style.cssText = `
            position: fixed;
            bottom: 0; left: 0; right: 0;
            width: 100%;
            background: #d1d5db;
            border-top: 1px solid #9ca3af;
            padding: 10px 6px 16px;
            z-index: 99999;
            box-shadow: 0 -2px 8px rgba(0,0,0,0.15);
            user-select: none;
            touch-action: none;
            box-sizing: border-box;
        `;

        overlay.appendChild(kb);
        document.body.appendChild(overlay);
        renderKeys();
    }

    function renderKeys() {
        const kb = document.getElementById('vk-keyboard');
        if (!kb) return;
        kb.innerHTML = '';

        let layout;
        if (isSymbols) layout = keys.symbols;
        else if (isFn) layout = keys.fn;
        else if (isNumbers) layout = keys.numbers;
        else layout = keys.letters;

        layout.forEach((row) => {
            const rowDiv = document.createElement('div');
            rowDiv.style.cssText = `
                display: flex; justify-content: stretch;
                gap: 5px; margin-bottom: 5px;
                width: 100%; padding: 0 4px; box-sizing: border-box;
            `;

            row.forEach((key) => {
                const btn = document.createElement('button');
                btn.textContent = getKeyLabel(key);
                btn.dataset.key = key;
                btn.style.cssText = getKeyStyle(key);

                btn.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleKey(key);
                });

                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleKey(key);
                }, { passive: false });

                rowDiv.appendChild(btn);
            });

            kb.appendChild(rowDiv);
        });
    }

    function getKeyLabel(key) {
        if (key === 'SPACE') return 'Space';
        if (key === 'ENTER') return 'Enter';
        if (key === 'CAPS') return isCaps ? 'CAPS ✓' : 'Caps';
        if (key === '⌫') return '⌫';
        if (key === '123') return '123';
        if (key === 'ABC') return 'ABC';
        if (key === 'SYM') return 'SYM';
        if (key === 'FN')  return 'FN';
        if (key === 'SHIFT') return isShift ? 'Shift ✓' : 'Shift';
        if (key === 'ALT') return isAlt ? 'Alt ✓' : 'Alt';
        if (key === 'CTRL') return isCtrl ? 'Ctrl ✓' : 'Ctrl';
        if (key === '\u2190') return '←';
        if (key === '\u2192') return '→';
        if (key === '\u2191') return '↑';
        if (key === '\u2193') return '↓';
        if (isShift || isCaps) return key.toUpperCase();
        return key;
    }

    function getKeyStyle(key) {
        let flex = '1';
        let bg = '#ffffff';
        let color = '#1f2937';
        let fontSize = '18px';
        let minWidth = '0';

        if (key === 'SPACE') { flex = '5'; bg = '#ffffff'; }
        if (key === 'ENTER') { flex = '2'; bg = '#4b5563'; color = '#ffffff'; }
        if (key === '⌫')    { flex = '1.5'; bg = '#9ca3af'; }
        if (key === 'CAPS') {
            flex = '1.5';
            bg = isCaps ? '#4b5563' : '#9ca3af';
            color = isCaps ? '#ffffff' : '#1f2937';
        }
        if (key === '123' || key === 'ABC') { flex = '1.3'; bg = '#9ca3af'; }
        if (key === 'SYM' || key === 'FN')  { flex = '1.3'; bg = '#6b7280'; color = '#ffffff'; fontSize = '14px'; }

        // Arrow keys
        if (['\u2190','\u2192','\u2191','\u2193'].includes(key)) {
            flex = '1.2'; bg = '#e5e7eb'; fontSize = '18px';
        }

        // Function / special keys
        if (['Esc','Tab','Pause','Insert','Del','Menu','Break'].includes(key)) {
            flex = '1.4'; bg = '#9ca3af'; fontSize = '13px';
        }
        if (['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12'].includes(key)) {
            flex = '1'; bg = '#e5e7eb'; fontSize = '14px';
        }

        // Modifier keys — left-side, compact, like a physical keyboard
        if (key === 'SHIFT') {
            flex = '1.5'; fontSize = '14px';
            bg = isShift ? '#2563eb' : '#9ca3af';
            color = isShift ? '#ffffff' : '#1f2937';
        }
        if (key === 'ALT') {
            flex = '1.1'; fontSize = '14px';
            bg = isAlt ? '#7c3aed' : '#9ca3af';
            color = isAlt ? '#ffffff' : '#1f2937';
        }
        if (key === 'CTRL') {
            flex = '1.1'; fontSize = '14px';
            bg = isCtrl ? '#dc2626' : '#9ca3af';
            color = isCtrl ? '#ffffff' : '#1f2937';
        }

        return `
            flex: ${flex}; min-width: ${minWidth}; height: 52px;
            background: ${bg}; color: ${color};
            border: 1px solid #9ca3af; border-radius: 8px;
            font-size: ${fontSize}; font-weight: 500;
            cursor: pointer; outline: none;
            display: flex; align-items: center; justify-content: center;
            transition: background 0.1s;
            padding: 0; margin: 0;
            font-family: sans-serif;
            -webkit-tap-highlight-color: transparent;
            box-sizing: border-box;
        `;
    }

    function handleKey(key) {
        if (!currentInput) return;

        // Flash effect
        flashKey(key);

        if (key === 'ENTER') {
            if (isCtrl) {
                // Ctrl+Enter: dispatch as KeyboardEvent
                dispatchModifiedKeyEvent('Enter');
                resetModifiers();
                return;
            }
            // Submit form or go to next input
            const form = currentInput.closest('form');
            if (form) {
                const inputs = Array.from(form.querySelectorAll('input, textarea, select'));
                const idx = inputs.indexOf(currentInput);
                if (idx < inputs.length - 1) {
                    inputs[idx + 1].focus();
                    currentInput = inputs[idx + 1];
                } else {
                    hideKeyboard();
                    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                }
            } else {
                hideKeyboard();
            }
            return;
        }

        if (key === '⌫') {
            if (isCtrl) {
                // Ctrl+Backspace: delete previous word
                deleteWord();
                resetModifiers();
                return;
            }
            const start = currentInput.selectionStart;
            const end = currentInput.selectionEnd;
            const val = currentInput.value;
            let newVal;
            let newPos;
            if (start !== end) {
                newVal = val.slice(0, start) + val.slice(end);
                newPos = start;
            } else if (start > 0) {
                newVal = val.slice(0, start - 1) + val.slice(start);
                newPos = start - 1;
            } else {
                return;
            }
            currentInput.value = newVal;
            // Fallback for inputs that block .value (e.g. type="email")
            if (currentInput.value !== newVal) {
                currentInput.focus();
                document.execCommand('delete', false);
            } else {
                currentInput.setSelectionRange(newPos, newPos);
            }
            triggerInputEvent();
            return;
        }

        if (key === 'CAPS') {
            isCaps = !isCaps;
            isShift = false;
            renderKeys();
            return;
        }

        if (key === 'SHIFT') {
            isShift = !isShift;
            renderKeys();
            return;
        }

        if (key === 'ALT') {
            isAlt = !isAlt;
            renderKeys();
            return;
        }

        if (key === 'CTRL') {
            isCtrl = !isCtrl;
            renderKeys();
            return;
        }

        if (key === 'SPACE') {
            if (isCtrl) {
                dispatchModifiedKeyEvent(' ');
                resetModifiers();
                return;
            }
            insertText(' ');
            return;
        }

        if (key === '123') {
            isNumbers = true; isSymbols = false; isFn = false;
            renderKeys();
            return;
        }

        if (key === 'ABC') {
            isNumbers = false; isSymbols = false; isFn = false;
            renderKeys();
            return;
        }

        if (key === 'SYM') {
            isSymbols = true; isNumbers = false; isFn = false;
            renderKeys();
            return;
        }

        if (key === 'FN') {
            isFn = true; isNumbers = false; isSymbols = false;
            renderKeys();
            return;
        }

        // Arrow keys — move cursor
        if (key === '\u2190' || key === '\u2192') {
            const pos = currentInput.selectionStart;
            const newPos = key === '\u2190' ? Math.max(0, pos - 1) : Math.min(currentInput.value.length, pos + 1);
            currentInput.setSelectionRange(newPos, newPos);
            return;
        }

        if (key === '\u2191' || key === '\u2193') {
            dispatchModifiedKeyEvent(key === '\u2191' ? 'ArrowUp' : 'ArrowDown');
            return;
        }

        // Function / special keys — dispatch as keyboard events
        if (['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
             'Esc','Tab','Pause','Insert','Del','Menu','Break'].includes(key)) {
            const keyMap = { 'Esc': 'Escape', 'Del': 'Delete' };
            const eventKey = keyMap[key] || key;
            dispatchModifiedKeyEvent(eventKey);
            return;
        }

        // Regular character — handle with modifiers
        let char = (isShift || isCaps) ? key.toUpperCase() : key;

        if (isCtrl || isAlt) {
            // Fire a KeyboardEvent with modifier flags instead of inserting text
            dispatchModifiedKeyEvent(char);
            resetModifiers();
            return;
        }

        insertText(char);

        // Turn off shift after one key (sticky shift)
        if (isShift) {
            isShift = false;
            renderKeys();
        }
    }

    // ============= MODIFIER HELPERS =============

    /**
     * Dispatch a KeyboardEvent (keydown + keyup) with the current modifier state.
     * Useful for Ctrl+C, Ctrl+V, Alt+key shortcuts, etc.
     */
    function dispatchModifiedKeyEvent(key) {
        if (!currentInput) return;

        const opts = {
            key: key,
            code: 'Key' + key.toUpperCase(),
            bubbles: true,
            cancelable: true,
            ctrlKey: isCtrl,
            altKey: isAlt,
            shiftKey: isShift || isCaps,
            metaKey: false
        };

        currentInput.dispatchEvent(new KeyboardEvent('keydown', opts));
        currentInput.dispatchEvent(new KeyboardEvent('keyup', opts));
    }

    /**
     * Ctrl+Backspace: delete the word immediately before the cursor.
     */
    function deleteWord() {
        if (!currentInput) return;
        const start = currentInput.selectionStart;
        const val = currentInput.value;
        if (start === 0) return;

        // Find start of previous word (skip trailing spaces, then word chars)
        let i = start;
        while (i > 0 && val[i - 1] === ' ') i--;
        while (i > 0 && val[i - 1] !== ' ') i--;

        currentInput.value = val.slice(0, i) + val.slice(start);
        currentInput.setSelectionRange(i, i);
        triggerInputEvent();
    }

    /**
     * Reset all modifier states and re-render.
     */
    function resetModifiers() {
        isShift = false;
        isAlt = false;
        isCtrl = false;
        renderKeys();
    }

    // ============= CORE HELPERS =============

    function insertText(char) {
        if (!currentInput) return;
        const start = currentInput.selectionStart;
        const end = currentInput.selectionEnd;
        const val = currentInput.value;
        const newVal = val.slice(0, start) + char + val.slice(end);
        currentInput.value = newVal;
        // Fallback for inputs that block .value (e.g. type="email")
        if (currentInput.value !== newVal) {
            currentInput.focus();
            document.execCommand('insertText', false, char);
        } else {
            currentInput.setSelectionRange(start + char.length, start + char.length);
        }
        triggerInputEvent();
    }

    function triggerInputEvent() {
        if (!currentInput) return;
        currentInput.dispatchEvent(new Event('input', { bubbles: true }));
        currentInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function flashKey(key) {
        const kb = document.getElementById('vk-keyboard');
        if (!kb) return;
        const btns = kb.querySelectorAll('button');
        btns.forEach(btn => {
            if (btn.dataset.key === key) {
                const orig = btn.style.background;
                btn.style.background = '#c0c4cc';
                setTimeout(() => { btn.style.background = orig; }, 100);
            }
        });
    }

    function showKeyboard(input) {
        currentInput = input;
        isNumbers = (input.type === 'number' || input.inputMode === 'numeric');
        isSymbols = false;
        isFn = false;
        createKeyboard();

        // Scroll input into view above keyboard
        setTimeout(() => {
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }

    function hideKeyboard() {
        const overlay = document.getElementById('vk-overlay');
        if (overlay) overlay.remove();
        currentInput = null;
        isShift = false;
        isNumbers = false;
        isSymbols = false;
        isFn = false;
        isAlt = false;
        isCtrl = false;
    }

    // ============= ATTACH TO ALL INPUTS =============
    function attachToInput(el) {
        el.addEventListener('focus', (e) => {
            e.preventDefault();
            showKeyboard(el);
        });

        el.setAttribute('readonly', 'readonly');
        el.addEventListener('mousedown', (e) => {
            e.preventDefault();
            el.removeAttribute('readonly');
            el.focus();
        });
        el.addEventListener('touchstart', (e) => {
            e.preventDefault();
            el.removeAttribute('readonly');
            showKeyboard(el);
        }, { passive: false });
    }

    function initKeyboard() {
        const inputs = document.querySelectorAll('input:not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), textarea');
        inputs.forEach(attachToInput);

        // Watch for dynamically added inputs (for modals etc.)
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        const newInputs = node.querySelectorAll
                            ? node.querySelectorAll('input:not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), textarea')
                            : [];
                        newInputs.forEach(attachToInput);
                        if (node.matches && node.matches('input, textarea')) {
                            attachToInput(node);
                        }
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initKeyboard);
    } else {
        initKeyboard();
    }

})();