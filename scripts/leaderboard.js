let testleaderboard = [
    { name: 'Alice', score: 1200 },
    { name: 'Bob', score: 950 },
    { name: 'Charlie', score: 700 }
  ];
//code to get and display leaderboard, assuming it has been populated
//let arcadeLbList = JSON.parse(localStorage.getItem("arcadeLeaderboard"));
//let freeplayLbList = JSON.parse(localStorage.getItem("freeplayLeaderboard"));

let arcadeLeaderboard = document.getElementById("arcadeLeaderboard")
let freeplayLeaderboard = document.getElementById("freeplayLeaderboard")

testleaderboard.forEach((entry) => {
    let listing = document.createElement("li")
    listing.textContent = `${entry.name}: ${entry.score}`
    arcadeLeaderboard.appendChild(listing)
})


