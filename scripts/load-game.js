const savedGames = document.getElementById("saved-games")

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function loadGame(){
    //get a list of all saves
    const saveFiles = JSON.parse(localStorage.getItem("saveFiles"))
    console.log(saveFiles)
    if (saveFiles == null) return
    //display the html for each save file
    for(var i = 0; i < saveFiles.length; i++){
        const save = JSON.parse(localStorage.getItem(`${saveFiles[i]}-save`))
        if (save == null) continue //ensure that save exists
        savedGames.innerHTML += `
        <div class = "load-game-container">
            <h3 style="font-size: 22px; margin-bottom: 1vw;">${saveFiles[i]}</h3>
            <div style="font-size: 17px;">${capitalize(save.type)} Mode</div>
            <div style="color: #2F2F2F; font-size: 16px;">
                <div>Turn ${save.turn}</div>
                <div>Coins: ${save.coins}</div>
                <div>Score: ${save.score}</div>
            </div>
            <button id = ${saveFiles[i]} class = "load-game-button" onclick="startGame(this.id)">Play</button>
        </div>
        `
        console.log(save)
    }

}

function startGame(id){
    const save = JSON.parse(localStorage.getItem(`${id}-save`))
    localStorage.setItem("playSave",id)
    if (save.type == "arcade"){
        window.location.href='arcade.html'
    }
    else if (save.type == "freeplay"){
        window.location.href='freeplay.html'
    }
}

loadGame()