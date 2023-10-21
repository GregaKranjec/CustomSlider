import { Slider } from './slider/slider.js';

let container = document.querySelector('#container');

let slider = new Slider('#container', [
    {
        color: '#32a852',
        min: 0,
        max: 1000,
        step: 25,
        radius: 'max',
        progress: 750
    }, {
        color: '#8d0088',
        min: 0,
        max: 1000,
        step: 100,
        radius: 'max',
        progress: 300
    }, {
        color: '#ff415c',
        min: 0,
        max: 1000,
        step: 25,
        radius: 'max',
        progress: 750
    }, {
        color: '#02a28d',
        min: 0,
        max: 100,
        step: 1,
        radius: 'max',
        progress: 85
    }]
)

