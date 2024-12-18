document.getElementById('openFeedbackBtn').addEventListener('click', function() {
    document.getElementById('feedbackModal').classList.remove('hidden'); // Show modal  
});

document.getElementById('closeFeedbackBtn').addEventListener('click', function() {
    document.getElementById('feedbackModal').classList.add('hidden'); // Hide modal  
});

document.getElementById('feedbackForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent page reload  
    const thankYouMessage = document.getElementById('thankYouMessage');
    thankYouMessage.classList.remove('hidden'); // Show thank you message  
    this.reset(); // Reset form fields  
});