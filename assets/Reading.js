// 倒计时功能
let timerInterval;
let timeLeft = 2160; // 初始时间（秒）
const timerDisplay = document.getElementById('timer');

function startTimer() {
    timerInterval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        if (timeLeft <= 0) clearInterval(timerInterval);
        timeLeft--;
    }, 1000);
}

startTimer();

// 显示/隐藏计时器
document.getElementById('hideTimer').addEventListener('click', () => {
    const timerSection = document.querySelector('.timer-section');
    timerSection.classList.toggle('d-none');
    const btnText = document.getElementById('hideTimer').textContent;
    document.getElementById('hideTimer').textContent = btnText === 'Hide Timer' ? 'Show Timer' : 'Hide Timer';
});



// Global variables
let currentQuestion = 1;
const totalQuestions = 20;
let questionsData = [];
let userAnswers = Array(totalQuestions).fill().map(() => []);

// DOM Elements
const questionElement = document.getElementById('question');
const currentQuestionElement = document.getElementById('current_question');
const totalQuestionElement = document.getElementById('total_question');
const progressBar = document.getElementById('progress-bar');
const alertSelectNum = document.getElementById('alert-select-num');
const backBtn = document.getElementById('back-btn');
const nextBtn = document.getElementById('next-btn');
const optionButtons = document.querySelectorAll('.single-select-button');
const optionContainers = {
    A: document.getElementById('optionA'),
    B: document.getElementById('optionB'),
    C: document.getElementById('optionC'),
    D: document.getElementById('optionD'),
    E: document.getElementById('optionE'),
    F: document.getElementById('optionF')
};

// Initialize the test
document.addEventListener('DOMContentLoaded', async () => {
    totalQuestionElement.textContent = totalQuestions;
    
    try {
        // Load both question sets
        const [data1, data2] = await Promise.all([
            fetch('Reading_QuestionData_1.json').then(res => res.json()),
            fetch('Reading_QuestionData_2.json').then(res => res.json())
        ]);
        
        // Combine both sets into one array
        questionsData = [...data1, ...data2];
        
        // Load first question
        loadQuestion(currentQuestion - 1);
    } catch (error) {
        console.error('Error loading questions:', error);
        questionElement.textContent = 'Failed to load questions. Please try again.';
    }
});

// Load question data into UI
function loadQuestion(questionIndex) {
    const questionData = questionsData[questionIndex];
    if (!questionData) return;
    
    // Update question text
    questionElement.textContent = questionData.question;
    
    // Update question number
    currentQuestionElement.textContent = questionIndex + 1;
    currentQuestion = questionIndex + 1;
    
    // Update progress bar
    const progressPercent = (currentQuestion / totalQuestions) * 100;
    progressBar.style.width = `${progressPercent}%`;
    progressBar.setAttribute('aria-valuenow', currentQuestion);
    
    // Update answer selection text
    updateAnswerSelectionText(questionData);
    
    // Update options visibility and content
    updateOptions(questionData);
    
    // Update button states
    backBtn.disabled = currentQuestion === 1;
    backBtn.setAttribute('aria-disabled', currentQuestion === 1);
    
    if (currentQuestion === totalQuestions) {
        nextBtn.innerHTML = 'Submit <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-chevron-right ms-1" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/></svg>';
    } else {
        nextBtn.innerHTML = 'Next <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-chevron-right ms-1" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/></svg>';
    }
    
    // Restore user selection
    restoreUserSelection(questionIndex);
}

// Update answer selection text
function updateAnswerSelectionText(questionData) {
    let answerCount = 1;
    
    if (questionData.type === 'multiple_choice' && Array.isArray(questionData.answer)) {
        answerCount = questionData.answer.length;
    } else if (questionData.type === 'summary') {
        answerCount = 3;
    }
    
    const words = ['one', 'two', 'three'];
    alertSelectNum.textContent = words[answerCount - 1] || 'one';
}

// Update options visibility and content
function updateOptions(questionData) {
    // Reset all options
    optionButtons.forEach(button => {
        button.checked = false;
        button.type = 'radio'; // Default to radio
        button.disabled = false;
        button.dataset.maxSelections = 1; // Default max selections
    });
    
    // Reset option containers
    Object.values(optionContainers).forEach(container => {
        container.classList.remove('option-selected');
        if (['E', 'F'].includes(container.id.replace('option', '').replace('-row', ''))) {
            container.classList.add('hidden');
        }
    });
    
    // Set max selections based on question type
    let maxSelections = 1;
    if (questionData.type === 'multiple_choice' && Array.isArray(questionData.answer)) {
        maxSelections = questionData.answer.length;
    } else if (questionData.type === 'summary') {
        maxSelections = 3;
    }
    
    // Update option content
    questionData.choices.forEach((choice, index) => {
        const optionLetter = String.fromCharCode(65 + index); // A, B, C, etc.
        const labelElement = document.getElementById(`label-option${optionLetter}`);
        
        if (labelElement) {
            labelElement.textContent = choice;
            
            // Show E/F options for summary questions
            if (['E', 'F'].includes(optionLetter) && questionData.type === 'summary') {
                optionContainers[optionLetter].classList.remove('hidden');
            }
        }
    });
    
    // Set input type and max selections
    optionButtons.forEach(button => {
        if (maxSelections > 1) {
            button.type = 'checkbox';
        }
        button.dataset.maxSelections = maxSelections;
    });
}

// Restore user selection for the current question
function restoreUserSelection(questionIndex) {
    const selectedOptions = userAnswers[questionIndex];
    
    // Reset all selections
    optionButtons.forEach(button => {
        button.checked = false;
        button.parentElement.parentElement.classList.remove('option-selected');
    });
    
    // Apply stored selections
    selectedOptions.forEach(option => {
        const button = document.querySelector(`.option-button[value="${option}"]`);
        if (button) {
            button.checked = true;
            button.parentElement.parentElement.classList.add('option-selected');
        }
    });
}

// Handle option selection
document.querySelectorAll('.option-button').forEach(button => {
    button.addEventListener('change', function() {
        const container = this.closest('.option-container');
        const maxSelections = parseInt(this.dataset.maxSelections) || 1;
        
        // Update visual selection state
        if (this.checked) {
            container.classList.add('option-selected');
        } else {
            container.classList.remove('option-selected');
        }
        
        // Save user answer
        saveUserAnswer();
        
        // Enforce max selections
        if (maxSelections > 1) {
            enforceMaxSelections(maxSelections);
        } else {
            // For single selection, deselect others
            if (this.checked) {
                document.querySelectorAll('.option-button').forEach(otherButton => {
                    if (otherButton !== this && otherButton.checked) {
                        otherButton.checked = false;
                        otherButton.closest('.option-container').classList.remove('option-selected');
                    }
                });
            }
        }
    });
});

// Enforce maximum selections for multiple choice
function enforceMaxSelections(maxSelections) {
    const selectedButtons = document.querySelectorAll('.option-button:checked');
    
    if (selectedButtons.length > maxSelections) {
        // If over the limit, uncheck the last selected option
        selectedButtons[selectedButtons.length - 1].checked = false;
        selectedButtons[selectedButtons.length - 1].closest('.option-container').classList.remove('option-selected');
        
        // Show an alert to the user
        const words = ['one', 'two', 'three'];
        alert(`You can only select ${words[maxSelections - 1]} options for this question.`);
    }
}

// Save user answer to storage
function saveUserAnswer() {
    const selectedOptions = [];
    document.querySelectorAll('.option-button:checked').forEach(button => {
        selectedOptions.push(button.value);
    });
    
    // Store sorted answers
    userAnswers[currentQuestion - 1] = selectedOptions.sort();
}

// Navigation handlers
backBtn.addEventListener('click', () => {
    if (currentQuestion > 1) {
        saveUserAnswer();
        loadQuestion(currentQuestion - 2);
    }
});

nextBtn.addEventListener('click', () => {
    if (currentQuestion < totalQuestions) {
        saveUserAnswer();
        loadQuestion(currentQuestion);
    } else {
        // Submit the test
        submitTest();
    }
});

// Submit test and show results
function submitTest() {
    saveUserAnswer();
    
    // Calculate results
    let wrongAnswers = [];
    let correctCount = 0;
    
    for (let i = 0; i < totalQuestions; i++) {
        const correctAnswer = Array.isArray(questionsData[i].answer) ? 
            questionsData[i].answer : 
            [questionsData[i].answer];
        
        const userAnswer = userAnswers[i];
        
        // Compare sorted arrays
        if (JSON.stringify(userAnswer.sort()) === JSON.stringify(correctAnswer.sort())) {
            correctCount++;
        } else {
            wrongAnswers.push(i + 1);
        }
    }
    
    // Prepare result message
    const score = Math.round((correctCount / totalQuestions) * 100);
    let message = `Test completed!\n\n`;
    message += `Your score: ${score}% (${correctCount} out of ${totalQuestions} correct)\n\n`;
    
    if (wrongAnswers.length > 0) {
        message += `Incorrect answers: ${wrongAnswers.join(', ')}`;
    } else {
        message += `Perfect score! All answers are correct.`;
    }
    
    // Show results
    alert(message);
}
