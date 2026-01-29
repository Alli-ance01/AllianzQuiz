let calcExpression = '';
let calcResult = 0;
let shouldResetDisplay = false;

document.addEventListener('DOMContentLoaded', () => {
    const calcWidget = document.getElementById('calculatorWidget');
    const toggleBtn = document.getElementById('calcToggleBtn');
    const closeBtn = document.getElementById('closeCalc');
    const header = document.getElementById('calcHeader');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const isVisible = calcWidget.style.display !== 'none';
            calcWidget.style.display = isVisible ? 'none' : 'block';
            if (!isVisible) {
                calcWidget.style.transform = 'translateY(0)';
                calcWidget.style.opacity = '1';
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            calcWidget.style.display = 'none';
        });
    }

    makeDraggable(calcWidget, header);

    document.addEventListener('keydown', (e) => {
        if (calcWidget.style.display === 'none') return;

        const key = e.key;
        if (/[0-9]/.test(key)) calcAction(key);
        else if (key === '+') calcAction('+');
        else if (key === '-') calcAction('-');
        else if (key === '*') calcAction('*');
        else if (key === '/') calcAction('/');
        else if (key === 'Enter' || key === '=') calcAction('=');
        else if (key === 'Backspace') calcAction('DEL');
        else if (key === 'Escape') calcAction('AC');
        else if (key === '.') calcAction('.');
    });
});

function calcAction(val) {
    const display = document.getElementById('calcDisplay');

    if (val === 'AC') {
        calcExpression = '';
        display.value = '0';
    } else if (val === 'DEL') {
        calcExpression = calcExpression.slice(0, -1);
        display.value = calcExpression || '0';
    } else if (val === '=') {
        try {
            const sanitized = calcExpression.replace(/[^-+*./0-9]/g, '');
            if (sanitized) {
                const result = Function('"use strict";return (' + sanitized + ')')();
                display.value = Number.isInteger(result) ? result : result.toFixed(4).replace(/\.?0+$/, '');
                calcExpression = display.value;
                shouldResetDisplay = true;
            }
        } catch (e) {
            display.value = 'Error';
            calcExpression = '';
        }
    } else {
        if (shouldResetDisplay && /[0-9]/.test(val)) {
            calcExpression = val;
            shouldResetDisplay = false;
        } else {
            calcExpression += val;
            shouldResetDisplay = false;
        }
        display.value = calcExpression;
    }
}

function makeDraggable(el, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        const newTop = el.offsetTop - pos2;
        const newLeft = el.offsetLeft - pos1;

        el.style.top = newTop + "px";
        el.style.left = newLeft + "px";
        el.style.bottom = 'auto';
        el.style.right = 'auto';
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

window.calcAction = calcAction;
