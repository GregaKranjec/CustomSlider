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
        this.container.classList.add('slider_container')
        this._sliders = sliders;
        this._position = {
            x: parseInt(getComputedStyle(this.container).width) / 2,
            y: parseInt(getComputedStyle(this.container).height) / 2
        };

        this.draw();

    }

    draw() {
        let g = document.createElement('g');
        let svg = htmlToElement(`<svg  xmlns="http://www.w3.org/2000/svg" version="1.1" style="width: 100%; height: 100%;" ></svg>`);
        g.append(svg);
        this.container.append(g);


        for(let slider of this.sliders) {
            // calculate variables
            slider.circumference =  Math.PI * 2 * slider.radius;
            let steps = (slider.max - slider.min)/slider.step;
            slider.angle = (slider.progress-slider.min)/slider.max * 360;
            slider.pointer_position = Slider.calculatePointerPosition(this.position, slider.angle, slider.radius)

           slider.circle = this.createSVGCircle({
                cx:this.position.x.toString(),
                cy:this.position.y.toString(),
                r: slider.radius,
                color: '#ccc',
                fill: 'none',
                width: '15',
                strokeDasharray: `${(slider.circumference / steps ) - 1}, 1`,
            })
            svg.append(slider.circle);

            //bind object to event
            this.handleMouseDown = this.handleMouseDown.bind(this);
            //bind event to circle element
            slider.circle.addEventListener('mousedown', (e) => this.handleMouseDown(e, slider));


            // create inner circle representing current selected number
            slider.progress_circle = this.createSVGCircle({
                cx:this.position.x.toString(),
                cy:this.position.y.toString(),
                r: slider.radius,
                color: slider.color,
                fill: 'none',
                width: '15',
                opacity: '0.5',
                strokeDasharray: `${((slider.progress-slider.min)/slider.max) * slider.circumference} ,${slider.circumference}`,
            })

            slider.progress_circle.classList.add('no_events')
            svg.append(slider.progress_circle);

            // create selector
            slider.progress_selector = this.createSVGCircle({
                cx: slider.pointer_position.cx.toString(),
                cy: slider.pointer_position.cy.toString(),
                r: '7.5',
                fill: 'white',
                color: 'black',
                width: '1',
            })
            slider.progress_selector.classList.add('no_events')

            svg.append(slider.progress_selector);
        }
    }


     /**
      * @param {{r: string, color: string, cx: string, cy: string, width: string, fill: string, opacity: string, strokeDasharray: string}} options
      */
     createSVGCircle(options) {
         const circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
         circle.setAttribute('cx', options.cx ? options.cx : '0');
         circle.setAttribute('cy', options.cy ? options.cy : '0');
         circle.setAttribute('r', options.r ? options.r : '25');
         circle.setAttribute('stroke', options.color ? options.color : '#ccc');
         circle.setAttribute('stroke-width', options.width ? options.width: '15');
         circle.setAttribute('fill', options.fill ? options.fill : 'none');
         circle.setAttribute('opacity', options.opacity ? options.opacity : '1');

         if(options.strokeDasharray) {
             circle.setAttribute('stroke-dasharray', options.strokeDasharray);
         }

         return circle;
     }



     /**
      * @param {MouseEvent} e
      * @param {*} slider - selected slider object
      */
     handleMouseDown(e, slider) {
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
         if(this.activeSlider) {
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
         const angle_radians = Math.atan2(delta_y, delta_x);
         let new_angle = ((angle_radians * 180) / Math.PI) + 90;
         if(new_angle < 0) new_angle += 360;

         // get current progress percentage and progress
         let progress_percentage = new_angle/360;
         let progress =  Math.round((this.activeSlider.max - this.activeSlider.min) * progress_percentage + this.activeSlider.min);

         // handle minimum change via step
         progress = progress - progress % this.activeSlider.step;
         new_angle = (progress-this.activeSlider.min)/this.activeSlider.max * 360;

         // prevent going over max into min or over min into max
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





