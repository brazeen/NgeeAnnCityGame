const grid = document.getElementById("game-grid")
const coinLabel = document.getElementById("coins")
var coins = 16
updateCoins()
const gridSize = [20,20]
const buildings = {
    "residential": [1,1],
    "industry": [2,1]
}

//generate the spots with coordinates as their id
//also initialise a 2d array
const gridData = []
for (var y = 0; y < gridSize[0]; y++){
    var row = []
    for (var x = 0; x < gridSize[1]; x++){
        grid.innerHTML += `
        <div class = "grid-spot" id = "${x},${y}" ondrop="drop(event)" ondragover="allowDrop(event)" ondragenter="spotDragEnter(event)" ondragleave="spotDragLeave(event)"></div>
        `
        row.push("")
    }
    gridData.push(row)
}

function placeBuilding(type, x, y){
    const spot = document.getElementById(`${x},${y}`)
    //display image in spot
    spot.innerHTML = `<img src="./assets/${type}.png" width="100%" draggable = "false"></img>`
    //add class
    spot.classList.add(type)
    //reset background color
    spot.style.backgroundColor = ""
    //update grid data
    gridData[y][x] = type
    //update coins
    updateCoins(-1)
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
    const data = ev.dataTransfer.getData("building")
    const img = document.getElementById(data);
    const type = img.getAttribute("data-type");
    const targetId = ev.target.id;
    const [x, y] = targetId.split(',').map(Number);
    placeBuilding(type, x, y);
    generateRandomBuilding()
}

//change backrgound colour when drag is hovered over tile
function spotDragEnter(event){
    event.target.style.backgroundColor = "lightblue"
}

function spotDragLeave(event){
    event.target.style.backgroundColor = ""
}

function updateCoins(value = 0){
    coins += value
    console.log(coins)
    coinLabel.innerText = coins
}
function calculateScore(){

}

generateRandomBuilding()