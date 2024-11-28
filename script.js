let songs;
let currsong = new Audio();
let currFolder;
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}
// let artname;
async function getSongs(folder) {
    currFolder = folder;
    // console.log(folder)
    let a = await fetch(`/${folder}/`)
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response;
    let as = div.getElementsByTagName("a")
    songs = []
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1])
        }
    }
    // Show all the songs in the playlist
    let songUL = document.getElementsByClassName("songs-list")[0];
    songUL.innerHTML = ""
    for (const song of songs) {
        const decodedString = decodeURIComponent(song);
        // console.log(decodedString);
        songUL.innerHTML += `<div class="sl">
                        <div class="library-song-img">
                            <img src="img/audioicon.svg" alt="audio-icon" class="invert">
                        </div>
                        <div class="sec1-content">
                            <span class="span1">${decodedString.replaceAll(".mp3","")}</span>
                            <span class="span2">♪ Artist</span>
                        </div>
                    </div>`;
    }

    // Attach an event listener to each song
    Array.from(document.getElementsByClassName("sl")).forEach(e => {
        e.addEventListener("click", () => {
            const songName = e.querySelector(".span1").innerHTML.trim();
            // console.log("Song clicked:", songName.trim()+".mp3"); 
            playmusic(songName.replaceAll("&amp;", "&").trim()+".mp3");
        });
    });

    return songs;
}

async function playFirstSong(folder) {
    console.log("Playing the first song from folder:", folder);
    let a = await fetch(`/songs/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    let songs = [];

    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1]); // Extract song names
        }
    }

    if (songs.length > 0) {
        // Play the first song
        playmusic(songs[0]);
    } else {
        console.error("No songs found in the folder:", folder);
    }
}

const playmusic = (track, pause = false) => {
    currsong.src = `/${currFolder}/` + track
    if (!pause) {
        currsong.play()
        PL.src = "img/pause.svg"
    }
    document.getElementsByClassName("Song-name")[0].innerHTML = decodeURIComponent(track.replace(".mp3",""));
    document.getElementsByClassName("Song-time")[0].innerHTML = "00:00/00:00"
}

async function displayAlbums() {
    // console.log("Displaying albums...");
    let a = await fetch(`/songs`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;

    // console.log(div);

    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".card-container");
    for (const e of Array.from(anchors)) {
        const url = new URL(e.href);
        const pathname = url.pathname;
    
        // Match folders immediately under /songs/
        if (pathname.startsWith("/songs/") && pathname.split("/").length === 3) {
            const folder = pathname.split("/").filter(Boolean).pop(); // Extract folder name
            // console.log("Valid folder link:", folder);
            try {
                let a = await fetch(`/songs/${folder}/info.json`);
                if (!a.ok) throw new Error(`Failed to fetch metadata for folder ${folder}`);
                let response = await a.json();
                cardContainer.innerHTML += `<div data-folder="${folder}" class="card">
                    <div  class="play">
                        <img src="/songs/${folder}/cover.jpg" alt="music-tagimg">
                        <button><img src="img/play.svg" alt="play"></button>
                    </div>
                    <div class="title">${response.title}</div>
                    <div class="time">${response.description}</div>
                </div>`;
            } catch (error) {
                console.error(`Error fetching metadata for folder ${folder}:`, error);
            }
        }
    }

    // Load the playlist whenever card is clicked
    
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            console.log("Fetching songs...");
            let songs = await getSongs(`/songs/${item.currentTarget.dataset.folder}`);
            // playmusic(songs[0]);
        });
    });
    function attachCardButtonListeners() {
        let cards = Array.from(document.getElementsByClassName("card"));
        cards.forEach(card => {
            let button = card.querySelector("button");
            let folder = card.getAttribute("data-folder");
    
            if (button && folder) {
                button.addEventListener("click", () => {
                    playFirstSong(folder);
                });
            }
        });
    }
    
    // Call this function after rendering all cards
    attachCardButtonListeners();
}






async function main() {
    await getSongs("songs/ncs")
    playmusic(songs[0], true)

    // Display all the albums on the page
    await displayAlbums()


    Array.from(document.getElementsByClassName("sl")).forEach(e => {
        e.addEventListener("click", () => {
            const songName = e.querySelector(".span1").innerHTML; // Select .span1 inside .sec1-content
            // console.log(songName);
            playmusic(songName); // Play the music using the trimmed song name
        });
    });


    document.getElementsByClassName("PLAY")[0].addEventListener("click", () => {
        if (currsong.paused) {
            currsong.play();
            PL.src = "img/pause.svg";
        }
        else {
            currsong.pause();
            PL.src = "img/play.svg"
        }
    })
    currsong.addEventListener("timeupdate", () => {
        document.querySelector(".Song-time").innerHTML = `${secondsToMinutesSeconds(currsong.currentTime)} / ${secondsToMinutesSeconds(currsong.duration)}`
        document.querySelector(".circle").style.left = (currsong.currentTime / currsong.duration) * 100 + "%";
    })

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currsong.currentTime = ((currsong.duration) * percent) / 100
    })

    document.getElementById("menu-btn").addEventListener("click", () => {
        let leftElement = document.querySelector(".left");
        let menuBtn = document.getElementById("menu-btn");

        if (menuBtn.src.includes("img/cross.svg")) {
            leftElement.style.right = "-110%";
            menuBtn.src = "img/hamburger.svg";
        }
        else {
            leftElement.style.right = "0";
            menuBtn.src = "img/cross.svg";
        }
    });

    // Add an event listener to previous
    document.getElementsByClassName("previous-play")[0].addEventListener("click", () => {
        currsong.pause()
        console.log("Previous clicked")
        let index = songs.indexOf(currsong.src.split("/").slice(-1)[0])
        console.log(index)
        if ((index - 1) >= 0) {
            playmusic(songs[index - 1])
        }
        console.log(currsong.src)
    })

    // Add an event listener to next
    document.getElementsByClassName("next-play")[0].addEventListener("click", () => {
        currsong.pause()
        console.log("Next clicked")

        let index = songs.indexOf(currsong.src.split("/").slice(-1)[0])
        if ((index + 1) < songs.length) {
            playmusic(songs[index + 1])
        }
    })

    document.getElementsByClassName("vol")[0].getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currsong.volume = parseInt(e.target.value) / 100;
        if (currsong.volume > 0) {
            document.querySelector(".vol>img").src = document.querySelector(".vol>img").src.replace("mute.svg", "volume.svg")
        }
    })

    // document.getElementsByClassName("card")[0].addEventListener("mouseover",()=>{
    //     document.getElementsByClassName("play")[0].getElementsByTagName("button")[0].style.opacity="100%";
    // })

    // Add event listener to mute the track
    let previousVolume = 0.5;
    document.querySelector(".vol>img").addEventListener("click", e => {
        if (e.target.src.includes("volume-btn.svg")) {
            e.target.src = e.target.src.replace("volume-btn.svg", "mute.svg")
            previousVolume = currsong.volume;
            currsong.volume = 0;
            document.querySelector(".vol").getElementsByTagName("input")[0].value = 0;
        }
        else {
            e.target.src = e.target.src.replace("mute.svg", "volume-btn.svg")
            currsong.volume = previousVolume;
            document.querySelector(".vol").getElementsByTagName("input")[0].value = previousVolume*100;
        }

    })
}

main();
