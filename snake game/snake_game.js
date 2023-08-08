function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

var startGame = function() {
	var mapSize = document.getElementById("mapSize").value;
	var walkThroughWalls = document.getElementById("walkThroughWalls").checked;
	var addBariers = document.getElementById("addBariers").checked;
	var gameSpeed =  document.getElementById("gameSpeed").value;
	var direction = 0;
	var previousDirection = 0;
	var mainLoop;

	var ihtml = "<table>"
	for (let i = 0; i < mapSize; i++) {
		ihtml += "<tr>";
		for (let j = 0; j < mapSize; j++) {
			ihtml += '<td><img src="emptyCell.png" id="cell' + i + "x" + j + '"/></td>';
		}
		ihtml += "</tr>";
	}
	ihtml += "</table>";
	document.body.innerHTML = ihtml;

	var setCellImg = function (i, j, img, rotation) {
		var cell = document.getElementById("cell" + i + "x" + j);
		cell.src = img;
		switch (rotation) {
			case 1:
				cell.className = "bottom";
				break;
			case 2:
				cell.className = "";
				break;
			case 3:
				cell.className = "right";
				break;
			case 4:
				cell.className = "left";
				break;
			default:
				break;
		}
	}

	var snakePos = [[2 + getRandomInt(mapSize - 4), 2 + getRandomInt(mapSize - 4)],];
	setCellImg(snakePos[0][0], snakePos[0][1], "snakeHeadAndEndCell.png");

	var applePos = [];
	var bariersPos = [];

	var randomPositions = (function () {
		var ranPos = [], pos;
		for (var i = 0; i < mapSize; i++) {
			for (var j = 0; j < mapSize; j++) {
				if (ranPos.length == 0)
					ranPos.push([i, j]);
				else {
					pos = getRandomInt(ranPos.length - 1)
					ranPos.splice(pos, 1, ranPos[pos], [i, j]);
				}
			}
		}
		return ranPos;
	})();

	var checkIfIsClear = function (x,y) {
		for(let i = 0; i < snakePos.length; i++)
			if (snakePos[i][0] === x && snakePos[i][1] === y)
				return false;
		for (var i = 0; i < bariersPos.length; i++) {
			if (bariersPos[i][0] === x && bariersPos[i][1] === y)
				return false;
		}
		return true;
	};

	var setApplePos = function () {
		var getClearPos = function () {
			var pos = randomPositions.shift();
			if (!checkIfIsClear(pos[0], pos[1])) {
				randomPositions.push(pos);
				return getClearPos();
			}
			return pos;
		};

		if (snakePos.length === mapSize * mapSize)
			endGame();

		applePos = getClearPos();
		setCellImg(applePos[0], applePos[1], "appleCell.png", 2);

		if (addBariers) {
			if (snakePos.length + bariersPos.length + 1 >= mapSize * mapSize)
				endGame();
			var barPos = getClearPos()
			bariersPos.push(barPos);
			setCellImg(barPos[0], barPos[1], "barierCell.png", 2);
		}
	};

	var endGame = function() {
		clearInterval(mainLoop);
		if (snakePos.length + bariersPos.length === mapSize * mapSize)
		{
			alert("Congratulations! You've eaten all the apples!");
		}
		else
		{
			alert("Congratulations! You've eaten " + (snakePos.length - 1) + " of " + ((mapSize * mapSize - 1) * ((addBariers ? 1/2 : 1))));
		}
	};
	
	setApplePos();

	document.body.addEventListener("keydown", function(event) {
		if ((event.key == "s" || event.key == "ArrowDown") && previousDirection != 2)
			direction = 1;
		else if ((event.key == "w" || event.key == "ArrowUp") && previousDirection != 1)
			direction = 2;
		else if ((event.key == "d" || event.key == "ArrowRight") && previousDirection != 4)
			direction = 3;
		else if ((event.key == "a" || event.key == "ArrowLeft") && previousDirection != 3)
			direction = 4;
		else if (event.key == "Escape")
			direction = 0;
	});

	mainLoop = setInterval(function() {
		previousDirection = direction;

		// Set next position
		var nextPos = [snakePos[snakePos.length-1][0],snakePos[snakePos.length-1][1]];
		switch (direction)
		{
			case 1:
				nextPos[0]++;
				break;
			case 2:
				nextPos[0]--;
				break;
			case 3:
				nextPos[1]++;
				break;
			case 4:
				nextPos[1]--;
				break;
			default:
				return;
		}

		// Check if is escaping table
		if (nextPos[0] >= mapSize || nextPos[0] < 0 || nextPos[1] >= mapSize || nextPos[1] < 0)
		{
			if (walkThroughWalls) {
				console.log(mapSize + " " + (nextPos[1] + mapSize) + " " + (nextPos[1] + mapSize) % mapSize)
				nextPos[0] = (nextPos[0] + (1 * mapSize)) % mapSize;
				nextPos[1] = (nextPos[1] + (1 * mapSize)) % mapSize;
			}
			else {
				setCellImg(snakePos[snakePos.length - 1][0], snakePos[snakePos.length - 1][1], "tragedyCell.png");
				endGame();
				return;
			}
		}

		// Remove last segment, if not eaten an apple
		if (nextPos[0] !== applePos[0] || nextPos[1] !== applePos[1]) {
			var snakePreviousPos = snakePos.shift();
			setCellImg(snakePreviousPos[0], snakePreviousPos[1], "emptyCell.png");
		}

		// Check if crashing
		if (!checkIfIsClear(nextPos[0], nextPos[1])) {
			setCellImg(nextPos[0], nextPos[1], "tragedyCell.png");
			endGame();
			return;
		}
		else {

			snakePos.push(nextPos);

			// If eaten apple, add new one
			if (nextPos[0] === applePos[0] && nextPos[1] === applePos[1])
				setApplePos();

			// Set Cells appearance
			// Head
			setCellImg(nextPos[0], nextPos[1], snakePos.length !== 1 ? "snakeHeadCell.png" : "snakeHeadAndEndCell.png", direction);
			// Tail
			if (snakePos.length > 1) {
				var rot;
				if (snakePos[0][0] + 1 === snakePos[1][0])
					rot = 1;
				else if (snakePos[0][0] - 1 === snakePos[1][0])
					rot = 2;
				else if (snakePos[0][1] + 1 === snakePos[1][1])
					rot = 3;
				else if (snakePos[0][1] - 1 === snakePos[1][1])
					rot = 4;
				setCellImg(snakePos[0][0], snakePos[0][1], "snakeEndCell.png", rot);
			}
			// Cell after head
			if (snakePos.length > 2) {
				// If is straight
				if (snakePos[snakePos.length-3][0] === nextPos[0])
					setCellImg(snakePos[snakePos.length - 2][0], snakePos[snakePos.length -2][1], "snakeCell.png", 3);
				else if (snakePos[snakePos.length -3][1] === nextPos[1])
					setCellImg(snakePos[snakePos.length - 2][0], snakePos[snakePos.length -2][1], "snakeCell.png", 2);
				else {
					// If is a turn
					var rot;
					var pos1 = snakePos[snakePos.length - 1], pos2 = snakePos[snakePos.length - 2], pos3 = snakePos[snakePos.length - 3];
					if ((pos1[0] + 1 === pos2[0] || pos3[0] + 1 === pos2[0]) && (pos1[1] + 1 === pos2[1] || pos3[1] + 1 === pos2[1]))
						rot = 3;
					else if ((pos1[0] - 1 === pos2[0] || pos3[0] - 1 === pos2[0]) && (pos1[1] + 1 === pos2[1] || pos3[1] + 1 === pos2[1]))
						rot = 2;
					if ((pos1[0] + 1 === pos2[0] || pos3[0] + 1 === pos2[0]) && (pos1[1] - 1 === pos2[1] || pos3[1] - 1 === pos2[1]))
						rot = 1;
					else if ((pos1[0] - 1 === pos2[0] || pos3[0] - 1 === pos2[0]) && (pos1[1] - 1 === pos2[1] || pos3[1] - 1 === pos2[1]))
						rot = 4;
					setCellImg(snakePos[snakePos.length - 2][0], snakePos[snakePos.length -2][1], "snakeCornerCell.png",rot);
				}
					
			}
		}
	}, 10000/gameSpeed);
};
