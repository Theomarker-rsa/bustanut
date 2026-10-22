(() => {
  "use strict";

  const STORAGE_KEY = "funzone-progress-v1";
  const today = new Date().toLocaleDateString("en-CA");
  const defaultState = {
    points: 0, gamesPlayed: 0, wins: 0, challenges: {}, badges: [],
    rps: { player: 0, computer: 0 }, ttt: { player: 0, computer: 0, draws: 0 },
    guessBest: null, memoryBest: null, reactionBest: null,
    clickBest: 0, quizBest: 0, streak: 0, lastVisit: null, sound: false, theme: "dark",
    featuredName: null
  };
  let state;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    state = { ...defaultState, ...saved };
    state.rps = { ...defaultState.rps, ...(saved.rps || {}) };
    state.ttt = { ...defaultState.ttt, ...(saved.ttt || {}) };
    state.challenges = saved.challenges || {};
    state.badges = Array.isArray(saved.badges) ? saved.badges : [];
  } catch (error) {
    console.warn("FUNZONE could not read saved progress.", error);
    state = { ...defaultState, rps: { ...defaultState.rps }, ttt: { ...defaultState.ttt }, challenges: {}, badges: [] };
  }
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  let toastTimer;
  let audioContext;
  let activeGenerator = "activity";
  let currentQuestion = null;
  let quizScore = 0;
  let quizIndex = 0;
  let tttBoard = Array(9).fill("");
  let tttMode = "ai";
  let tttTurn = "X";
  let tttLocked = false;
  let memoryValues = [];
  let memoryOpen = [];
  let memoryMatches = 0;
  let memoryMoves = 0;
  let memoryLocked = false;
  let guessNumber = newGuess();
  let guessCount = 0;
  let reactionTimeout;
  let reactionStart = 0;
  let clickTimer;
  let clicks = 0;
  let clickActive = false;

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (error) { console.warn("FUNZONE could not save progress.", error); showToast("Progress could not be saved on this device."); }
  }
  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 2500);
  }
  function sound(frequency = 520, duration = .09, type = "sine") {
    if (!state.sound) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === "suspended") audioContext.resume();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = type; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.06, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
      oscillator.connect(gain); gain.connect(audioContext.destination);
      oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
    } catch (error) { console.warn("Audio feedback is unavailable.", error); }
  }
  function confetti() {
    const layer = $("#confettiLayer");
    const colors = ["#a178ff", "#fa65c6", "#64b6ff", "#72e6b4", "#ffd36e"];
    for (let i = 0; i < 55; i++) {
      const piece = document.createElement("i");
      piece.className = "confetti";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = `${Math.random() * .5}s`;
      piece.style.animationDuration = `${1.2 + Math.random() * 1.3}s`;
      layer.append(piece);
      setTimeout(() => piece.remove(), 2800);
    }
  }
  function award(points, won = false) {
    state.points += points;
    state.gamesPlayed += 1;
    if (won) { state.wins += 1; sound(740, .16); confetti(); }
    else sound(460, .08);
    updateProgress();
    save();
  }
  function addPoints(points) {
    state.points += points;
    updateProgress();
    save();
  }
  function unlockBadge(id) {
    if (!state.badges.includes(id)) {
      state.badges.push(id);
      save();
      showToast("New badge unlocked! ✨");
      sound(880, .18, "triangle");
      confetti();
    }
  }
  function updateProgress() {
    $("#pointsTotal").textContent = state.points;
    const level = Math.floor(state.points / 100) + 1;
    const intoLevel = state.points % 100;
    const names = ["Fun Rookie", "Vibe Starter", "Joy Seeker", "Fun Legend", "Certified Icon"];
    $("#levelName").textContent = names[Math.min(level - 1, names.length - 1)];
    $("#levelPoints").textContent = `${intoLevel} / 100 XP`;
    $("#levelProgress").style.width = `${intoLevel}%`;
    $("#rewardNote").textContent = intoLevel === 0 && state.points > 0 ? "New level unlocked. You're on a roll!" : `${100 - intoLevel} XP to your next level.`;
    const badgeMeta = [
      ["first", state.gamesPlayed > 0], ["winner", state.wins > 0],
      ["streak", state.streak >= 3], ["collector", Object.keys(state.challenges).length >= 3]
    ];
    badgeMeta.forEach(([id, earned]) => {
      if (earned) unlockBadge(id);
      $(`[data-badge="${id}"]`).classList.toggle("locked", !state.badges.includes(id));
    });
    $("#badgeCount").textContent = `${state.badges.length}/4`;
    renderChallenges();
  }
  function dailyVisit() {
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");
    if (state.lastVisit !== today) {
      state.streak = state.lastVisit === yesterday ? state.streak + 1 : 1;
      state.lastVisit = today;
      state.challenges = {};
      save();
    }
  }

  const featured = [
    { emoji: "⚡", tag: "QUICK GAME", name: "Reflex rush", description: "Think you're quick? Put your reflexes to the test.", target: "games", game: "reaction" },
    { emoji: "🧠", tag: "BRAIN SNACK", name: "Memory match", description: "Flip a few cards and give your brain a little workout.", target: "games", game: "memory" },
    { emoji: "🎲", tag: "RANDOM FUN", name: "A plot twist", description: "Get an unexpected idea to make your day more interesting.", target: "random", game: "random" },
    { emoji: "⭕", tag: "QUICK GAME", name: "Tic-tac-toe", description: "One tiny board. One mighty battle. You in?", target: "games", game: "ttt" },
    { emoji: "💡", tag: "TRIVIA TIME", name: "Trivia pop", description: "Prove your brain has been paying attention.", target: "games", game: "quiz" }
  ];
  let featuredItem;
  function showFeatured() {
    const previousName = featuredItem?.name || state.featuredName;
    const choices = featured.filter(item => item.name !== previousName);
    featuredItem = choices[Math.floor(Math.random() * choices.length)];
    state.featuredName = featuredItem.name;
    $("#featuredEmoji").textContent = featuredItem.emoji;
    $("#featuredTag").textContent = featuredItem.tag;
    $("#featuredName").textContent = featuredItem.name;
    $("#featuredDescription").textContent = featuredItem.description;
    $("#featuredVisual").style.background = `radial-gradient(circle at 50% 55%,${featuredItem.game === "reaction" ? "#49d69544" : "#9457ed4d"},transparent 65%),linear-gradient(135deg,#372552,#1a1628)`;
    $("#featuredCard").dataset.target = featuredItem.target;
    $("#featuredCard").dataset.game = featuredItem.game;
    save();
  }

  const challenges = [
    { id: "game", icon: "🎮", title: "Try a new game", description: "Play any mini-game today.", reward: 20, type: "game" },
    { id: "generator", icon: "🎲", title: "Follow the fun", description: "Generate an idea in I'm bored!.", reward: 15, type: "generator" },
    { id: "win", icon: "🏆", title: "Take home a win", description: "Win a round in any game.", reward: 25, type: "win" }
  ];
  function renderChallenges() {
    const list = $("#challengeList");
    list.replaceChildren();
    challenges.forEach(challenge => {
      const done = state.challenges[challenge.id] === today;
      const article = document.createElement("article");
      article.className = "challenge-item";
      article.innerHTML = `<span class="challenge-icon">${challenge.icon}</span><span class="challenge-info"><strong>${challenge.title}</strong><small>${challenge.description}</small><span class="challenge-progress"><i style="width:${done ? 100 : 0}%"></i></span></span><span class="${done ? "challenge-done" : "challenge-reward"}">${done ? "✓ Done" : `+${challenge.reward} XP`}</span>`;
      list.append(article);
    });
    const players = [
      { icon: "🦊", name: "pixelpanda", score: 420 }, { icon: "🐸", name: "tinychaos", score: 365 },
      { icon: "🦄", name: "moonmuffin", score: 290 }, { icon: "🐙", name: "you", score: state.points, self: true }
    ].sort((a, b) => b.score - a.score);
    const leaderboard = $("#leaderboardList");
    leaderboard.replaceChildren();
    players.forEach((player, index) => {
      const row = document.createElement("div");
      row.className = "leader-row";
      row.innerHTML = `<span class="leader-rank">0${index + 1}</span><span class="leader-avatar">${player.icon}</span><span class="leader-name">${player.name}${player.self ? " (you)" : ""}</span><span class="leader-score">${player.score} XP</span>`;
      leaderboard.append(row);
    });
  }
  function completeChallenge(id) {
    const challenge = challenges.find(item => item.id === id);
    if (!challenge || state.challenges[id] === today) return;
    state.challenges[id] = today;
    addPoints(challenge.reward);
    if (Object.keys(state.challenges).length >= 3) unlockBadge("collector");
    showToast(`Challenge complete! +${challenge.reward} XP`);
    confetti();
    updateProgress();
  }
  function onGame(won = false) {
    award(won ? 15 : 5, won);
    completeChallenge("game");
    if (won) completeChallenge("win");
  }

  function newGuess() { return Math.floor(Math.random() * 100) + 1; }
  function resetGuess() { guessNumber = newGuess(); guessCount = 0; $("#guessInput").value = ""; $("#guessFeedback").textContent = "I've picked a number. Go!"; $("#guessAttempts").textContent = "0 guesses"; $("#guessBest").textContent = `Best: ${state.guessBest === null ? "—" : `${state.guessBest} guesses`}`; }
  $("#guessForm").addEventListener("submit", event => {
    event.preventDefault();
    const input = $("#guessInput");
    const value = Number(input.value);
    if (!Number.isInteger(value) || value < 1 || value > 100) { $("#guessFeedback").textContent = "Pick a whole number from 1 to 100."; return; }
    guessCount++;
    $("#guessAttempts").textContent = `${guessCount} ${guessCount === 1 ? "guess" : "guesses"}`;
    if (value === guessNumber) {
      $("#guessFeedback").textContent = `You got it in ${guessCount}! The number was ${guessNumber}.`;
      state.guessBest = state.guessBest === null ? guessCount : Math.min(state.guessBest, guessCount);
      $("#guessBest").textContent = `Best: ${state.guessBest} ${state.guessBest === 1 ? "guess" : "guesses"}`;
      onGame(guessCount <= 7);
      setTimeout(resetGuess, 2800);
    } else $("#guessFeedback").textContent = value < guessNumber ? "Higher! Give it another shot." : "Lower! You're getting warmer.";
    input.value = ""; input.focus();
  });

  function playRps(choice) {
    const options = ["rock", "paper", "scissors"];
    const computer = options[Math.floor(Math.random() * 3)];
    const result = choice === computer ? "tie" : ((choice === "rock" && computer === "scissors") || (choice === "paper" && computer === "rock") || (choice === "scissors" && computer === "paper")) ? "win" : "lose";
    const words = { rock: "✊ Rock", paper: "✋ Paper", scissors: "✌️ Scissors" };
    $("#rpsFeedback").textContent = result === "tie" ? `Both picked ${words[choice].toLowerCase()} — tie!` : `${words[choice]} beats ${words[computer].toLowerCase()}${result === "win" ? " — you win!" : " — CPU wins!"}`;
    if (result === "win") { state.rps.player++; onGame(true); }
    else if (result === "lose") { state.rps.computer++; onGame(false); }
    else { award(3); completeChallenge("game"); }
    $("#rpsPlayerScore").textContent = state.rps.player; $("#rpsComputerScore").textContent = state.rps.computer; save();
  }
  $$("[data-rps]").forEach(button => button.addEventListener("click", () => playRps(button.dataset.rps)));
  function resetRps() { state.rps = { player: 0, computer: 0 }; $("#rpsPlayerScore").textContent = "0"; $("#rpsComputerScore").textContent = "0"; $("#rpsFeedback").textContent = "Choose your move!"; save(); }

  function renderTtt() {
    const board = $("#tttBoard");
    board.replaceChildren();
    tttBoard.forEach((value, index) => {
      const cell = document.createElement("button");
      cell.className = `ttt-cell ${value === "O" ? "o-cell" : ""}`;
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", `Cell ${index + 1}${value ? `, ${value}` : ", empty"}`);
      cell.textContent = value;
      cell.disabled = Boolean(value) || tttLocked;
      cell.addEventListener("click", () => moveTtt(index));
      board.append(cell);
    });
  }
  function winner(board) {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a,b,c] of lines) if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    return board.every(Boolean) ? "draw" : null;
  }
  function endTtt(result) {
    tttLocked = true;
    renderTtt();
    if (result === "draw") state.ttt.draws++;
    else if (result === "X") state.ttt.player++;
    else state.ttt.computer++;
    $("#tttScore").textContent = `${tttMode === "friend" ? "X" : "You"} ${state.ttt.player} : ${state.ttt.computer} ${tttMode === "friend" ? "O" : "CPU"} · ${state.ttt.draws} draw${state.ttt.draws === 1 ? "" : "s"}`;
    $("#tttFeedback").textContent = result === "draw" ? "It's a draw. Nicely played!" : tttMode === "friend" ? `Player ${result} wins this round!` : result === "X" ? "You win! That's a clean sweep." : "CPU got this one. Rematch?";
    if (result === "X" || (result === "O" && tttMode === "friend")) onGame(true);
    else if (result === "O") onGame(false);
    else { award(3); completeChallenge("game"); }
    setTimeout(resetTtt, 2200);
  }
  function moveTtt(index) {
    if (tttLocked || tttBoard[index]) return;
    tttBoard[index] = tttTurn;
    let result = winner(tttBoard);
    if (result) { endTtt(result); return; }
    if (tttMode === "friend") {
      tttTurn = tttTurn === "X" ? "O" : "X";
      $("#tttFeedback").textContent = `Player ${tttTurn}'s turn`;
      renderTtt();
      return;
    }
    const available = tttBoard.map((value, i) => value ? -1 : i).filter(i => i !== -1);
    const winningMove = mark => {
      for (const cell of available) {
        const possible = [...tttBoard];
        possible[cell] = mark;
        if (winner(possible) === mark) return cell;
      }
      return null;
    };
    const move = winningMove("O") ?? winningMove("X") ?? available[Math.floor(Math.random() * available.length)];
    if (move !== undefined) tttBoard[move] = "O";
    result = winner(tttBoard);
    if (result) { endTtt(result); return; }
    $("#tttFeedback").textContent = "Your turn — X";
    renderTtt();
  }
  function resetTtt() { tttBoard = Array(9).fill(""); tttTurn = "X"; tttLocked = false; $("#tttFeedback").textContent = "Your turn — X"; $("#tttScore").textContent = `${tttMode === "friend" ? "X" : "You"} ${state.ttt.player} : ${state.ttt.computer} ${tttMode === "friend" ? "O" : "CPU"} · ${state.ttt.draws} draw${state.ttt.draws === 1 ? "" : "s"}`; renderTtt(); }
  $$(".mode-button").forEach(button => button.addEventListener("click", () => {
    tttMode = button.dataset.mode;
    $$(".mode-button").forEach(item => item.classList.toggle("selected", item === button));
    resetTtt();
  }));

  const memoryEmojis = ["🍓", "🪐", "🍄", "🦋", "🍕", "🐸"];
  function initMemory() {
    memoryValues = [...memoryEmojis, ...memoryEmojis].sort(() => Math.random() - .5);
    memoryOpen = []; memoryMatches = 0; memoryMoves = 0; memoryLocked = false;
    $("#memoryMoves").textContent = "0 moves"; $("#memoryMatches").textContent = "0 / 6 matched"; $("#memoryFeedback").textContent = "Find the matching pairs!";
    $("#memoryBest").textContent = `Best: ${state.memoryBest === null ? "—" : state.memoryBest}`;
    const board = $("#memoryBoard"); board.replaceChildren();
    memoryValues.forEach((emoji, index) => {
      const card = document.createElement("button");
      card.className = "memory-card"; card.setAttribute("aria-label", `Hidden card ${index + 1}`); card.dataset.index = index;
      card.addEventListener("click", () => flipMemory(index));
      board.append(card);
    });
  }
  function flipMemory(index) {
    if (memoryLocked || memoryOpen.includes(index) || $$(".memory-card")[index].classList.contains("matched")) return;
    const card = $$(".memory-card")[index]; card.classList.add("flipped"); card.textContent = memoryValues[index]; card.setAttribute("aria-label", memoryValues[index]);
    memoryOpen.push(index); sound(560, .06);
    if (memoryOpen.length === 2) {
      memoryMoves++; $("#memoryMoves").textContent = `${memoryMoves} ${memoryMoves === 1 ? "move" : "moves"}`;
      const [first, second] = memoryOpen;
      if (memoryValues[first] === memoryValues[second]) {
        [first, second].forEach(i => $$(".memory-card")[i].classList.add("matched"));
        memoryMatches++; $("#memoryMatches").textContent = `${memoryMatches} / 6 matched`; memoryOpen = [];
        if (memoryMatches === 6) {
          $("#memoryFeedback").textContent = `All matched in ${memoryMoves} moves. Brilliant!`;
          state.memoryBest = state.memoryBest === null ? memoryMoves : Math.min(state.memoryBest, memoryMoves);
          $("#memoryBest").textContent = `Best: ${state.memoryBest}`;
          onGame(true);
        } else $("#memoryFeedback").textContent = "It's a match! Keep going.";
      } else {
        memoryLocked = true; $("#memoryFeedback").textContent = "No match. Try to remember those!";
        setTimeout(() => {
          [first, second].forEach(i => { const item = $$(".memory-card")[i]; item.classList.remove("flipped"); item.textContent = ""; item.setAttribute("aria-label", `Hidden card ${i + 1}`); });
          memoryOpen = []; memoryLocked = false;
        }, 750);
      }
    }
  }

  const reactionPad = $("#reactionPad");
  function resetReaction() { clearTimeout(reactionTimeout); reactionPad.dataset.state = "idle"; $("#reactionText").textContent = "Start test"; $("#reactionFeedback").innerHTML = `Your best: <span id="reactionBest">${state.reactionBest === null ? "—" : `${state.reactionBest} ms`}</span>`; }
  reactionPad.addEventListener("click", () => {
    const current = reactionPad.dataset.state;
    if (current === "idle" || current === "result") {
      reactionPad.dataset.state = "waiting"; $("#reactionText").textContent = "Wait for green..."; $("#reactionFeedback").textContent = "Don't click too soon!";
      reactionTimeout = setTimeout(() => { reactionPad.dataset.state = "ready"; $("#reactionText").textContent = "CLICK NOW!"; reactionStart = performance.now(); }, 900 + Math.random() * 2200);
    } else if (current === "waiting") {
      clearTimeout(reactionTimeout); reactionPad.dataset.state = "result"; $("#reactionText").textContent = "Too soon!"; $("#reactionFeedback").textContent = "False start — wait for green."; sound(180, .15, "square");
    } else if (current === "ready") {
      const ms = Math.round(performance.now() - reactionStart);
      reactionPad.dataset.state = "result"; $("#reactionText").textContent = `${ms} ms`; $("#reactionFeedback").innerHTML = `Your best: <span id="reactionBest">${state.reactionBest === null ? "—" : `${state.reactionBest} ms`}</span>`;
      if (state.reactionBest === null || ms < state.reactionBest) { state.reactionBest = ms; $("#reactionBest").textContent = `${ms} ms`; }
      onGame(ms < 350); save();
    }
  });

  function resetClick() {
    clearInterval(clickTimer); clicks = 0; clickActive = false;
    $("#clickCount").textContent = "0"; $("#clickButton").textContent = "Start clicking!";
    $("#clickFeedback").textContent = "Ready when you are."; $("#clickBest").textContent = `Best: ${state.clickBest}`;
    $("#clickButton").disabled = false;
  }
  $("#clickButton").addEventListener("click", () => {
    if (!clickActive) {
      clickActive = true; clicks = 0; $("#clickCount").textContent = "0"; $("#clickButton").textContent = "CLICK!"; $("#clickFeedback").textContent = "Go go go!";
      const end = Date.now() + 10000;
      clickTimer = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
        $("#clickFeedback").textContent = `${remaining}s left — keep going!`;
        if (remaining <= 0) {
          clearInterval(clickTimer); clickActive = false; $("#clickButton").textContent = "Play again";
          $("#clickFeedback").textContent = `Time! You clicked ${clicks} times.`;
          const won = clicks >= 70;
          if (clicks > state.clickBest) state.clickBest = clicks;
          $("#clickBest").textContent = `Best: ${state.clickBest}`;
          onGame(won); save();
        }
      }, 150);
    } else {
      clicks++; $("#clickCount").textContent = clicks; sound(350 + Math.min(clicks * 3, 300), .025);
    }
  });

  const questions = [
    { q: "Which planet has the most moons (confirmed)?", a: ["Saturn", "Mars", "Venus"], correct: 0 },
    { q: "What is the only mammal capable of true flight?", a: ["Flying squirrel", "Bat", "Sugar glider"], correct: 1 },
    { q: "How many hearts does an octopus have?", a: ["One", "Two", "Three"], correct: 2 },
    { q: "Which animal has fingerprints remarkably like humans?", a: ["Koala", "Panda", "Dolphin"], correct: 0 },
    { q: "What is the smallest country in the world?", a: ["Monaco", "Vatican City", "Malta"], correct: 1 },
    { q: "Which sea creature has blue blood?", a: ["Jellyfish", "Horseshoe crab", "Sea turtle"], correct: 1 },
    { q: "How many sides does a snowflake usually have?", a: ["Five", "Six", "Eight"], correct: 1 }
  ];
  function nextQuestion() {
    if (quizIndex >= questions.length) { quizIndex = 0; questions.sort(() => Math.random() - .5); }
    currentQuestion = questions[quizIndex++];
    $("#quizQuestion").textContent = currentQuestion.q;
    const options = $("#quizOptions"); options.replaceChildren();
    currentQuestion.a.forEach((answer, index) => {
      const button = document.createElement("button"); button.className = "quiz-option"; button.textContent = answer;
      button.addEventListener("click", () => {
        $$(".quiz-option", options).forEach(item => item.disabled = true);
        if (index === currentQuestion.correct) {
          quizScore++; $("#quizScore").textContent = quizScore; $("#quizFeedback").textContent = "Correct! Big brain energy. ✨";
          state.quizBest = Math.max(state.quizBest, quizScore); onGame(true);
        } else { $("#quizFeedback").textContent = `Not quite — it was ${currentQuestion.a[currentQuestion.correct]}.`; onGame(false); }
        setTimeout(nextQuestion, 1300);
      });
      options.append(button);
    });
  }
  function resetQuiz() { quizScore = 0; quizIndex = 0; questions.sort(() => Math.random() - .5); $("#quizScore").textContent = "0"; $("#quizFeedback").textContent = ""; $("#quizQuestion").textContent = "Ready for a brain snack?"; $("#quizOptions").innerHTML = '<button class="mini-button" id="startQuiz">Start quiz</button>'; $("#startQuiz").addEventListener("click", nextQuestion); }
  $("#startQuiz").addEventListener("click", nextQuestion);

  const generators = {
    activity: { icon: "🎲", label: "YOUR NEXT MOVE", items: ["Make up a new handshake with someone nearby.", "Take the most dramatic 5-minute walk of your life.", "Draw a self-portrait with your non-dominant hand.", "Put on one song and have a one-song dance party.", "Build the coziest blanket fort you can manage.", "Invent a tiny holiday and celebrate it today."] },
    joke: { icon: "😄", label: "A LITTLE GIGGLE", items: ["Why don't skeletons fight each other? They don't have the guts.", "What do you call a bear with no teeth? A gummy bear.", "Why did the scarecrow win an award? He was outstanding in his field.", "What do you call a sleeping dinosaur? A dino-snore.", "I used to hate facial hair... but then it grew on me."] },
    fact: { icon: "🧠", label: "DID YOU KNOW?", items: ["Octopuses have three hearts and blue blood. Overachievers.", "A group of flamingos is called a flamboyance.", "Wombat poop is cube-shaped. Nature is wonderfully weird.", "Honey never spoils when stored properly. Sweet, right?", "A day on Venus is longer than its year.", "Sea otters hold hands while sleeping so they don't drift apart."] },
    challenge: { icon: "🔥", label: "YOUR CHALLENGE", items: ["Name 5 things that are purple in 10 seconds. Go!", "Balance a book on your head for 30 seconds.", "Do your best impression of a robot ordering pizza.", "Say the alphabet backwards as far as you can.", "Give someone a genuine compliment right now.", "Make up a 3-line poem about the nearest object."] },
    wyr: { icon: "🤔", label: "WOULD YOU RATHER?", items: ["Would you rather speak every language or talk to animals?", "Would you rather explore the deep ocean or outer space?", "Would you rather have a rewind button or a pause button for life?", "Would you rather always sing instead of talk or dance everywhere?", "Would you rather have a pet dragon or a tiny friendly dinosaur?"] },
    truth: { icon: "🎤", label: "TRUTH OR DARE", items: ["TRUTH: What's the silliest thing you believed as a kid?", "DARE: Do your best runway walk across the room.", "TRUTH: What's a song you secretly know every word to?", "DARE: Try to touch your nose with your tongue.", "TRUTH: What's your most oddly specific talent?", "DARE: Talk in a dramatic movie-trailer voice for one minute."] },
    starter: { icon: "💬", label: "BREAK THE ICE", items: ["What's the most unexpectedly fun thing you've done lately?", "If your week had a theme song, what would it be?", "What's a tiny hill you're willing to die on?", "What would your dream treehouse absolutely have?", "Which fictional world would you visit for one day?", "What is your most niche fun fact?"] }
  };
  function generate() {
    const generator = generators[activeGenerator];
    const item = generator.items[Math.floor(Math.random() * generator.items.length)];
    $("#resultIcon").textContent = generator.icon; $("#resultCategory").textContent = generator.label; $("#resultText").textContent = item;
    const card = $("#randomResultCard"); card.classList.remove("refresh"); void card.offsetWidth; card.classList.add("refresh");
    completeChallenge("generator"); sound(620, .08);
  }
  $$(".generator-button").forEach(button => button.addEventListener("click", () => {
    activeGenerator = button.dataset.generator;
    $$(".generator-button").forEach(item => item.classList.toggle("active", item === button));
    generate();
  }));
  $("#generateButton").addEventListener("click", generate);
  $("#surpriseButton").addEventListener("click", () => {
    const messages = ["You are officially too cool to be bored.", "Plot twist: you're doing great.", "A tiny dance break is legally recommended.", "Your vibe today? Immaculate.", "Somewhere, a cat just did a perfect backflip. Probably."];
    $("#surpriseMessage").textContent = messages[Math.floor(Math.random() * messages.length)];
    $("#surpriseOverlay").classList.add("open"); $("#surpriseOverlay").setAttribute("aria-hidden", "false");
    confetti(); sound(700, .12, "triangle");
  });
  function closeSurprise() { $("#surpriseOverlay").classList.remove("open"); $("#surpriseOverlay").setAttribute("aria-hidden", "true"); }
  $("#surpriseClose").addEventListener("click", closeSurprise);
  $("#surpriseOverlay").addEventListener("click", event => { if (event.target.id === "surpriseOverlay") closeSurprise(); });

  $("#shuffleFeatured").addEventListener("click", showFeatured);
  $("#featuredPlay").addEventListener("click", () => {
    if (!featuredItem) return;
    if (featuredItem.game === "random") { document.querySelector("#random").scrollIntoView({ behavior: "smooth" }); generate(); }
    else {
      document.querySelector(`#${featuredItem.game === "ttt" ? "tttBoard" : featuredItem.game === "memory" ? "memoryBoard" : featuredItem.game === "quiz" ? "quizQuestion" : "reactionPad"}`).scrollIntoView({ behavior: "smooth", block: "center" });
      showToast(`${featuredItem.name} is ready when you are!`);
    }
  });
  $$("[data-reset]").forEach(button => button.addEventListener("click", () => {
    const resetters = { rps: resetRps, guess: resetGuess, ttt: resetTtt, memory: initMemory, reaction: resetReaction, click: resetClick, quiz: resetQuiz };
    resetters[button.dataset.reset]?.();
    showToast("Ready for another round!");
  }));

  const settings = $("#settingsDialog");
  $("#settingsOpen").addEventListener("click", () => settings.showModal());
  $("#soundToggle").addEventListener("click", () => setSound(!state.sound));
  $("#soundSetting").addEventListener("change", event => setSound(event.target.checked));
  function setSound(enabled) {
    state.sound = enabled; $("#soundToggle").textContent = enabled ? "♫" : "♪"; $("#soundToggle").title = enabled ? "Sound on" : "Sound off";
    $("#soundToggle").setAttribute("aria-label", enabled ? "Turn sound off" : "Turn sound on");
    $("#soundSetting").checked = enabled; save(); if (enabled) sound(660, .1);
  }
  $("#themeToggle").addEventListener("click", () => setTheme(state.theme !== "light"));
  $("#themeSetting").addEventListener("change", event => setTheme(event.target.checked));
  function setTheme(light) {
    state.theme = light ? "light" : "dark";
    document.body.classList.toggle("light-theme", light);
    $("#themeToggle").textContent = light ? "☾" : "☼";
    $("#themeToggle").setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
    $("#themeSetting").checked = light; save();
  }
  $("#clearData").addEventListener("click", () => {
    if (!window.confirm("Clear all saved FUNZONE progress and settings?")) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch (error) { console.warn("FUNZONE could not clear saved progress.", error); showToast("Saved progress could not be cleared."); return; }
    state = { ...defaultState, rps: { ...defaultState.rps }, ttt: { ...defaultState.ttt }, challenges: {}, badges: [] };
    setSound(false); setTheme(false); resetRps(); resetGuess(); resetTtt(); initMemory(); resetReaction(); resetClick(); resetQuiz(); updateProgress();
    showToast("Progress cleared. Fresh start!");
  });

  $("#menuToggle").addEventListener("click", () => {
    const open = $("#mainNav").classList.toggle("open");
    $("#menuToggle").setAttribute("aria-expanded", String(open));
    $("#menuToggle").setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  });
  $$(".nav-link").forEach(link => link.addEventListener("click", () => {
    $$(".nav-link").forEach(item => item.classList.toggle("active", item === link));
    $("#mainNav").classList.remove("open"); $("#menuToggle").setAttribute("aria-expanded", "false");
  }));
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const link = $(`.nav-link[href="#${entry.target.id}"]`);
        if (link) { $$(".nav-link").forEach(item => item.classList.toggle("active", item === link)); }
      }
    });
  }, { rootMargin: "-35% 0px -55% 0px" });
  ["home", "games", "random", "challenges", "about"].forEach(id => observer.observe(document.getElementById(id)));

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeSurprise();
    if (event.key.toLowerCase() === "f" && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
      $("#surpriseButton").focus(); showToast("You found the F key. Excellent instincts. ✨");
    }
  });
  $("#year").textContent = new Date().getFullYear();
  $("#playerCount").textContent = (2481 + Math.floor(Math.random() * 130)).toLocaleString();
  dailyVisit(); showFeatured(); updateProgress(); renderTtt(); initMemory(); resetGuess();
  $("#tttScore").textContent = `You ${state.ttt.player} : ${state.ttt.computer} CPU · ${state.ttt.draws} draws`;
  $("#memoryBest").textContent = `Best: ${state.memoryBest === null ? "—" : state.memoryBest}`;
  $("#rpsPlayerScore").textContent = state.rps.player; $("#rpsComputerScore").textContent = state.rps.computer;
  $("#reactionBest").textContent = state.reactionBest === null ? "—" : `${state.reactionBest} ms`;
  $("#clickBest").textContent = `Best: ${state.clickBest}`;
  $("#guessBest").textContent = `Best: ${state.guessBest === null ? "—" : `${state.guessBest} ${state.guessBest === 1 ? "guess" : "guesses"}`}`;
  setSound(state.sound); setTheme(state.theme === "light");
  setTimeout(() => $("#loader").classList.add("hidden"), 850);
})();
