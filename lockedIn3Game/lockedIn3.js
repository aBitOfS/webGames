/* FUNCTION.prototype
- działa TYLKO do FUNKCJI
czyli jeśli jest objekt to nie można nic dodać
czyli działa TYLKO do KONSTRUKTORÓW
*/
Object.beget = function (obj) {
	let F = function() {};
	F.prototype = obj;
	return new F();
};

function random(max) {
	return Math.floor(Math.random() * max);
};

var game = function () {
	var firstCall = true;

	var htmlElements = {};
	var canvas;


	// Map
	var map = {
		map, scale: 100, SIZE: 100,
		generate: function () {
			let mapCell = {
				render: function (x,y,w,h) {
					canvas.fillStyle = this.color;
					canvas.fillRect(x,y,w,h);
				},
			};
	
			let newMap = [];
			for(let i = 0; i < map.SIZE; i++) {
				newMap[i] = [];
				for (let j = 0; j < map.SIZE; j++) {
					newMap[i][j] = Object.beget(mapCell);
					//let obj = new Object(mapCell,{});
					//newMap[i][j] = obj;
					newMap[i][j].color = "rgba("+(random(256)+",").repeat(3)+"1)";
				}
			}
			return newMap;
		},
		render: function () {
			for (let i = 0; i < map.SIZE; i++) {
				for (let j = 0; j < map.SIZE; j++) {
					map.map[i][j].render(i*map.scale+position[0],j*map.scale+position[1], map.scale, map.scale);
				}
			}
		}
	};

	// Movement
	var position = [0,0];

	// Input
	var mouse = {
		position: [0,0], angle: 0,
	};
	var mouseButtonsState = [false, false, false];

	var input = {
		onMouseMove: function (event) {
			var angle;
			if (event.clientY === htmlElements.game.offsetHeight/2)
				angle = Math.PI * ((event.clientX > htmlElements.game.offsetWidth / 2) ? 3 / 2 : 1 / 2);
			else {
				angle = Math.atan((event.clientX - htmlElements.game.offsetWidth / 2) / (event.clientY - htmlElements.game.offsetHeight / 2));
				if (event.clientY > htmlElements.game.offsetHeight / 2)
					angle += Math.PI;
				}
			mouse.angle = angle;
			htmlElements.player.style.transform = "rotate("+-angle+"rad)";
			mouse.position = [event.clientX, event.clientY];
		},
		onMouseDown: function (event) {
			mouseButtonsState[event.button] = true;
			switch (event.button) {
				case 0:
					break;
				case 1:
					break;
				case 2:
					break;
			}
		},
		onMouseUp: function (event) {
			mouseButtonsState[event.button] = false;
			switch (event.button) {
				case 0:
					break;
				case 1:
					break;
				case 2:
					break;
			}
		}
	};
	
	// MainLoop
	var mainLoop;
	var loop = function () {
		if (mouseButtonsState[2]) {
			position[0] -= (mouse.position[0] - htmlElements.game.offsetWidth / 2)/100;
			position[1] -= (mouse.position[1] - htmlElements.game.offsetHeight / 2)/100;
		}
		map.render();
	};
	
	return {
		start: function () {
			// Variables setup
			htmlElements.game = document.getElementById("game");
			htmlElements.player = document.getElementById("playerImage");
			canvas = document.getElementById("canvas").getContext("2d");

			// Opening game in fullscreen
			htmlElements.game.requestFullscreen();
			htmlElements.game.style = "";

			// Adding events handling
			if (firstCall) {
				// Keyboard Input
				htmlElements.game.addEventListener("keydown", game.buttonClick);

				// Mouse Input
				htmlElements.game.addEventListener("mousemove", input.onMouseMove);

				htmlElements.game.addEventListener("mousedown", input.onMouseDown);
				htmlElements.game.addEventListener("mouseup", input.onMouseUp);
			}
			// Map
			map.map = map.generate();
			
			map.render();
			mainLoop = setInterval(loop, 10);

			firstCall = false;
		},
		buttonClick: function (event) {

		},
	};
}();