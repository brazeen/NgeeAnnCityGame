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
        <div class = "grid-spot" id = "${x},${y}" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
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

function generateRandomBuilding(){
    //list of png names
    let typeList = ["commercial", "industry", "residential", "park", "road"]
    let choice1 = Math.floor(Math.random() * 5)
    let choice2 = Math.floor(Math.random() * 5)
    while (choice2 == choice1 ) {
        //if choice is the same, change one to make it different
        choice2 = Math.floor(Math.random() * 5)
    }
    choice1 = typeList[choice1]
    choice2 = typeList[choice2]
    const randomdiv1 = document.getElementById('randombuilding-1')
    const randomdiv2 = document.getElementById('randombuilding-2')
    randomdiv1.innerHTML = `<img src="./assets/${choice1}.png" width="100%" draggable="true" ondragstart="drag(event)" id="building1" data-type="${choice1}"></img>`
    randomdiv2.innerHTML = `<img src="./assets/${choice2}.png" width="100%" draggable="true" ondragstart="drag(event)" id="building2" data-type="${choice2}"></img>`
}

//allow dropping on grid spots
function allowDrop(ev) {
    ev.preventDefault();
}

//handle drag event
function drag(ev) {
    ev.dataTransfer.setData("building", ev.target.id);
}

//handle drop event
function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("building");
    const img = document.getElementById(data);
    const type = img.getAttribute("data-type");
    const targetId = ev.target.id;
    const [x, y] = targetId.split(',').map(Number);
    placeBuilding(type, x, y);
    generateRandomBuilding()
}

generateRandomBuilding()
placeBuilding("road",1,1)   
placeBuilding("road",1,2)
placeBuilding("road",1,3)