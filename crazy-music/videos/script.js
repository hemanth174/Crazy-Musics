document.addEventListener("DOMContentLoaded", () => {
    const videoPlayer = document.getElementById("videoPlayer");
    const videoSource = document.getElementById("videoSource");
    
    const qualityButtons = document.querySelectorAll(".quality-btn");
    const videoSources = {
        "360": "./Endhuko-360p.mp4" ,
        "480": "./Endhuko-480p.mp4" ,
        "720": "./Endhuko-720p.mp4",
        "1080": "./Endhuko-1080p.mp4",
        

    };

    qualityButtons.forEach(button => {
        button.addEventListener("click", function() {
            let quality = this.getAttribute("data-quality");
            let currentTime = videoPlayer.currentTime;
            videoSource.src = videoSources[quality];
            videoPlayer.load();
            videoPlayer.currentTime = currentTime;
            videoPlayer.play();
        });
    });

    document.querySelector('.like-button').addEventListener('click', function() {
        alert('You liked this video!');
    });

    document.querySelector('.share-button').addEventListener('click', function() {
        alert('Share link copied to clipboard!');
    });
});
