const grid = document.getElementById("game-grid")

const gridSize = [20,20]

for (var x = 0; x < gridSize[0]; x++){
    for (var y = 0; y < gridSize[1]; y++){
        grid.innerHTML += `
        <div class = "grid-spot" id = "${x},${y}"></div>
        `
    }
}