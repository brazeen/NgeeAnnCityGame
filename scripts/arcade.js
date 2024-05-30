const grid = document.getElementById("game-grid")

const gridSize = [20,20]
const buildings = {
    "residential": [1,1],
    "industry": [2,1]
}

//generate the spots with coordinates as their id
for (var y = 0; y < gridSize[0]; y++){
    for (var x = 0; x < gridSize[1]; x++){
        grid.innerHTML += `
        <div class = "grid-spot" id = "${x},${y}"></div>
        `
    }
}

function placeBuilding(type, x, y){
    const spot = document.getElementById(`${x},${y}`)
    //display image in spot
    spot.innerHTML = `<img src="./assets/${type}.png" width="100%"></img>`
    //add class
    spot.classList.add(type)
}

placeBuilding("road",1,1)
placeBuilding("road",1,2)
placeBuilding("road",1,3)