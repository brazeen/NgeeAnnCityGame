const grid = document.getElementById("game-grid")

const gridSize = [20,20]
const buildings = {
    "residential": [1,1],
    "industry": [2,1]
}

for (var y = 0; y < gridSize[0]; y++){
    for (var x = 0; x < gridSize[1]; x++){
        grid.innerHTML += `
        <div class = "grid-spot" id = "${x},${y}"></div>
        `
    }
}

function placeBuilding(type, x, y){
    document.getElementById(`${x},${y}`).innerHTML = `<img src="./assets/${type}.png" width="100%"></img>`
}

placeBuilding("road",1,1)
placeBuilding("road",1,2)
placeBuilding("road",1,3)