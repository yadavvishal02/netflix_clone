console.log('Lets write the JavaScript');

let currentsong = new Audio();
let songs;
let currFolder;

///function for changing minutes in seconds
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    // Calculate minutes and seconds
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    // Add leading zero if needed
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    // Return formatted string
    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getsongs(folder) {
    currFolder = folder;
    try {
        let a = await fetch(`/${folder}/`);
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let as = div.getElementsByTagName("a");
        songs = [];
        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                songs.push(decodeURI(element.href.split(`/${folder}/`)[1].split(".mp3")[0]));
            }
        }
        /// show all the songs in the playlist
        let songul = document.querySelector(".song-list").getElementsByTagName("ul")[0];
        songul.innerHTML = "";
        for (const song of songs) {
            songul.innerHTML = songul.innerHTML + `<li>
            <img src="images/music.svg" alt="">
            <div class="info">
                <div>${song}</div>
                <div>Artist: Vishal</div>
            </div>
            <div class="play-now">
                <span>Play Now</span>
                <img src="images/play2.svg" width="30" alt="">
            </div></li>`;
        }
        ///Attach an event listener to each song
        Array.from(document.querySelector(".song-list").getElementsByTagName("li")).forEach(e => {
            e.addEventListener("click", element => {
                playMusic(e.querySelector(".info").firstElementChild.innerHTML);
            });
        });
    } catch (error) {
        console.error("Error fetching songs:", error);
    }
    return songs;
}

const playMusic = (track, pause = false) => {
    currentsong.src = `/${currFolder}/` + track + ".mp3";
    if (!pause) {
        currentsong.play();
        document.getElementById('play').src = "images/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = track;
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

async function displayalbums() {
    try {
        let a = await fetch(`/songs/`);
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let anchors = div.getElementsByTagName("a");
        let cardcontainer = document.querySelector(".cardcontainer");
        let array = Array.from(anchors);
        for (let index = 0; index < array.length; index++) {
            const e = array[index];
            if (e.href.includes("/songs") && !e.href.includes(".DS_Store")) {
                let folder = (e.href.split("/").slice(-2)[0]);
                ///Get the metadata of the folder
                let metadata = await fetch(`/songs/${folder}/info.json`);
                if (metadata.ok) {
                    let folderInfo = await metadata.json();
                    cardcontainer.innerHTML = cardcontainer.innerHTML + `
                    <div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="50" height="50">
                            <circle cx="50" cy="50" r="48" fill="#00cc44" stroke="none" />
                            <polygon points="35,30 35,70 70,50" fill="black" />
                        </svg>
                    </div>
                    <img src="/songs/${folder}/cover.jpeg" alt="playlist-image">
                    <h2>${folderInfo.title}</h2>
                    <p>${folderInfo.description}</p>
                    </div>`;
                } else {
                    console.error("Info file not found for folder:", folder);
                }
            }
        }
        //// Load the playlist when card was clicked
        Array.from(document.getElementsByClassName("card")).forEach(e => {
            e.addEventListener("click", async item => {
                songs = await getsongs(`songs/${item.currentTarget.dataset.folder}`);
                playMusic(songs[0]);
            });
        });
    } catch (error) {
        console.error("Error displaying albums:", error);
    }
}

async function main() {
    //get the list of all the songs 
    await getsongs("songs/mix");
    playMusic(songs[0], true);

    ///Display all the albums on the page
    displayalbums();

    const play = document.getElementById('play');
    const previous = document.getElementById('previous');
    const next = document.getElementById('next');

    ///Attach an event listener to previous, play, and next buttons
    play.addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play();
            play.src = "images/pause.svg";
        } else {
            currentsong.pause();
            play.src = "images/play.svg";
        }
    });

    /////event listener for time update event
    currentsong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${formatTime(currentsong.currentTime)} / ${formatTime(currentsong.duration)}`;
        document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%";
    });

    //// event listener for seek bar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentsong.currentTime = ((currentsong.duration) * percent) / 100;
    });

    ///// event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    /////to close hamburger
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    //// listener for previous 
    previous.addEventListener("click", () => {
        let currentIndex = songs.indexOf(document.querySelector(".songinfo").innerHTML);
        if (currentIndex > 0) {
            playMusic(songs[currentIndex - 1]);
        } else {
            // Optionally handle looping to the end of the playlist
            playMusic(songs[songs.length - 1]);
        }
    });

    //// listener for next 
    next.addEventListener("click", () => {
        let currentIndex = songs.indexOf(document.querySelector(".songinfo").innerHTML);
        if (currentIndex < songs.length - 1) {
            playMusic(songs[currentIndex + 1]);
        } else {
            // Optionally handle looping to the start of the playlist
            playMusic(songs[0]);
        }
    });

    //// listener for volume up down
    document.querySelector(".range input").addEventListener("change", (e) => {
        console.log("Setting volume to", e.target.value);
        currentsong.volume = parseInt(e.target.value) / 100;
    });

    /// event listener for mute
    document.querySelector(".volume > img").addEventListener("click", e => {
        if (e.target.src.includes("images/volume.svg")) {
            e.target.src = e.target.src.replace("images/volume.svg", "images/mute.svg");
            currentsong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = e.target.src.replace("images/mute.svg", "images/volume.svg");
            currentsong.volume = 1;
            document.querySelector(".range input").value = 100;
        }
    });
}
main();
