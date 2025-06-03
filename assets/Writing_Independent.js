// 倒计时功能
let timerInterval;
let timeLeft = 600; // 初始时间（秒）
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

// 字数统计
const writingArea = document.getElementById('writingArea');
const wordCountDisplay = document.querySelector('.word-count');

function updateWordCount() {
    const words = writingArea.value.trim().split(/\s+/).filter(word => word !== '');
    wordCountDisplay.textContent = words.length;
}

writingArea.addEventListener('input', updateWordCount);

// 显示/隐藏字数统计
document.getElementById('hideWordCount').addEventListener('click', () => {
    wordCountDisplay.classList.toggle('d-none');
    const btnText = document.getElementById('hideWordCount').textContent;
    document.getElementById('hideWordCount').textContent = btnText === 'Hide Word Count' ? 'Show Word Count' : 'Hide Word Count';
});

// 剪切复制撤销功能
const cutBtn = document.getElementById('cutBtn');
const pasteBtn = document.getElementById('pasteBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');

let history = [];
let currentIndex = -1;

writingArea.addEventListener('selectionchange', () => {
    cutBtn.disabled = writingArea.selectionStart === writingArea.selectionEnd;
    cutBtn.classList.toggle('disabled-btn', cutBtn.disabled);
});

document.addEventListener('paste', () => {
    // 处理粘贴操作
});

// 具体剪切、粘贴、撤销、重做功能实现需要进一步完善