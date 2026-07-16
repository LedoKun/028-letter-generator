const test = require('node:test');
const assert = require('node:assert/strict');

global.window = {};
require('../public/js/common.js');

const Common = global.window.Common;

function inputElement() {
    const listeners = {};
    return {
        value: '',
        style: {},
        addEventListener(type, handler) {
            listeners[type] = handler;
        },
        removeEventListener(type) {
            delete listeners[type];
        },
        dispatch(type, inputType) {
            listeners[type]({ type, inputType, target: this });
        }
    };
}

test('auto-formats date input as DD/MM/YYYY', () => {
    const input = inputElement();
    Common.attachDateAutoFormat(input, () => Common.ERA_CE);

    input.value = '16072026';
    input.dispatch('input');

    assert.equal(input.value, '16/07/2026');
    assert.equal(input.maxLength, 10);
    assert.equal(input.inputMode, 'numeric');
    assert.equal(input.style.borderColor, '');
});

test('auto-formats and validates month-year input as MM/YYYY', () => {
    const input = inputElement();
    Common.attachMonthYearAutoFormat(input, () => Common.ERA_CE);

    input.value = '072026';
    input.dispatch('input');
    assert.equal(input.value, '07/2026');
    assert.equal(input.style.borderColor, '');

    input.value = '132026';
    input.dispatch('input');
    assert.equal(input.value, '13/2026');
    assert.equal(input.style.borderColor, 'red');
});

test('auto-formats time input as HH:MM and pads three-digit times on blur', () => {
    const input = inputElement();
    Common.attachTimeAutoFormat(input);

    input.value = '930';
    input.dispatch('input');
    assert.equal(input.value, '930');
    input.dispatch('blur');

    assert.equal(input.value, '09:30');
    assert.deepEqual(Common.parseTime24(input.value), { hour: 9, minute: 30 });
    assert.equal(input.style.borderColor, '');

    input.value = '2460';
    input.dispatch('input');
    assert.equal(input.value, '24:60');
    assert.equal(input.style.borderColor, 'red');
});
