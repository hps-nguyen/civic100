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

// Update the question and answer display with smoother animation
function updateDisplay() {
    if (questions.length === 0) return;

    let index = getProgress();
    currentIndex = index; // Track current index

    const questionContainer = document.querySelector(".question-container");
    const answerContainer = document.querySelector(".answer-container");
    
    // Apply smooth fade-out before updating content
    questionContainer.style.transition = "opacity 0.5s ease-in-out";
    answerContainer.style.transition = "opacity 0.5s ease-in-out";
    questionContainer.style.opacity = "0.1";
    answerContainer.style.opacity = "0.1";
    
    setTimeout(() => {
        document.getElementById("question-text").innerHTML = `
            ${questions[index].question}
            <p class="translation">${questions[index].translation.question}</p>
        `;

        document.getElementById("answer-text").innerHTML = `
            ${questions[index].answer}
            <p class="translation">${questions[index].translation.answer}</p>
        `;

        document.getElementById("question-title").textContent = `Câu hỏi ${index + 1}`;
        document.getElementById("answer-title").textContent = `Trả lời`;

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

        // Apply smooth fade-in after updating content
        questionContainer.style.opacity = "1";
        answerContainer.style.opacity = "1";
    }, 300);
}

// Handle audio playback with button animation
function playAudio(isAnswer = false) {
    if (questions.length === 0) return;
    
    const audioFile = isAnswer ? `q${questions[currentIndex].id}/q${questions[currentIndex].id}_answer_voice1.wav` : `q${questions[currentIndex].id}/q${questions[currentIndex].id}_voice1.wav`;
    const playButton = isAnswer ? document.querySelector(".answer-container .play-button") : document.querySelector(".question-container .play-button");
    
    // Stop currently playing audio if any
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        let oldProgressBar = document.querySelector(".progress-bar");
        if (oldProgressBar) oldProgressBar.remove();
    }
    
    currentAudio = new Audio(BUCKET_URL + audioFile);
    currentAudio.volume = 1.0; // Set max volume
    
    currentAudio.addEventListener("loadedmetadata", () => {
        playButton.style.position = "relative";
        playButton.style.overflow = "hidden";
        let progressBar = document.createElement("span");
        progressBar.classList.add("progress-bar");
        progressBar.style.position = "absolute";
        progressBar.style.top = "0";
        progressBar.style.left = "0";
        progressBar.style.height = "100%";
        progressBar.style.background = "rgba(80, 118, 135, 0.5)";
        progressBar.style.width = "0%";
        playButton.appendChild(progressBar);
        currentAudio.addEventListener("timeupdate", () => {
            const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
            progressBar.style.transition = "width 0.3s linear";
            progressBar.style.width = `${progress}%`;
        });
    });

    currentAudio.play();

    // Remove progress bar when audio ends
    currentAudio.onended = () => {
        let progressBar = playButton.querySelector(".progress-bar");
        if (progressBar) progressBar.remove();
    };
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
