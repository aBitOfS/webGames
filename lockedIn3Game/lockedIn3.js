Object.beget = function(obj) {
	let F = function() {};
	F.prototype = obj;
	return new F();
};

function random(max) {
	return Math.floor(Math.random() * max);
};

var game = function() {
	var firstCall = true;

	var htmlElements = {};
	var canvas;

	// Map
	const map = new class {
		map;
		scale = 100;
		get SIZE() { return 100; }
		cells = (function() { // VALUE of function
			class NormalCell {
				constructor(color,position) {
					this.color = color;
					this.position = position;
				}
				render(x,y,w,h) {
					canvas.fillStyle = this.color;
					canvas.fillRect(x,y,w,h);
				}
				buildingRender(x, y, w, h, canBuild) {
					canvas.fillStyle = this.buildable ? (canBuild ? "green" : "orange") : "red";
					canvas.fillRect(x,y,w,h);
				}
				walkable = true;
				buildable = true;
			}
			//const staticNormalCell = new NormalCell("black");
			
			class BreakableCell extends NormalCell {
				constructor(color, position, hardness, walkable) {
					super(color, position);
					this.hardness = hardness;
					this.startHardness = hardness;
					this.walkable = walkable;
				}
				
				buildable = false;

				mine(strength) {
					this.hardness -= strength;
					if (this.hardness <= 0)
						map.demolish(this.position[0], this.position[1]);
				}
				
				drawHealthIndex(x,y,w,h,value,maxValue) {
					let procent = value/maxValue;
					if (procent < 0)
						procent = 0;
					else if (procent > 1) // >= 1) return;
						procent = 1;
				
					var size = [0.9*map.scale,0.3*map.scale];
	
					x += w/2 - size[0]/2;
					y += h/2 - size[1]/2;
					// Border
					canvas.fillStyle = "rgba(10,10,10,0.7)";
					canvas.fillRect(x,y,size[0],size[1]);
					// LineBg
					x += size[0]/10;
					y += size[1]/10;
					w = size[0]/5*4;
					h = size[1]/4*3;
					canvas.fillStyle = "darkblue";
					canvas.fillRect(x,y,w,h);
					// Line
					canvas.fillStyle = "blue";
					canvas.fillRect(x,y,w*procent,h);
				}
			}
			const grassColors = ["#5BBA6F","#3FA34D","#2A9134","#137547","#054A29"];
			
			class GrassCell extends NormalCell {
				constructor(position) {
					super(grassColors[random(5)],position);
				}
			}
			class RockCell extends BreakableCell {
				constructor(position) {
					const rockColors = ["#aaaaaa","#bbbbbb","#cccccc","#dddddd","#eeeeee"];
					super(rockColors[random(5)], position, 5 + random(20), false);
				}
				render(x,y,w,h, mining) {
					super.render(x,y,w,h);
					if (mining)
						this.drawHealthIndex(x,y,w,h, this.hardness,this.startHardness);
				}
			}
			
			class BuildingCell extends BreakableCell {
				constructor(color, position, size, img, hardness, walkable) {
					super(color, position, hardness, walkable);
					this.img = new Image();
					this.img.src = img;

					this.size = size;
					this.walkable = walkable;
				}
				render(x, y, w, h, mining) {
					// Bg
					super.render(x, y, w, h, mining);
					// Img
					// Assign to full size of building (not cell);
					x = x-w*(this.size[0]-1);
					y = y-h*(this.size[1]-1);
					w = w*this.size[0];
					h = h*this.size[1];
					
					canvas.drawImage(this.img,x,y,w,h);

					// Health
					if (mining) {
						this.drawHealthIndex(x, y, w, h, this.hardness, this.startHardness);
					}
				}
				mine(strength) {
					this.hardness -= strength;
					if (this.hardness <= 0) {
						for (let i = -this.size[0]+1; i <= 0; i++)
							for (let j = -this.size[1]+1; j <= 0; j++)
								map.demolish(i+this.position[0],j+this.position[1]);
					}
				}
			}
			class BuildedCell extends NormalCell { // Handle to BuildingCell
				constructor(color, position, parent) {
					super(color);
					this.parent = parent;
					this.walkable = parent.walkable;
				}
				buildable = false;
				mine(strength) {
					this.parent.mine(strength);
				}
			}

			const treeTypes = [	["https://cdn.pixabay.com/photo/2015/12/10/17/46/fir-1086772_640.png",10, false], ["https://cdn.pixabay.com/photo/2014/12/22/00/07/tree-576847_1280.png", 5, false] ];
			class TreeCell extends BuildingCell {
				constructor(position) {
					let treeType = random(treeTypes.length);
					super(grassColors[random(grassColors.length)], position,[1,1], treeTypes[treeType][0], treeTypes[treeType][1], treeTypes[treeType][2]);
				}

			}
			
			return {
				Normal: NormalCell,
				Grass: GrassCell,
				Rock: RockCell,
				Tree: TreeCell,
				Building: BuildingCell,
				Builded: BuildedCell,
			};
		})();
		demolish(x,y) {
			let cell = new map.cells.Grass([x,y]);
			map.map[x][y] = cell;
		}
		generate() {
			let newMap = [];
			for(let i = 0; i < map.SIZE; i++) {
				newMap[i] = [];
				for (let j = 0; j < map.SIZE; j++) {
					newMap[i][j] = (random(40) === 0) ? (random(3) === 0 ? new this.cells.Rock([i,j]) : new this.cells.Tree([i,j])) : new this.cells.Grass([i,j]);
				}
			}
			return newMap;
		}
		getLocationUnder() {
			if (arguments.length === 2)
				return [Math.floor((-arguments[0])/map.scale-player.position[0]+map.SIZE/2),Math.floor((-arguments[1])/map.scale-player.position[1]+map.SIZE/2)];
			else if (arguments.length === 1)
				return [Math.floor((-arguments[0][0])/map.scale-player.position[0]+map.SIZE/2),Math.floor((-arguments[0][1])/map.scale-player.position[1]+map.SIZE/2)]
		}
		render() {
			let minPos = this.getLocationUnder(1920,1080), maxPos = this.getLocationUnder(-1920,-1080);

			let maxBuildingSize = 3; // to show buildings on the edges
			
			minPos = [Math.max(minPos[0],0),Math.max(minPos[1],0)];
			maxPos = [Math.min(maxPos[0]+maxBuildingSize-1,map.SIZE-1),Math.min(maxPos[1]+maxBuildingSize-1,map.SIZE-1)];
			
			for (let i = minPos[0]; i <= maxPos[0]; i++) {
				for (let j = minPos[1]; j <= maxPos[1]; j++) {
					map.map[i][j].render((i+player.position[0]-map.SIZE/2)*map.scale+1920,(j+player.position[1]-map.SIZE/2)*map.scale+1080, map.scale, map.scale, player.mode === 0 && player.option === 3);
				}
			}
			if (player.mode === 2)
				this.building.render();
		}
		distanceBetween(p1, p2) {
			return Math.pow(Math.pow(p1[0]-p2[0],2) + Math.pow(p1[1]-p2[1],2), 0.5);
		}
		move() {
			var position = [player.position[0] + Math.sin(mouse.angle) * mouse.amplitude * player.SPEED * 0.1,
							player.position[1] + Math.cos(mouse.angle) * mouse.amplitude * player.SPEED * 0.1];
			// Collision detection
			var under = this.getLocationUnder(0,0);
			var checkDist = Math.floor((player.SIZE+3)/2);

			if (this.canMove(position,under, checkDist)) // Orginal movement
				player.position = position;
			else if (this.canMove([position[0],player.position[1]],under, checkDist)) // One-axcies move when other blocked
				player.position[0] = position[0];
			else if (this.canMove([player.position[0],position[1]],under, checkDist)) // -||- but second axcies
				player.position[1] = position[1];
		}
		canMove(position, under, checkDist) {
			try
			{
				for (let i = under[0]-checkDist; i <= under[0] + checkDist; i++)
					for (let j = under[1]-checkDist; j <= under[1] + checkDist; j++)
						if (this.distanceBetween(position,[-i+map.SIZE/2-0.5,-j+map.SIZE/2-0.5]) < checkDist-0.5 && !map.map[i][j].walkable)
							return false;	// Obstackle
			}
			catch
			{
				return false; // Out of the map
			}
			return true;
		}
		mine() {
			let pos = this.getLocationUnder(mouse.position);
			
			if (pos[0] < 0 || pos[1] < 0 || pos[0] >= map.SIZE || pos[1] >= map.SIZE)
				return;

			if (this.map[pos[0]][pos[1]].mine) { // Is mineable if !== null
				if(this.map[pos[0]][pos[1]].mine(1)) // If broken
					this.map[pos[0]][pos[1]] = new this.cells.Grass();
			}
		}
		building = {
			MAXDISTANCE: 12,
			build() {
				if (player.option === 0 || player.mode !== 2)
					return;
				
				var building = this.buildings[player.option-1]
				let size = building[0];

				var under = map.getLocationUnder(mouse.position[0],mouse.position[1]);
				var minPos = [under[0]-Math.floor(size[0]/2),under[1]-Math.floor(size[1]/2)];
				var maxPos = [minPos[0]+size[0]-1, minPos[1]+size[1]-1];
				
				if (minPos[0] < 0 || minPos[1] < 0 || maxPos[0] >= map.SIZE || maxPos[1] >= map.SIZE)
					return;

				for (let i = minPos[0]; i <= maxPos[0]; i++)
					for (let j = minPos[1]; j <= maxPos[1]; j++)
						if (!map.map[i][j].buildable)
							return;

				//constructor(color, position, size, img, hardness, walkable)
				let build = new map.cells.Building(map.map[maxPos[0]][maxPos[1]].color, maxPos, building[0], building[1], building[2], building[3]);
				
				for (let i = minPos[0]; i <= maxPos[0]; i++) {
					for (let j = minPos[1]; j <= maxPos[1]; j++) {
						map.map[i][j] = new map.cells.Builded(map.map[i][j].color,[i,j],build);
					}
				}
				
				map.map[maxPos[0]][maxPos[1]] = build;
			},
			buildings: [[[2,2],"img/House.png",10,false],[[3,3],"img/House.png",15,false],[[3,2],"img/Build.png",5,true],],
			render() {
				if (player.option === 0 || player.mode !== 2)
					return;
				
				var under = map.getLocationUnder(mouse.position);
				let size = this.buildings[player.option-1][0];
				var minPos = [under[0]-Math.floor(size[0]/2),under[1]-Math.floor(size[1]/2)];
				var maxPos = [minPos[0]+size[0]-1, minPos[1]+size[1]-1];
				
				let canBuild = this.checkIfCanBuild(minPos[0],minPos[1],maxPos[0],maxPos[1]);
				
				minPos = map.clampVectorSize(minPos);
				maxPos = map.clampVectorSize(maxPos);

				for (let i = minPos[0]; i <= maxPos[0]; i++) {
					for (let j = minPos[1]; j <= maxPos[1]; j++) {
						map.map[i][j].buildingRender((i+player.position[0]-map.SIZE/2)*map.scale+1920,(j+player.position[1]-map.SIZE/2)*map.scale+1080, map.scale, map.scale, canBuild);
					}
				}
			},
			checkIfCanBuild(x,y,w,h) {
				if (x < 0 || y < 0 || w >= map.SIZE || h >= map.SIZE)
					return false;
				
				for (let i = x; i <= w; i++)
					for (let j = y; j <= h; j++)
						if (!map.map[i][j].buildable)
							return false;
				return true;
			},
		};
		clampVectorSize() {
			var x, y;
			var maxX = this.SIZE, maxY = this.SIZE;
			if (arguments.length === 1) {
				x = arguments[0][0];
				y = arguments[0][1];
			}
			else {
				x = arguments[0];
				y = arguments[1];
				if (arguments.length === 3)
					maxX = maxY = arguments[2];
				else if (arguments.length === 4) {
					maxX = arguments[2];
					maxY = arguments[3];
				}
			}
			x = x < 0 ? 0 : x;
			x = x >= maxX ? maxX - 1 : x;
			
			y = y < 0 ? 0 : y;
			y = y >= maxY ? maxY - 1 : y;

			return [x,y];
		}
	};

	// Movement
	const player = new class {
		position = [0,0]; // Relative to center of map, growing to top left
		get SPEED() { return 0.75; }
		get SIZE() { return 1.9; }
		mode = 0; // 0 - default, 1 - buildingCategories, 2 - building, 3 - equipment
		option = 0; // 0 - none, next - depending on mode
		updateSize() {
			htmlElements.player.style.width = player.SIZE * map.scale *  htmlElements.game.offsetWidth / 3840 + "px";
		}
		toolbar = {
			default: [[0, 1,"Sword.png","rgba(3, 37, 108, 0.8)","Fight"],[0, 2,"Bow.png","rgba(75, 136, 162,0.8)","Shoot"],
					  [0, 3,"Pickaxe.png","rgba(252, 68, 15, 0.8)","Mine"],[1, 0,"Build.png","rgba(250, 163, 0,0.8)","Build"]],
			buildingCategories: [[0,0],[2,1,"House.png","rgba(30, 255, 188,0.8)","Small House"],
					[2,2,"House.png","rgba(21, 171, 126, 0.8)","Big House"],[2,3,"Build.png","rgba(180, 227, 61,0.8)","Building"]],

			setItems(items) {
				let newItems = "";
				for (let i = 0; i < items.length; i++) {
					if (items[i].length === 2)
						newItems += `<h1 onclick="game.changeMode(${items[i][0]},${items[i][1]})">BACK</h1>`
					else
						newItems += `<div onclick="game.changeMode(${items[i][0]},${items[i][1]})" style="background-color: ${items[i][3]};">
						<img src="img/${items[i][2]}"/><h2>${items[i][4]}</h2></div>`;
				}
				htmlElements.toolbar.innerHTML = newItems;
			},
		};
		resources = {wood : 0, stone : 0, apples : 0}
	};

	// Input
	const mouse = new class {
		position = [1920,1080]; // Position on canvas relative to center, growing to top left
		angle = 0; // of moving based by mouse position relative to playerImage
		buttonsState = [false, false, false];
		amplitude = 0; // speed of moving based by distance from mouse to playerImage
		updateMouse(event) {
			var position = [event.clientX - htmlElements.game.offsetWidth / 2, event.clientY - htmlElements.game.offsetHeight / 2];
			this.position = [-position[0] / htmlElements.game.offsetWidth * 3840, -position[1] / htmlElements.game.offsetHeight * 2160];

			// Angle
			var angle;
			if (position[1] === 0)
				angle = Math.PI * ((position[0] > 0) ? 3 / 2 : 1 / 2);
			else {
				angle = Math.atan(position[0] / position[1]);
				if (position[1] > 0)
					angle += Math.PI;
				}
			this.angle = angle;
			
			htmlElements.player.style.transform = "rotate("+-angle+"rad)";

			// Amplitude
			var amplitude = Math.pow(Math.pow(position[0], 2) + Math.pow(position[1],2), 0.5) / (((htmlElements.game.offsetHeight < htmlElements.game.offsetWidth) ? htmlElements.game.offsetHeight : htmlElements.game.offsetWidth)/2);
			if (amplitude > 1)
				this.amplitude = 1;
			else
				this.amplitude = amplitude;
		}
	};

	var input = {
		onKeyDown(event) {
			
		},

		onMouseMove(event) {
			mouse.updateMouse(event);
		},
		onMouseDown(event) {
			mouse.updateMouse(event);
			mouse.buttonsState[event.button] = true;
			switch (event.button) {
				case 0:
					htmlElements.playerTool.style.animation = "playertoolanimation 0.5s infinite alternate cubic-bezier(0.4, 0, 1, 1)";
					if (player.mode === 2 && mouse.position[1] > -500)
						map.building.build();
					break;
				case 1:
					break;
				case 2:
					break;
			}
		},
		onMouseUp(event) {
			mouse.updateMouse(event);
			mouse.buttonsState[event.button] = false;
			switch (event.button) {
				case 0:
					htmlElements.playerTool.style.animation = "";
					break;
				case 1:
					break;
				case 2:
					break;
			}
		},
		onMouseWheelUpOrDown(event) {
			var scale = map.scale + event.deltaY/10;
			if (scale < 50)
				scale = 50;
			else if (scale > 200)
				scale = 200;
			map.scale = scale;
		},
	};
	
	// MainLoop
	var mainLoop;
	var loop = function() {
		player.updateSize();
		// Functionality
		
		// Movement
		if (mouse.buttonsState[0] && player.mode === 0 && player.option === 3)
			map.mine();
		if (mouse.buttonsState[2])
			map.move();
		
		// Render
		canvas.fillStyle = "#242f40";
		canvas.fillRect(0,0,3840,2160);
		map.render();
	};
	
	return {
		start() {
			
			if (firstCall) {
				// Variables setup
				htmlElements.game = document.getElementById("game");
				htmlElements.player = document.getElementById("playerImage");
				htmlElements.playerTool = document.getElementById("playerTool");
				htmlElements.toolbar = document.getElementById("toolbar");
				canvas = document.getElementById("canvas").getContext("2d");

				// Adding events handling
				// Keyboard Input
				htmlElements.game.addEventListener("keydown", game.buttonClick);

				// Mouse Input
				htmlElements.game.addEventListener("mousemove", input.onMouseMove);

				htmlElements.game.addEventListener("mousedown", input.onMouseDown);
				htmlElements.game.addEventListener("mouseup", input.onMouseUp);
				htmlElements.game.addEventListener("wheel", input.onMouseWheelUpOrDown);
				
				// Map
				map.map = map.generate();
				for (let i = -2; i < 2+map.SIZE%2; i++)
					for (let j = -2; j < 2+map.SIZE%2; j++)
						map.map[i+Math.floor(map.SIZE/2)][j+Math.floor(map.SIZE/2)] = new map.cells.Grass();
			}
			// Opening game in fullscreen
			htmlElements.game.requestFullscreen();
			htmlElements.game.style = "";
			//document.getElementById("start").style.visibility = "collapse";

			// Player size // Needen waiting for fullscreen
			player.updateSize();

			// Toolbar
			player.toolbar.setItems(player.toolbar.default);
			
			map.render();
			mainLoop = setInterval(loop, 10);

			firstCall = false;
		},
		changeMode(newMode, newOption) {
			if (player.option != 0)
				htmlElements.toolbar.getElementsByTagName("div")[player.option-1].className = "";
			
			if (player.mode !== newMode) {
				switch (newMode) {
					case 0:
						player.toolbar.setItems(player.toolbar.default);
						break;
					case 1:
						player.toolbar.setItems(player.toolbar.buildingCategories);
						break;
				}
			}
			
			if (player.mode === newMode && player.option === newOption)
				player.option = 0;
			else
			{
				player.mode = newMode;
				player.option = newOption;
			}
			if (player.mode === 0) {
				switch (player.option) {
					case 1:
						htmlElements.playerTool.src = "img/Sword.png";
						break;
					case 2:
						htmlElements.playerTool.src = "img/Bow.png";
						break;
					case 3:
						htmlElements.playerTool.src = "img/Pickaxe.png";
						break;
					default:
						htmlElements.playerTool.src = "";
						break;
				}
			}
			else
				htmlElements.playerTool.src = "";
			
			if (player.option != 0)
				htmlElements.toolbar.getElementsByTagName("div")[player.option-1].className = "toolbarSelected";
		},
	};
}();

// Still having trouble to walk close to walls // weardly walking between two blocks (X__X)
//  XX   XX  This problem may be caused by wrong collision detection which seems to 'cut' edges
// XXXX XXXX so player can stuck beeing in place of ^ so he must go back and omit obstackle from distance
// XXXX XXXX
//  XX ^ XX 