 export class Slider {
     get changeEvent() {
         return this._changeEvent;
     }
     get margin() {
         return this._margin;
     }
     get mobileMaxWidth() {
         return this._mobileMaxWidth;
     }
     get slider_container() {
         return this._slider_container;
     }
     set slider_container(value) {
         this._slider_container = value;
     }
     get sliderWidth() {
         return this._sliderWidth;
     }
     get position() {
         return this._position;
     }
     get sliders() {
         return this._sliders;
     }
     get container() {
        return this._container;
    }
    /**
     * @param {string} container - id of parent DOM element
     * @param {{min: number, color: string, max: number, progress: number, step: number, radius: string}[]} sliders
     */
    constructor(container, sliders) {
        this._container = document.querySelector(container);
        this.container.classList.add('slider_container')
        this._sliders = sliders;
        this._position = {
            x: this.container.clientWidth / 2,
            y: this.container.clientHeight / 2
        };

        // default settings
        this._sliderWidth = 30;
        this._margin = 5;
        this._sliderContainer = null;
        this._mobileMaxWidth = 800;

        this._changeEvent = new Event('changeValue');
    }

     draw() {
        this.draw_legend();

        this.sliderContainer = htmlToElement('<div class="slider_container"></div>');
        let svg = htmlToElement(`<svg  xmlns="http://www.w3.org/2000/svg" version="1.1" >
            </svg>`);
        this.sliderContainer.append(svg);
        this.container.append(this.sliderContainer);

        this.sliders.forEach((slider, ix) => {
            // determine slider radius if needed
            if(slider.radius === 'max') slider.radius = this.calculateRadius(ix).toString();
            if(slider.radius < 0) return;
            // calculate variables
            slider.circumference =  Math.PI * 2 * slider.radius;
            let steps = (slider.max - slider.min)/slider.step;
            slider.angle = (slider.progress - slider.min)/(slider.max - slider.min) * 360;
            slider.pointer_position = Slider.calculatePointerPosition(this.position, slider.angle, slider.radius)

           slider.circle = this.createSVGCircle({
                cx:this.position.x.toString(),
                cy:this.position.y.toString(),
                r: slider.radius,
                color: '#ccc',
                fill: 'none',
                width: this.sliderWidth.toString(),
                strokeDasharray: `${(slider.circumference / steps ) - 1}, 1`,
                rotate: true,
           })
            svg.append(slider.circle);

            // strokeDasharray make a circle with gaps in between, any events triggered on it won't be detected if user clicks on the gap between sections
            // to combat this we use a trigger circle which is transparent and listens to events that will then affect the actual slider.
            slider.triggerCircle = this.createSVGCircle({
                cx:this.position.x.toString(),
                cy:this.position.y.toString(),
                r: slider.radius,
                color: 'transparent',
                fill: 'none',
                width: this.sliderWidth.toString(),
                rotate: true,
            })
            svg.append(slider.triggerCircle);

            //bind class to all events
            this.handleMouseDown = this.handleMouseDown.bind(this);
            this.handleTouchStart = this.handleTouchStart.bind(this);
            this.handleChangeValue = this.handleChangeValue.bind(this);
            this.handleDragStop = this.handleDragStop.bind(this);
            this.handleTouchMove = this.handleTouchMove.bind(this);
            //bind event to circle element
            slider.triggerCircle.addEventListener('mousedown', (e) => this.handleMouseDown(e, slider));
            slider.triggerCircle.addEventListener('touchstart', (e) => this.handleTouchStart(e, slider));

            // remove move event after end of touch
            document.addEventListener('touchend', (event) => {
                this.handleDragStop(event)
                document.removeEventListener('touchmove', this.handleTouchMove)
            });

            // remove move event on mouseup event
            document.addEventListener('mouseup', (event) => {
                this.handleDragStop(event)
                document.removeEventListener('mousedown', this.handleTouchMove)
            });

            // create inner circle representing current selected number
            slider.progress_circle = this.createSVGCircle({
                cx:this.position.x.toString(),
                cy:this.position.y.toString(),
                r: slider.radius,
                color: slider.color,
                fill: 'none',
                width: this.sliderWidth.toString(),
                opacity: '0.5',
                strokeDasharray: `${((slider.angle)/360) * slider.circumference} ,${slider.circumference - ((slider.angle)/360) * slider.circumference}`,
                rotate: true,
            });
            slider.progress_circle.addEventListener('changeValue', (e) => this.handleChangeValue(e, slider));
            slider.progress_circle.classList.add('no_events')
            svg.append(slider.progress_circle);

            // create selector
            slider.progress_selector = this.createSVGCircle({
                cx: slider.pointer_position.cx.toString(),
                cy: slider.pointer_position.cy.toString(),
                r: (this.sliderWidth/2).toString(),
                fill: 'white',
                color: 'black',
                width: '1',
                rotate: false,
            })
            slider.progress_selector.classList.add('no_events')

            svg.append(slider.progress_selector);
        });

        this.cropSVG(svg);
    }

     draw_legend() {
        let current_indicators = [];
         for(let slider of this.sliders){
             let indicator = (htmlToElement(`
                <div class="indicator_wrapper">
                    <div class="indicator" style="background-color:${slider.color}"></div>
                    <span>${slider.progress}</span>
                </div>
            `));
             current_indicators.push(indicator);
             slider.indicator = indicator.querySelector('span');
         }

        const legend = document.createElement('div')
        legend.classList.add('legend');
        current_indicators.forEach((x) => legend.append(x));
        this.container.append(legend);
    }

     /**
      * Create SVG circle element in DOM
      * @param {{[r]: string, [color]: string, [cx]: string, [cy]: string, [width]: string, [fill]: string, [opacity]: string, [strokeDasharray]: string, [rotate]: boolean}} options
      */
     createSVGCircle(options) {
         const circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
         circle.setAttribute('cx', options.cx ? options.cx : '0');
         circle.setAttribute('cy', options.cy ? options.cy : '0');
         circle.setAttribute('r', options.r ? options.r : this.calculateRadius(0).toString());
         circle.setAttribute('stroke', options.color ? options.color : '#ccc');
         circle.setAttribute('stroke-width', options.width ? options.width: '15');
         circle.setAttribute('fill', options.fill ? options.fill : 'none');
         circle.setAttribute('opacity', options.opacity ? options.opacity : '1');

         if(options.strokeDasharray) {
             circle.setAttribute('stroke-dasharray', options.strokeDasharray);
         }

         if(options.rotate) {
             circle.setAttribute('transform', `rotate(-90, ${options.cx} ${options.cy})`);
         }

         return circle;
     }

     /**
      * Calculate maximum radius for the n-th ring
      * @param {number} n
      */
     calculateRadius(n) {
         let width = this.container.clientWidth;
         let height = this.container.clientHeight;
         let r;
         if(width < height)
             r = ((width/2) - n * (this.sliderWidth + this.margin)) - this.sliderWidth;
          else
             r = ((height/2) - n * (this.sliderWidth + this.margin)) - this.sliderWidth;

         if(r > 0) return r
         else return -1
     }

     /**
      * Calculate current position on circle based on current mouse position
      * @param {{x: number, y: number}} mouse_position
      * @param {boolean} isDrag
      */
     calculatePositionOnCircle(mouse_position, isDrag) {
         // calculate mouse position relative to the svg rect
         const rect = this.container.querySelector('svg').getBoundingClientRect();

         // rect center point
         const centerX = rect.left + rect.width / 2;
         const centerY = rect.top + rect.height / 2;

         // calculate the angle
         let angle_radians = Math.atan2(mouse_position.y - centerY,  mouse_position.x - centerX);
         let new_angle = ((angle_radians * 180) / Math.PI) + 90;
         if(new_angle < 0) new_angle += 360;
         if(new_angle > 360) new_angle -= 360;

         // get current progress percentage and progress
         let progress_percentage = new_angle/360;
         let progress =  Math.round((this.activeSlider.max - this.activeSlider.min) * progress_percentage);

         // handle minimum change via step and handle minimum value offset
         progress = progress + (this.activeSlider.min/this.activeSlider.step) * this.activeSlider.step;
         new_angle = (progress - this.activeSlider.min)/(this.activeSlider.max - this.activeSlider.min) * 360;

         if(isDrag) {
             // limit the jump over the min|max line
             if(new_angle < 35 && this.activeSlider.angle > 325) {
                 new_angle = 360;
             } else if(new_angle > 325 && this.activeSlider.angle < 35) {
                 new_angle = 0;
             }
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
             .setAttribute('stroke-dasharray', `${(slider.angle/360) * slider.circumference} ,${slider.circumference - (slider.angle/360) * slider.circumference}`);

         slider.progress_selector.setAttribute('cx', slider.pointer_position.cx.toString());
         slider.progress_selector.setAttribute('cy', slider.pointer_position.cy.toString());

        slider.progress_circle.dispatchEvent(this.changeEvent);
     }

     /**
      * Calculates range pointer position
      * @param {*} center_point
      * @param {number} progress_degree
      * @param {*} radius
      */
     static calculatePointerPosition(center_point, progress_degree, radius) {
         let progress_radians = (progress_degree-90) * (Math.PI / 180)

         return {
             cx: center_point.x + radius * Math.cos(progress_radians),
             cy: center_point.y + radius * Math.sin(progress_radians)
         }
     }

     /**
      * Sets SVG viewBox to crop unnecessary space
      * @param svgEl - svg DOM node
      */
     cropSVG(svgEl) {
         // Get the bounds of the SVG content
         const bbox = svgEl.getBBox();
         // Set the viewport with these bounds
         if(window.innerWidth <= this.mobileMaxWidth) {
             svgEl.setAttribute("viewBox", `${bbox.x - this.sliderWidth/2} ${bbox.y - this.sliderWidth/2} ${bbox.width + this.sliderWidth} ${bbox.height + this.sliderWidth}`);
         } else {
             svgEl.setAttribute("viewBox", `${bbox.x - this.sliderWidth/2} ${this.sliderWidth/2} ${bbox.width + this.sliderWidth} ${bbox.height + this.sliderWidth}`);
         }
         svgEl.parentElement.style.width = bbox.width + this.sliderWidth + 'px';
     }

     /*
        * EVENTS
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

         this.calculatePositionOnCircle(mouse_position, false);
         this.updateRange(this.activeSlider);

         // add mouse move event
         document.addEventListener('mousemove', this.handleMouseMove);

     }

     handleTouchStart(e, slider) {
         e.preventDefault();
         this.activeSlider = slider;
         // bind touch_move to class
         this.handleTouchMove = this.handleTouchMove.bind(this);

         // update slider with new value
         const position = {
             x: e.touches[0].clientX,
             y: e.touches[0].clientY
         }

         this.calculatePositionOnCircle(position, false);
         this.updateRange(this.activeSlider);

         // add mouse touchmove event
         document.addEventListener('touchmove', this.handleTouchMove);
     }

     handleMouseMove(e) {
         if(this.activeSlider) {
             const mouse_position = {
                 x: e.clientX,
                 y: e.clientY
             }

             this.calculatePositionOnCircle(mouse_position, true);
             this.updateRange(this.activeSlider);
         }
     }

     handleTouchMove(e) {
         e.preventDefault();
         if(this.activeSlider) {
             const position = {
                 x: e.touches[0].clientX,
                 y: e.touches[0].clientY
             }

             this.calculatePositionOnCircle(position, true);
             this.updateRange(this.activeSlider);
         }
     }

     handleDragStop(e) {
         if(this.activeSlider) {
             this.activeSlider.progress =  this.activeSlider.progress -  this.activeSlider.progress % this.activeSlider.step;
             this.activeSlider.angle = (this.activeSlider.progress - this.activeSlider.min)/(this.activeSlider.max - this.activeSlider.min) * 360;
             this.activeSlider.pointer_position = Slider.calculatePointerPosition(this.position, this.activeSlider.angle, this.activeSlider.radius);
             this.updateRange(this.activeSlider);
             this.activeSlider = null;
         }

     }

     handleChangeValue(e, slider) {
         slider.indicator.innerText = slider.progress - slider.progress % slider.step;
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





