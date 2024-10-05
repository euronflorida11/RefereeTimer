// タッチデバイスかどうかを判定し、イベントを適切に設定
const startEvent = 'ontouchstart' in window ? 'touchstart' : 'click';

let timers = [];
let gameInterval;
let gameTime = 0;
let gamePaused = false; // ゲームタイマーの状態
let violationIntervals = {}; // 各タイマーごとのインターバル管理オブジェクト
let realTimeInterval;
let realStartTime;
let myScore = 0; // 自チームの得点
let opponentScore = 0; // 相手チームの得点

// ゲームタイマーの開始
function startGameTimer() {
  gameInterval = setInterval(() => {
    gameTime++;
    updateGameTimeDisplay();
  }, 1000);
}

// ゲームタイマーの一時停止
function pauseGameTimer() {
  clearInterval(gameInterval);
  pauseViolationTimers(); // 違反カードタイマーも停止
  gamePaused = true;
}

// ゲームタイマーの再開
function resumeGameTimer() {
  if (gamePaused) {
    startGameTimer(); // ゲームタイマーを再開
    resumeViolationTimers(); // 違反カードタイマーも再開
    gamePaused = false;
  }
}

// ゲームタイマーの表示を更新
function updateGameTimeDisplay() {
  document.getElementById('game-time').value = new Date(gameTime * 1000).toISOString().substr(11, 8);
}

// リアルタイムタイマーの開始
function startRealTimeTimer() {
  if (!realTimeInterval) {
    realStartTime = new Date();
    realTimeInterval = setInterval(() => {
      const elapsed = new Date(new Date() - realStartTime);
      document.getElementById('real-time').textContent = elapsed.toISOString().substr(11, 8);
    }, 1000);
    startGameTimer(); // ゲームタイマーも同時にスタート
  }
}

// カスタム通知の表示
function showNotification(message) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.classList.remove('hidden');
  setTimeout(() => notification.classList.add('hidden'), 3000);
}

// 自チームの得点機能の更新
function updateMyScore() {
  document.getElementById('my-score').textContent = myScore;
}

// 相手チームの得点機能の更新
function updateOpponentScore() {
  document.getElementById('opponent-score').textContent = opponentScore;
}

// 自チームの得点を増やす
function increaseMyScore() {
  myScore += 10;
  updateMyScore();
}

// 自チームの得点を減らす
function decreaseMyScore() {
  myScore = Math.max(0, myScore - 10); // 得点が0以下にならないように制御
  updateMyScore();
}

// 相手チームの得点を増やす
function increaseOpponentScore() {
  opponentScore += 10;
  updateOpponentScore();
}

// 相手チームの得点を減らす
function decreaseOpponentScore() {
  opponentScore = Math.max(0, opponentScore - 10); // 得点が0以下にならないように制御
  updateOpponentScore();
}

// 違反カードタイマーの追加
function addViolationTimer(type, duration, label) {
  const timerId = Date.now();
  timers.push({
    id: timerId,
    duration: duration,
    label: label,
    remainingTime: duration,
    active: false,  // タイマーが動作中かどうかのフラグ
    playerNumber: ""
  });

  if (!gamePaused) {
    startViolationCountdown(timerId); // ゲームタイマーが動作中なら違反カードタイマーも動作
  }

  renderTimers();
}

// 違反カードタイマーのカウントダウン開始
function startViolationCountdown(timerId) {
  const timer = timers.find(t => t.id === timerId);
  if (timer && !timer.active) {
    // タイマーが既に動作中でない場合のみカウントダウンを開始
    timer.active = true;
    violationIntervals[timerId] = setInterval(() => {
      timers = timers.map(t => {
        if (t.id === timerId) {
          t.remainingTime--;
          if (t.remainingTime <= 0) {
            clearInterval(violationIntervals[timerId]);
            delete violationIntervals[timerId];
            showNotification(`${t.label}のタイマーが終了しました`);
            timers = timers.filter(t => t.id !== timerId); // タイマーリストから削除
            renderTimers(); // タイマーが削除された後に再描画
          }
        }
        return t;
      });
      renderTimers(); // タイマーの残り時間を毎秒再描画
    }, 1000);
  }
}

// 違反カードタイマーの一時停止
function pauseViolationTimers() {
  Object.keys(violationIntervals).forEach(timerId => {
    clearInterval(violationIntervals[timerId]);
    // タイマーを一時停止する
    timers = timers.map(t => t.id === parseInt(timerId) ? { ...t, active: false } : t);
  });
}

// 違反カードタイマーの再開
function resumeViolationTimers() {
  timers.forEach(timer => {
    if (!timer.active && timer.remainingTime > 0) {
      // 一時停止されていたタイマーを再開
      startViolationCountdown(timer.id);
    }
  });
}

// 特定のタイマーを削除
function deleteTimer(timerId) {
  clearInterval(violationIntervals[timerId]);
  delete violationIntervals[timerId];
  timers = timers.filter(t => t.id !== timerId); // タイマーリストから削除
  renderTimers(); // 再描画
}

// タイマーリストの再描画
function renderTimers() {
  // 現在の背番号入力値を保持
  const playerNumbers = {};
  timers.forEach(timer => {
    const playerInput = document.getElementById(`player-${timer.id}`);
    if (playerInput) {
      playerNumbers[timer.id] = playerInput.value;
    }
  });

  const timerList = document.getElementById('timer-list');
  timerList.innerHTML = ''; // 既存のリストをクリア

  timers.forEach(timer => {
    const playerNumber = playerNumbers[timer.id] || timer.playerNumber; // 既存の入力値を使う
    const inputField = `<input type="text" value="${playerNumber}" placeholder="背番号" class="small-input" id="player-${timer.id}">`;
    const deleteButton = `<button class="delete-btn small-input" style="font-size: 12px; padding: 4px;" data-timer-id="${timer.id}">削除</button>`; // 各ボタンにデータ属性でタイマーIDを保存
    timerList.innerHTML += `
      <div class="timer-item" id="timer-${timer.id}">
        ${inputField}
        <div>${timer.label}: <span id="time-${timer.id}">${formatTime(timer.remainingTime)}</span></div>
        ${deleteButton}
      </div>`;
    document.getElementById(`player-${timer.id}`).addEventListener('input', (event) => {
      const newPlayerNumber = event.target.value;
      timers = timers.map(t => t.id === timer.id ? { ...t, playerNumber: newPlayerNumber } : t);
    });
  });

  // 各削除ボタンにイベントを設定（data-timer-id属性でタイマーIDを取得）
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener(startEvent, function() {
      const timerId = this.getAttribute('data-timer-id');
      deleteTimer(parseInt(timerId));
    });
  });
}

// 時間をMM:SS形式にフォーマット
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// イベントリスナーの設定
document.getElementById('start-real-time').addEventListener(startEvent, startRealTimeTimer);
document.getElementById('increase-time').addEventListener(startEvent, () => {
  gameTime += 30; 
  updateGameTimeDisplay();
});
document.getElementById('decrease-time').addEventListener(startEvent, () => {
  gameTime = Math.max(0, gameTime - 30);
  updateGameTimeDisplay();
});
document.getElementById('pause-game-time').addEventListener(startEvent, pauseGameTimer);
document.getElementById('resume-game-time').addEventListener(startEvent, resumeGameTimer);

// 得点機能のイベントリスナーの設定
document.getElementById('increase-score').addEventListener(startEvent, increaseMyScore);
document.getElementById('decrease-score').addEventListener(startEvent, decreaseMyScore);
document.getElementById('opponent-score-increase').addEventListener(startEvent, increaseOpponentScore);
document.getElementById('opponent-score-decrease').addEventListener(startEvent, decreaseOpponentScore);

// 違反カードタイマー追加のイベントリスナー
document.getElementById('red-card').addEventListener(startEvent, () => addViolationTimer('red', 120, 'レッドカード'));
document.getElementById('yellow-card').addEventListener(startEvent, () => addViolationTimer('yellow', 60, 'イエローカード'));
document.getElementById('blue-card').addEventListener(startEvent, () => addViolationTimer('blue', 60, 'ブルーカード'));
