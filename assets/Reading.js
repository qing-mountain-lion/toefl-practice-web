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




// 全局变量
let currentQuestionIndex = 1; // 当前题号（从1开始）
const totalQuestions = 20; // 总题数
let allQuestions = []; // 存储所有题目数据
const userAnswers = Array(totalQuestions).fill().map(() => []); // 用户答案存储

// DOM 元素引用
const currentQuestionElement = document.getElementById('current_question');
const totalQuestionElement = document.getElementById('total_question');
const progressBar = document.getElementById('progress-bar');
const alertSelectNum = document.getElementById('alert-select-num');
const backBtn = document.getElementById('back-btn');
const nextBtn = document.getElementById('next-btn');
const questionElement = document.getElementById('question');
const optionsContainer = document.getElementById('options');

// 选项行元素（A-F） - 修正后的引用
const optionRows = {
    A: document.getElementById('optionA').parentElement,
    B: document.getElementById('optionB').parentElement,
    C: document.getElementById('optionC').parentElement,
    D: document.getElementById('optionD').parentElement,
    E: document.getElementById('optionE').parentElement,
    F: document.getElementById('optionF').parentElement
};

// 选项输入元素（A-F） - 修正后的引用
const optionInputs = {
    A: document.getElementById('optionA'),
    B: document.getElementById('optionB'),
    C: document.getElementById('optionC'),
    D: document.getElementById('optionD'),
    E: document.getElementById('optionE'),
    F: document.getElementById('optionF')
};

// 加载题目数据
async function loadQuestions() {
    try {
        // 同时加载两篇阅读题目
        const [data1, data2] = await Promise.all([
            fetch('Reading_QuestionData_1.json').then(res => res.json()),
            fetch('Reading_QuestionData_2.json').then(res => res.json())
        ]);
        
        // 合并题目数据（0-9: 第一篇, 10-19: 第二篇）
        allQuestions = [...data1, ...data2];
        
        // 设置总题数显示
        totalQuestionElement.textContent = totalQuestions;
        
        // 加载第一题
        loadQuestion(currentQuestionIndex);
    } catch (error) {
        console.error('题目加载失败:', error);
        alert('题目加载失败，请刷新页面重试');
    }
}

// 加载指定题目
function loadQuestion(questionIndex) {
    // 保存当前题目答案
    saveCurrentQuestionAnswer();
    
    // 更新当前题号
    currentQuestionIndex = questionIndex;
    currentQuestionElement.textContent = questionIndex;
    
    // 计算在allQuestions中的索引（0-based）
    const dataIndex = questionIndex - 1;
    const questionData = allQuestions[dataIndex];
    
    // 更新题干
    questionElement.textContent = questionData.question;
    
    // 清空所有选项选中状态
    Object.values(optionInputs).forEach(input => {
        input.checked = false;
    });
    
    // 更新选项文本
    const choices = questionData.choices;
    Object.keys(optionInputs).forEach((key, index) => {
        if (choices[index]) {
            // 获取对应的label元素
            const label = optionInputs[key].nextElementSibling;
            if (label && label.tagName === 'LABEL') {
                label.textContent = choices[index];
            }
        }
    });
    
    // 根据题目类型调整UI
    updateUIForQuestionType(questionData.type);
    
    // 恢复之前保存的答案
    restoreUserAnswers(dataIndex);
    
    // 更新进度条
    updateProgressBar(questionIndex);
    
    // 更新按钮状态
    updateButtonStates(questionIndex);
}

// 根据题目类型更新UI
function updateUIForQuestionType(questionType) {
    // 隐藏所有选项行（后面再按需显示）
    Object.values(optionRows).forEach(row => {
        row.style.display = 'none';
    });
    
    // 显示E/F选项（仅当summary类型时）
    const showEF = questionType === 'summary';
    optionRows.E.style.display = showEF ? 'flex' : 'none';
    optionRows.F.style.display = showEF ? 'flex' : 'none';
    
    // 始终显示A-D选项
    ['A', 'B', 'C', 'D'].forEach(key => {
        optionRows[key].style.display = 'flex';
    });
    
    // 根据题目类型设置输入类型和选择提示
    let inputType = 'radio';
    let maxSelections = 1;
    let selectText = 'one';
    
    switch (questionType) {
        case 'multiple_choice':
            // 根据答案数量确定是多选还是单选
            maxSelections = allQuestions[currentQuestionIndex - 1].answer.length;
            inputType = maxSelections > 1 ? 'checkbox' : 'radio';
            selectText = maxSelections === 1 ? 'one' : 'two';
            break;
        case 'summary':
            inputType = 'checkbox';
            maxSelections = 3;
            selectText = 'three';
            break;
        case 'excerpt_highlight':
        case 'sentence_insertion':
            inputType = 'radio';
            maxSelections = 1;
            selectText = 'one';
            break;
    }
    
    // 更新选择提示
    alertSelectNum.textContent = selectText;
    
    // 更新输入类型
    Object.values(optionInputs).forEach(input => {
        input.type = inputType;
        // 重置name属性以确保单选按钮分组正确
        input.name = inputType === 'radio' ? 'options' : `options-${currentQuestionIndex}`;
    });
    
    // 添加选项选择事件监听器
    optionsContainer.onchange = function(event) {
        handleOptionSelection(event, maxSelections);
    };
}

// 处理选项选择
function handleOptionSelection(event, maxSelections) {
    const input = event.target;
    if (!input.classList.contains('form-check-input')) return;
    
    const dataIndex = currentQuestionIndex - 1;
    const questionType = allQuestions[dataIndex].type;
    
    // 如果是单选，不需要额外处理
    if (input.type === 'radio') return;
    
    // 获取当前选中的选项
    const selectedOptions = Array.from(
        optionsContainer.querySelectorAll('input:checked')
    );
    
    // 检查是否超过最大可选数量
    if (selectedOptions.length > maxSelections && input.checked) {
        // 取消当前选择
        input.checked = false;
        
        // 显示错误提示
        alert(`最多只能选择 ${maxSelections} 个选项`);
    }
}

// 保存当前题目答案
function saveCurrentQuestionAnswer() {
    const dataIndex = currentQuestionIndex - 1;
    
    // 获取当前选中的选项值（如 ["A", "C"]）
    const selectedOptions = Array.from(
        optionsContainer.querySelectorAll('input:checked')
    ).map(input => {
        // 提取选项字母 (optionA -> A)
        return input.id.replace('option', '');
    });
    
    // 按字母顺序排序并保存
    userAnswers[dataIndex] = selectedOptions.sort();
}

// 恢复用户保存的答案
function restoreUserAnswers(dataIndex) {
    const savedOptions = userAnswers[dataIndex];
    
    savedOptions.forEach(option => {
        const inputId = `option${option}`;
        const inputElement = document.getElementById(inputId);
        if (inputElement) {
            inputElement.checked = true;
        }
    });
}

// 更新进度条
function updateProgressBar(questionIndex) {
    // 计算进度百分比
    const progressPercentage = (questionIndex / totalQuestions) * 100;
    
    // 更新进度条
    progressBar.style.width = `${progressPercentage}%`;
    progressBar.setAttribute('aria-valuenow', questionIndex);
    progressBar.setAttribute('aria-valuemax', totalQuestions);
}

// 更新按钮状态
function updateButtonStates(questionIndex) {
    // 上一题按钮状态
    const isFirstQuestion = questionIndex === 1;
    backBtn.disabled = isFirstQuestion;
    backBtn.setAttribute('aria-disabled', isFirstQuestion);
    
    // 下一题/提交按钮状态
    const isLastQuestion = questionIndex === totalQuestions;
    
    document.getElementById('next-text').textContent = isLastQuestion ? 'Submit ' : 'Next ';
}

// 上一题按钮事件
backBtn.addEventListener('click', () => {
    if (currentQuestionIndex > 1) {
        loadQuestion(currentQuestionIndex - 1);
    }
});

// 下一题/提交按钮事件
nextBtn.addEventListener('click', () => {
    if (currentQuestionIndex < totalQuestions) {
        loadQuestion(currentQuestionIndex + 1);
    } else {
        // 提交按钮功能
        submitAnswers();
    }
});

// 提交答案
function submitAnswers() {
    // 保存最后一题答案
    saveCurrentQuestionAnswer();
    
    // 检查答案
    const wrongQuestions = [];
    
    for (let i = 0; i < totalQuestions; i++) {
        const correctAnswer = allQuestions[i].answer;
        const userAnswer = userAnswers[i];
        
        // 统一答案格式为数组
        let correctArray;
        if (Array.isArray(correctAnswer)) {
            correctArray = [...correctAnswer].sort();
        } else if (typeof correctAnswer === 'string') {
            correctArray = [correctAnswer];
        } else {
            console.error(`Invalid answer format for question ${i+1}:`, correctAnswer);
            correctArray = [];
        }
        
        // 比较答案
        const userAnswerSorted = [...userAnswer].sort();
        
        if (userAnswerSorted.length !== correctArray.length ||
            !userAnswerSorted.every((val, idx) => val === correctArray[idx])) {
            wrongQuestions.push(i + 1); // 记录题号
        }
    }
    
    // 显示结果
    if (wrongQuestions.length === 0) {
        alert('恭喜！全部回答正确！');
    } else {
        const wrongCount = wrongQuestions.length;
        const wrongList = wrongQuestions.join(', ');
        alert(`您有 ${wrongCount} 道题回答错误：\n第 ${wrongList} 题`);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    loadQuestions();
});