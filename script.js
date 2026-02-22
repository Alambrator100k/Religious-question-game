// متغيرات اللعبة العامة
let gameMode = 'single';
let players = [];
let teams = {
    team1: { name: 'الفريق الأول', players: [], score: 0, turns: 0 },
    team2: { name: 'الفريق الثاني', players: [], score: 0, turns: 0 }
};
let currentQuestion = null;
let currentPlayer = null;
let currentTeam = null;
let spinning = false;
let questions = [...questionsDB];
let totalQuestionsCount = 10;
let questionsAsked = 0;
let lastPlayerIndex = -1;
let lastTeam = null;
let answerRevealed = false;
let answerMarked = false;
let questionActive = false;
let wheelStopped = true;

// تهيئة اللعبة
function showPlayerInput(mode) {
    gameMode = mode;
    document.getElementById('start-screen').classList.remove('active');
    document.getElementById('player-input-screen').classList.add('active');
    
    const titleElement = document.getElementById('input-title');
    document.getElementById('single-input').classList.add('hidden');
    document.getElementById('teams-input').classList.add('hidden');
    
    const playerCount = document.getElementById('modal-player-count')?.value || '4';
    const questionsCount = document.getElementById('modal-questions-count')?.value || '10';
    
    if (mode === 'single') {
        titleElement.textContent = 'أدخل أسماء اللاعبين';
        document.getElementById('single-input').classList.remove('hidden');
        document.getElementById('display-player-count').textContent = playerCount;
        document.getElementById('display-questions-count').textContent = questionsCount;
        updatePlayerInputs(parseInt(playerCount));
    } else {
        titleElement.textContent = 'أدخل بيانات الفرق';
        document.getElementById('teams-input').classList.remove('hidden');
        document.getElementById('display-questions-count-teams').textContent = questionsCount;
    }
}

function backToStart() {
    document.getElementById('player-input-screen').classList.remove('active');
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('start-screen').classList.add('active');
    resetGameState();
}

function updatePlayerInputs(count) {
    const container = document.getElementById('players-inputs-container');
    container.innerHTML = '';
    
    for (let i = 1; i <= count; i++) {
        const inputDiv = document.createElement('div');
        inputDiv.className = 'player-input-wrapper';
        inputDiv.innerHTML = `
            <i class="fas fa-user"></i>
            <input type="text" id="player${i}" placeholder="اسم اللاعب ${i}" class="ramadan-input" value="لاعب ${i}">
        `;
        container.appendChild(inputDiv);
    }
}

function openSettings() {
    document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettings() {
    document.getElementById('settings-modal').classList.add('hidden');
}

function saveSettings() {
    closeSettings();
    if (document.getElementById('player-input-screen').classList.contains('active')) {
        if (gameMode === 'single') {
            const playerCount = document.getElementById('modal-player-count').value;
            document.getElementById('display-player-count').textContent = playerCount;
            document.getElementById('display-questions-count').textContent = document.getElementById('modal-questions-count').value;
            updatePlayerInputs(parseInt(playerCount));
        } else {
            document.getElementById('display-questions-count-teams').textContent = document.getElementById('modal-questions-count').value;
        }
    }
}

function startGame() {
    totalQuestionsCount = parseInt(document.getElementById('modal-questions-count').value) || 10;
    
    let validInput = false;
    
    if (gameMode === 'single') {
        const playerCount = parseInt(document.getElementById('modal-player-count').value);
        players = [];
        
        for (let i = 1; i <= playerCount; i++) {
            const input = document.getElementById(`player${i}`);
            const name = input ? input.value.trim() : '';
            if (name) {
                players.push({ name, score: 0, turns: 0 });
            } else {
                players.push({ name: `لاعب ${i}`, score: 0, turns: 0 });
            }
        }
        
        if (players.length >= 2) {
            validInput = true;
        }
    } else {
        const team1Name = document.getElementById('team1-name').value.trim() || 'الفريق الأول';
        const team2Name = document.getElementById('team2-name').value.trim() || 'الفريق الثاني';
        
        const team1Players = [
            document.getElementById('team1-player1').value.trim() || 'لاعب 1',
            document.getElementById('team1-player2').value.trim() || 'لاعب 2',
            document.getElementById('team1-player3').value.trim(),
            document.getElementById('team1-player4').value.trim()
        ].filter(name => name);
        
        const team2Players = [
            document.getElementById('team2-player1').value.trim() || 'لاعب 3',
            document.getElementById('team2-player2').value.trim() || 'لاعب 4',
            document.getElementById('team2-player3').value.trim(),
            document.getElementById('team2-player4').value.trim()
        ].filter(name => name);
        
        if (team1Players.length > 0 && team2Players.length > 0) {
            teams.team1 = { name: team1Name, players: team1Players, score: 0, turns: 0 };
            teams.team2 = { name: team2Name, players: team2Players, score: 0, turns: 0 };
            validInput = true;
        }
    }
    
    if (validInput) {
        questionsAsked = 0;
        lastPlayerIndex = -1;
        lastTeam = null;
        answerRevealed = false;
        answerMarked = false;
        questionActive = false;
        wheelStopped = true;
        
        createWheel();
        
        document.getElementById('player-input-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
        
        updateScores();
        updateQuestionsCounter();
        enableAllButtons();
        
        document.getElementById('question-display').innerHTML = `
            <i class="fas fa-question-circle"></i>
            اضغط على لف العجلة لبدء اللعبة
        `;
        document.getElementById('answerSection').classList.add('hidden');
        document.getElementById('results').classList.add('hidden');
        document.getElementById('currentPlayer').textContent = '-';
        document.getElementById('currentPlayerShort').textContent = '-';
    }
}

function enableAllButtons() {
    document.getElementById('spinButton').disabled = false;
    document.getElementById('showAnswerBtn').disabled = false;
    document.getElementById('correctBtn').disabled = false;
    document.getElementById('wrongBtn').disabled = false;
    document.getElementById('showAnswerBtn').style.opacity = '1';
}

function createWheel() {
    const wheelSegments = document.getElementById('wheelSegments');
    wheelSegments.innerHTML = '';
    
    let items = [];
    if (gameMode === 'single') {
        items = players.map(p => p.name);
    } else {
        items = [
            ...teams.team1.players.map(p => ({ name: p, team: 'team1' })),
            ...teams.team2.players.map(p => ({ name: p, team: 'team2' }))
        ];
    }
    
    const angleStep = 360 / items.length;
    
    items.forEach((item, index) => {
        const segment = document.createElement('div');
        segment.className = 'segment';
        const playerName = typeof item === 'string' ? item : item.name;
        segment.textContent = playerName;
        
        const rotate = index * angleStep;
        segment.style.transform = `rotate(${rotate}deg) skewY(${90 - angleStep}deg)`;
        segment.style.transformOrigin = '100% 100%';
        
        wheelSegments.appendChild(segment);
    });
    
    wheelSegments.items = items;
}

function spinWheel() {
    if (spinning || questionActive || !wheelStopped) return;
    
    spinning = true;
    wheelStopped = false;
    document.getElementById('spinButton').disabled = true;
    
    answerRevealed = false;
    answerMarked = false;
    questionActive = true;
    
    document.getElementById('answerSection').classList.add('hidden');
    
    const wheel = document.getElementById('playerWheel');
    
    wheel.style.transition = 'none';
    void wheel.offsetHeight;
    wheel.style.transition = 'transform 4s cubic-bezier(0.25, 0.1, 0.15, 1)';
    
    const minSpins = 12;
    const maxSpins = 18;
    const spins = minSpins + Math.random() * (maxSpins - minSpins);
    const randomAngle = Math.random() * 360;
    const spinDegrees = 360 * spins + randomAngle;
    
    wheel.style.transform = `rotate(${spinDegrees}deg)`;
    
    setTimeout(() => {
        spinning = false;
        wheelStopped = true;
        
        const items = gameMode === 'single' ? 
            players.map(p => p.name) : 
            [...teams.team1.players.map(p => ({ name: p, team: 'team1' })), 
             ...teams.team2.players.map(p => ({ name: p, team: 'team2' }))];
        
        const finalRotation = spinDegrees % 360;
        const segmentAngle = 360 / items.length;
        
        // حساب اللاعب الذي يشير إليه المؤشر العلوي
        // نضيف نصف زاوية القطاع للحصول على منتصف القطاع
        let selectedIndex = Math.floor(((360 - finalRotation + 90 + segmentAngle/2) % 360) / segmentAngle);
        if (selectedIndex >= items.length) selectedIndex = 0;
        
        if (gameMode === 'single') {
            if (items.length > 2) {
                let attempts = 0;
                while (selectedIndex === lastPlayerIndex && attempts < items.length * 2) {
                    selectedIndex = (selectedIndex + 1) % items.length;
                    attempts++;
                }
            }
            
            currentPlayer = players[selectedIndex];
            currentPlayer.turns = (currentPlayer.turns || 0) + 1;
            lastPlayerIndex = selectedIndex;
            document.getElementById('currentPlayer').textContent = currentPlayer.name;
            document.getElementById('currentPlayerShort').textContent = currentPlayer.name;
            
        } else {
            const selectedPlayer = items[selectedIndex];
            currentTeam = selectedPlayer.team;
            lastTeam = currentTeam;
            
            if (currentTeam === 'team1') {
                teams.team1.turns++;
                document.getElementById('currentPlayer').innerHTML = 
                    `${teams.team1.name}: ${selectedPlayer.name}`;
                document.getElementById('currentPlayerShort').textContent = 
                    teams.team1.name.length > 8 ? teams.team1.name.substring(0, 8) + '...' : teams.team1.name;
            } else {
                teams.team2.turns++;
                document.getElementById('currentPlayer').innerHTML = 
                    `${teams.team2.name}: ${selectedPlayer.name}`;
                document.getElementById('currentPlayerShort').textContent = 
                    teams.team2.name.length > 8 ? teams.team2.name.substring(0, 8) + '...' : teams.team2.name;
            }
        }
        
        askQuestion();
        
    }, 4000);
}

function askQuestion() {
    if (questions.length === 0) {
        questions = [...questionsDB];
    }
    
    const randomIndex = Math.floor(Math.random() * questions.length);
    currentQuestion = questions[randomIndex];
    
    document.getElementById('question-display').innerHTML = `
        <i class="fas fa-question-circle"></i>
        ${currentQuestion.question}
    `;
    document.getElementById('answerSection').classList.remove('hidden');
    document.getElementById('answer-box').classList.add('hidden');
    document.getElementById('showAnswerBtn').disabled = false;
    document.getElementById('showAnswerBtn').style.opacity = '1';
    
    document.getElementById('correctBtn').disabled = false;
    document.getElementById('wrongBtn').disabled = false;
    
    const teamButtons = document.getElementById('teamButtons');
    if (gameMode === 'teams') {
        teamButtons.innerHTML = `
            <button onclick="selectTeam('team1')" class="team-btn team1-btn">
                <i class="fas fa-star"></i> ${teams.team1.name}
            </button>
            <button onclick="selectTeam('team2')" class="team-btn team2-btn">
                <i class="fas fa-star"></i> ${teams.team2.name}
            </button>
        `;
        teamButtons.classList.remove('hidden');
    } else {
        teamButtons.classList.add('hidden');
    }
}

function selectTeam(team) {
    currentTeam = team;
    const teamName = team === 'team1' ? teams.team1.name : teams.team2.name;
    document.getElementById('currentPlayer').innerHTML = teamName;
    document.getElementById('currentPlayerShort').textContent = 
        teamName.length > 8 ? teamName.substring(0, 8) + '...' : teamName;
}

function showAnswer() {
    if (currentQuestion && !answerRevealed && !answerMarked) {
        answerRevealed = true;
        document.getElementById('correct-answer').textContent = currentQuestion.answer;
        document.getElementById('answer-box').classList.remove('hidden');
        document.getElementById('showAnswerBtn').disabled = true;
        document.getElementById('showAnswerBtn').style.opacity = '0.5';
    }
}

function markAnswer(isCorrect) {
    if (answerMarked || !currentQuestion) return;
    
    answerMarked = true;
    questionActive = false;
    
    document.getElementById('correctBtn').disabled = true;
    document.getElementById('wrongBtn').disabled = true;
    document.getElementById('showAnswerBtn').disabled = true;
    
    if (isCorrect) {
        if (gameMode === 'single' && currentPlayer) {
            currentPlayer.score += 1;
        } else if (gameMode === 'teams' && currentTeam) {
            teams[currentTeam].score += 1;
        }
    }
    
    questionsAsked++;
    
    updateScores();
    updateQuestionsCounter();
    
    if (questionsAsked >= totalQuestionsCount) {
        setTimeout(() => {
            showResults();
        }, 500);
    } else {
        setTimeout(() => {
            document.getElementById('spinButton').disabled = false;
            answerRevealed = false;
            answerMarked = false;
        }, 1500);
    }
}

function updateQuestionsCounter() {
    document.getElementById('questions-counter').textContent = 
        `${questionsAsked + 1}/${totalQuestionsCount}`;
}

function updateScores() {
    const scoreDisplay = document.getElementById('score-display');
    
    if (gameMode === 'single') {
        scoreDisplay.innerHTML = players.map(p => 
            `<div class="score-item"><i class="fas fa-star"></i> ${p.name}: ${p.score}</div>`
        ).join('');
    } else {
        scoreDisplay.innerHTML = `
            <div class="score-item"><i class="fas fa-star"></i> ${teams.team1.name}: ${teams.team1.score}</div>
            <div class="score-item"><i class="fas fa-star"></i> ${teams.team2.name}: ${teams.team2.score}</div>
        `;
    }
}

function showResults() {
    const resultsDiv = document.getElementById('results');
    const finalScores = document.getElementById('final-scores');
    
    if (gameMode === 'single') {
        const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
        finalScores.innerHTML = sortedPlayers.map((p, index) => {
            let medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📋';
            return `<p>${medal} ${index + 1}. ${p.name}: ${p.score} نقطة</p>`;
        }).join('');
    } else {
        const winner = teams.team1.score > teams.team2.score ? teams.team1 : 
                      (teams.team2.score > teams.team1.score ? teams.team2 : null);
        
        let resultHTML = winner ? 
            `<p class="winner">🏆 الفائز: ${winner.name} 🏆</p>` : 
            `<p class="winner">🤝 تعادل! 🤝</p>`;
        
        resultHTML += `
            <p>⭐ ${teams.team1.name}: ${teams.team1.score} نقطة</p>
            <p>⭐ ${teams.team2.name}: ${teams.team2.score} نقطة</p>
        `;
        
        finalScores.innerHTML = resultHTML;
    }
    
    resultsDiv.classList.remove('hidden');
    document.getElementById('spinButton').disabled = true;
}

function resetGameState() {
    players = [];
    teams = {
        team1: { name: 'الفريق الأول', players: [], score: 0, turns: 0 },
        team2: { name: 'الفريق الثاني', players: [], score: 0, turns: 0 }
    };
    questionsAsked = 0;
    lastPlayerIndex = -1;
    lastTeam = null;
    answerRevealed = false;
    answerMarked = false;
    questionActive = false;
    wheelStopped = true;
    currentPlayer = null;
    currentTeam = null;
}

function resetGame() {
    resetGameState();
    backToStart();
}

// تهيئة اللعبة
document.addEventListener('DOMContentLoaded', () => {
    const modalPlayerCount = document.getElementById('modal-player-count');
    modalPlayerCount.innerHTML = '';
    for (let i = 2; i <= 8; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i} لاعبين`;
        if (i === 4) option.selected = true;
        modalPlayerCount.appendChild(option);
    }
    
    const modalQuestionsCount = document.getElementById('modal-questions-count');
    modalQuestionsCount.innerHTML = '';
    [5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 250].forEach(num => {
        const option = document.createElement('option');
        option.value = num;
        option.textContent = `${num} أسئلة`;
        if (num === 10) option.selected = true;
        modalQuestionsCount.appendChild(option);
    });
    
    console.log('🌙 رمضان كويز جاهز!');
});