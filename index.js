import { Slider } from './slider/slider.js';

let container = document.querySelector('#container');

new Slider('#container', [
    {
        color: '#32a852',
        min: 0,
        max: 1000,
        step: 25,
        radius: 50,
        progress: 750
    }, {
        color: '#8d0088',
        min: 0,
        max: 1000,
        step: 100,
        radius: 70,
        progress: 300
    }
])

