const grid = document.getElementById("game-grid")
const coinLabel = document.getElementById("coins")
const scoreLabel = document.getElementById("score")
const gameoverpopup = document.getElementById("gameover-popup")
const finalScore = document.getElementById("finalscore")
const turnNumber = document.getElementById("turn")
const saveGamePopup = document.getElementById("savegame-popup")
const repeatFile = document.getElementById("repeat-file")


var coins = 16
var turns = 1
var score = 0
var isGameOver = false
var action = ""
updateCoins()
const gridSize = [20,20]
var buildingCount = 0 //track number buildings so we know when all tiles are filled
var lastSave = null //check if user has saved game
const buildings = {
    "residential": [1,1],
    "industry": [2,1]
}


const adjBuildingScores = { //only store scoring data for buildings that have scores based on adjacent buildings
    "residential": [
        ["industry", 1, true], 
        ["residential", 1, false], 
        ["commercial", 1, false], 
        ["park", 2, false]
    ],
    "commercial": [
        ["commercial", 1, false]
    ],
    "park": [
        ["park",1, false]
    ]
}

//generate the spots with coordinates as their id
//also initialise the 2d arrays
var gridData = [] //store the buildings on the grid
var scoreData = [] //store the score of the buildings on the grid
for (var y = 0; y < gridSize[0]; y++){
    var gridRow = []
    var scoreRow = []
    for (var x = 0; x < gridSize[1]; x++){
        grid.innerHTML += `
        <div class = "grid-spot" id = "${x},${y}" ondrop="drop(event)" ondragover="allowDrop(event)" ondragenter="spotDragEnter(event)" ondragleave="spotDragLeave(event)"></div>
        `
        gridRow.push("")
        scoreRow.push(0)
    }
    gridData.push(gridRow)
    scoreData.push(scoreRow)
}

//load game
const playSave = localStorage.getItem("playSave")
if (playSave != null){
    const save = JSON.parse(localStorage.getItem(`${playSave}-save`))
    lastSave = save
    coins = save.coins
    turns = save.turn
    score = save.score
    gridData = save.gridData
    //update html elements
    coinLabel.innerText = coins
    scoreLabel.innerText = score
    turnNumber.innerText = turns
    for (var y = 0; y < gridData.length; y++){
        for (var x = 0; x < gridData[0].length; x++){
            if (gridData[y][x]) placeBuilding(gridData[y][x],x,y)
        }
    }

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
    buildingCount += 1
}

function destroyBuilding(x,y){
    const spot = document.getElementById(`${x},${y}`)
    const type = gridData[y][x]
    //remove image in spot
    spot.innerHTML = ``
    //add class
    spot.classList.remove(type)
    //reset background color
    spot.style.backgroundColor = ""
    //update grid data
    gridData[y][x] = ""
    updateCoins(-1)
    buildingCount -= 1
}

function generateRandomBuilding(){
    if (isGameOver) return;
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

//return a array containing all buildings with their coordinates in a area specified by relativeCoords
function getSurrounding(x,y, relativeCoords){
    if (y === undefined || x  === undefined) return null //spot is already occupied
    var out = []
    for (i in relativeCoords){
        const tileY = relativeCoords[i][0] + y
        const tileX = relativeCoords[i][1] + x
        //check for out-of-bounds search
        if (tileY < 0 || tileX < 0 || tileY == gridSize[0] || tileX == gridSize[1]) continue
        if (gridData[tileY][tileX]) out.push(gridData[tileY][tileX])
    }
    return out
}

function calculateScore(x,y,type){
    var finalScore = 0
    const adjRelativeCoords = [[0,1],[0,-1],[1,0],[-1,0],[1,-1],[1,1],[-1,1],[-1,-1]] //relative coordinates of adjacent tiles
    //buildings that use adjacent scoring
    if (type in adjBuildingScores){
        const buildingData = adjBuildingScores[type]
        const surroundBuildings = getSurrounding(x,y,adjRelativeCoords)
        //search for surrounding buildings that meet the database
        for (i in buildingData){
            data = buildingData[i]
            for (j in surroundBuildings){
                if (data[0] == surroundBuildings[j]){
                    if (data[2]) return data[1]
                    finalScore += data[1]
                }
            }
        }

        //gernerate coin for commercial
        if (type == "commercial"){
            for (i in surroundBuildings){
                if (surroundBuildings[i] == "residential"){
                   updateCoins(1)
                }
            }
        }

    }else if (type == "industry"){
        finalScore = 1
        //generate coins
        const surroundBuildings = getSurrounding(x,y,adjRelativeCoords)
        for (i in surroundBuildings){
            if (surroundBuildings[i] == "residential"){
               updateCoins(1)
            }
        }
    }else if (type == "road"){
        const rowRelativeCoords = [[0,1],[0,-1],[1,0],[-1,0]]
        const rowBuildings = getSurrounding(x,y,rowRelativeCoords)
        for (i in rowBuildings){
            //check if its connected to another road
            if (rowBuildings[i] == "road"){
                finalScore = 1
                break
            }
        }
    }
    return finalScore
}

//check if place tile is connected to another building
function canPlace(x,y){
    //building can be placed anywhere
    if (!buildingCount) return true
    //spot is already occupied 
    if (y === undefined || x  === undefined) return false
    const relativeTiles = [[0,1],[0,-1],[1,0],[-1,0]] //relative coordinates of orthogonal tiles
    return getSurrounding(x,y, relativeTiles).length
}

//allow dropping on grid spots
function allowDrop(ev) {
    if (isGameOver) return;
    ev.preventDefault();
}

//handle drag event
function drag(ev) {
    action = "build"
    ev.dataTransfer.setData("building", ev.target.id);
}

function destroyDrag(event){
    action = "destroy"
}

function newTurn(){
    scoreLabel.innerHTML = score
    turns += 1
    turnNumber.innerText = turns
    generateRandomBuilding()
    checkIfGameOver()
}

//handle drop event
function drop(ev) {
    ev.preventDefault();
    if (action == "build"){
        const targetId = ev.target.id
        const [x, y] = targetId.split(',').map(Number);

        const data = ev.dataTransfer.getData("building")
        const img = document.getElementById(data);
        const type = img.getAttribute("data-type");
        if (!canPlace(x,y)) return
        placeBuilding(type, x, y);
        score += calculateScore(x,y,type)
        scoreData[y][x] = score
        newTurn()
        //update coin
        updateCoins(-1)
    }else{
        const targetId = ev.target.parentElement.id
        const [x, y] = targetId.split(',').map(Number);
        if (x == undefined || y == undefined) return
        destroyBuilding(x,y)
        newTurn()
    }
    
}

//change backrgound colour when drag is hovered over tile
function spotDragEnter(event){
    const [x, y] = event.target.id.split(',').map(Number)
    if (action == "destroy"){
        if (y != undefined && x != undefined) return
        event.target.style.backgroundColor = "red"
    }else{
        if (!canPlace(x,y)) return
        event.target.style.backgroundColor = "lightblue"
    }
}

function spotDragLeave(event){
    event.target.style.backgroundColor = ""
}

function updateCoins(value = 0){
    coins += value
    coinLabel.innerText = coins
}

function checkIfGameOver(){
    //check for game end
    if (coins == 0 || buildingCount == gridSize[0]*gridSize[1]){
        
        gameoverpopup.style.display = "flex"
        finalScore.innerText = score
        isGameOver = true
    }
}


var saveType = "normal"

function executePostSave(){
    repeatFile.style.display = "none"
    document.getElementById('save-success').style.display = 'none'
    console.log(saveType)
    if(saveType == "exit"){
        window.location='./index.html'
    }
}

function displaySaveGame(type = "normal"){
    if (type != "none") saveType = type
    if (lastSave){
        updateSave()
        return
    }
    saveGamePopup.style.display = "flex"
    repeatFile.style.display = "none"
    if (type == "leave" || type == "exit") document.getElementById("save-game").innerText += "?"
}

//check if the content of 2 objects are the same
function shallowEqual(object1, object2) {
    if (object1 == null || object2 == null) return false
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);
  
    if (keys1.length !== keys2.length) {
      return false;
    }
  
    for (let key of keys1) {
      if (object1[key] !== object2[key]) {
        return false;
      }
    }
  
    return true;
  }

function createSaveObj(){
    return {
        type: "arcade",
        turn: turns,
        coins: coins,
        score: score,
        gridData: gridData
    }
}

//check if the user has already saved
const alreadySaved = () => shallowEqual(lastSave, createSaveObj())

function updateSave(name){
    const saveData = createSaveObj()
    localStorage.setItem(`${name}-save`, JSON.stringify(saveData))
    lastSave = saveData
    //show success message
    if (saveType == "exit" && alreadySaved()){
        executePostSave()
        return
    }
    document.getElementById("save-success").style.display = "flex"
}

function saveGame(override = false){
    //get save file name
    const sname = document.getElementById("sname").value
    if (!sname) return
    //update list of save files
    //if saveFiles storage doesnt exist, assign an empty array
    saveFiles = (localStorage.getItem("saveFiles") == null)? [] : JSON.parse(localStorage.getItem("saveFiles"))
    //check if save file already exists
    if (saveFiles.includes(sname)){
        if (!override){
            saveGamePopup.style.display = "none"
            repeatFile.style.display = "flex"
            document.getElementById("repeat-title").innerText = `Another save file with the name ${sname} has been found. Do you want to override it?`
            return
        }
    }else{
        saveFiles.push(sname)
    }
    localStorage.setItem("saveFiles", JSON.stringify(saveFiles))
    updateSave(sname)
    saveGamePopup.style.display = "none"
    repeatFile.style.display = "none"

}


const beforeUnloadHandler = (event) => {
    //if user has not saved game, prompt them to save
    if (!alreadySaved()){
        event.preventDefault()
        console.log("hi")
        displaySaveGame("leave")
    }
}

window.addEventListener("beforeunload", beforeUnloadHandler)

generateRandomBuilding()