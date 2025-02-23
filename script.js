const BUCKET_URL = "https://civic100-voice.s3.us-west-1.amazonaws.com/civic100-voice/";

let questions = [];
let currentIndex = 0;
let currentAudio = null; // Track currently playing audio

// Fetch questions from JSON file
async function loadQuestions() {
    try {
        const response = await fetch("questions.json");
        questions = await response.json();
        updateDisplay(); // Update UI once data is loaded
    } catch (error) {
        console.error("Error loading questions:", error);
    }
}

// Get stored progress from cookies
function getProgress() {
    const storedIndex = document.cookie.replace(/(?:(?:^|.*;\s*)currentQuestion\s*=\s*([^;]*).*$)|^.*$/, "$1");
    return storedIndex ? parseInt(storedIndex) : 0; // Default to first question if no cookie
}

// Save progress to cookies
function setProgress(index) {
    document.cookie = `currentQuestion=${index}; path=/; max-age=31536000`; // Expires in 1 year
}

// Update the question and answer display
function updateDisplay() {
    if (questions.length === 0) return;

    let index = getProgress();
    currentIndex = index; // Track current index

    document.getElementById("question-text").innerHTML = `
        ${questions[index].question}
        <p class="translation">${questions[index].translation.question}</p>
    `;

    document.getElementById("answer-text").innerHTML = `
        ${questions[index].answer}
        <p class="translation">${questions[index].translation.answer}</p>
    `;

    document.getElementById("question-title").textContent = `Câu hỏi ${index + 1}`;
    document.getElementById("answer-title").textContent = `Trả lời ${index + 1}`;

    // Hide question and answer content initially
    document.querySelectorAll(".toggle-button").forEach(button => {
        button.textContent = button.textContent.replace("Ẩn", "Hiện");
    });
    document.getElementById("question-text").style.display = "none";
    document.getElementById("answer-text").style.display = "none";

    // Stop any currently playing audio when updating display
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
}

// Handle audio playback
function playAudio(isAnswer = false) {
    if (questions.length === 0) return;
    
    const audioFile = isAnswer ? `q${questions[currentIndex].id}/q${questions[currentIndex].id}_answer_voice1.wav` : `q${questions[currentIndex].id}/q${questions[currentIndex].id}_voice1.wav`;
    
    // Stop currently playing audio if any
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
    
    currentAudio = new Audio(BUCKET_URL + audioFile);
    currentAudio.volume = 1.0; // Set max volume
    currentAudio.play();
}

// Navigate to the previous question
function prevQuestion() {
    if (currentIndex > 0) {
        setProgress(currentIndex - 1);
        updateDisplay();
    }
}

// Navigate to the next question
function nextQuestion() {
    if (currentIndex < questions.length - 1) {
        setProgress(currentIndex + 1);
        updateDisplay();
    }
}

// Toggle visibility of question/answer text
function toggleVisibility(elementId, button) {
    const element = document.getElementById(elementId);
    if (element.style.display === "none" || element.style.display === "") {
        element.style.display = "block";
        button.textContent = button.textContent.replace("Hiện", "Ẩn");
    } else {
        element.style.display = "none";
        button.textContent = button.textContent.replace("Ẩn", "Hiện");
    }
}

// Initialize the display on page load
document.addEventListener("DOMContentLoaded", () => {
    loadQuestions();
});
