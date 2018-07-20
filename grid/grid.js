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
        this.PATH_COLOR = '#b18ec5';
        this.CELL_COLOR = this.BG_COLOR;

        // Cell size info
        this.cell_width = null;
        this.cell_height = null;
        this.grid_matrix = null;
        this.wall_map = null;

        // Objects in the grid
        this.objects = null;

        this.n_path = 0;

        // Listeners
        this.canvas_obj.addEventListener('mousemove', this.onMouseMove.bind(null, this));
        this.canvas_obj.addEventListener('mousedown', this.onMouseDown.bind(null, this));
        this.canvas_obj.addEventListener('mouseup', this.onMouseUp.bind(null, this));
        this.canvas_obj.addEventListener('click', this.onMouseClick.bind(null, this));
        this.canvas_obj.addEventListener('contextmenu', this.onMouseRightClick.bind(null, this));

        // Mouse status helpers
        this.mouseIsDown = false;
        this.mouseWasDragged = false;
        this.lastCellMouseOver = null;
        this.mouseDragAction = null;
        this.positionEndPoint = false;

        this.onCellClickDrag = null;
        this.onCellRightClick = function (cell) {
            this.relocateStartEnd(cell);
        };

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

        for (var key in this.objects) {
            var obj = this.objects[key];

            switch (obj.type) {
                case this.RECT:
                    this.drawRect(obj);
                    break;

                case this.CIRCLE:
                    this.drawCircle(obj);
                    break;

                case this.LINE:
                    this.drawLine(obj);
                    break;

                default:
                    console.log('ERROR: Uknown object type');
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
            console.log('ERROR: Grid has to be generated yet');
            return;
        }

        if (this.objects[name]) {
            console.log('ERROR: Name already used by another object');
            return;
        }


        if (type != this.LINE && cell_x >= this.size_x || cell_y >= this.size_y) {
            console.log('ERROR: Positioning outside of the grid');
            return;
        }

        if (type == this.LINE) {
            for (var i = 0; i < pointList.length; i++) {
                if (pointList[i].x >= this.size_x || pointList[i].y >= this.size_y) {
                    console.log('ERROR: Point in pointlist outside of the grid');
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

        this.objects[name] = obj;

        this.updateGraphics();
    }

    removeObj(name) {
        if (this.objects == null) {
            console.log('ERROR: Grid has to be generated yet');
            return;
        }

        delete this.objects[name];
        this.updateGraphics();
    }

    // do not use this for adding walls, use addWall
    addRect(name, size, cell_x, cell_y, color) {
        this.addObj(name, size, cell_x, cell_y, color, this.RECT, null);
    }

    addWall(cell_x, cell_y) {
        if (!this.cellHasWall(cell_x, cell_y)) {
            var name = 'w' + cell_x + "-" + cell_y;

            this.addRect(name, this.MAX, cell_x, cell_y, this.WALL_COLOR);
            this.wall_map[cell_x][cell_y] = 1;
            this.evaluatePath();
        }
    }

    removeWall(cell_x, cell_y) {
        if (this.cellHasWall(cell_x, cell_y)) {
            var name = 'w' + cell_x + "-" + cell_y;

            this.wall_map[cell_x][cell_y] = 0;
            this.removeObj(name);
        } else {
            console.log("ERROR: trying to remove wall on (" + cell_x + ", " + cell_y + "), but no wall was found");
        }
    }

    toggleWall(cell_x, cell_y) {
        if (!this.cellHasWall(cell_x, cell_y))
            this.addWall(cell_x, cell_y);
        else
            this.removeWall(cell_x, cell_y);
        this.evaluatePath();
    }

    addCircle(name, size, cell_x, cell_y, color) {
        this.addObj(name, size, cell_x, cell_y, color, this.CIRCLE, null);
    }

    // do not use this for adding path, use addPath
    addLine(name, size, color, pointList) {
        this.addObj(name, size, null, null, color, this.LINE, pointList);
    }

    addPath(name = null, pointList) {
        var _name = name;

        if (!_name)
            _name = 'path' + this.n_path++;

        this.addLine(_name, grid.SMALLER, this.PATH_COLOR, pointList);
    }

    removePath(name) {
        var obj;

        if (obj = this.objects[name]) {
            if (this.objects[name].type == 'TYPE_LINE') {
                delete this.objects[name];
                this.n_path--;
            } else {
                console.log("ERROR: trying to remove path '" + name + "', but its type is actually " + this.objects[name].type);
            }
        } else {
            console.log("WARNING: path '" + name + "' not found while trying to remove it");
        }
    }

    moveObject(name, direction) {
        var obj;

        if (obj = this.objects[name]) {

            if (obj.type != this.CIRCLE && obj.type != this.RECT) {
                console.log('ERROR: Impossible to move this type of object');
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
                    console.log('ERROR: Direction unknown');
            }

            // Check validity of movement
            if (obj.x < 0 || obj.x >= this.size_x || obj.y < 0 || obj.y >= this.size_y) {
                console.log('ERROR: Invalid new position');
                obj.x = old_x;
                obj.y = old_y;
            }

            this.updateGraphics();
            return;

        }

        console.log('ERROR: Object name not found');
    }

    setObjectPosition(name, x, y) {
        this.objects[name].x = x;
        this.objects[name].y = y;
        this.updateGraphics();
    }


    // Generate the grid based on setting specified before
    generate() {
        if (this.size_x == null || this.size_y == null) {
            console.log('ERROR: Missing size parameters');
            return false;
        }

        // Calculate size in pixel based on dimensions and number of cells
        this.cell_width = ((this.canvas_obj.width - this.spacing_x) / this.size_x) - this.spacing_x;
        this.cell_height = ((this.canvas_obj.height - this.spacing_y) / this.size_y) - this.spacing_y;

        this.grid_matrix = [];
        this.wall_map = [];
        console.log(this.size_y)
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

        if (cell_x < 0 || cell_x > this.size_x || cell_y < 0 || cell_y > this.size_y) {
            return null;
        }

        console.log('Cell ' + cell_x + ' - ' + cell_y);

        return {
            x: cell_x,
            y: cell_y
        }
    }

    relocateStartEnd(cell) {
        if (this.cellHasWall(cell.x, cell.y)) {
            if (grid.positionEndPoint) {
                console.error("ERROR: trying to place 'end' point over a wall.")
            } else {
                console.error("ERROR: trying to place 'start' point over a wall.")
            }
        } else {
            if (grid.positionEndPoint) {
                if (!grid.objects['end'])
                    grid.addCircle('end', grid.MEDIUM_SMALL, cell.x, cell.y, grid.END_COLOR);
                else
                    grid.setObjectPosition('end', cell.x, cell.y);
                grid.positionEndPoint = false;

                // var path_x = Math.abs(grid.objects['start'].x - grid.objects['end'].x);
                // var path_y = Math.abs(grid.objects['start'].y - grid.objects['end'].y);

                this.evaluatePath();
            } else {
                grid.removePath('test');

                if (!grid.objects['start'])
                    grid.addCircle('start', grid.MEDIUM_SMALL, cell.x, cell.y, grid.START_COLOR);
                else {
                    grid.setObjectPosition('start', cell.x, cell.y);
                    grid.removeObj('end');
                }

                grid.positionEndPoint = true;
            }
        }
    }

    findDummyPath(start, end) {
        console.log(start)
        console.log(end)
        var pointList = [];
        pointList.push({
            x: start.x,
            y: start.y
        })
        var last = {
            x: start.x,
            y: start.y
        };
        var x, y;
        while (last.x != end.x || last.y != end.y) {
            if (last.x < end.x)
                x = last.x + 1
            else if (last.x == end.x)
                x = last.x
            else x = last.x - 1

            if (last.y < end.y)
                y = last.y + 1
            else if (last.y == end.y)
                y = last.y
            else y = last.y - 1

            pointList.push({
                x: x,
                y: y
            })
            last.x = x;
            last.y = y;
        }
        return pointList
    }

    evaluatePath() {
        if (grid.objects['start'] && grid.objects['end']) {
            var pointList = this.findDummyPath(grid.objects['start'], grid.objects['end']);
            if (grid.objects['test'])
                grid.removePath('test');
            if (document.getElementById("methodSelect").value == "Bug1")
                pointList = this.bug1(pointList);
            else if (document.getElementById("methodSelect").value == "Bug2")
                pointList = this.bug2(pointList);
            else if (document.getElementById("methodSelect").value == "Tangent Bug")
                pointList = this.tangentBug(pointList);
            grid.addPath('test', pointList);
            grid.setObjectPosition('start', pointList[0].x, pointList[0].y);
        }
    }

    isInPath(path, step) { //index of 
        var r = -1;
        for (var i = 0; i < path.length; i++) {
            var el = path[i];
            if (el.x == step.x && el.y == step.y) {
                r = i;
                break;
            }
        }
        return r;
    }

    tangentBug(dummyPath) {
        console.log("tangent bug");

        var path = [];
        for (var i = 0; i < dummyPath.length; i++) { //try to follow the dummy path
            var range = this.rangeArea(dummyPath[i], 2);
            var free = true;
            var discontinuities = [];
            for (var j = 0; j < range.length; j++) { //check if range area is free
                if (this.isWall(range[j])) {
                    discontinuities.push(range[j]); //the list of obstacles in range
                    free = false;
                }
            }
            if (free) { //if free follow the dummy path
                path.push(dummyPath[i])
            }
            else {
                var min;
                var minDist = 100;
                console.log("-------- ")
                console.log(discontinuities);
                for (var j = 0; j < discontinuities.length; j++) { //find the nearest discontinuity
                    var toDisc = this.findDummyPath(dummyPath[i], discontinuities[j]);
                    console.log("ok")
                    var dist = this.findDummyPath(discontinuities[j], grid.objects['end']).length + toDisc.length //the distance is given by the sum of the distances between you and the discontinuity and between the discontinuity and the end
                    if (dist < minDist) {
                        min = discontinuities[j];
                        minDist = dist;
                    }
                }
                var toDisc = this.findDummyPath(dummyPath[i], min);
                path = path.concat(toDisc);

                //now boundary following , quando finisce quella devi modificare il dummy path e l'indice 
                //heuristic to understand in which direction is better to turn around the obstacle
                var dir = "anti";
                if (Math.abs(this.objects["end"].x - this.objects["start"].x) > Math.abs(this.objects["end"].y - this.objects["start"].y)) { // i'm moving horizontally
                    console.log('orizzontale')
                    if ((toDisc[0].x < toDisc[1].x && toDisc[0].y > toDisc[1].y) || (toDisc[0].x > toDisc[1].x && toDisc[0].y < toDisc[1].y))
                        dir = "or";
                }
                else{ // vertically
                    if ((toDisc[0].x > toDisc[1].x && toDisc[0].y > toDisc[1].y) || (toDisc[0].x < toDisc[1].x && toDisc[0].y < toDisc[1].y))
                        dir = "or";
                }
                console.log(dir)
                return path.concat(this.findDummyPath(min, grid.objects['end']));
                //problema tutti i punti di discontinuità hanno la stessa distanza, quindi prende sempre il primo
            }
        }
        return dummyPath;
    }

    rangeArea(o, r) { //o is a point object, and r is the radio of the circonference ( in our case it will be a square, according to our distance definition, as the number of steps)
        var range = [];
        for (var i = 0; i < this.size_y; i++) {
            for (var j = 0; j < this.size_x; j++) {
                if (o.x - r <= i && i <= o.x + r && o.y - r <= j && j <= o.y + r) {
                    range.push({
                        x: i,
                        y: j
                    })
                }
            }
        }
        return range
    }

    bug1(dummyPath) {
        var path = [];
        for (var i = 0; i < dummyPath.length; i++) {
            var step = dummyPath[i];
            if (!this.isWall(step)) {
                console.log(step)
                path.push(step);
            }
            else {
                console.log("wall")
                path.push(step);
                var lastStep = dummyPath[this.isInPath(dummyPath, step) - 1];
                var res = {
                    circumnavigation: [],
                    dists: []
                };

                var dummy = this.findDummyPath(lastStep, this.objects['end']);
                var dist = dummy.length;
                res.circumnavigation.push(lastStep);
                res.dists.push(dist)

                res = this.circumnavigate1(lastStep, step, this.objects['end'], res)
                //usa res per capire il minimo e percorrere il percorso all'indietro
                console.log(path.length);
                path.pop();
                path.pop();
                console.log(path.length);

                var minDist = Math.min(...res.dists);
                console.log("min dist: " + minDist)
                var nearest = res.circumnavigation[res.dists.lastIndexOf(minDist)];
                console.log(nearest);
                var backToNearest = res.circumnavigation.slice(res.dists.lastIndexOf(minDist), res.dists.length)

                backToNearest.reverse();
                console.log(backToNearest);
                path = path.concat(res.circumnavigation);
                path = path.concat(backToNearest.slice(1, backToNearest.length));


                dummyPath = this.findDummyPath(nearest, this.objects['end']);
                console.log("raggirato");
                i = 0;
                console.log("--- " + i);
            }
        }
        console.log(path);
        return path
    }

    followObs(lastStep, obstacle) {
        console.log("last ")
        console.log(lastStep);
        console.log("obs ")
        console.log(obstacle);
        var dir = "";
        if (lastStep.y > obstacle.y)
            dir += "N";
        else if (lastStep.y < obstacle.y)
            dir += "S";
        if (lastStep.x > obstacle.x)
            dir += "O";
        else if (lastStep.x < obstacle.x)
            dir += "E";

        var newStep;
        console.log(dir)
        if (dir == "E" || dir == "SE") {
            newStep = {
                x: lastStep.x,
                y: lastStep.y + 1
            }
        }
        else if (dir == "NE" || dir == "N") {
            newStep = {
                x: lastStep.x + 1,
                y: lastStep.y
            }
        }

        else if (dir == "NO" || dir == "O") {
            newStep = {
                x: lastStep.x,
                y: lastStep.y - 1
            }
        }
        else if (dir == "SO" || dir == "S") {
            newStep = {
                x: lastStep.x - 1,
                y: lastStep.y
            }
        }
        return newStep;
    }

    circumnavigate1(lastStep, obstacle, end, obj) { //end è la destinazione finale, mi serve per la distanza, dists contiene le distanze lungo la circumnavigazione
        var newStep = this.followObs(lastStep, obstacle);
        var dummy = this.findDummyPath(newStep, end);
        var dist = dummy.length;
        obj.circumnavigation.push(newStep);
        obj.dists.push(dist)
        console.log("new ");
        console.log(newStep);
        if (!this.isWall(newStep)) {
            if (newStep.x == obj.circumnavigation[0].x && newStep.y == obj.circumnavigation[0].y) {
                //non sto mettendo l'ultimo step, controllare se è giusto
                console.log(obj.dists)
                return obj
            }
            return this.circumnavigate1(newStep, obstacle, end, obj);
        }
        else
            obj.circumnavigation.pop();
        obj.dists.pop();
        console.log(newStep)
        return this.circumnavigate1(lastStep, newStep, end, obj)
    }


    bug2(dummyPath) {
        var path = [];
        for (var i = 0; i < dummyPath.length; i++) {
            var step = dummyPath[i];
            if (!this.isWall(step)) {
                console.log(step)
                path.push(step);
            }
            else {
                console.log("wall")
                path.push(step);
                var lastStep = dummyPath[this.isInPath(dummyPath, step) - 1];
                path = this.circumnavigate2(lastStep, step, path, dummyPath)
                console.log("raggirato")
                var last = path[path.length - 1]
                i = this.isInPath(dummyPath, last) - 1;
                console.log("--- " + i);
            }
        }
        return path
    }


    circumnavigate2(lastStep, obstacle, newPath, oldPath) {
        var newStep = this.followObs(lastStep, obstacle);
        var newPath = newPath.slice(0, this.isInPath(newPath, lastStep) + 1)
        newPath.push(newStep)
        console.log(newStep)
        if (!this.isWall(newStep)) {
            if (this.isInPath(oldPath, newStep) != -1 && this.isInPath(newPath, newStep) == newPath.length - 1)
                return newPath
            return this.circumnavigate2(newStep, obstacle, newPath, oldPath);
        }
        else
            return this.circumnavigate2(lastStep, newStep, newPath, oldPath)
    }

    isWall(patch) {
        if (patch.x < 0 || patch.y < 0 || patch.x >= this.size_x || patch.y >= this.size_y)
            return true;
        if (this.wall_map[patch.x][patch.y] == 1)
            return true;
        return false
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

    onMouseRightClick(grid, event) {
        event.preventDefault();

        if (event.button != 0) { // Right or middle click
            var cell;

            if (cell = grid.getCorrespondingCell(grid, event)) {
                grid.onCellRightClick(cell);
            }
        }
    }

    setOnCellRightClick(evHandler) {
        this.onCellRightClick = evHandler;
    }

    onMouseClick(grid, event) {
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