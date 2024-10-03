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
document.getElementById('yellow-card').addEventListener(startEvent, () => addTimer('yellow', 120, 'イエローカード'));
document.getElementById('blue-card').addEventListener(startEvent, () => addTimer('blue', 60, 'ブルーカード'));

function addTimer(type, duration, label) {
  const timerId = Date.now();
  const inputField = `<input type="text" placeholder="背番号" class="small-input">`;
  const timerElement = `
    <div class="timer-item" id="timer-${timerId}">
      ${inputField}
      <div>${label}: <span id="time-${timerId}">${formatTime(duration)}</span></div>
    </div>`;
  
  timers.push({ id: timerId, duration, label, remainingTime: duration });
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
  timers.sort((a, b) => a.duration - b.duration);

  timers.forEach(timer => {
    const inputField = `<input type="text" placeholder="背番号" class="small-input">`;
    timerList.innerHTML += `
      <div class="timer-item" id="timer-${timer.id}">
        ${inputField}
        <div>${timer.label}: <span id="time-${timer.id}">${formatTime(timer.remainingTime)}</span></div>
      </div>`;
  });
}

// 時間をMM:SS形式にフォーマット
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
