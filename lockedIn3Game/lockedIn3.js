/* FUNCTION.prototype
- działa TYLKO do FUNKCJI
czyli jeśli jest objekt to nie można nic dodać
czyli działa TYLKO do KONSTRUKTORÓW
*/
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
	var map = {
		map, scale: 100, SIZE: 100,
		cells: (function() { // VALUE of function
			class NormalCell {
				constructor(color) {
					this.color = color;
				}
				render(x,y,w,h) {
					canvas.fillStyle = this.color;
					canvas.fillRect(x,y,w,h);
				}
				walkable = true;
			}
			class ImgCell extends NormalCell {
				constructor(bgColor, img) {
					super(bgColor);
					this.img = new Image();
					this.img.src = img;
				}
				render(x,y,w,h) {
					super.render(x,y,w,h);
					canvas.drawImage(this.img,x,y,w,h)
				}
				walkable = false;
			}
			class GrassCell extends NormalCell {
				constructor() {
					const grassColors = ["#5BBA6F","#3FA34D","#2A9134","#137547","#054A29"];
					super(grassColors[random(5)]);
				}
			}
			class RockCell extends NormalCell {
				constructor() {
					const rockColors = ["#aaaaaa","#bbbbbb","#cccccc","#dddddd","#eeeeee"];
					super(rockColors[random(5)]);
				}
				walkable = false;
			}
			return {
				Normal: NormalCell,
				Img: ImgCell,
				Grass: GrassCell,
				Rock: RockCell,
			};
		})(),
		generate() {
			let newMap = [];
			for(let i = 0; i < map.SIZE; i++) {
				newMap[i] = [];
				for (let j = 0; j < map.SIZE; j++) {
					newMap[i][j] = (random(50) === 0) ? new this.cells.Rock() : new this.cells.Grass();
				}
			}
			return newMap;
		},
		render() {
			for (let i = 0; i < map.SIZE; i++) {
				for (let j = 0; j < map.SIZE; j++) {
					map.map[i][j].render((i+player.position[0]-map.SIZE/2)*map.scale+1920,(j+player.position[1]-map.SIZE/2)*map.scale+1080, map.scale, map.scale);
				}
			}
		},
		getLocationUnder() {
			if (arguments.length === 2)
				return [Math.floor((arguments[0]-1920)/map.scale-player.position[0]+map.SIZE/2),Math.floor((arguments[1]-1080)/map.scale-player.position[1]+map.SIZE/2)];
			else if (arguments.length === 1)
				return [Math.floor((arguments[0][0]-1920)/map.scale-player.position[0]+map.SIZE/2),Math.floor((arguments[0][1]-1080)/map.scale-player.position[1]+map.SIZE/2)]
		},
		distanceBetween(p1, p2) {
			return Math.pow(Math.pow(p1[0]-p2[0],2) + Math.pow(p1[1]-p2[1],2), 0.5);
		},
		move() {
			var position = [player.position[0] + Math.sin(mouse.angle) * mouse.amplitude * player.SPEED * 0.1,
							player.position[1] + Math.cos(mouse.angle) * mouse.amplitude * player.SPEED * 0.1];
			// Collision detection
			var under = this.getLocationUnder(1920,1080);
			var checkDist = Math.floor((player.SIZE+3)/2);

			try
			{
				for (let i = under[0]-checkDist; i <= under[0] + checkDist; i++)
					for (let j = under[1]-checkDist; j <= under[1] + checkDist; j++)
						if (this.distanceBetween(position,[-i+map.SIZE/2-0.5,-j+map.SIZE/2-0.5]) < checkDist-0.5 && !map.map[i][j].walkable)
							return;	
			}
			catch
			{
				return;
			}
			
			player.position = position;
		},
		building: {
			MAXDISTANCE: 12,
			build() {
				var position = map.getLocationUnder(mouse.position[0],mouse.position[1]);
				//if (Math.pow(position[0]-player.position[0]-map.SIZE/2,2) + Math.pow(position[1]-player.position[1]-map.SIZE/2,2) < Math.pow(this.MAXDISTANCE,2))
					map.map[position[0]][position[1]] = new map.cells.Img(map.map[position[0]][position[1]].color,"House.png");
			},
		},
	};

	// Movement
	var player = {
		position: [0,0], SPEED: 1, SIZE: 2, mode: 0,
		modeTools: ["","Sword.png","Bow.png","Pickaxe.png","",""],
		updateSize() {
			htmlElements.player.style.width = player.SIZE * map.scale *  htmlElements.game.offsetWidth / 3840 + "px";
		},
	};

	// Input
	var mouse = {
		position: [0,0], angle: 0, buttonsState: [false, false, false], amplitude: 0,
		updateMouse(event) {
			this.position = [event.clientX / htmlElements.game.offsetWidth * 3840, event.clientY / htmlElements.game.offsetHeight * 2160];
			position = [event.clientX - htmlElements.game.offsetWidth / 2, event.clientY - htmlElements.game.offsetHeight / 2];

			// Angle (of moving based by mouse position relative to playerImage)
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

			// Amplitude (speed of moving based by distance from mouse to playerImage)
			var amplitude = Math.pow(Math.pow(position[0], 2) + Math.pow(position[1],2), 0.5) / (((htmlElements.game.offsetHeight > htmlElements.game.offsetWidth) ? htmlElements.game.offsetHeight : htmlElements.game.offsetWidth)/3);
			if (amplitude > 1)
				this.amplitude = 1;
			else
				this.amplitude = amplitude;
		},
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
					if (player.mode === 4 && mouse.position[1] < 1580)
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
		if (mouse.buttonsState[2])
			map.move();
		
		// Render
		canvas.fillStyle = "#242f40";
		canvas.fillRect(0,0,3840,2160);
		map.render();
	};
	
	return {
		start() {
			// Variables setup
			htmlElements.game = document.getElementById("game");
			htmlElements.player = document.getElementById("playerImage");
			htmlElements.playerTool = document.getElementById("playerTool");
			canvas = document.getElementById("canvas").getContext("2d");

			// Opening game in fullscreen
			htmlElements.game.requestFullscreen();
			htmlElements.game.style = "";
			//document.getElementById("start").style.visibility = "collapse";

			// Player size // Needen waiting for fullscreen
			player.updateSize();
			
			// Adding events handling
			if (firstCall) {
				// Keyboard Input
				htmlElements.game.addEventListener("keydown", game.buttonClick);

				// Mouse Input
				htmlElements.game.addEventListener("mousemove", input.onMouseMove);

				htmlElements.game.addEventListener("mousedown", input.onMouseDown);
				htmlElements.game.addEventListener("mouseup", input.onMouseUp);
				htmlElements.game.addEventListener("wheel", input.onMouseWheelUpOrDown);
			}
			
			
			// Map
			map.map = map.generate();
			
			map.render();
			mainLoop = setInterval(loop, 10);

			firstCall = false;
		},
		changeMode(newMode) {
			if (player.mode === newMode)
				player.mode = 0;
			else
				player.mode = newMode;
			htmlElements.playerTool.src = player.modeTools[player.mode];
		},
	};
}();