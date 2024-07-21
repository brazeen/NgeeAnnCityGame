//description for each tutorial
const desc = [
    ["Welcome!","Welcome to Freeplay Mode! In this game, you build a city to score as many points as possible"],
    ["Building","To build buildings, drag one from the top onto the board. Building costs 1 coin"],
    ["Building","You can build buildings anywhere"],
    ["Building","Each building has different criterias for scoring, coin generation and upkeep cost. Hover over it to find out more"],
    ["Grid Expansion","Building a building on the edge of the grid will expand it by 5 tiles in each direction"],
    ["Demolish","You can demolish buildings by dragging the bulldozer over the building you want to remove. Demolishing costs 1 coin"],
    ["Thats it!","Score as many points as you can! The game ends when your city makes a loss 20 turns in a row. Good luck!"],

]
var currPage = 1
const maxPage = desc.length

const tutorialHTML = document.getElementById("tutorial")
const pageLabel = document.querySelector("#tutorial #page-no")
const imgDisplay = document.querySelector("#tutorial img")
const tutorialDesc = document.querySelector("#tutorial .description")
const tutorialTitle = document.querySelector("#tutorial #title")

document.querySelector("#tutorial #page-max").innerText = maxPage
tutorialHTML.style.display = "flex"

//show the page's contents
function displayPage(){
    pageLabel.innerText = currPage
    tutorialTitle.innerText = desc[currPage-1][0]
    tutorialDesc.innerText = desc[currPage-1][1]
    imgDisplay.src = `./assets/tutorial/freeplay/${currPage}.png`
}

//navigation between pages
function tutorialNext(){
    currPage += 1
    //check if last page is reached, if so then go back to page 1
    if (currPage > maxPage) currPage = 1
    displayPage()
}

function tutorialBack(){
    currPage -= 1
    //check if first page is reached, if so then disable (dont go back to first page)
    if (currPage < 1){
        currPage = 1
        return
    }
    displayPage()
}

function tutorialClose(){
    tutorialHTML.style.display = "none"
}

displayPage()