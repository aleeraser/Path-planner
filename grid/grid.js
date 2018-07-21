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
        this.BEST_PATH_COLOR = 'green';
        this.CELL_COLOR = this.BG_COLOR;
        this.OBSTACLE_EDGE_COLOR = '#996600';

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


        this.adjacency_graph = null;

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
                    console.error('ERROR: Uknown object type');
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

        this.context.strokeStyle = obj.color;
        this.context.lineWidth = (this.cell_height / 2) * obj.size;
        this.context.beginPath();
        //this.context.strokeStyle = obj.color;
        //this.context.lineWidth = (this.cell_height / 2) * obj.size;

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
            console.error('ERROR: Grid has to be generated yet');
            return;
        }

        if (this.objects[name]) {
            console.error('ERROR: Name "' + name + '"already used by another object');
            return;
        }


        if (type != this.LINE && cell_x >= this.size_x || cell_y >= this.size_y) {
            console.error('ERROR: point (' + cell_x + ', ' + cell_y + ') outside of the grid.\n\tGrid size: ' + this.size_x + 'x' + this.size_y + '.');
            return;
        }

        if (type == this.LINE) {
            for (var i = 0; i < pointList.length; i++) {
                if (pointList[i].x >= this.size_x || pointList[i].y >= this.size_y) {
                    console.error('ERROR: Point (' + pointList[i].x + ', ' + pointList[i].y + ') in pointlist outside of the grid.\n\tGrid size: ' + this.size_x + 'x' + this.size_y + '.');
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
            console.error('ERROR: Grid has to be generated yet');
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
        }
    }

    removeWall(cell_x, cell_y, printDebug = true) {
        if (this.cellHasWall(cell_x, cell_y)) {
            var name = 'w' + cell_x + "-" + cell_y;

            this.wall_map[cell_x][cell_y] = 0;
            this.removeObj(name);
        } else {
            if (printDebug) {
                console.error("ERROR: trying to remove wall on (" + cell_x + ", " + cell_y + "), but no wall was found");
            }
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

    // do not use this for adding path, use addPath
    addLine(name, size, color, pointList) {
        this.addObj(name, size, null, null, color, this.LINE, pointList);
    }

    addPath(pointList, name = null, gridSize = grid.SMALLER, color = this.PATH_COLOR) {
        var _name = name;

        this.n_path++;

        if (!_name)
            _name = 'path' + this.n_path;

        this.addLine(_name, gridSize, color, pointList);
    }

    removePath(name) {
        var obj;

        if (obj = this.objects[name]) {
            if (this.objects[name].type == 'TYPE_LINE') {
                delete this.objects[name];
                this.n_path--;
            } else {
                console.error("ERROR: trying to remove path '" + name + "', but its type is actually " + this.objects[name].type);
            }
        } else {
            console.log("WARNING: path '" + name + "' not found while trying to remove it");
        }
    }

    moveObject(name, direction) {
        var obj;

        if (obj = this.objects[name]) {

            if (obj.type != this.CIRCLE && obj.type != this.RECT) {
                console.error('ERROR: Impossible to move this type of object');
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
                    console.error('ERROR: Direction unknown');
            }

            // Check validity of movement
            if (obj.x < 0 || obj.x >= this.size_x || obj.y < 0 || obj.y >= this.size_y) {
                console.error('ERROR: Invalid new position');
                obj.x = old_x;
                obj.y = old_y;
            }

            this.updateGraphics();
            return;

        }

        console.error('ERROR: Object name not found');
    }

    setObjectPosition(name, x, y) {
        this.objects[name].x = x;
        this.objects[name].y = y;
        this.updateGraphics();
    }


    // Generate the grid based on setting specified before
    generate() {
        if (this.size_x == null || this.size_y == null) {
            console.error('ERROR: Missing size parameters');
            return false;
        }

        // Calculate size in pixel based on dimensions and number of cells
        this.cell_width = ((this.canvas_obj.width - this.spacing_x) / this.size_x) - this.spacing_x;
        this.cell_height = ((this.canvas_obj.height - this.spacing_y) / this.size_y) - this.spacing_y;

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

        if (cell_x < 0 || cell_x > this.size_x || cell_y < 0 || cell_y > this.size_y) {
            return null;
        }

        // console.log('Cell ' + cell_x + ' - ' + cell_y);

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

                switch (document.getElementById('methodSelect').value) {
                    case "Visibility Graph":
                        this.visibilityGraph();
                        break;
                    case "Probabilistic Roadmap":
                        this.visibilityGraph(true);
                        break;
                    case "Cellular Decomposition":
                        this.findPath();
                        break;

                    default:
                        break;
                }
            } else {
                grid.removePath('decomposition');

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




    // Grid/cellular decomposition methods
    gridDecomposition() {
        var adjacency_matrix = {};

        // iterate over all cells
        for (var i = 0; i < this.grid_matrix.length; i++) {
            for (var j = 0; j < this.grid_matrix[i].length; j++) {

                // console.log("Computing for cell (" + i + ", " + j + ").");

                // skip wall cells
                if (!this.cellHasWall(i, j)) {

                    var source = i + "_" + j;

                    adjacency_matrix[source] = {};

                    // iterate over adjacent cells
                    for (var k = i - 1; k <= i + 1; k++) {
                        for (var l = j - 1; l <= j + 1; l++) {

                            // console.log("\tChecking (" + k + ", " + l + ")...");

                            // check that target is inside the map
                            if (k >= 0 && k < this.size_x && l >= 0 && l < this.size_y) {

                                // exclude the cell itself
                                if (!(k == i && l == j)) {

                                    // check that target has not a wall over it
                                    if (!this.cellHasWall(k, l)) {
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

        console.log(adjacency_matrix);


        this.adjacency_graph = new Graph(adjacency_matrix);
    }

    findPath() {
        this.gridDecomposition();

        var start_key = grid.objects['start'].x + "_" + grid.objects['start'].y;
        var end_key = grid.objects['end'].x + "_" + grid.objects['end'].y;

        var shortest = this.adjacency_graph.findShortestPath(start_key, end_key);
        console.log(shortest);

        // Null means no path available
        if (shortest == null) {
            alert('No path found');
            return;
        }

        var pointList = [];

        shortest.forEach(node => {
            pointList.push({
                x: parseInt(node.split('_')[0]),
                y: parseInt(node.split('_')[1])
            });
        })

        this.addPath(pointList, "decomposition");
    }




    // Visibility Graph Methods
    visibilityGraph(probabilistic = false) {
        console.log("Visibility Graph Method");

        // Variables setup
        this.obstacle_vertex_names = [];

        // Obstacle map, initialized to 0 in every cell
        this.obstacle_vertex_map = [];
        for (var i = 0; i < this.size_x; i++) {
            var l = []
            for (var j = 0; j < this.size_y; j++) {
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
        var point_names = this.obstacle_vertex_names.concat('start').concat('end');

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
                if (this.wall_map[step.x][step.y] == 1) {
                    ok = false;
                    return;
                }
            })
            // If path is ok adds it to free_single_path
            if (ok) {
                free_single_paths.push(sp);
                this.addPath(sp.name, sp.path);
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
        var shortest = graph.findShortestPath('start', 'end');
        console.log(shortest);

        // Null means no path available
        if (shortest == null) {
            alert('No path found');
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
        this.addBestPath('best', shortest_path_point_list);
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

            if (x + element[0] >= this.size_x || x + element[0] < 0 || y + element[1] >= this.size_y || y + element[1] < 0) {
                // Outside the map
                return;
            } else if (this.wall_map[x + element[0]][y] == 0 && this.wall_map[x][y + element[1]] == 0 && this.wall_map[x + element[0]][y + element[1]] == 0) {
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
        var SAMPLE_NUM = this.size_x;
        var MAX_TRIES = this.size_x * 3;
        var i = 0;
        var n = 0;
        var x, y;

        while (i < SAMPLE_NUM && n < MAX_TRIES) {
            x = Math.floor(Math.random() * this.size_x);
            y = Math.floor(Math.random() * this.size_y);

            if (this.wall_map[x][y] == 0 && this.obstacle_vertex_map[x][y] == 0) {
                this.obstacle_vertex_map[x][y] = 1;
                var obstacle_vertex_name = "random_" + x + "_" + y;
                this.addCircle(obstacle_vertex_name, grid.MEDIUM, x, y, grid.OBSTACLE_EDGE_COLOR);
                this.obstacle_vertex_names.push(obstacle_vertex_name);
                i++;
            }

            n++;
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

    logObjectNames() {
        for (var key in this.objects) {
            console.log(key);
        }
    }
}