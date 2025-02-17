document.getElementById("inviteButton").addEventListener("click", function() {  
    const recipientEmail = "ramasaiahemanth@gmail.com"; // The recipient's email address  
    const subject = "Access Denied Mail"; // Set your desired subject  
    const message = "Extended For Me Time"; // Your message content  
    const emailUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;  

    window.open(emailUrl, "_blank"); // Opens the default email client  
});