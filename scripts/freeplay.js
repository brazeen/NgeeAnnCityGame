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
const adjRelativeCoords = [[0,1],[0,-1],[1,0],[-1,0],[1,-1],[1,1],[-1,1],[-1,-1]] //relative coordinates of adjacent tiles
const connectRelativeCoords =  [[0,1],[0,-1],[1,0],[-1,0]] //relative coordinates of connected tiles (N-S-E-W)

//to test, i set to 2
var coins = 16
var turns = 1
var score = 0
var isGameOver = false
var action = ""
updateCoins()
var gridSize = [5,5]
var clusterData = {} //store an array of the x,y coords of the buildings associated with a cluster
var clusterCount = 0 //store the number of clusters ever created, used for unique ids
var buildingCount = 0 //track number buildings so we know when all tiles are filled
var lossCount = 0 //number of turns in a row that city is making a loss

//store the relative coordinates of adjacent coords for each building's clustering algorithm
//if a building is not in here, then clustering does not apply for them
const clusterAdjCoords = {
    "residential": adjRelativeCoords,
    "road": connectRelativeCoords
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

//data for coin generation
const coinGenerationData = {
    residential: 1,
    industry: 2,
    commercial: 3,
    park: 0,
    road: 0
}

//this stores the data for buildings that require upkeep individually (not affected by clustering)
const individualUpkeepData = {
    industry: 1,
    commercial: 2,
    park: 1
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
    const {type,score, coins, clusterID,upkeep} = getGrid(xPos,yPos)
    //display tooltip horizontally-centered, bottom of the building img
    const rect = e.getBoundingClientRect()
    const startY = (rect.top + rect.height)*1.01 //Y position to plasce the tooltip
    const startX = rect.left-(tooltip.offsetWidth-e.offsetWidth)/2 //center it horizontally based on the element

    tooltip.style.visibility = "visible"
    //capitalise first letter of type
    let tooltipContent = `${type.charAt(0).toUpperCase()}${type.slice(1)}\nScore Value: ${score}\nCoins per turn: ${coins}`
    //show cluster ID if it has one
    if (clusterID != undefined) tooltipContent += `\nCluster: ${clusterID}`
    if (upkeep) tooltipContent += `\nUpkeep Cost: ${upkeep}`
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

const canPlace = (x,y) => !(y === undefined || x  === undefined)

function placeBuilding(type, x, y){
    const spot = document.getElementById(`${x},${y}`)
    let building = getGrid(x,y)
    //display image in spot
    spot.innerHTML = `<img src="./assets/${type}.png" width="100%" draggable = "false" onmouseover="showPlacedTooltip(this)" onmouseleave="hideTooltip()"></img>`
    //add class
    spot.classList.add(type)
    //reset background color
    spot.style.backgroundColor = ""
    //update grid data
    building.type = type
    
    //check if clustering is required for the building
    if (!(type in clusterAdjCoords)) return
    //apply the build cluster algorithm
    /*
    When a building is placed, checked for adjacent buildings that are the same type as it.
    If there is no building, make a new cluster id
    If there is 1 building, make the cluster id the same as that building's
    If there 2 or more buildings, merge their cluster id together.
    To merge cluster ids, pick one cluster from the object and combine the arrays of the other clusters to it, then delete the other clusters.
     */

    //get only buildings that match its type
    //also no repeated clusters
    const adjBuildings = getSurrounding(x,y,clusterAdjCoords[type]).filter((e,i,arr) => e.type == type && i === arr.findIndex(x => x.clusterID === e.clusterID))

    let clusterID = clusterCount
    if (! adjBuildings.length){
        //create new cluster
        clusterCount ++
        clusterData[clusterID] = []
    } else if (adjBuildings.length === 1){
        clusterID = adjBuildings[0].clusterID
        building.clusterID = clusterID
    } else {
        //merge time!
        const clusters = adjBuildings.map(x => x.clusterID)
        clusterID = clusters[0] //pick any included cluster
        let finalArray = clusterData[clusterID]
        for (let i= 1; i < clusters.length; i++){
            const clusterArr = clusterData[clusters[i]]
            finalArray = finalArray.concat(clusterArr)
            //update the clusterID for the building objs
            clusterArr.forEach(j => {
                [cbx, cby] = j //cluster building x, cluster building y
                getGrid(cbx,cby).clusterID = clusterID
            })
            
            delete clusterData[clusters[i]]//delete the cluster 
        }
        clusterData[clusterID] = finalArray

    }

    building.clusterID = clusterID
    clusterData[clusterID].push([x,y])
    
}

function destroyBuilding(x,y){
    const spot = document.getElementById(`${x},${y}`)
    let building = getGrid(x,y)
    const type = building.type
    //remove image in spot
    spot.innerHTML = ``
    //add class
    spot.classList.remove(type)
    //reset background color
    spot.style.backgroundColor = ""
    //update grid data
    updateCoins(-1)
    //check if clustering applies to the building
    if (!(type in clusterAdjCoords)){
        building = {}
        return
    }

    /* 
    Break the single cluster up into smaller clusters
    Done with DFS searching
    the array of buildings in the cluster are nodes to explore
    if a node is explored, remove it from the prior array
    also have a visited list and stack list to track adjacent nodes to the node we want to explore 
    visited list is an obj for fastest lookup time (tar in obj)
    */

    const [xStart, yStart, xEnd, yEnd] = getGridBounding()
    //get cluster
    const relativeCoords = clusterAdjCoords[type]
    let cluster = clusterData[building.clusterID]
    let visited = {}
    visited[[x,y]] = 1 //add the deleted building to visited so it gets skipped
    //repeat for all nodes
    for (let i = 0; i < cluster.length; i++){
        //check if node is already explored

        if (cluster[i] in visited) continue
        const clusterID = clusterCount
        clusterCount++
        const [snx,sny] = cluster[i]
        //initalise stack for next round of dfs
        let stack = [[snx,sny]]
        let newCluster = [] //store the buildings in the cluster
        //run DFS search to find the cluster
        while (stack.length){
            const e = stack.shift()
            const [nx,ny] = e
            visited[e] = 1
            newCluster.push(e)
            //get adjacent
            for (j in relativeCoords){
                const tileY = relativeCoords[j][0] + ny
                const tileX = relativeCoords[j][1] + nx
                //check for out-of-bounds search
                if (tileY < yStart || tileX < xStart || tileY > yEnd || tileX > xEnd) continue
                //get buildings of the same type and havent been visited
                if (getGrid(tileX,tileY).type == type && !([tileX,tileY] in visited)) stack.push([tileX,tileY])
            }
            getGrid(nx,ny).clusterID = clusterID

        }
        clusterData[clusterID] = newCluster
    }
    delete clusterData[building.clusterID]
    building = {}


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
    choice1 = typeList[4]
    choice2 = typeList[choice2]
    const randomdiv1 = document.getElementById('randombuilding-1')
    const randomdiv2 = document.getElementById('randombuilding-2')
    randomdiv1.innerHTML = `<img src="./assets/${choice1}.png" width="100%" draggable="true" ondragstart="drag(event)" id="building1" data-type="${choice1}" onmouseover="showRandomTooltip(this)" onclick="hideTooltip()" onmouseleave="hideTooltip()"></img>`
    randomdiv2.innerHTML = `<img src="./assets/${choice2}.png" width="100%" draggable="true" ondragstart="drag(event)" id="building2" data-type="${choice2}" onmouseover="showRandomTooltip(this)" onclick="hidemTooltip()" onmouseleave="hideTooltip()"></img>`
}

//return a array containing all buildings with their coordinates in a area specified by relativeCoords
//coordOnly: return the coords of the building instead of the building obj
function getSurrounding(x,y, relativeCoords, coordOnly = false){
    const [xStart, yStart, xEnd, yEnd] = getGridBounding()
    if (y === undefined || x  === undefined) return null //spot is already occupied
    var out = []
    for (i in relativeCoords){
        const tileY = relativeCoords[i][0] + y
        const tileX = relativeCoords[i][1] + x
        //check for out-of-bounds search
        if (tileY < yStart || tileX < xStart || tileY > yEnd || tileX > xEnd) continue
        if (getGrid(tileX,tileY).type){
            if (coordOnly){
                out.push([tileX,tileY])
            }else{
                out.push(getGrid(tileX,tileY))
            }
        }
    }
    return out
}

//return a object of buildings adjacent to each other (connected to the same street)
//key: street (road clusterID)
//value: array of coordinates of buildings in that street
function adjacentBuilder(){
    let out = {}
    //for each cluster of roads
    for (const [k,v] of Object.entries(clusterData)) {
        if (getGrid(v[0]).type != "road") continue
        out[k] = []
        //get the buildings connected to each road in the cluster
        v.forEach(e => {
            const [x,y] = e
            const buildings = getSurrounding(x,y,connectRelativeCoords,true)
            out[k] = out[k].concat(buildings)
        })
    }
    return out

}

function calculateScore(x,y,type){
    var finalScore = 0
    var finalCoins = 0
    //buildings that use adjacent scoring
    if (type in adjBuildingScores){
        const buildingData = adjBuildingScores[type]
        const surroundBuildings = getSurrounding(x,y,adjRelativeCoords)
        let exitLoop = false
        //search for surrounding buildings that meet the database
        for (i in buildingData){
            data = buildingData[i]
            for (j in surroundBuildings){
                if (data[0] == surroundBuildings[j].type){
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

    }else if (type == "industry"){
        finalScore = 1
        //generate coins
        const surroundBuildings = getSurrounding(x,y,adjRelativeCoords)
        for (i in surroundBuildings){
            if (surroundBuildings[i].type == "residential"){
               finalCoins = 1
            }
        }
    }else if (type == "road"){
        const rowBuildings = getSurrounding(x,y,connectRelativeCoords)
        finalScore = rowBuildings.filter(x => x.type === "road").length
        
    }
    return {score: finalScore}
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

function clusterUpkeep(){
    let out = 0
    for (const [k,v] of Object.entries(clusterData)) {
        //get the type of the cluster
        const type = getGrid(...v[0]).type
        if (type == "residential"){
            out += 1
        }else if (type == "road"){
            if (v.length == 1){
                out += 1
                //update upkeep property
                getGrid(...v[0]).upkeep = 1
            }else{
                //update upkeep property
                v.forEach(e => {
                    getGrid(...e).upkeep = 0
                })
            }
        }
    }
    return out
}

function newTurn(){
    //recalculates score and generate coins
    score = 0
    let finalCoins = 0
    const [xStart, yStart, xEnd, yEnd] = getGridBounding()
    for (var y = yStart; y < yEnd + 1; y++){
        for (var x = xStart; x < xEnd + 1; x++){
            let spotData = getGrid(x,y)
            const type = spotData.type
            if (type){
                const scoreInfo = calculateScore(x,y,type)
                score += scoreInfo.score
                finalCoins += coinGenerationData[type]
                let upkeepObj = {upkeep:0}
                //calculate upkeep
                if (type in individualUpkeepData){
                    upkeepObj.upkeep = individualUpkeepData[type]
                    finalCoins -= individualUpkeepData[type]
                }
                spotData = Object.assign(spotData,scoreInfo, {coins: coinGenerationData[type]},upkeepObj)
            }
        }
    }
    //deal with cluster upkeep costs
    finalCoins -= clusterUpkeep()

    //check if city is making a loss
    if (finalCoins < 0){
        lossCount += 1
    } else{
        lossCount = 0
    }
    scoreLabel.innerHTML = score
    turns += 1
    turnNumber.innerText = turns
    updateCoins(finalCoins)
    generateRandomBuilding()
    checkIfGameOver()
}

//handle drop event
function drop(ev) {
    ev.preventDefault();
    if (action == "build"){
        const e = ev.target
        const targetId = e.id
        const [x, y] = targetId.split(',').map(Number);
        if (!canPlace(x,y)) return

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
    const place = canPlace(x,y)
    if (action == "destroy"){
        if (place) return
        event.target.style.backgroundColor = "red"
    }else{
        if (!place) return
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
    // Check for game end with loss
    if (lossCount >= 20){
      isGameOver = true;
  
      let lblist = localStorage.getItem("freeplayLeaderboard");
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
            localStorage.setItem("freeplayLeaderboard", JSON.stringify(leaderboard));

            // Clean up event listener to prevent memory leaks
            document.getElementById('initialsForm').removeEventListener('submit', onSubmit);
            // Ensure the event listener is triggered only once
            gameoverpopup.style.visibility = "visible"; // display gameover popup only when player has submitted their initials
        }); 
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
