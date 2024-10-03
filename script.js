// タッチデバイスかどうかを判定
const isTouchDevice = 'ontouchstart' in window;
const startEvent = isTouchDevice ? 'touchstart' : 'click';

let timers = [];
let gameInterval;
let gameTime = 0;
let gamePaused = false;
let violationIntervals = [];

// リアルタイムタイマーとゲームタイマーを同時にスタート
let realTimeInterval;
let realStartTime;

let myScore = 0;
let opponentScore = 0;

document.getElementById('my-score-increase').addEventListener(startEvent, () => {
  myScore += 10;
  updateScores();
});

document.getElementById('my-score-decrease').addEventListener(startEvent, () => {
  myScore = Math.max(0, myScore - 10); // スコアを0未満にしない
  updateScores();
});

document.getElementById('opponent-score-increase').addEventListener(startEvent, () => {
  opponentScore += 10;
  updateScores();
});

document.getElementById('opponent-score-decrease').addEventListener(startEvent, () => {
  opponentScore = Math.max(0, opponentScore - 10);
  updateScores();
});

function updateScores() {
  document.getElementById('my-score').textContent = myScore;
  document.getElementById('opponent-score').textContent = opponentScore;
}

document.getElementById('start-real-time').addEventListener(startEvent, () => {
  // リアルタイムタイマーのスタート
  if (!realTimeInterval) {
    realStartTime = new Date();
    realTimeInterval = setInterval(() => {
      const elapsed = new Date(new Date() - realStartTime);
      document.getElementById('real-time').textContent = elapsed.toISOString().substr(11, 8);
    }, 1000);

    // ゲームタイマーも同時にスタート
    if (!gameInterval) {
      gameInterval = setInterval(() => {
        gameTime++;
        updateGameTimeDisplay();
      }, 1000);
    }
  }
});

document.getElementById('increase-time').addEventListener(startEvent, () => {
  gameTime += 30; // ゲームタイマーを30秒増やす
  updateGameTimeDisplay();
});

document.getElementById('decrease-time').addEventListener(startEvent, () => {
  gameTime = Math.max(0, gameTime - 30); // ゲームタイマーを30秒減らす、負にはしない
  updateGameTimeDisplay();
});

document.getElementById('pause-game-time').addEventListener(startEvent, () => {
  clearInterval(gameInterval);
  pauseViolationTimers(); // 違反カードのタイマーも停止
  gamePaused = true;
});

document.getElementById('resume-game-time').addEventListener(startEvent, () => {
  if (!gamePaused) return; // 一時停止状態でないと再開しない

  gameInterval = setInterval(() => {
    gameTime++;
    updateGameTimeDisplay();
  }, 1000);
  resumeViolationTimers(); // 違反カードのタイマーも再開
  gamePaused = false;
});

// ゲームタイマーの表示を更新
function updateGameTimeDisplay() {
  document.getElementById('game-time').value = new Date(gameTime * 1000).toISOString().substr(11, 8);
}

// カスタム通知の表示
function showNotification(message) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.classList.remove('hidden');

  setTimeout(() => {
    notification.classList.add('hidden');
  }, 3000);
}

// 違反カードタイマーの追加
document.getElementById('red-card').addEventListener(startEvent, () => addTimer('red', 120, 'レッドカード'));
document.getElementById('yellow-card').addEventListener(startEvent, () => addTimer('yellow', 60, 'イエローカード')); // イエローカードは1分
document.getElementById('blue-card').addEventListener(startEvent, () => addTimer('blue', 60, 'ブルーカード'));

function addTimer(type, duration, label) {
  const timerId = Date.now();
  timers.push({ id: timerId, duration, label, remainingTime: duration, playerNumber: "" }); // プレイヤー番号フィールドを追加
  renderTimers();
  startCountdown(timerId, duration);
}

function startCountdown(timerId, duration) {
  let remainingTime = duration;
  const interval = setInterval(() => {
    remainingTime--;

    // タイマーが0になったら通知を表示し、タイマーを削除
    if (remainingTime <= 0) {
      clearInterval(interval);
      showNotification(`${document.getElementById(`time-${timerId}`).previousSibling.textContent}のタイマーが終了しました`);
      removeTimer(timerId);
    }

    // タイマーを更新
    document.getElementById(`time-${timerId}`).textContent = formatTime(remainingTime);
  }, 1000);

  violationIntervals.push({ timerId, interval, remainingTime });
}

// 違反カードのタイマーを停止
function pauseViolationTimers() {
  violationIntervals.forEach(timer => {
    clearInterval(timer.interval);
  });
}

// 違反カードのタイマーを再開
function resumeViolationTimers() {
  violationIntervals.forEach(timer => {
    startCountdown(timer.timerId, timer.remainingTime);
  });
}

// タイマーの削除
function removeTimer(timerId) {
  timers = timers.filter(timer => timer.id !== timerId);
  violationIntervals = violationIntervals.filter(timer => timer.timerId !== timerId);
  renderTimers();
}

// タイマーリストを表示
function renderTimers() {
  const timerList = document.getElementById('timer-list');
  timerList.innerHTML = '';

  // 残り時間でソート
  timers.sort((a, b) => a.remainingTime - b.remainingTime);

  timers.forEach(timer => {
    const inputField = `<input type="text" value="${timer.playerNumber}" placeholder="背番号" class="small-input" id="player-${timer.id}">`;
    timerList.innerHTML += `
      <div class="timer-item" id="timer-${timer.id}">
        ${inputField}
        <div>${timer.label}: <span id="time-${timer.id}">${formatTime(timer.remainingTime)}</span></div>
      </div>`;

    // イベントリスナーでプレイヤー番号の変更を監視し、変更を保存
    document.getElementById(`player-${timer.id}`).addEventListener('input', (event) => {
      const newPlayerNumber = event.target.value;
      const timerIndex = timers.findIndex(t => t.id === timer.id);
      if (timerIndex !== -1) {
        timers[timerIndex].playerNumber = newPlayerNumber; // プレイヤー番号を保存
      }
    });
  });
}

// 時間をMM:SS形式にフォーマット
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
