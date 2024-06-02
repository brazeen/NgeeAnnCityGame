const grid = document.getElementById("game-grid")
const coinLabel = document.getElementById("coins")
var coins = 16
var turns = 1
var placedOneBuilding = false
var score = 0
updateCoins()
const gridSize = [20,20]
const buildings = {
    "residential": [1,1],
    "industry": [2,1]
}


const adjBuildingScores = { //only store scoring data for buildings that have scores based on adjacent buildings
    "residential": [
        ["industry", 1, true], 
        ["residential", 1, false], 
        ["commercial", 1, false], 
        ["park", 2, false]],
    "commercial": [
        ["commercial", 1, false]
    ],
    "park": [
        ["park",1, false]
    ]
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

//return a array containing all buildings in a 3x3 area (exclduing the target coords)
function getAdjacent(type, x,y){
    if (turns == 1) return ""
    if (y === undefined || x  === undefined) return null //spot is already occupied
    const adjTiles = [[0,1],[0,-1],[1,0],[-1,0],[1,-1],[1,1],[-1,1],[-1,-1]] //relative coordinates of adjacent tiles
    var valid = false
    const adjBuilding = type in adjBuildingScores
    var out = 0
    for (i in adjTiles){
        const tileY = adjTiles[i][0] + y
        const tileX = adjTiles[i][1] + x
        //check for out-of-bounds search
        if (tileY < 0 || tileX < 0 || tileY == gridSize[0] || tileX == gridSize[1]) continue
        const tile = gridData[tileY][tileX]
        //placeable area
        if (tile){
            valid = true
            //calculate score if applicable
            if (adjBuilding){
                const buildings = adjBuildingScores[type]
                for (i in buildings){
                    const data = buildings[i]
                    if (tile == data[0]){
                        out += data[1]
                        if (data[2]){ //check for "only" condition
                            out = data[1]
                            break
                        }
                    }
                }
            }
        }
        //i love the nests how fun 
    }

    console.log(out)
    return (valid) ? out : null
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
    const targetId = ev.target.id
    const [x, y] = targetId.split(',').map(Number);

    const data = ev.dataTransfer.getData("building")
    const img = document.getElementById(data);
    const type = img.getAttribute("data-type");
    if (getAdjacent(type,x,y) == null) return
    placeBuilding(type, x, y);
    generateRandomBuilding()
    turns += 1
}

//change backrgound colour when drag is hovered over tile
function spotDragEnter(event){
    const [x, y] = event.target.id.split(',').map(Number)
    if (getAdjacent(null,x,y) == null) return
    event.target.style.backgroundColor = "lightblue"
}

function spotDragLeave(event){
    event.target.style.backgroundColor = ""
}

function updateCoins(value = 0){
    coins += value
    coinLabel.innerText = coins
}
function calculateScore(){

}

generateRandomBuilding()