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
    updateDisplay();
}

// Update the question and answer display with smoother animation
function updateDisplay() {
    if (questions.length === 0) return;

    let index = getProgress();
    currentIndex = index; // Track current index

    const questionContainer = document.querySelector(".question-container");
    const answerContainer = document.querySelector(".answer-container");
    
    // Apply smooth fade-out before updating content
    questionContainer.style.transition = "opacity 0.5s ease-in-out, width 0.3s ease-in-out";
    answerContainer.style.transition = "opacity 0.5s ease-in-out, width 0.3s ease-in-out";
    questionContainer.style.opacity = "0.1";
    answerContainer.style.opacity = "0.1";
    questionContainer.style.width = "80%";
    answerContainer.style.width = "80%";
    
    // Update the selected option in the question menu to match current question
    const questionMenu = document.getElementById("question-menu");
    questionMenu.value = index + 1; // Adding 1 because option values start from 1
    
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
    const questionContainer = document.querySelector(".question-container");
    const answerContainer = document.querySelector(".answer-container");
    
    // Reset both containers before playing
    questionContainer.style.width = "80%";
    answerContainer.style.width = "80%";
    
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
        
        // Expand both containers dynamically
        if (isAnswer) {
            answerContainer.style.width = "85%";
        }
        else {
            questionContainer.style.width = "85%";
        }
        
        currentAudio.addEventListener("timeupdate", () => {
            const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
            progressBar.style.transition = "width 0.3s linear";
            progressBar.style.width = `${progress}%`;
        });
    });

    currentAudio.play();

    // Remove progress bar and reset width when audio ends
    currentAudio.onended = () => {
        let progressBar = playButton.querySelector(".progress-bar");
        if (progressBar) progressBar.remove();
        questionContainer.style.width = "80%";
        answerContainer.style.width = "80%";
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

// Create question menu based on categories and subcategories
function createQuestionMenu() {
    const questionMenu = document.getElementById("question-menu");
    const categories = [
        { label: "CÔNG QUYỀN HOA KỲ", subcategories: [
            { label: "Các Nguyên Tắc Của Dân Chủ Hoa Kỳ", range: [1, 12] },
            { label: "Hệ Thống Công Quyền", range: [13, 47] },
            { label: "Quyền Hạn Và Bổn Phận", range: [48, 57] }
        ]},
        { label: "LỊCH SỬ HOA KỲ", subcategories: [
            { label: "Thời Kỳ Thuộc Địa Và Độc Lập", range: [58, 70] },
            { label: "Thời Kỳ 1800", range: [71, 77] },
            { label: "Lịch Sử Cận Đại Hoa Kỳ Và Các Thông Tin Lịch Sử Quan Trọng Khác", range: [78, 87] }
        ]},
        { label: "TỔNG HỢP VỀ KIẾN THỨC CÔNG DÂN", subcategories: [
            { label: "Địa Dư", range: [88, 95] },
            { label: "Các Biểu Tượng", range: [96, 98] },
            { label: "Các Ngày Lễ", range: [99, 100] }
        ]}
    ];

    // Clear existing options except the first one
    while (questionMenu.options.length > 1) {
        questionMenu.remove(1);
    }

    // Create category and subcategory structure
    categories.forEach(category => {
        // Create main category optgroup
        let optgroupCategory = document.createElement("optgroup");
        optgroupCategory.label = category.label;
        questionMenu.appendChild(optgroupCategory);
        
        // Process each subcategory
        category.subcategories.forEach(sub => {
            // Create subcategory optgroup
            let optgroupSub = document.createElement("optgroup");
            optgroupSub.label = sub.label;
            
            // Add question options for this subcategory
            for (let i = sub.range[0]; i <= sub.range[1]; i++) {
                let option = document.createElement("option");
                option.value = i;
                option.textContent = `Câu ${i}`;
                optgroupSub.appendChild(option);
            }
            
            // Add subcategory to main category
            questionMenu.appendChild(optgroupSub);
        });
    });
}


// Initialize the display on page load
document.addEventListener("DOMContentLoaded", () => {
    loadQuestions();
    createQuestionMenu()
});

// Function to jump to a selected question
document.getElementById("question-menu").addEventListener("change", function(event) {
    const selectedIndex = parseInt(event.target.value, 10);
    setProgress(selectedIndex - 1);
});
