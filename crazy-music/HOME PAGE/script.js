new Vue({  
  el: "#app",  
  data() {  
    return {  
      audio: null,  
      circleLeft: null,  
      barWidth: null,  
      duration: null,  
      currentTime: null,  
      isTimerPlaying: false,  
      tracks: [  
        {  
          name: "Track 1",  
          artist: "Artist 1",  
          cover: "https://a10.gaanacdn.com/gn_img/albums/Oxd3xzPbgV/xd3x9vpaWg/size_m.jpg", // Replace with your custom image link  
          source: "https://res.cloudinary.com/dqtlqvhw5/video/upload/v1739696693/WhatsApp_Audio_2025-02-16_at_14.22.38_54296f9b_vdreff.mp3", // Replace with your audio link  
          url: "https://www.youtube.com/watch?v=example1",  
          favorited: false  
        },  
        {  
          name: "Track 2",  
          artist: "Artist 2",  
          cover: "https://your-image-link.com/image2.jpg",  
          source: "https://your-audio-link.com/audio2.mp3",  
          url: "https://www.youtube.com/watch?v=example2",  
          favorited: true  
        },  
        // Add more tracks here...  
      ],  
      currentTrack: null,  
      currentTrackIndex: 0,  
      transitionName: null  
    };  
  },  
  methods: {  
    play() {  
      if (this.audio.paused) {  
        this.audio.play();  
        this.isTimerPlaying = true;  
      } else {  
        this.audio.pause();  
        this.isTimerPlaying = false;  
      }  
    },  
    generateTime() {  
      let width = (100 / this.audio.duration) * this.audio.currentTime;  
      this.barWidth = width + "%";  
      this.circleLeft = width + "%";  
      let durmin = Math.floor(this.audio.duration / 60);  
      let dursec = Math.floor(this.audio.duration - durmin * 60);  
      let curmin = Math.floor(this.audio.currentTime / 60);  
      let cursec = Math.floor(this.audio.currentTime - curmin * 60);  
      this.duration = `${durmin < 10 ? '0' : ''}${durmin}:${dursec < 10 ? '0' : ''}${dursec}`;  
      this.currentTime = `${curmin < 10 ? '0' : ''}${curmin}:${cursec < 10 ? '0' : ''}${cursec}`;  
    },  
    updateBar(x) {  
      let progress = this.$refs.progress;  
      let maxduration = this.audio.duration;  
      let position = x - progress.offsetLeft;  
      let percentage = (100 * position) / progress.offsetWidth;  
      percentage = Math.max(0, Math.min(percentage, 100)); // Clamp to 0-100  
      this.barWidth = percentage + "%";  
      this.circleLeft = percentage + "%";  
      this.audio.currentTime = (maxduration * percentage) / 100;  
      this.audio.play();  
    },  
    clickProgress(e) {  
      this.isTimerPlaying = true;  
      this.audio.pause();  
      this.updateBar(e.pageX);  
    },  
    prevTrack() {  
      this.currentTrackIndex = (this.currentTrackIndex > 0) ? this.currentTrackIndex - 1 : this.tracks.length - 1;  
      this.currentTrack = this.tracks[this.currentTrackIndex];  
      this.resetPlayer();  
    },  
    nextTrack() {  
      this.currentTrackIndex = (this.currentTrackIndex < this.tracks.length - 1) ? this.currentTrackIndex + 1 : 0;  
      this.currentTrack = this.tracks[this.currentTrackIndex];  
      this.resetPlayer();  
    },  
    resetPlayer() {  
      this.barWidth = 0;  
      this.circleLeft = 0;  
      this.audio.currentTime = 0;  
      this.audio.src = this.currentTrack.source;  
      this.audio.load();  
      setTimeout(() => {  
        this.isTimerPlaying ? this.audio.play() : this.audio.pause();  
      }, 300);  
    },  
    favorite() {  
      this.tracks[this.currentTrackIndex].favorited = !this.tracks[this.currentTrackIndex].favorited;  
    }  
  },  
  created() {  
    this.currentTrack = this.tracks[0];  
    this.audio = new Audio();  
    this.audio.src = this.currentTrack.source;  
    this.audio.ontimeupdate = this.generateTime;  
    this.audio.onloadedmetadata = this.generateTime;  
    this.audio.onended = this.nextTrack;  

    // Preload images for cover art  
    this.tracks.forEach(track => {  
      let link = document.createElement('link');  
      link.rel = "prefetch";  
      link.href = track.cover; // Ensure the cover is a valid direct link to an image  
      link.as = "image";  
      document.head.appendChild(link);  
    });  
  }  
});

