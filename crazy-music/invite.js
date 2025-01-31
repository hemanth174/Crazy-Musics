document.getElementById("inviteButton").addEventListener("click", function() {
    const message = "Hey! Check out this amazing website:https://crazy-music.netlify.app/";
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank");
});