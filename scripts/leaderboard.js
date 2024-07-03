
//code to get and display leaderboard, assuming it has been populated
let arcadeLbList = JSON.parse(localStorage.getItem("arcadeLeaderboard"));
let freeplayLbList = JSON.parse(localStorage.getItem("freeplayLeaderboard"));

let arcadeLeaderboard = document.getElementById("arcadeLeaderboard")
let freeplayLeaderboard = document.getElementById("freeplayLeaderboard")



arcadeLbList.forEach((entry) => {
    console.log(entry)
    let listing = document.createElement("li")
    listing.textContent = `${entry.name}: ${entry.score}`
    arcadeLeaderboard.appendChild(listing)
})


