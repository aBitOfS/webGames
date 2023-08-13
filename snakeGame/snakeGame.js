function getRandomInt(max) {
  return Math.floor(Math.random() * max);
};

game = function () {
	var setCellImg = function (i, j, img, rotation) {
		var cell = document.getElementById("cell" + i + "x" + j);
		cell.src = "img/"+img;
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
	
	var mainloop;
	var snakePos;
	var direction = 0;; // 0 - pause, 1 - up, 2 - down, 3 - right, 4 - left
	var previousDirection = 0;
	var firstGame = true;

	return {
		start: function () {
			var mapSize = document.getElementById("mapSize").value;
			var walkThroughWalls = document.getElementById("walkThroughWalls").checked;
			var addBariers = document.getElementById("addBariers").checked;
			var gameSpeed = document.getElementById("gameSpeed").value;

			
			// Table intalisation
			var table = document.getElementById("table");
			
			var gridColumns = "";
			var ihtml = "";
			for (let i = 0; i < mapSize; i++) {
				gridColumns += "100px ";
				ihtml += "<div>";
				for (let j = 0; j < mapSize; j++) {
					ihtml += '<div><img src="img/emptyCell.png" onclick="game.cellClick(' + i
						+ ',' + j + ')" id="cell' + i + "x" + j + '"/></div>';
				}
				ihtml += "</div>";
			}
			table.innerHTML = ihtml;
			table.gridTemplateColumns = gridColumns;
			document.getElementById("game").className = "";
			document.getElementById("startPopup").className = "hidden";
			document.getElementById("barrierContainer").className = (addBariers ? "" : "hidden");

			// Snake initialisation
			snakePos = [[2 + getRandomInt(mapSize - 4), 2 + getRandomInt(mapSize - 4)],];
			setCellImg(snakePos[0][0], snakePos[0][1], "snakeHeadAndEndCell.png");

			// Apples and barriers initialisation
			var applePos = [];
			var bariersPos = [];

			// Apples and barriers processing initialisation
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

			var checkIfIsClear = function (x, y) {
				for (let i = 0; i < snakePos.length; i++)
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
				document.getElementById("apples").innerText = snakePos.length - 1;

				if (addBariers) {
					if (snakePos.length + bariersPos.length + 1 >= mapSize * mapSize)
						endGame();
					var barPos = getClearPos()
					bariersPos.push(barPos);
					setCellImg(barPos[0], barPos[1], "barierCell.png", 2);
					document.getElementById("barriers").innerText = snakePos.length;
				}
			};

			setApplePos();

			// Game functions initialisation
			var fixedValue = function (valueToFix) {
				return (valueToFix + (1 * mapSize)) % mapSize;
			};
			
			var main = function () {
				previousDirection = direction;

				// Set next position
				var nextPos = [snakePos[snakePos.length - 1][0], snakePos[snakePos.length - 1][1]];
				switch (direction) {
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
				if (nextPos[0] >= mapSize || nextPos[0] < 0 || nextPos[1] >= mapSize || nextPos[1] < 0) {
					if (walkThroughWalls) {
						nextPos[0] = fixedValue(nextPos[0]);
						nextPos[1] = fixedValue(nextPos[1]);
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
						if (snakePos[snakePos.length - 3][0] === nextPos[0])
							setCellImg(snakePos[snakePos.length - 2][0], snakePos[snakePos.length - 2][1], "snakeCell.png", 3);
						else if (snakePos[snakePos.length - 3][1] === nextPos[1])
							setCellImg(snakePos[snakePos.length - 2][0], snakePos[snakePos.length - 2][1], "snakeCell.png", 2);
						else {
							// If is a turn
							var rot;
							var pos1 = snakePos[snakePos.length - 1], pos2 = snakePos[snakePos.length - 2], pos3 = snakePos[snakePos.length - 3];

							/*if (((pos1[0] + 1) % mapSize === pos2[0] || (pos3[0] + 1) % mapSize === pos2[0]) && ((pos1[1] + 1) % mapSize === pos2[1] || (pos3[1] + 1) % mapSize === pos2[1]))
								rot = 3;
							else if (((pos1[0] + mapSize - 1) % mapSize === pos2[0] || (pos3[0] + mapSize - 1) % mapSize === pos2[0]) && ((pos1[1] + 1) % mapSize === pos2[1] || (pos3[1] + 1) % mapSize === pos2[1]))
								rot = 2;
							if (((pos1[0] + 1) % mapSize === pos2[0] || (pos3[0] + 1) % mapSize === pos2[0]) && ((pos1[1] + mapSize - 1) % mapSize === pos2[1] || (pos3[1] + mapSize - 1) % mapSize === pos2[1]))
								rot = 1;
							else if (((pos1[0] + mapSize - 1) % mapSize === pos2[0] || (pos3[0] + mapSize - 1) % mapSize === pos2[0]) && ((pos1[1] + mapSize - 1) % mapSize === pos2[1] || (pos3[1] + mapSize - 1) % mapSize === pos2[1]))
								rot = 4;*/
							
							if ((fixedValue(pos1[0] + 1) === pos2[0] || fixedValue(pos3[0] + 1) === pos2[0])
									&& (fixedValue(pos1[1] + 1) === pos2[1] || fixedValue(pos3[1] + 1) === pos2[1]))
								rot = 3;
							else if ((fixedValue(pos1[0] - 1) === pos2[0] || fixedValue(pos3[0] - 1) === pos2[0])
									 && (fixedValue(pos1[1] + 1) === pos2[1] || fixedValue(pos3[1] + 1) === pos2[1]))
								rot = 2;
							if ((fixedValue(pos1[0] + 1) === pos2[0] || fixedValue(pos3[0] + 1) === pos2[0])
									&& (fixedValue(pos1[1] - 1) === pos2[1] || fixedValue(pos3[1] - 1) === pos2[1]))
								rot = 1;
							else if ((fixedValue(pos1[0] - 1) === pos2[0] || fixedValue(pos3[0] - 1) === pos2[0])
									 && (fixedValue(pos1[1] - 1) === pos2[1] || fixedValue(pos3[1] - 1) === pos2[1]))
								rot = 4;
							setCellImg(snakePos[snakePos.length - 2][0], snakePos[snakePos.length - 2][1], "snakeCornerCell.png", rot);
						}

					}
				}
			}

			var endGame = function () {
				clearInterval(mainLoop);
				var all = ((mapSize * mapSize - 1) * ((addBariers ? 1 / 2 : 1)));
				Math.floor(all);
				var progress = (snakePos.length - 1)/all * 100;
				if (snakePos.length + bariersPos.length === mapSize * mapSize) {
					alert("!!!YOU WON!!!");
				}
				else if (progress < 10) {
					switch (getRandomInt(3)) {
						case 0:
							alert("Don't give up! Next time will be better");
							break;
						case 1:
							alert("Every one makes mistatkes, don't worry!");
							break;
						default:
							alert("Try again");
							break;
					}
				}
				else if (progress < 30) {
					if (getRandomInt(2))
						alert("Not so bad");
					else
						alert("Nice work");
				}
				else if (progress < 50) {
					if (getRandomInt(2))
						alert("You have nearly eaten half of the apples!");
					else
						alert("Congratulations! You completed over " + Math.floor(progress) + "%");
				}
				else if (progress < 90) {
					if (getRandomInt(2))
						alert("You're one of the bests (" + Math.floor(progress) + "% compleated)");
					else
						alert("Nearly finished! (" + Math.floor(progress) + "% compleated)");
				}
				else {
					if (getRandomInt(2))
						alert("Next time you will surely won! (" + Math.floor(progress) + "% compleated)");
					else
						alert("There was so close! (" + Math.floor(progress) + "% compleated)");
				}
				game.menu.show();
			};

			if (firstGame) {
				document.body.addEventListener("keydown", function (event) {
					if ((event.key == "s" || event.key == "ArrowDown") && previousDirection != 2)
						direction = 1;
					else if ((event.key == "w" || event.key == "ArrowUp") && previousDirection != 1)
						direction = 2;
					else if ((event.key == "d" || event.key == "ArrowRight") && previousDirection != 4)
						direction = 3;
					else if ((event.key == "a" || event.key == "ArrowLeft") && previousDirection != 3)
						direction = 4;
					else if (event.key == "Escape")
						game.menu.show();
				});
			}

			// Start game
			mainLoop = setInterval(main, 10000 / gameSpeed);
			firstGame = false;
		},
		cellClick: function (x, y) {
			var snakeHeadPos = snakePos[snakePos.length - 1];
			if (direction === 0) {
				if (x === snakeHeadPos[0] && y > snakeHeadPos[1] && previousDirection != 4)
					direction = 3;
				else if (x === snakeHeadPos[0] && y < snakeHeadPos[1] && previousDirection != 3)
					direction = 4;
				else if (x > snakeHeadPos[0] && y === snakeHeadPos[1] && previousDirection != 2)
					direction = 1;
				else if (x < snakeHeadPos[0] && y === snakeHeadPos[1] && previousDirection != 1)
					direction = 2;
			}
			else if (direction === 1 || direction === 2) {
				if (y > snakeHeadPos[1] && previousDirection != 4)
					direction = 3;
				else if (y < snakeHeadPos[1] && previousDirection != 3)
					direction = 4
			}
			else {
				if (x > snakeHeadPos[0] && previousDirection != 2)
					direction = 1;
				else if (x < snakeHeadPos[0] && previousDirection != 1)
					direction = 2;
			}
		},
		menu: {
			show: function () {
				direction = 0;
				var m = document.getElementById("menu")
				if (m.className === "hidden")
					m.className = "";
				else
					m.className = "hidden";
			},
			resume: function () {
				document.getElementById("menu").className = "hidden";
			},
			showHowToPlay: function () {
				alert("Move snake with WSAD or arrows to eat an apple.\mEach time snake eats an apple it get longer, so " +
					"after some time it will get hard to not hit itself, which ends the game.\nYou should also avoid crashing " +
					'with walls or barriers, which you can enable in menu.\nWe suggest turning on "walk through walls" and ' +
					"seting lower speen, if you're begginger.")
			},
			restart: function () {
				game.reset();
				game.start();
			},
		},

		reset: function () {
			clearInterval(mainLoop);
			direction = 0;
			previousDirection = 0;
			document.getElementById("menu").className = "hidden";
			document.getElementById("game").className = "hidden";
			document.getElementById("startPopup").className = "";
		},
	};
}();

