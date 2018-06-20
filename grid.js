class Grid {

    constructor(canvas_id, side_length, cell_number) {
        this.CIRCLE = 'TYPE_CIRCLE';
        this.RECT = 'TYPE_RECT';
        this.LINE = 'TYPE_LINE';

        this.UP = 'DIR_UP';
        this.DOWN = 'DIR_DOWN';
        this.LEFT = 'DIR_LEFT';
        this.RIGHT = 'DIR_RIGHT';

        this.MAX = 1.0;
        this.BIG = 0.8;
        this.MEDIUM = 0.6;
        this.MEDIUM_SMALL = 0.4;
        this.SMALL = 0.3;
        this.SMALLER = 0.2;
        this.MIN = 0.1;

        this.canvas_id = canvas_id;
        this.canvas_obj = document.getElementById(this.canvas_id);
        this.context = this.canvas_obj.getContext('2d');

        // Canvas size and cell number
        this.canvas_obj.width = this.canvas_obj.height = side_length;
        this.size_x = this.size_y = cell_number;

        // Pixel distance between grid cells
        this.spacing_x = 5;
        this.spacing_y = 5;

        // Color configurations
        this.WALL_COLOR = '#d5a76b';
        this.WALL_COLOR = '#d5a76b';
        this.BG_COLOR = '#142b3f';
        this.START_COLOR = '#00ff00';
        this.END_COLOR = '#ff0000';
        this.LINE_COLOR = '#b18ec5';
        this.CELL_COLOR = this.BG_COLOR;

        // Cell size info
        this.cell_width = null;
        this.cell_height = null;
        this.grid_matrix = null;
        this.wall_map = null;

        // Objects in the grid
        this.objects = null;

        // Listeners
        this.canvas_obj.addEventListener('mousemove', this.onMouseMove.bind(null, this));
        this.canvas_obj.addEventListener('mousedown', this.onMouseDown.bind(null, this));
        this.canvas_obj.addEventListener('mouseup', this.onMouseUp.bind(null, this));
        this.canvas_obj.addEventListener('click', this.onMouseClick.bind(null, this));

        // Mouse status helpers
        this.mouseIsDown = false;
        this.mouseWasDragged = false;
        this.lastCellMouseOver = null;
        this.mouseDragAction = null;

        this.onCellClickDrag = null;

    }


    // GETTERS and SETTERS
    getWidth() {
        return this.canvas_obj.width;
    }
    setWidth(width_pixel) {
        this.canvas_obj.width = width_pixel;
    }
    getHeight() {
        return this.canvas_obj.height;
    }
    setHeight(height_pixel) {
        this.canvas_obj.height = height_pixel;
    }
    getSize() {
        return {
            x: this.size_x,
            y: this.size_y
        }
    }
    setSize(size_x, size_y) {
        this.setSizeX(size_x);
        this.setSizeY(size_y);
    }
    getSizeX() {
        return this.size_x;
    }
    setSizeX(size_x) {
        this.size_x = size_x;
    }
    getSizeY() {
        return this.size_y;
    }
    setSizeY(size_y) {
        this.size_y = size_y;
    }
    setSpacing(spacing_x, spacing_y) {
        this.spacing_x = spacing_x;
        this.spacing_y = spacing_y;
    }
    setBackgroundColor(color) {
        this.BG_COLOR = color;
    }
    setCellsColor(color) {
        this.CELL_COLOR = color;
    }
    printInfo() {
        console.log(this.canvas_id);
    }


    // DRAWING UTILS
    clearCanvas() {
        this.context.clearRect(0, 0, this.canvas_obj.width, this.canvas_obj.height);
    }

    drawBackground() {
        this.context.fillStyle = this.BG_COLOR;
        this.context.fillRect(0, 0, this.canvas_obj.width, this.canvas_obj.height);
    }

    drawCells() {
        for (var i = 0; i < this.grid_matrix.length; i++) {
            for (var j = 0; j < this.grid_matrix[i].length; j++) {
                var cell = this.grid_matrix[i][j];
                this.context.fillStyle = this.CELL_COLOR;
                this.context.fillRect(cell.x, cell.y, this.cell_width, this.cell_height);
            }
        }
    }

    drawObjects() {
        if (this.objects == null) {
            return;
        }

        for (var i = 0; i < this.objects.length; i++) {
            switch (this.objects[i].type) {
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
        this.context.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
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
                x: cell.x + this.cell_width / 2,
                y: cell.y + this.cell_height / 2
            }

            if (i == 0) {
                this.context.moveTo(pos.x, pos.y)
            } else {
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


    // OBJECTS CREATION/DESTRUCTION UTILS
    addObj(name, size, cell_x, cell_y, color, type, pointList) {
        if (this.objects == null) {
            console.log('Grid has to be generated yet');
            return;
        }

        for (var i = 0; i < this.objects.length; i++) {
            if (this.objects[i].name == name) {
                console.log('Name already used by another object');
                this.objects.splice(i, 1);
                this.updateGraphics();
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

    removeObj(name) {
        if (this.objects == null) {
            console.log('Grid has to be generated yet');
            return;
        }

        for (var i = 0; i < this.objects.length; i++) {
            if (this.objects[i].name == name) {
                this.objects.splice(i, 1);
                this.updateGraphics();
                return;
            }
        }

        console.log('Error: object not found.');
    }

    addRect(name, size, cell_x, cell_y, color) {
        this.addObj(name, size, cell_x, cell_y, color, this.RECT, null);
    }

    addWall(cell_x, cell_y) {
        if (!this.cellHasWall(cell_x, cell_y)) {
            var name = 'w' + cell_x + cell_y;

            this.addRect(name, this.MAX, cell_x, cell_y, this.WALL_COLOR);
            this.wall_map[cell_x][cell_y] = 1;
        }
    }

    removeWall(cell_x, cell_y) {
        if (this.cellHasWall(cell_x, cell_y)) {
            var name = 'w' + cell_x + cell_y;

            this.wall_map[cell_x][cell_y] = 0;
            this.removeObj(name);
        }
    }

    toggleWall(cell_x, cell_y) {
        if (!this.cellHasWall(cell_x, cell_y))
            this.addWall(cell_x, cell_y);
        else
            this.removeWall(cell_x, cell_y);
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

                switch (direction) {
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


    // Generate the grid based on setting specified before
    generate() {
        if (this.size_x == null || this.size_y == null) {
            console.log('Missing size parameters');
            return false;
        }

        // Calculate size in pixel based on dimensions and number of cells
        this.cell_width = ((this.canvas_obj.width - this.spacing_x) / this.size_x) - this.spacing_x;
        this.cell_height = ((this.canvas_obj.height - this.spacing_y) / this.size_y) - this.spacing_y;

        // console.log(this.cell_width + " - " + this.cell_height);

        this.grid_matrix = [];
        this.wall_map = [];

        for (var i = 0; i < this.size_y; i++) {
            this.wall_map[i] = [];

            var grid_row = [];

            for (var j = 0; j < this.size_x; j++) {
                var cell_coords = {
                    x: this.spacing_x + j * (this.cell_width + this.spacing_x),
                    y: this.spacing_y + i * (this.cell_height + this.spacing_y)
                }

                grid_row.push(cell_coords);

                this.wall_map[i][j] = 0;
            }

            this.grid_matrix.push(grid_row);
        }

        this.objects = [];
        this.updateGraphics();
    }


    // UTILS
    cellHasWall(x, y) {
        return this.wall_map[x][y];
    }

    getCorrespondingCell(grid, event) {
        var x = event.layerX;
        var y = event.layerY;

        // Simple
        var cell_x = Math.ceil(x / (grid.cell_width + grid.spacing_x)) - 1;
        var cell_y = Math.ceil(y / (grid.cell_height + grid.spacing_y)) - 1;

        if (cell_x < 0 || cell_x > 24 || cell_y < 0 || cell_y > 24) {
            return;
        }

        console.log('Cell ' + cell_x + ' - ' + cell_y);

        return {
            x: cell_x,
            y: cell_y
        }
    }


    // MOUSE HANDLING
    onMouseMove(grid, event) {
        if (grid.mouseIsDown) {
            var cell;

            if (cell = grid.getCorrespondingCell(grid, event)) {

                if (grid.lastCellMouseOver) {

                    if (grid.lastCellMouseOver.x != cell.x || grid.lastCellMouseOver.y != cell.y) {
                        if (!grid.mouseWasDragged) {
                            grid.mouseWasDragged = true;

                            if (grid.cellHasWall(cell.x, cell.y))
                                grid.mouseDragAction = function (x, y) {
                                    grid.removeWall(x, y);
                                };
                            else
                                grid.mouseDragAction = function (x, y) {
                                    grid.addWall(x, y);
                                };
                        }
                        grid.mouseDragAction(cell.x, cell.y);
                    }
                }

                grid.lastCellMouseOver = cell;
            }
        }
    }

    onMouseDown(grid, event) {
        grid.mouseIsDown = true;
        grid.mouseWasDragged = false;
    }

    onMouseUp(grid, event) {
        grid.mouseIsDown = false;
    }

    onMouseExit() {
        // console.log('Exit');
    }

    onMouseClick(grid, event) {
        // console.log('Click');

        if (!grid.mouseWasDragged) {
            var cell;

            if (cell = grid.getCorrespondingCell(grid, event)) {
                grid.onCellClickDrag(cell.x, cell.y);
            }
        }

        grid.mouseWasDragged = false;

    }

    setOnCellClickDrag(evHandler) {
        this.onCellClickDrag = evHandler;
    }
}