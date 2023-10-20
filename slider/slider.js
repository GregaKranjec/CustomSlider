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
            // calculate variables
            slider.circumference =  Math.PI * 2 * slider.radius;
            let steps = (slider.max - slider.min)/slider.step;
            let progress_degree = (slider.progress-slider.min)/slider.max * 360;
            slider.angle = progress_degree;
            slider.pointer_position = Slider.calculatePointerPosition(this.position, progress_degree, slider.radius)

            // create an outer circle
            const circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
            circle.setAttribute('cx', this.position.x.toString());
            circle.setAttribute('cy', this.position.y.toString());
            circle.setAttribute('r', slider.radius);
            circle.setAttribute('stroke', '#ccc');
            circle.setAttribute('stroke-width', '15');
            circle.setAttribute('stroke-dasharray', `${(slider.circumference / steps ) - 1}, 1`);
            circle.setAttribute('fill', 'none');
            svg.append(circle);
            slider.circle = circle;

            //bind object to event
            this.handleMouseDown = this.handleMouseDown.bind(this);
            //bind event to circle element
            slider.circle.addEventListener('mousedown', (e) => this.handleMouseDown(e, slider));

            // create inner circle representing current selected number
            const progress_circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
            progress_circle.setAttribute('cx', this.position.x.toString());
            progress_circle.setAttribute('cy', this.position.y.toString());
            progress_circle.setAttribute('r', slider.radius);
            progress_circle.setAttribute('stroke', slider.color);
            progress_circle.setAttribute('fill', 'none');
            progress_circle.setAttribute('stroke-width', '15');
            progress_circle.setAttribute('opacity', '0.5');
            progress_circle.setAttribute('stroke-dasharray', `${((slider.progress-slider.min)/slider.max) * slider.circumference} ,${slider.circumference}`);
            progress_circle.classList.add('no_events')
            svg.append(progress_circle);
            slider.progress_circle = progress_circle;

            // create selector
            let progress_selector = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
            progress_selector.setAttribute('r', '7.5');
            progress_selector.setAttribute('fill', 'white');
            progress_selector.setAttribute('stroke', 'black');
            progress_selector.setAttribute('stroke-width', '1');
            progress_selector.setAttribute('cx', slider.pointer_position.cx.toString());
            progress_selector.setAttribute('cy', slider.pointer_position.cy.toString());
            progress_selector.classList.add('no_events')
            slider.progress_selector = progress_selector;

            svg.append(progress_selector);
        }
    }

     /**
      * @param {MouseEvent} e
      * @param {*} slider - selected slider object
      */
     handleMouseDown(e, slider) {
         e.stopPropagation();

         this.activeSlider = slider;
         // bind mouse_move to class
         this.handleMouseMove = this.handleMouseMove.bind(this);
         
         // update slider with new value
         const mouse_position = {
             x: e.clientX,
             y: e.clientY
         }
         this.calculatePositionOnCircle(mouse_position);
         this.updateRange(this.activeSlider);

         // add mouse move event
         document.addEventListener('mousemove', this.handleMouseMove);
         // remove move event after end of click
         document.addEventListener('mouseup', (event) => {
             document.removeEventListener('mousemove', this.handleMouseMove)
         });
     }

     handleMouseMove(e) {
         e.stopPropagation();
         if(this.activeSlider) {
            // const svg_rect = e.target.parentElement.getBoundingClientRect();
            const mouse_position = {
                x: e.clientX,
                y: e.clientY
            }

            this.calculatePositionOnCircle(mouse_position);
            this.updateRange(this.activeSlider);
         }
     }

     /**
      * Calculate current position on circle based on current mouse position
      * @param {{x: number, y: number}} mouse_position
      */
     calculatePositionOnCircle(mouse_position) {
         // calculate mouse position relative to the svg rect
         const rect = this.container.getBoundingClientRect();
         const mouse_x = mouse_position.x - rect.left;
         const mouse_y = mouse_position.y - rect.top;

         // get delta values of the triangle
         const delta_x = mouse_x - this.position.x;
         const delta_y = mouse_y - this.position.y;

         // calculate degrees on the closest part of the circle
         const position_radians = Math.atan2(delta_y, delta_x);
         let new_angle = ((position_radians * 180) / Math.PI) + 90;
         if(new_angle < 0) new_angle += 360;

         // get current progress percentage and progress
         let progress_percentage = new_angle/360;
         let progress =  Math.round((this.activeSlider.max - this.activeSlider.min) * progress_percentage + this.activeSlider.min);

         // handle minimum change via step
         progress = progress - progress % this.activeSlider.step;
         new_angle = (progress-this.activeSlider.min)/this.activeSlider.max * 360;

         // prevent going over maximum into zero or over zero into maximum
         if(new_angle === 0 && this.activeSlider.angle === ((this.activeSlider.max-this.activeSlider.step-this.activeSlider.min)/this.activeSlider.max * 360)) {
             new_angle = 360;
         } else if(this.activeSlider.angle === 360 && new_angle !== ((this.activeSlider.max-this.activeSlider.step-this.activeSlider.min)/this.activeSlider.max * 360)) {
             new_angle = 360;
         } else if(new_angle !== ((this.activeSlider.step)/this.activeSlider.max * 360) && this.activeSlider.angle === 0) {
             new_angle = 0;
         }

         // recalculate position_degree from minimum step for pointer position calculation
         this.activeSlider.angle = new_angle;
         this.activeSlider.progress = Math.round((this.activeSlider.max - this.activeSlider.min) * new_angle/360 + this.activeSlider.min);

         this.activeSlider.pointer_position = Slider.calculatePointerPosition(this.position, new_angle, this.activeSlider.radius)
     }
     /**
      * Update slider with new data
      * @param {*} slider - slider object to update
      */
     updateRange(slider) {
         slider.progress_circle
             .setAttribute('stroke-dasharray', `${((slider.progress-slider.min)/slider.max) * slider.circumference} ,${slider.circumference}`);

         slider.progress_selector.setAttribute('cx', slider.pointer_position.cx.toString());
         slider.progress_selector.setAttribute('cy', slider.pointer_position.cy.toString());
     }

     /**
      * @param {*} center_point
      * @param {number} progress_degree
      * @param {*} radius
      */
     static calculatePointerPosition(center_point, progress_degree, radius) {
         let progress_radians = progress_degree * (Math.PI / 180)

         return {
             cx: center_point.x + radius * Math.cos(progress_radians),
             cy: center_point.y + radius * Math.sin(progress_radians)
         }
     }
}



 /** Converts a string into an HTML element
  * @param {string} html
  */
 function htmlToElement(html) {
     let template = document.createElement('template');
     html = html.trim();
     template.innerHTML = html;
     return template.content.firstChild;
 }





