class Grid {
    
    constructor(canvas_id) {
        this.CIRCLE = 'TYPE_CIRCLE';
        this.RECT = 'TYPE_RECT';
        this.LINE = 'TYPE_LINE';

        this.UP = 'DIR_UP';
        this.DOWN = 'DIR_DOWN';
        this.LEFT = 'DIR_LEFT';
        this.RIGHT = 'DIR_RIGHT';

        this.BIG = 0.8;
        this.MEDIUM = 0.6;
        this.SMALL = 0.3;
        this.SMALLER = 0.1;

        this.canvas_id = canvas_id;
        this.canvas_obj = document.getElementById(this.canvas_id);
        this.context = this.canvas_obj.getContext('2d');

        // Pixel distance between grid cells
        this.spacing_x = 5;
        this.spacing_y = 5;

        // Color configurations
        this.bg_color = '#000000';
        this.cell_color = '#006699';
        
        // Cell size info
        this.cell_width = null;
        this.cell_height = null;
        this.grid_matrix = null;

        // Objects in the grid
        this.objects = null;

        // Listeners
        this.canvas_obj.addEventListener('mouseover', this.onMouseOver);
        this.canvas_obj.addEventListener('mouseout', this.onMouseExit);
        this.canvas_obj.addEventListener('click', this.onMouseClick.bind(null, this));

        this.onCellClick = null;
    }

    setWidth(width_pixel) {
        this.canvas_obj.width = width_pixel;
    }

    setHeight(height_pixel) {
        this.canvas_obj.height = height_pixel;
    }

    getWidth() {
        return this.canvas_obj.width;
    }

    getHeight() {
        return this.canvas_obj.height;
    }

    setSize(size_x, size_y) {
        this.setSizeX(size_x);
        this.setSizeY(size_y);
    }

    setSizeX(size_x) {
        this.size_x = size_x;
    }

    setSizeY(size_y) {
        this.size_y = size_y;
    }

    getSizeX() {
        return this.size_x;
    }

    getSizeY() {
        return this.size_y;
    }

    setSpacing(spacing_x, spacing_y) {
        this.spacing_x = spacing_x;
        this.spacing_y = spacing_y;
    }

    setBackgroundColor(color) {
        this.bg_color = color;
    }

    setCellsColor(color) {
        this.cell_color = color;
    }

    printInfo() {
        console.log(this.canvas_id);
    }


    // Generate the grid based on setting specified before
    generate() {
        if (this.size_x == null || this.size_y == null) {
            console.log('Missing size parameters');
            return false;
        }

        // Calculate size in pixel based on dimensions and number of cells
        this.cell_width = ((this.canvas_obj.width - this.spacing_x) / this.size_x) - this.spacing_x;
        this.cell_height = ((this.canvas_obj.height - this.spacing_y) / this.size_y) - this.spacing_y;

        console.log(this.cell_width + " - " + this.cell_height);

        this.grid_matrix = [];

        for (var i = 0; i < this.size_y; i++) {

            var grid_row = [];

            for (var j = 0; j < this.size_x; j++) {
                var cell_coords = {
                    x: this.spacing_x + j * (this.cell_width + this.spacing_x),
                    y: this.spacing_y + i * (this.cell_height + this.spacing_y)
                }

                grid_row.push(cell_coords);
            }

            this.grid_matrix.push(grid_row);
        }

        this.objects = [];
        this.updateGraphics();
    }


    clearCanvas() {
        this.context.clearRect(0, 0, this.canvas_obj.width, this.canvas_obj.height);
    }

    
    drawBackground() {
        this.context.fillStyle = this.bg_color;
        this.context.fillRect(0, 0, this.canvas_obj.width, this.canvas_obj.height);
    } 


    drawCells() {
        for (var i = 0; i < this.grid_matrix.length; i++) {
            for (var j = 0; j < this.grid_matrix[i].length; j++) {
                var cell = this.grid_matrix[i][j];            
                this.context.fillStyle = this.cell_color;
                this.context.fillRect(cell.x, cell.y, this.cell_width, this.cell_height);
            }
        }
    }


    drawObjects() {
        if (this.objects == null) {
            return;
        }

        for (var i = 0; i < this.objects.length; i++) {
            switch(this.objects[i].type) {
                case this.RECT:
                    this.drawRect(this.objects[i]);
                    break;

                case this.CIRCLE:
                    this.drawCircle(this.objects[i]);
                    break;

                case this.LINE:
                    this.drawLine(this.objects[i]);
                    break;    
                
                default:
                    console.log('Uknown object type');
            }
        }
    }


    drawRect(obj) {
        var cell = this.grid_matrix[obj.y][obj.x];

        var size = {
            x: this.cell_width * obj.size,
            y: this.cell_height * obj.size
        }

        var pos = {
            x: cell.x + (this.cell_width - size.x) / 2,
            y: cell.y + (this.cell_height - size.y) / 2
        }

        this.context.fillStyle = obj.color;
        this.context.fillRect(pos.x, pos.y, size.x, size.y);
    }


    drawCircle(obj) {
        var cell = this.grid_matrix[obj.y][obj.x];

        var radius = this.cell_width < this.cell_height ? 
            (this.cell_width / 2) * obj.size :
            (this.cell_height / 2) * obj.size; 

        var pos = {
            x: cell.x + (this.cell_width / 2),
            y: cell.y + (this.cell_height / 2)
        }

        this.context.fillStyle = obj.color;
        this.context.strokeStyle = obj.color;
        this.context.lineWidth = 0;
        this.context.beginPath();
        this.context.arc(pos.x, pos.y, radius, 0, 2*Math.PI);
        this.context.fill();
        this.context.closePath();
    }


    drawLine(obj) {
        if (obj.pointList.length <= 1) {
            return;
        }

        this.context.beginPath();
        this.context.strokeStyle = obj.color;
        this.context.lineWidth = (this.cell_height / 2) * obj.size; 

        for (var i = 0; i < obj.pointList.length; i++) {
            var cell = this.grid_matrix[obj.pointList[i].y][obj.pointList[i].x];
            var pos = {
                x: cell.x + this.cell_width/2,
                y: cell.y + this.cell_height/2
            }

            if (i == 0) {
                this.context.moveTo(pos.x, pos.y)
            }
            else {
                this.context.lineTo(pos.x, pos.y);
            }
        }

        this.context.stroke();
        this.context.closePath();
    }


    updateGraphics() {
        this.clearCanvas();
        this.drawBackground();
        this.drawCells();
        this.drawObjects()
    }


    addObj(name, size, cell_x, cell_y, color, type, pointList) {
        if (this.objects == null) {
            console.log('Grid has to be generated yet');
            return;
        }

        for (var i = 0; i < this.objects.length; i++) {
            if (this.objects[i].name == name) {
                console.log('Name already used by another object');
                return;
            }
        }

        if (type != this.LINE && cell_x >= this.size_x || cell_y >= this.size_y) {
            console.log('Positioning outside of the grid');
            return;
        }

        if (type == this.LINE) {
            for (var i = 0; i < pointList.length; i++) {
                if (pointList[i].x >= this.size_x || pointList[i].y >= this.size_y) {
                    console.log('Point in pointlist outside of the grid');
                    return;
                }
            }
        }

        var obj = {
            name: name,
            size: size,
            x: cell_x,
            y: cell_y,
            type: type,
            color: color,
            pointList: pointList
        }

        this.objects.push(obj);

        this.updateGraphics();
    }

    addRect(name, size, cell_x, cell_y, color) {
        this.addObj(name, size, cell_x, cell_y, color, this.RECT, null);
    }

    addCircle(name, size, cell_x, cell_y, color) {
        this.addObj(name, size, cell_x, cell_y, color, this.CIRCLE, null);
    }

    addLine(name, size, color, pointList) {
        this.addObj(name, size, null, null, color, this.LINE, pointList);
    }

    moveObject(name, direction) {
        for (var i = 0; i < this.objects.length; i++) {
            if (this.objects[i].name == name) {
                var obj = this.objects[i];
                if (obj.type != this.CIRCLE && obj.type != this.RECT) {
                    console.log('Impossible to move this type of object');
                    return; 
                }

                var old_x = obj.x;
                var old_y = obj.y;

                switch(direction) {
                    case this.UP:
                        obj.y -= 1;
                        break;

                    case this.DOWN:
                        obj.y += 1;
                        break;

                    case this.LEFT:
                        obj.x -= 1;
                        break;

                    case this.RIGHT:
                        obj.x += 1;
                        break;

                    default:
                        console.log('Direction unknown');
                }

                // Check validity of movement
                if (obj.x < 0 || obj.x >= this.size_x || obj.y < 0 || obj.y >= this.size_y) {
                    console.log('Invalid new position');
                    obj.x = old_x;
                    obj.y = old_y;
                } 

                this.updateGraphics();
                return;

            }
        }

        console.log('Object name not found');
    }


    // Mouse handling
    onMouseOver(event) {
        //console.log('Coordinates: ' + event.clientX + ' - ' + event.clientY);
    }

    onMouseExit() {
        //console.log('Exit');
    }

    onMouseClick(grid, event) {
        //console.log('Click');

        var click_x = event.layerX;
        var click_y = event.layerY;

        // Simple
        //var x = Math.ceil(click_x / (grid.cell_width + grid.spacing_x)) - 1;
        //var y = Math.ceil(click_y / (grid.cell_height + grid.spacing_y)) - 1;

        //console.log("Original " + click_x + " - " + click_y);

        // Keeping spacing in consideration
        click_x -= grid.spacing_x;
        click_y -= grid.spacing_y;

        //console.log("Adjusted " + click_x + " - " + click_y);

        if (click_x < 0 || click_y < 0) {
            console.log('Clicked on spacing');
            return;
        }

        if (click_x % (grid.cell_width + grid.spacing_x) > grid.cell_width || click_y % (grid.cell_height + grid.spacing_y) > grid.cell_height) {
            console.log('Clicked on spacing');
            return;
        }

        var x = Math.ceil(click_x / (grid.cell_width + grid.spacing_x)) - 1;
        var y = Math.ceil(click_y / (grid.cell_height + grid.spacing_y)) - 1;

        //console.log('Cell ' + x + ' - ' + y);

        grid.onCellClick(x, y);
    }


    setOnCellClick(evHandler) {
        this.onCellClick = evHandler;
    }
}