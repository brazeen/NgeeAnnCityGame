const grid = document.getElementById("game-grid")
const coinLabel = document.getElementById("coins")
const scoreLabel = document.getElementById("score")
const gameoverpopup = document.getElementById("gameover-popup")
const finalScore = document.getElementById("finalscore")
const turnNumber = document.getElementById("turn")
const saveGamePopup = document.getElementById("savegame-popup")
const repeatFile = document.getElementById("repeat-file")
const initialsPopup = document.getElementById("initials-popup")
const tooltip = document.getElementById("tooltip")

//to test, i set to 2
var coins = 16
var turns = 1
var score = 0
var isGameOver = false
var action = ""
updateCoins()
var gridSize = [5,5]
var buildingCount = 0 //track number buildings so we know when all tiles are filled
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
for (var y = 0; y < gridSize[0]; y++){
    var gridRow = []
    for (var x = 0; x < gridSize[1]; x++){
        gridRow.push({})
    }
    gridData.push(gridRow)
}

var lastSave = createSaveObj() //store previous save data

//load game
var playSave = localStorage.getItem("playSave")
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
}

//return the offset to convert coords to regular array indexing
//return an array [xOffset, yOffset]

function getGridOffset(){
    return gridSize.map(x => parseInt((x-1)/2))
}
//return an array for the top left and bottom right coordinates
//[x1,y1,x2,y2]
function getGridBounding(){
    //bottom right coordinates
    const [x2,y2] = getGridOffset()
    //upper left coordinates
    const x1 = x2*-1
    const y1 = y2*-1
    return [x1,y1,x2,y2]
}
//return the obj of the building at the grid spot
//we need this because of negative coords
//accept negative coord system
function getGrid(x,y){
    const xInt = parseInt(x)
    const yInt = parseInt(y)
    const [xOffset, yOffset] = getGridOffset()
    return gridData[yInt+yOffset][xInt+xOffset]
}

//delete the contents of the grid and rebuild it
function renderGrid(){
    grid.innerHTML = ""
    //set the grid's size
    grid.style.gridTemplateColumns = `repeat(${gridSize[0]},4.375rem)`
    grid.style.gridTemplateRows = `repeat(${gridSize[1]},4.375rem)`
    //also update the width of the whole grid
    grid.style.width = `min(100%,calc((4.375rem * ${gridSize[0]}) + 18px))`

    //get bounding ccoordinates
    const [xStart, yStart, xEnd, yEnd] = getGridBounding()
    //implement the fastest way to add elements to DOM
    //this is done by creating elements, appending them to a document fragment and adding the document fragment to the grid at the end
    //https://howchoo.com/javascript/learn-the-slow-and-fast-way-to-append-elements-to-the-dom/
    let fragment = document.createDocumentFragment();
    for (let y = yStart; y <= yEnd; y++){
        for (let x = xStart; x <= xEnd; x++){
            //create tile element
            let e = document.createElement("div")
            e.className = "grid-spot"
            e.id = `${x},${y}`
            e.addEventListener("drop",drop)
            e.addEventListener("dragover",allowDrop)
            e.addEventListener("dragenter", spotDragEnter)
            e.addEventListener("dragleave", spotDragLeave)
            fragment.appendChild(e)

            //render buildings
            //spot.innerHTML = `<img src="./assets/${type}.png" width="100%" draggable = "false" onmouseover="showPlacedTooltip(this)" onmouseleave="hideTooltip()"></img>`
            if (getGrid(x,y).type){
                let imge = document.createElement("img")
                imge.src = `./assets/${getGrid(x,y).type}.png`
                imge.style.width = "100%"
                imge.setAttribute("draggable", false)
                //use a regular function, arrow functions dont allow for 'this' keyword
                imge.addEventListener("mouseover", function(evt) {
                    showPlacedTooltip(this)
                })
                imge.addEventListener("mouseleave", (evt) => hideTooltip())
                //add it to the tile
                e.appendChild(imge)
            }
        }
    }
    grid.appendChild(fragment)
}

renderGrid()

const buildingDesc = {
    residential: "Next to industry: 1point (max)\nNext to residential/commercial: 1 point\nNext to park: 2 points",
    industry: "Per industry in city: 1 point\nNext to residential: 1 coin/turn",
    commercial: "Next to commercial: 1 point\nNext to residential: 1 coin/turn",
    park: "Next to park: 1 point",
    road: "Per road in a row: 1 point",
}

//show tooltip for placed buildings
function showPlacedTooltip(e){
    //display building name, score value, coin generation
    //get the parent's element to get the x and y value
    const parentEle = e.parentElement
    const [xPos,yPos] = parentEle.id.split(",")
    const {type,score, coins} = getGrid(xPos,yPos)
    //display tooltip horizontally-centered, bottom of the building img
    const rect = e.getBoundingClientRect()
    const startY = (rect.top + rect.height)*1.01 //Y position to plasce the tooltip
    const startX = rect.left-(tooltip.offsetWidth-e.offsetWidth)/2 //center it horizontally based on the element

    tooltip.style.visibility = "visible"
    const tooltipContent = `${type}\nScore Value: ${score}\nCoins per turn:${coins}`
    tooltip.innerHTML = tooltipContent.replaceAll("\n","<br>")

    //check if tooltip is so low that it goes below the screen
    if ((startY + tooltip.offsetHeight) > window.innerHeight){
        //display tooltip above instead
        tooltip.style.top = `${(rect.top - tooltip.offsetHeight)*0.99}px`
    }
    else{
        //display tooltip below
        tooltip.style.top = `${(startY)*1.01}px`
    }

    //check if tooltip is too far to the right/left and gets cut off
    if (startX < 0){
        //too far to the right
        tooltip.style.left = `${rect.left}px`
    }else if (startX+tooltip.offsetWidth > window.innerWidth){
        tooltip.style.left = `${rect.left - e.offsetWidth}px`
    }else {
        tooltip.style.left = `${startX}px` //center it horizontally based on the element
    }

}

//show tooltips for random buildings
function showRandomTooltip(e){
    const rect = e.getBoundingClientRect()

    //display tooltip horizontally-centered, bottom of the building img
    tooltip.style.top = `${(rect.top + rect.height)*1.05}px`
    tooltip.style.visibility = "visible"
    const type = e.dataset.type
    const tooltipContent = `${type}\n${buildingDesc[type]}`
    tooltip.innerHTML = tooltipContent.replaceAll("\n","<br>")
    tooltip.style.left = `${rect.left-(tooltip.offsetWidth-e.offsetWidth)/2}px` //center
}

function hideTooltip(){
    tooltip.style.visibility = "hidden"
}

function placeBuilding(type, x, y){
    const spot = document.getElementById(`${x},${y}`)
    //display image in spot
    spot.innerHTML = `<img src="./assets/${type}.png" width="100%" draggable = "false" onmouseover="showPlacedTooltip(this)" onmouseleave="hideTooltip()"></img>`
    //add class
    spot.classList.add(type)
    //reset background color
    spot.style.backgroundColor = ""
    //update grid data
    getGrid(x,y).type = type
    buildingCount += 1
}

function destroyBuilding(x,y){
    const spot = document.getElementById(`${x},${y}`)
    const type = getGrid(x,y).type
    //remove image in spot
    spot.innerHTML = ``
    //add class
    spot.classList.remove(type)
    //reset background color
    spot.style.backgroundColor = ""
    //update grid data
    getGrid(x,y) = {}
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
    randomdiv1.innerHTML = `<img src="./assets/${choice1}.png" width="100%" draggable="true" ondragstart="drag(event)" id="building1" data-type="${choice1}" onmouseover="showRandomTooltip(this)" onclick="hideTooltip()" onmouseleave="hideTooltip()"></img>`
    randomdiv2.innerHTML = `<img src="./assets/${choice2}.png" width="100%" draggable="true" ondragstart="drag(event)" id="building2" data-type="${choice2}" onmouseover="showRandomTooltip(this)" onclick="hidemTooltip()" onmouseleave="hideTooltip()"></img>`
}

//return a array containing all buildings with their coordinates in a area specified by relativeCoords
//TODO: return building obj instead of just type
function getSurrounding(x,y, relativeCoords){
    const [xStart, yStart, xEnd, yEnd] = getGridBounding()
    if (y === undefined || x  === undefined) return null //spot is already occupied
    var out = []
    for (i in relativeCoords){
        const tileY = relativeCoords[i][0] + y
        const tileX = relativeCoords[i][1] + x
        //check for out-of-bounds search
        if (tileY < yStart || tileX < xStart || tileY > yEnd || tileX > xEnd) continue
        if (getGrid(tileX,tileY).type) out.push(getGrid(tileX,tileY).type)
    }
    return out
}

function calculateScore(x,y,type){
    var finalScore = 0
    var finalCoins = 0
    const adjRelativeCoords = [[0,1],[0,-1],[1,0],[-1,0],[1,-1],[1,1],[-1,1],[-1,-1]] //relative coordinates of adjacent tiles
    //buildings that use adjacent scoring
    if (type in adjBuildingScores){
        const buildingData = adjBuildingScores[type]
        const surroundBuildings = getSurrounding(x,y,adjRelativeCoords)
        let exitLoop = false
        //search for surrounding buildings that meet the database
        for (i in buildingData){
            data = buildingData[i]
            for (j in surroundBuildings){
                if (data[0] == surroundBuildings[j]){
                    if (data[2]){ //check if the "only" constrain is true, limit the score no matter the surrounding buiildings
                        finalScore = data[1]
                        //stop evaluating anymore buildings
                        exitLoop = true
                        break
                    }
                    finalScore += data[1]
                }
            }
            if (exitLoop) break
        }

        //gernerate coin for commercial
        if (type == "commercial"){
            for (i in surroundBuildings){
                if (surroundBuildings[i] == "residential"){
                   finalCoins += 1
                }
            }
        }

    }else if (type == "industry"){
        finalScore = 1
        //generate coins
        const surroundBuildings = getSurrounding(x,y,adjRelativeCoords)
        for (i in surroundBuildings){
            if (surroundBuildings[i] == "residential"){
               finalCoins = 1
            }
        }
    }else if (type == "road"){
        const rowRelativeCoords = [[0,1],[0,-1],[1,0],[-1,0]]
        const rowBuildings = getSurrounding(x,y,rowRelativeCoords)
        finalScore = rowBuildings.filter(x => x === "road").length
        
    }
    updateCoins(finalCoins)
    return {score: finalScore, coins:finalCoins}
}

//allow dropping on grid spots
function allowDrop(ev) {
    if (isGameOver) return;
    ev.preventDefault();
}

//handle drag event
function drag(ev) {
    action = "build"
    hideTooltip()
    ev.dataTransfer.setData("building", ev.target.id);
}

function destroyDrag(event){
    action = "destroy"
}

function newTurn(){
    //recalculates score and generate coins
    score = 0
    const [xStart, yStart, xEnd, yEnd] = getGridBounding()
    for (var y = yStart; y < yEnd + 1; y++){
        for (var x = xStart; x < xEnd + 1; x++){
            let spotData = getGrid(x,y)
            const type = spotData.type
            if (type){
                const scoreInfo = calculateScore(x,y,type)
                score += scoreInfo.score
                spotData = Object.assign(spotData,scoreInfo)
            }
        }
    }

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
        placeBuilding(type, x, y);
        const [xStart, yStart, xEnd, yEnd] = getGridBounding()
        //check if built on border and expand
        if (x == xStart || x == xEnd || y == yStart || y == yEnd){
            gridSize = gridSize.map(x => x+10)
            //also update gridData by adding blank spots
            //right and left

            const length = gridData.length
            for (let i = 0; i < length; i++) { 
                //for each row, add 5 empty elements at the front and back
                for(let j = 0; j < 5; j++){
                    gridData[i].push({});
                    gridData[i].unshift({});
                }
            }

            //top and bottom
            //get length of a row
            const rowLength = gridSize[0]
            //create the row to add
            const rowToAdd = []
            for (let i = 0; i < rowLength; i++){
                rowToAdd.push({})
            }
            //finally, add the rows to gridData
            for (let i = 0; i < 5; i++) { 
                gridData.push(rowToAdd);
                gridData.unshift(rowToAdd);
            }
            //remove references
            gridData = JSON.parse(JSON.stringify(gridData));

            renderGrid()
        }
        //update coin
        updateCoins(-1)
        newTurn()
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

function checkIfGameOver() {
    // Check for game end
    if (coins < 1 || buildingCount == gridSize[0] * gridSize[1]) {
      isGameOver = true;
  
      let lblist = localStorage.getItem("arcadeLeaderboard");
      if (!lblist) {
        lblist = [];
      } else {
        lblist = JSON.parse(lblist);
      }
  
      // Update leaderboard and store after update
      updateLeaderboard(score, lblist);
      
  
      // Delete save file (optional)
      const saveInput = document.getElementById("sname").value;
      if (saveInput) {
        localStorage.removeItem(`${saveInput}-save`);
      } else if (playSave) {
        localStorage.removeItem(`${playSave}-save`);
      }
  
      // Display game over popup
      gameoverpopup.style.display = "flex";
      finalScore.innerText = score;
    }
  }
  
  function updateLeaderboard(score, leaderboard) {
    // Ensure leaderboard array has at most 10 elements
    if (leaderboard.length > 10) {
        leaderboard = leaderboard.slice(0, 10);
    }

    // Check if the score is higher than the score in the tenth place
    if (leaderboard.length < 10 || score > leaderboard[leaderboard.length - 1]?.score) {
        initialsPopup.style.display = "flex";

        // Add a one-time event listener for the form submission
        document.getElementById('initialsForm').addEventListener('submit', function onSubmit(event) {
            event.preventDefault(); // Prevent default form submission
            initialsPopup.style.display = "none";

            // Perform any action with the submitted initials here
            const initials = document.getElementById('initials').value;
            console.log(initials);
            const newEntry = { name: initials, score: score };

            // Insert the new entry and sort immediately (regardless of length)
            leaderboard.push(newEntry);
            leaderboard.sort((a, b) => b.score - a.score);

            // If the array now has more than 10 elements, remove the last one
            if (leaderboard.length > 10) {
                leaderboard.pop();
            }

            // Update local storage with the new leaderboard
            localStorage.setItem("arcadeLeaderboard", JSON.stringify(leaderboard));

            // Clean up event listener to prevent memory leaks
            document.getElementById('initialsForm').removeEventListener('submit', onSubmit);
        }); // Ensure the event listener is triggered only once
    }
}

  
  


var saveType = "normal"

function cancelSave(){
    //hide the popup and execute post save action (leave sit, exit to main menu)
    saveGamePopup.style.display='none'
    lastSave = createSaveObj() //trick alreadySaved() function to return true
    executePostSave()
}

function executePostSave(){
    //hide all popups and execute the user's action after saving
    repeatFile.style.display = "none"
    document.getElementById('save-success').style.display = 'none'
    console.log(saveType)
    if(saveType == "exit"){ //exit to main menu
        window.location='./index.html'
    }
}

function displaySaveGame(type = "normal"){
    if (type != "none") saveType = type
    console.log(lastSave)
    if (type == "exit" && alreadySaved()){
        executePostSave()
        return
    }
    if (playSave != null){
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
        gridData: gridData,
    }
}

//check if the user has already saved
const alreadySaved = () => shallowEqual(lastSave, createSaveObj())

function updateSave(){
    const saveData = createSaveObj()
    localStorage.setItem(`${playSave}-save`, JSON.stringify(saveData))
    lastSave = saveData
    //show success message
    if (saveType == "exit"){
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
    playSave = sname
    updateSave()
    saveGamePopup.style.display = "none"
    repeatFile.style.display = "none"

}


const beforeUnloadHandler = (event) => {
    //if user has not saved game, prompt them to save
    if (!alreadySaved() && !isGameOver){
        event.preventDefault()
        displaySaveGame("leave")
    }
}

window.addEventListener("beforeunload", beforeUnloadHandler)


function setGridHeight() {
    //set the game grid height's to the bottom of the screen
    //grid height = window height - y position of grid
    const gridY = grid.getBoundingClientRect().top
    grid.style.height = `${(window.innerHeight*0.98 - gridY)}px`
}
setGridHeight() //set height on load
window.onresize = setGridHeight; //set height everytime window is resized

generateRandomBuilding()
