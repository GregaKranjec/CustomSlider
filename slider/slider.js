 export class Slider {
     get position() {
         return this._position;
     }
     set position(value) {
         this._position = value;
     }
     get sliders() {
         return this._sliders;
     }
     set sliders(value) {
         this._sliders = value;
     }
    get container() {
        return this._container;
    }
    set container(value) {
        this._container = value;
    }
    constructor(container, sliders) {
        this._container = document.querySelector(container);
        this._sliders = sliders;
        this._position = {
            x: parseInt(getComputedStyle(this.container).width) / 2,
            y: parseInt(getComputedStyle(this.container).height) / 2
        };

        this.draw();
    }


    draw() {
        let svg = htmlToElement(`<svg  xmlns="http://www.w3.org/2000/svg" version="1.1" style="width: 100%; height: 100%;" transform="rotate(-90, 0, 0)"></svg>`);
        this.container.append(svg);

        for(let slider of this.sliders) {
            let circumference =  Math.PI * 2 * slider.radius;
            let steps = (slider.max - slider.min)/slider.step;
            let progress_degree = (slider.progress-slider.min)/slider.max * 360;
            let pointer_position = calculatePointerPosition(this.position, progress_degree, slider.radius)

            let circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
            circle.setAttribute('cx', this.position.x.toString());
            circle.setAttribute('cy', this.position.y.toString());
            circle.setAttribute('r', slider.radius);
            circle.setAttribute('stroke', '#ccc');
            circle.setAttribute('stroke-width', '15');
            circle.setAttribute('stroke-dasharray', `${(circumference / steps ) - 1}, 1`);
            circle.setAttribute('fill', 'none');
            svg.append(circle);
            slider.circle = circle;

            let progress_circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
            progress_circle.setAttribute('cx', this.position.x.toString());
            progress_circle.setAttribute('cy', this.position.y.toString());
            progress_circle.setAttribute('r', slider.radius);
            progress_circle.setAttribute('stroke', slider.color);
            progress_circle.setAttribute('fill', 'none');
            progress_circle.setAttribute('stroke-width', '15');
            progress_circle.setAttribute('opacity', '0.5');

            progress_circle.setAttribute('stroke-dasharray', `${((slider.progress-slider.min)/slider.max) * circumference} ,${circumference}`);
            svg.append(progress_circle);
            slider.progress_circle = progress_circle;

            let progress_selector = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
            progress_selector.setAttribute('r', '7.5');
            progress_selector.setAttribute('fill', 'white');
            progress_selector.setAttribute('stroke', 'black');
            progress_selector.setAttribute('stroke-width', '1');
            progress_selector.setAttribute('cx', pointer_position.cx.toString());
            progress_selector.setAttribute('cy', pointer_position.cy.toString());
            svg.append(progress_selector);


        }
    }


 }

 function htmlToElement(html) {
     let template = document.createElement('template');
     html = html.trim();
     template.innerHTML = html;
     return template.content.firstChild;
 }

 function calculatePointerPosition(center_point, progress_degree, radius) {
     let progress_radians = progress_degree * (Math.PI / 180)

     return {
         cx: center_point.x + radius * Math.cos(progress_radians),
         cy: center_point.y + radius * Math.sin(progress_radians)
     }
 }
