class Grid {

    constructor(canvas_id, width, height) {
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
        this.canvas_obj.setAttribute("width", width);
        this.canvas_obj.setAttribute("height", height);
        this.context = this.canvas_obj.getContext("2d");

        // Canvas size and cell number
        // TODO: rendi la dimensione delle celle selezionabile con una combo box da 3 opzioni: piccolo medio grande
        this.size = {
            x: -1,
            y: -1
        };

        // Default pixel distance between grid cells
        this.setSpacing(1, 1);

        // Color configurations
        this.darkTheme();

        // Cell size info
        this.cell_width = null;
        this.cell_height = null;
        this.grid_matrix = null;
        this.wall_map = null;

        // Objects in the grid
        this.objects = null;
        this.adjacency_graph = null;

        // Listeners
        this.canvas_obj.addEventListener("mousemove", this.onMouseMove.bind(null, this));
        this.canvas_obj.addEventListener("mousedown", this.onMouseDown.bind(null, this));
        this.canvas_obj.addEventListener("mouseup", this.onMouseUp.bind(null, this));
        this.canvas_obj.addEventListener("click", this.onMouseClick.bind(null, this));
        this.canvas_obj.addEventListener("contextmenu", this.onMouseRightClick.bind(null, this));

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

        // Others
        this.algorithm = null;

        // used to enable path drawing only if there is an actual path to redraw
        this.drawPath = false;
    }

    // Generate the grid based on setting specified before
    generate() {
        if (this.size.x == null || this.size.y == null) {
            console.error("Missing size parameters.");
            return false;
        }

        var cell_side_lenght = 30;

        var x = Math.ceil(((this.canvas_obj.width - this.spacing_x) / cell_side_lenght) - this.spacing_x);
        var y = Math.ceil(((this.canvas_obj.height - this.spacing_y) / cell_side_lenght) - this.spacing_y);

        var cell_n = {
            x: x,
            y: y
        };
        console.log("There can be " + cell_n.x + "x" + cell_n.y + " cells of side 100.");

        this.size = cell_n;


        // Calculate size in pixel based on dimensions and number of cells
        this.cell_width = (this.canvas_obj.width - this.spacing_x) / (cell_n.x + this.spacing_x);
        // this.cell_width = cell_side_lenght;
        // this.cell_width = ((this.canvas_obj.width - this.spacing_x) / 100) - this.spacing_x;
        this.cell_height = (this.canvas_obj.height - this.spacing_y) / (cell_n.y + this.spacing_y);
        // this.cell_height = cell_side_lenght;

        console.log(this.cell_width, this.cell_height);

        this.grid_matrix = [];
        this.wall_map = [];

        // for (var i = 0; i < this.size.y; i++) {
        //     // this.wall_map[i] = [];

        //     var grid_row = [];

        //     for (var j = 0; j < this.size.x; j++) {
        //         var cell_coords = {
        //             x: this.spacing_x + j * (this.cell_width + this.spacing_x),
        //             y: this.spacing_y + i * (this.cell_height + this.spacing_y)
        //         }

        //         grid_row.push(cell_coords);
        //     }

        //     this.grid_matrix.push(grid_row);
        // }

        for (var i = 0; i < this.size.x; i++) {
            this.wall_map[i] = [];
            this.grid_matrix[i] = [];

            for (var j = 0; j < this.size.y; j++) {
                this.wall_map[i][j] = 0;
                this.grid_matrix[i][j] = {
                    x: this.spacing_x + i * (this.cell_width + this.spacing_x),
                    y: this.spacing_y + j * (this.cell_height + this.spacing_y)
                };
            }
        }

        this.objects = [];
        this.drawPath = false;
        this.updateGraphics();
    }

    // GETTERS and SETTERS
    setSize(size_x, size_y) {
        this.size.x = size_x;
        this.size.y = size_y;
    }
    setSpacing(spacing_x, spacing_y) {
        this.spacing_x = spacing_x;
        this.spacing_y = spacing_y;
    }
    setAlgorithm(algorithm) {
        this.algorithm = algorithm;
    }
    darkTheme(refresh = false) {
        this.WALL_COLOR = "#d5a76b";
        this.BG_COLOR = "#aaaaaa";
        this.START_COLOR = "#00ff00";
        this.END_COLOR = "#ff0000";
        this.LINE_COLOR = "#b18ec5";
        this.PATH_COLOR = "#b18ec5";
        this.BEST_PATH_COLOR = "green";
        this.CELL_COLOR = "#142b3f";
        this.OBSTACLE_EDGE_COLOR = "#996600";
        this.WALL_BORDER = "white";

        if (refresh) this.updateGraphics();
    }
    lightTheme(refresh = false) {
        this.WALL_COLOR = "#d5a76b";
        this.BG_COLOR = "gray";
        this.START_COLOR = "#00ff00";
        this.END_COLOR = "#ff0000";
        this.LINE_COLOR = "#b18ec5";
        this.PATH_COLOR = "#b18ec5";
        this.BEST_PATH_COLOR = "green";
        this.CELL_COLOR = "#f4f4f4";
        this.OBSTACLE_EDGE_COLOR = "#996600";
        this.WALL_BORDER = "gray"

        if (refresh) this.updateGraphics();
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
                    console.error("Uknown object type '" + obj.type + "'.");
            }
        }
    }

    drawRect(obj) {
        var cell = this.grid_matrix[obj.x][obj.y];

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
        this.context.lineWidth = 3;
        this.context.strokeStyle = this.WALL_BORDER;
        this.context.strokeRect(pos.x, pos.y, size.x, size.y);
    }

    drawCircle(obj) {
        var cell = this.grid_matrix[obj.x][obj.y];

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

        this.context.strokeStyle = obj.color;
        this.context.lineWidth = (this.cell_height / 2) * obj.size;
        this.context.beginPath();

        for (var i = 0; i < obj.pointList.length; i++) {
            var cell = this.grid_matrix[obj.pointList[i].x][obj.pointList[i].y];
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
        //this.context.closePath();

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
            console.error("Grid has to be generated yet");
            return;
        }

        if (this.objects[name]) {
            console.error("Name '" + name + "' already used by another object");
            return;
        }


        if (type != this.LINE && cell_x >= this.size.x || cell_y >= this.size.y) {
            console.error("point (" + cell_x + ", " + cell_y + ") outside of the grid.\n\tGrid size: ' + this.size.x + 'x' + this.size.y + '.");
            return;
        }

        if (type == this.LINE) {
            for (var i = 0; i < pointList.length; i++) {
                if (pointList[i].x >= this.size.x || pointList[i].y >= this.size.y) {
                    console.error("Point (" + pointList[i].x + ", " + pointList[i].y + ") in pointlist outside of the grid.\n\tGrid size: ' + this.size.x + 'x' + this.size.y + '.");
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
            console.error("Grid has to be generated yet");
            return;
        }

        if (this.objects[name]) {
            delete this.objects[name];
        } else {
            console.warn("Object '" + name + "' not found while trying to remove it.");
        }
        this.updateGraphics();
    }

    // do not use this for adding walls, use addWall
    addRect(name, size, cell_x, cell_y, color) {
        this.addObj(name, size, cell_x, cell_y, color, this.RECT, null);
    }

    addWall(cell_x, cell_y) {
        if (!this.cellIsWall(cell_x, cell_y)) {
            if (this.objects["start"] && cell_x == this.objects["start"].x && cell_y == this.objects["start"].y) {
                return;
            } else if (this.objects["end"] && cell_x == this.objects["end"].x && cell_y == this.objects["end"].y) {
                return;
            }

            var name = 'w' + cell_x + "-" + cell_y;

            this.addRect(name, this.MAX, cell_x, cell_y, this.WALL_COLOR);
            this.wall_map[cell_x][cell_y] = 1;

            this.evaluatePath();
        }
    }

    removeWall(cell_x, cell_y) {
        if (this.cellIsWall(cell_x, cell_y)) {
            var name = 'w' + cell_x + "-" + cell_y;

            this.wall_map[cell_x][cell_y] = 0;
            this.removeObj(name);

            this.evaluatePath();
        }
    }

    clearWalls() {
        for (var key in this.objects) {
            var obj = this.objects[key];
            if (obj.type == this.RECT) {
                this.removeWall(obj.x, obj.y);
            }
        }
        if (this.drawPath) {
            this.evaluatePath;
        }
    }

    toggleWall(cell_x, cell_y) {
        if (!this.cellIsWall(cell_x, cell_y))
            this.addWall(cell_x, cell_y);
        else
            this.removeWall(cell_x, cell_y);
    }

    addCircle(name, size, cell_x, cell_y, color) {
        this.addObj(name, size, cell_x, cell_y, color, this.CIRCLE, null);
    }

    // do not use this for adding path, use addPath
    addLine(name, size, color, pointList) {
        this.addObj(name, size, null, null, color, this.LINE, pointList);
    }

    addPath(pointList, name, gridSize = grid.SMALLER, color = this.PATH_COLOR) {
        this.addLine(name, gridSize, color, pointList);
    }

    removePath(name) {
        this.removeObj(name);
    }

    clearPaths() {
        for (var key in this.objects) {
            var obj = this.objects[key];
            if (obj.type == this.LINE) {
                this.removePath(obj.name);
            }
        }
        this.drawPath = false;
    }

    moveObject(name, direction) {
        var obj;

        if (obj = this.objects[name]) {

            if (obj.type != this.CIRCLE && obj.type != this.RECT) {
                console.error("Cannot move object type '" + obj.type + "'.");
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
                    console.error("Direction unknown.");
            }

            // Check validity of movement
            if (obj.x < 0 || obj.x >= this.size.x || obj.y < 0 || obj.y >= this.size.y) {
                console.error("Invalid new position.");
                obj.x = old_x;
                obj.y = old_y;
            }

            this.updateGraphics();
            return;

        }

        console.error("Object name '" + name + "' not found.");
    }

    setObjectPosition(name, x, y) {
        this.objects[name].x = x;
        this.objects[name].y = y;
        this.updateGraphics();
    }



    // UTILS
    cellIsWall(x, y) {
        if (x < 0 || y < 0 || x >= this.size.x || y >= this.size.y)
            return true;
        else if (this.wall_map[x][y])
            return true;
        /*else if ((x + 1 < this.size.x && y - 1 >= 0 && this.wall_map[x + 1][y] == 1 && this.wall_map[x][y - 1] == 1) || (x + 1 < this.size.x && y + 1 < this.size.y && this.wall_map[x + 1][y] == 1 && this.wall_map[x][y + 1] == 1) || (x - 1 >= 0 && y - 1 >= 0 && this.wall_map[x - 1][y] == 1 && this.wall_map[x][y - 1] == 1) || (x - 1 >= 0 && y + 1 < this.size.y && this.wall_map[x - 1][y] == 1 && this.wall_map[x][y + 1] == 1))
            return true;
            */
        return false
    }

    getCorrespondingCell(grid, event) {
        var x = event.layerX;
        var y = event.layerY;

        // Simple
        var cell_x = Math.ceil(x / (grid.cell_width + grid.spacing_x)) - 1;
        var cell_y = Math.ceil(y / (grid.cell_height + grid.spacing_y)) - 1;

        if (cell_x < 0 || cell_x > this.size.x || cell_y < 0 || cell_y > this.size.y) {
            return null;
        }

        // console.log("Cell " + cell_x + " - " + cell_y);

        return {
            x: cell_x,
            y: cell_y
        }
    }

    relocateStartEnd(cell) {
        if (this.cellIsWall(cell.x, cell.y)) {
            if (grid.positionEndPoint) {
                console.error("trying to place 'end' point over a wall.")
            } else {
                console.error("trying to place 'start' point over a wall.")
            }
        } else {
            // Remove all previous paths
            for (var key in this.objects) {
                var obj = this.objects[key];
                if (obj.type == this.LINE) {
                    delete this.objects[obj.name];
                }
            }


            if (grid.positionEndPoint) {
                if (!grid.objects['end'])
                    grid.addCircle("end", grid.MEDIUM_SMALL, cell.x, cell.y, grid.END_COLOR);
                else
                    grid.setObjectPosition("end", cell.x, cell.y);
                grid.positionEndPoint = false;

                grid.drawPath = true;
                this.evaluatePath();
            } else {
                if (!grid.objects['start'])
                    grid.addCircle("start", grid.MEDIUM_SMALL, cell.x, cell.y, grid.START_COLOR);
                else {
                    grid.setObjectPosition("start", cell.x, cell.y);
                    grid.removeObj("end");
                }

                grid.positionEndPoint = true;
            }
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

                            if (grid.cellIsWall(cell.x, cell.y))
                                grid.mouseDragAction = function (x, y) {
                                    grid.removeWall(x, y, false);
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

    evaluatePath() {
        if (this.drawPath) {

            // Remove all previous paths and points, except for 'start' and 'end' points
            for (var key in this.objects) {
                var obj = this.objects[key];
                if (obj.type == this.LINE || (obj.type == this.CIRCLE && obj.name != 'start' && obj.name != "end")) {
                    delete this.objects[obj.name];
                }
            }

            var pointList;

            switch (this.algorithm) {
                case "visibility":
                    this.visibilityGraph();
                    break;
                case "probabilistic":
                    this.visibilityGraph(true);
                    break;
                case "decomposition":
                    pointList = this.findPath();
                    break;
                case "bug1":
                    pointList = this.bug1(this.findDummyPath(this.objects['start'], this.objects['end']));
                    break;
                case "bug2":
                    pointList = this.bug2(this.findDummyPath(this.objects['start'], this.objects['end']));
                    break;
                case "tangent-bug":
                    pointList = this.tangentBug(this.findDummyPath(this.objects['start'], this.objects['end']));
                    break;
                default:
                    console.error("No algorithm found with name '" + this.algorithm + "'.");
                    this.algorithm = null;
                    break;
            }

            if (pointList) {
                this.addPath(pointList, "path");
                this.setObjectPosition("start", pointList[0].x, pointList[0].y);
            }
        }
    }




    // Grid/cellular decomposition methods
    gridDecomposition() {
        var adjacency_matrix = {};

        // iterate over all cells
        for (var i = 0; i < this.grid_matrix.length; i++) { // x
            for (var j = 0; j < this.grid_matrix[i].length; j++) { // y

                // console.log("Computing for cell (" + i + ", " + j + ").");

                // skip wall cells
                if (!this.cellIsWall(i, j)) {

                    var source = i + "_" + j;

                    adjacency_matrix[source] = {};

                    // iterate over adjacent cells
                    for (var k = i - 1; k <= i + 1; k++) {
                        for (var l = j - 1; l <= j + 1; l++) {

                            // console.log("\tChecking (" + k + ", " + l + ")...");

                            // check that target is inside the map
                            if (k >= 0 && k < this.size.x && l >= 0 && l < this.size.y) {

                                // exclude the cell itself
                                if (!(k == i && l == j)) {

                                    // check that target has not a wall over it
                                    if (!this.cellIsWall(k, l)) {
                                        // var target = "c_" + k + "_" + l;
                                        var target = k + "_" + l;

                                        // console.log("\t\t\tAdding cell (" + k + ", " + l + ") to adjacency graph.");

                                        // add cell to adjacency graph
                                        adjacency_matrix[source][target] = k == i || l == j ? 1 : 2;

                                    } else {
                                        // console.log("\t\t\tCell (" + k + ", " + l + ") has a wall.");
                                    }
                                } else {
                                    // console.log("\t\tCell (" + k + ", " + l + ") is the cell itself (" + i + ", " + j + "). Skipping...");
                                }

                            } else {
                                // console.log("\t\tCell (" + k + ", " + l + ") is outside map.");
                            }
                        }
                    }

                } else {
                    // console.log("\tWall in (" + i + ", " + j + ").");
                }

                // console.log("\n\n");
            }
        }

        // console.log(adjacency_matrix);


        this.adjacency_graph = new Graph(adjacency_matrix);
    }

    findPath() {
        this.gridDecomposition();

        var start_key = grid.objects['start'].x + "_" + grid.objects['start'].y;
        var end_key = grid.objects['end'].x + "_" + grid.objects['end'].y;

        var shortest = this.adjacency_graph.findShortestPath(start_key, end_key);
        // console.log(shortest);

        // Null means no path available
        if (shortest == null) {
            console.error("No path found.");
            return;
        }

        var pointList = [];

        shortest.forEach(node => {
            pointList.push({
                x: parseInt(node.split("_")[0]),
                y: parseInt(node.split("_")[1])
            });
        })

        return pointList;
    }




    // Visibility Graph Methods
    visibilityGraph(probabilistic = false) {
        console.log("Visibility Graph Method");

        // Variables setup
        this.obstacle_vertex_names = [];

        // Obstacle map, initialized to 0 in every cell
        this.obstacle_vertex_map = [];
        for (var i = 0; i < this.size.x; i++) {
            var l = []
            for (var j = 0; j < this.size.y; j++) {
                l.push(0);
            }
            this.obstacle_vertex_map.push(l);
        }

        if (probabilistic) {
            // Random fills obstacle_vertex_map -- Probabilsitic Roadmap
            this.randomObstacleVertex();
        } else {
            // Fills the obstacle_vertex_map -- Visibility Graph
            this.addAllObstaclesVertex();
        }

        // All obstacle vertex plus the start and end position
        var point_names = this.obstacle_vertex_names.concat("start").concat("end");

        var i, j;
        var single_paths = [];

        // For each pair of points calculate the shortest path
        for (i = 0; i < point_names.length; i++) {
            for (j = i + 1; j < point_names.length; j++) {

                var p = this.findDummyPath(grid.objects[point_names[i]], grid.objects[point_names[j]]);

                // Start & End are the names of the vertices but the path can actually be used in both directions
                single_paths.push({
                    name: 'singlepath-' + point_names[i] + '-' + point_names[j],
                    path: p,
                    start: point_names[i],
                    end: point_names[j]
                });
            }
        }

        var free_single_paths = [];
        // Also create a dictionary using its name
        var fsp_dict = {};

        // For each single_path check if it goes through obstacles
        single_paths.forEach(sp => {
            var ok = true;
            sp.path.forEach(step => {
                if (this.cellIsWall(step.x, step.y)) {
                    ok = false;
                    return;
                }
            })
            // If path is ok adds it to free_single_path
            if (ok) {
                free_single_paths.push(sp);
                this.addPath(sp.path, sp.name);
                fsp_dict[sp.name] = sp;
            }
        })

        // Now translate single paths to a graph form
        // Each single path is an edge
        var map = {}

        free_single_paths.forEach(fsp => {

            // First time, initialize node in graph
            if (map[fsp.start] == null) {
                map[fsp.start] = {}
            }
            if (map[fsp.end] == null) {
                map[fsp.end] = {}
            }

            // Add bidirectional edge, weighted by the lenght of the path
            map[fsp.start][fsp.end] = this.pathCost(fsp.path); //fsp.path.length;
            map[fsp.end][fsp.start] = this.pathCost(fsp.path); //fsp.path.length;
        })

        // Shortest is a list of obstacle_vertex names
        var graph = new Graph(map);
        var shortest = graph.findShortestPath("start", "end");
        console.log(shortest);

        // Null means no path available
        if (shortest == null) {
            console.error("No path found.");
            return;
        }

        // In fsp_dict the singlepath name is used as key
        var i;
        var shortest_path_point_list = []

        // Insert start
        shortest_path_point_list.push({
            x: grid.objects['start'].x,
            y: grid.objects['start'].y
        });

        for (i = 1; i < shortest.length; i++) {
            // TODO: Serve modo un po piu elegante magari
            // Nella creazione del nome non so quale punto è stato messo prima... Li provo entrambi.
            // Se lo uso al contrario i punti del path vanno usati in ordine contrario (reverse)
            var sp_name_v1 = 'singlepath-' + shortest[i - 1] + '-' + shortest[i];
            var sp_name_v2 = 'singlepath-' + shortest[i] + '-' + shortest[i - 1];
            var point_list;
            if (fsp_dict[sp_name_v1])
                point_list = fsp_dict[sp_name_v1].path;
            else
                point_list = fsp_dict[sp_name_v2].path.reverse();

            point_list.slice(1).forEach(point => {
                shortest_path_point_list.push(point);
            })
            console.log(point_list);
        }

        console.log(shortest_path_point_list);
        this.addPath(shortest_path_point_list, "best", grid.SMALL, this.BEST_PATH_COLOR);
    }

    addAllObstaclesVertex() {
        // Add obstacles edges
        var i = 0,
            j = 0;
        for (i = 0; i < this.wall_map.length; i++) {
            var row = this.wall_map[i];
            for (j = 0; j < row.length; j++) {
                if (row[j] == 1) {
                    this.addObstacleVertex(i, j);
                }
            }
        }
    }

    // Check the four diagonal point of the specified cell, and adds edges if not occupied
    addObstacleVertex(x, y) {
        var diagonalPositions = [
            [1, 1],
            [1, -1],
            [-1, 1],
            [-1, -1]
        ];

        diagonalPositions.forEach(element => {

            if (x + element[0] >= this.size.x || x + element[0] < 0 || y + element[1] >= this.size.y || y + element[1] < 0) {
                // Outside the map
                return;
            } else if (!this.cellIsWall(x + element[0], y) && !this.cellIsWall(x, y + element[1]) && !this.cellIsWall(x + element[0], y + element[1])) {
                if (this.obstacle_vertex_map[x + element[0]][y + element[1]] == 0) {
                    var obstacle_vertex_name = 'ov' + '_' + (x + element[0]) + '_' + (y + element[1]);
                    this.addCircle(obstacle_vertex_name, grid.MEDIUM, x + element[0], y + element[1], grid.OBSTACLE_EDGE_COLOR);
                    this.obstacle_vertex_names.push(obstacle_vertex_name);
                    this.obstacle_vertex_map[x + element[0]][y + element[1]] = 1;
                }
            }
        });
    }

    randomObstacleVertex() {
        var SAMPLE_NUM = this.size.x;
        var MAX_TRIES = this.size.x * 3;
        var i = 0;
        var n = 0;
        var x, y;

        while (i < SAMPLE_NUM && n < MAX_TRIES) {
            x = Math.floor(Math.random() * this.size.x);
            y = Math.floor(Math.random() * this.size.y);

            if (!this.cellIsWall(x, y) && this.obstacle_vertex_map[x][y] == 0) {
                this.obstacle_vertex_map[x][y] = 1;
                var obstacle_vertex_name = "random_" + x + "_" + y;
                this.addCircle(obstacle_vertex_name, grid.MEDIUM, x, y, grid.OBSTACLE_EDGE_COLOR);
                this.obstacle_vertex_names.push(obstacle_vertex_name);
                i++;
            }

            n++;
        }
    }

    logObjectNames() {
        for (var key in this.objects) {
            console.log(key);
        }
    }




    // Bug methods
    findDummyPath(start, end) {
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
            console.log(dummyPath[i])
            var range = this.rangeArea(dummyPath[i], 2);
            console.log('range');
            console.log(range);
            var free = true;
            var discontinuities = [];
            for (var j = 0; j < range.length; j++) { //check if range area is free
                if (this.cellIsWall(range[j].x, range[j].y) || ((this.cellIsWall(range[j].x + 1, range[j].y) && this.cellIsWall(range[j].x, range[j].y - 1)) || this.cellIsWall(range[j].x + 1, range[j].y) && this.cellIsWall(range[j].x, range[j].y + 1)) || (this.cellIsWall(range[j].x - 1, range[j].y) && this.cellIsWall(range[j].x, range[j].y - 1)) || (this.cellIsWall(range[j].x - 1, range[j].y) && this.cellIsWall(range[j].x, range[j].y + 1))) {
                    discontinuities.push(range[j]); //the list of obstacles in range
                    if (this.isInPath(dummyPath, range[j]) != -1) //if there are obstacles in range, but the dummy path is free follow the dummy path
                        free = false;
                }
            }
            if (free) { //if free follow the dummy path
                console.log(dummyPath[i])
                console.log("free")
                path.push(dummyPath[i])
            } else {
                console.log(dummyPath[i])
                console.log("free")
                var min;
                var minDist = 100;
                console.log("-------- ")
                console.log(discontinuities);
                discontinuities = this.findDiscontinuities(discontinuities);
                console.log("-------- ")
                console.log(discontinuities);
                for (var j = 0; j < discontinuities.length; j++) { //find the nearest discontinuity
                    var toDisc = this.findDummyPath(dummyPath[i], discontinuities[j]);
                    var dist = this.pathCost(this.findDummyPath(discontinuities[j], grid.objects['end'])) + this.pathCost(toDisc) //the distance is given by the sum of the distances between you and the discontinuity and between the discontinuity and the end
                    for (var z = 0; z < toDisc.length - 1; z++) { // check that the path to the discontinuity is free
                        if (this.cellIsWall(toDisc[z].x, toDisc[z].y))
                            dist = 100;
                    }
                    if (dist < minDist) {
                        console.log(discontinuities[j])
                        min = discontinuities[j];
                        minDist = dist;
                    }
                }
                var toDisc = this.findDummyPath(dummyPath[i], min);
                console.log("toDisc");
                console.log(toDisc)
                path = path.concat(toDisc);
                path.pop();
                //now boundary following 
                //heuristic to understand in which direction is better to turn around the obstacle
                var dir = "anti";
                if (Math.abs(this.objects["end"].x - this.objects["start"].x) > Math.abs(this.objects["end"].y - this.objects["start"].y)) { // i'm moving horizontally
                    console.log("orizzontale")
                    if ((toDisc[0].x < toDisc[1].x && toDisc[0].y > toDisc[1].y) || (toDisc[0].x > toDisc[1].x && toDisc[0].y < toDisc[1].y))
                        dir = "or";
                } else { // vertically
                    if ((toDisc[0].x > toDisc[1].x && toDisc[0].y > toDisc[1].y) || (toDisc[0].x < toDisc[1].x && toDisc[0].y < toDisc[1].y))
                        dir = "or";
                }
                console.log(dir)
                this.boundaryFollow(toDisc[toDisc.length - 2], min, this.objects["end"], dir, path);
                dummyPath = this.findDummyPath(path[path.length - 1], this.objects["end"]);
                i = 0;
            }
        }
        return path;
    }
    //TODO evitare che find dummy path passi in diagonale tra due ostacoli!!!
    boundaryFollow(last, obstacle, end, dir, path) {
        var newStep = this.followObs(last, obstacle, dir);
        if (!this.cellIsWall(newStep.x, newStep.y)) {
            path.push(newStep);
            var dummy = this.findDummyPath(newStep, end);
            var range = this.rangeArea(newStep, 1);
            var free = true;
            for (var j = 0; j < range.length; j++) { //check if range area is free
                if (this.cellIsWall(range[j].x, range[j].y)) {
                    if (this.isInPath(dummy, range[j]) != -1) { //if there are obstacles in range, but the dummy path is free follow the dummy path
                        free = false;
                        break;
                    }
                }
            }
            if (free) { //nota se non ho mai il dummy path libero a distanza 2 mi fotto..
                return path
            }
            return this.boundaryFollow(newStep, obstacle, end, dir, path);
        } else
            console.log(newStep)
        return this.boundaryFollow(last, newStep, end, dir, path);
    }

    findDiscontinuities(obs) {
        var disc = [];
        for (var i = 0; i < obs.length; i++) {
            var count = 0;
            var nears = []
            nears.push({
                x: obs[i].x + 1,
                y: obs[i].y
            })
            nears.push({
                x: obs[i].x - 1,
                y: obs[i].y
            })
            nears.push({
                x: obs[i].x,
                y: obs[i].y + 1
            })
            nears.push({
                x: obs[i].x,
                y: obs[i].y - 1
            })
            for (var j = 0; j < nears.length; j++) {
                if (this.isInPath(obs, nears[j]) != -1)
                    count += 1
                if (count == 2)
                    break
            }
            if (count < 2)
                disc.push(obs[i])
        }
        if (disc.length > 0)
            return disc
        return (obs)
    }

    pathCost(path) {
        var last = path[0];
        var cost = 0;
        for (var i = 1; i < path.length; i++) {
            if (Math.abs(last.x - path[i].x) == 1)
                cost += 1
            if (Math.abs(last.y - path[i].y) == 1)
                cost += 1
            last = path[i];
        }
        return cost
    }

    rangeArea(o, r) { //o is a point object, and r is the radio of the circonference ( in our case it will be a square, according to our distance definition, as the number of steps)
        var range = [];
        for (var i = 0; i < this.size.x; i++) {
            for (var j = 0; j < this.size.y; j++) {
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
            if (!this.cellIsWall(step.x, step.y)) {
                console.log(step)
                path.push(step);
            } else {
                console.log("wall")
                path.push(step);
                var lastStep = dummyPath[this.isInPath(dummyPath, step) - 1];
                var res = {
                    circumnavigation: [],
                    dists: []
                };

                var dummy = this.findDummyPath(lastStep, this.objects['end']);
                var dist = this.pathCost(dummy);
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

    followObs(lastStep, obstacle, sense = "anti") {
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

        console.log(sense)
        if (sense == "anti") {
            if (dir == "E" || dir == "SE") {
                newStep = {
                    x: lastStep.x,
                    y: lastStep.y + 1
                }
            } else if (dir == "NE" || dir == "N") {
                newStep = {
                    x: lastStep.x + 1,
                    y: lastStep.y
                }
            } else if (dir == "NO" || dir == "O") {
                newStep = {
                    x: lastStep.x,
                    y: lastStep.y - 1
                }
            } else if (dir == "SO" || dir == "S") {
                newStep = {
                    x: lastStep.x - 1,
                    y: lastStep.y
                }
            }
        } else {
            if (dir == "O" || dir == "SO") {
                newStep = {
                    x: lastStep.x,
                    y: lastStep.y + 1
                }
            } else if (dir == "SE" || dir == "S") {
                newStep = {
                    x: lastStep.x + 1,
                    y: lastStep.y
                }
            } else if (dir == "NE" || dir == "E") {
                newStep = {
                    x: lastStep.x,
                    y: lastStep.y - 1
                }
            } else if (dir == "NO" || dir == "N") {
                newStep = {
                    x: lastStep.x - 1,
                    y: lastStep.y
                }
            }
        }
        return newStep;
    }

    circumnavigate1(lastStep, obstacle, end, obj) { //end è la destinazione finale, mi serve per la distanza, dists contiene le distanze lungo la circumnavigazione
        var newStep = this.followObs(lastStep, obstacle);
        var dummy = this.findDummyPath(newStep, end);
        var dist = this.pathCost(dummy);
        obj.circumnavigation.push(newStep);
        obj.dists.push(dist)
        console.log("new ");
        console.log(newStep);
        if (!this.cellIsWall(newStep.x, newStep.y)) {
            if (newStep.x == obj.circumnavigation[0].x && newStep.y == obj.circumnavigation[0].y) {
                //non sto mettendo l'ultimo step, controllare se è giusto
                console.log(obj.dists)
                return obj
            }
            return this.circumnavigate1(newStep, obstacle, end, obj);
        } else
            obj.circumnavigation.pop();
        obj.dists.pop();
        console.log(newStep)
        return this.circumnavigate1(lastStep, newStep, end, obj)
    }

    bug2(dummyPath) {
        var path = [];
        for (var i = 0; i < dummyPath.length; i++) {
            var step = dummyPath[i];
            if (!this.cellIsWall(step.x, step.y)) {
                console.log(step)
                path.push(step);
            } else {
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
        if (!this.cellIsWall(newStep.x, newStep.y)) {
            if (this.isInPath(oldPath, newStep) != -1 && this.isInPath(newPath, newStep) == newPath.length - 1)
                return newPath
            return this.circumnavigate2(newStep, obstacle, newPath, oldPath);
        } else
            return this.circumnavigate2(lastStep, newStep, newPath, oldPath)
    }
}