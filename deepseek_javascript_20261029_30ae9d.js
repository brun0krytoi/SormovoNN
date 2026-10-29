// Защита: если Телеграм не загрузился, сайт не сломается
if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
}

let score = 0;
let totalQuestions = 10;
let answeredQuizzes = {}; 
let attemptsTracker = {}; 
let currentUnlockedId = 1; 

// --- ЗВУКОВЫЕ ЭФФЕКТЫ (Синтезатор, чтобы не загружать mp3) ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
    if (!audioCtx) audioCtx = new AudioContext();
}

function playCorrect() {
    initAudio();
    if (!audioCtx) return;
    
    // Приятный двойной звон (как монетки в игре)
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // Нота Ля
    osc.frequency.setValueAtTime(1108.73, audioCtx.currentTime + 0.1); // Нота До-диез
    
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
    
    // Вибрация телефона (если поддерживается)
    if (navigator.vibrate) navigator.vibrate(50);
}

function playWrong() {
    initAudio();
    if (!audioCtx) return;
    
    // Глухой звук ошибки
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);

    // Двойная вибрация при ошибке
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const places = [
  {
    id: 1, lat: 56.347592, lng: 43.868608,
    title: "Памятник Ростиславу Алексееву",
    desc: "Ростислав Евгеньевич Алексеев — выдающийся советский кораблестроитель, чье имя золотыми буквами вписано в историю мирового судостроения. Он стал первопроходцем в создании судов на подводных крыльях (знаменитые «Ракета», «Метеор», «Комета») и экранопланов. Памятник был торжественно открыт в 2009 году на пересечении Юбилейного бульвара и улицы Коминтерна. Скульптор Татьяна Холуева изобразила конструктора в стремительном движении: в правой руке он держит блокнот с логарифмической линейкой, а левой придерживает развевающийся плащ, словно ветер встречного потока.",
    img: "https://via.placeholder.com/600x300?text=Памятник+Р.Алексееву",
    quiz: [
      { q: "Кем был Ростислав Алексеев?", options: ["Создателем судов на подводных крыльях", "Основателем завода «Красное Сормово»", "Директором завода в 1990-е"], answer: 0 },
      { q: "В каком году был открыт памятник?", options: ["В 2009 году", "В 1991 году", "В 2015 году"], answer: 0 }
    ]
  },
  {
    id: 2, lat: 56.3500, lng: 43.8700,
    title: "Судно «Метеор»",
    desc: "Памятник легендарному пассажирскому судну на подводных крыльях «Метеор» установлен на площади Буревестника, прямо напротив администрации Сормовского района. Корпус этого судна был построен в 1960-х годах на заводе «Красное Сормово» и долгие годы верой и правдой служил на речных просторах. «Метеоры» стали настоящим символом скорости и научно-технического прогресса СССР, сократив время в пути между городами в несколько раз.",
    img: "https://via.placeholder.com/600x300?text=Метеор",
    quiz: [
      { q: "Где установлен памятник?", options: ["На площади Буревестника", "В сквере на ул. Ефремова", "На Юбилейном бульваре"], answer: 0 },
      { q: "На каком заводе построен корпус?", options: ["На заводе «Красное Сормово»", "На Волжском автозаводе", "На заводе «Красный Октябрь»"], answer: 0 }
    ]
  },
  {
    id: 3, lat: 56.3490, lng: 43.8650,
    title: "Памятник Дмитрию Бенардаки",
    desc: "Дмитрий Егорович Бенардаки — потомственный дворянин, промышленник и меценат, который в 1849 году основал Сормовский завод (будущее «Красное Сормово»). Именно с его легкой руки Сормово превратилось из тихой деревушки в крупнейший промышленный центр России. Памятник был открыт 18 июля 2019 года в сквере на улице Ефремова. Бронзовая фигура высотой около трех метров установлена на массивном гранитном постаменте. Бенардаки изображен стоящим у рабочего стола с чертежами и макетом первого двухпалубного парохода.",
    img: "https://via.placeholder.com/600x300?text=Д.Бенардаки",
    quiz: [
      { q: "Кем был Дмитрий Бенардаки?", options: ["Основал Сормовский завод", "Спроектировал «Метеор»", "Был главным конструктором ЦКБ"], answer: 0 },
      { q: "Год открытия памятника?", options: ["2019", "2010", "2005"], answer: 0 }
    ]
  },
  {
    id: 4, lat: 56.345646, lng: 43.863940,
    title: "Памятник Николаю Жаркову",
    desc: "Николай Сергеевич Жарков — поистине легендарная личность для Сормова. Он проработал на заводе «Красное Сормово» 57 лет, из которых 34 года занимал должность генерального директора. Под его руководством было построено 105 подводных лодок, включая 26 атомных. За выдающиеся трудовые успехи он был удостоен звания Героя Труда Российской Федерации. Памятник Жаркову был торжественно открыт 25 апреля 2025 года на Юбилейном бульваре.",
    img: "https://via.placeholder.com/600x300?text=Н.Жарков",
    quiz: [
      { q: "Сколько лет он руководил заводом?", options: ["34 года", "20 лет", "57 лет"], answer: 0 },
      { q: "Что производил завод при Жаркове?", options: ["Подводные лодки", "Космические ракеты", "Тракторы"], answer: 0 }
    ]
  },
  {
    id: 5, lat: 56.3480, lng: 43.8690,
    title: "Памятник Валерию Иконникову",
    desc: "Валерий Васильевич Иконников — выдающийся инженер, который с 1968 по 1988 год занимал пост главного конструктора ЦКБ по судам на подводных крыльях. Он принимал непосредственное участие в создании уникальных экранопланов «Орлёнок», «Лунь» и «Волга-2». Памятный знак в его честь был открыт 1 августа 2024 года в благоустроенном сквере, который теперь носит его имя. Рядом со стелой установлена модель экраноплана «Орлёнок».",
    img: "https://via.placeholder.com/600x300?text=В.Иконников",
    quiz: [
      { q: "Что установлено рядом с памятником?", options: ["Модель экраноплана «Орлёнок»", "Копия «Метеора»", "Якорь с крейсера"], answer: 0 },
      { q: "Год открытия памятного знака?", options: ["2024", "2020", "2018"], answer: 0 }
    ]
  }
];

// ПЕРЕМЕШИВАЕМ ОТВЕТЫ
places.forEach(place => {
  place.quiz.forEach(q => {
    const correctAnswerText = q.options[q.answer];
    q.options = shuffleArray(q.options);
    q.answer = q.options.indexOf(correctAnswerText);
  });
});

const map = L.map('map').setView([56.347, 43.867], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap', maxZoom: 19
}).addTo(map);

const infoPanel = document.getElementById('infoPanel');
const infoTitle = document.getElementById('infoTitle');
const infoContent = document.getElementById('infoContent');
const progressBar = document.getElementById('progressBar');

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `show ${type}`;
  setTimeout(() => { toast.className = ''; }, 3500);
}

function updateProgress() {
  const answeredCount = Object.keys(answeredQuizzes).length;
  const percent = (answeredCount / totalQuestions) * 100;
  progressBar.style.width = percent + '%';
}

places.forEach(place => {
  const isUnlocked = place.id === currentUnlockedId;
  const icon = L.divIcon({
    className: 'custom-marker',
    html: `<div class="${isUnlocked ? 'marker-pulse' : ''}" style="background:${isUnlocked ? '#2481cc' : '#999'}; color:#fff; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:14px; border:2px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.3); opacity:${isUnlocked ? '1' : '0.6'};">${place.id}</div>`,
    iconSize: [32, 32], iconAnchor: [16, 16]
  });

  const marker = L.marker([place.lat, place.lng], { icon }).addTo(map);

  marker.on('click', () => {
    if (place.id > currentUnlockedId) {
      showToast(`Сначала пройдите точку №${currentUnlockedId}`, 'error');
      return;
    }
    showStartScreen(place);
  });
});

function showStartScreen(place) {
  infoTitle.textContent = place.title;
  
  let html = `<img src="${place.img}" alt="${place.title}">`;
  html += `<p>${place.desc}</p>`;
  
  const allQuestionsForPlace = place.quiz.length;
  const answeredForPlace = Object.keys(answeredQuizzes).filter(key => key.startsWith(place.id + '_')).length;
  
  if (answeredForPlace === allQuestionsForPlace) {
    html += `<div class="quiz-result correct" style="margin-top:20px;">✅ Эта точка уже пройдена</div>`;
    if (place.id < places.length) {
       html += `<button class="action-btn" onclick="goToNextPoint(${place.id})">Перейти к следующей точке ➡</button>`;
    } else {
       html += `<button class="action-btn" onclick="showFinalReward()">Посмотреть награду 🏆</button>`;
    }
    html += `<button class="action-btn secondary" onclick="closePanel()">Вернуться на карту</button>`;
  } else {
    html += `<button class="action-btn" onclick="showQuizScreen(${place.id})">Перейти к тесту 👉</button>`;
    html += `<button class="action-btn secondary" onclick="closePanel()">Вернуться на карту</button>`;
  }

  infoContent.innerHTML = html;
  infoPanel.classList.add('active');
}

window.showQuizScreen = function(placeId) {
  const place = places.find(p => p.id === placeId);
  
  infoTitle.innerHTML = `${place.title} <br><span style="font-size: 14px; font-weight: 500; color: #888; display: block; margin-top: 5px;">Проверка знаний</span>`;
  
  let html = `<div class="quiz-wrapper">`;
  html += `<div id="top-finish-btn-container"></div>`;

  place.quiz.forEach((q, qIndex) => {
    const quizId = `${place.id}_${qIndex}`;
    
    if (!answeredQuizzes[quizId]) {
      html += `<div class="quiz-card" id="quiz-box-${quizId}">
                 <div class="quiz-header">
                   <p>${q.q}</p>
                   <span class="attempts-badge" id="attempts-${quizId}">Попытки: 2/2</span>
                 </div>`;
      q.options.forEach((opt, optIndex) => {
        html += `<button class="quiz-option" onclick="answerQuiz('${quizId}', ${place.id}, ${qIndex}, ${optIndex})">${opt}</button>`;
      });
      html += `</div>`;
    } else {
      const wasCorrect = answeredQuizzes[quizId] === 'correct';
      html += `<div class="quiz-card">
                 <div class="quiz-header"><p>${q.q}</p></div>
                 <div class="quiz-result ${wasCorrect ? 'correct' : 'wrong'}" style="margin-top:0;">
                   ${wasCorrect ? '✅ Вы ответили верно (+1 балл)' : '❌ Вы не ответили верно'}
                 </div>
               </div>`;
    }
  });

  html += `<div style="text-align:center; margin: 15px 0;">
             <a href="#" onclick="showStartScreen(places.find(p => p.id === ${placeId})); return false;" style="color: #888; font-size: 14px; text-decoration: underline;">Вернуться к описанию</a>
           </div>`;
           
  html += `</div>`;
  
  infoContent.innerHTML = html;
  infoPanel.scrollTop = 0;
  checkQuizCompletion(placeId); 
}

function checkQuizCompletion(placeId) {
  const place = places.find(p => p.id === placeId);
  const allQuestionsForPlace = place.quiz.length;
  const answeredForPlace = Object.keys(answeredQuizzes).filter(key => key.startsWith(placeId + '_')).length;

  if (answeredForPlace === allQuestionsForPlace) {
    const container = document.getElementById('top-finish-btn-container');
    if (container && !container.hasChildNodes()) {
      container.innerHTML = `
        <div style="text-align:center; margin-bottom: 20px; padding: 15px; background: #e8f5e9; border-radius: 12px; border: 2px solid #4caf50; animation: popIn 0.5s;">
          <h4 style="color:#2e7d32; margin-bottom:10px; font-size: 16px;">🎉 Тест завершен!</h4>
          <button class="action-btn" onclick="goToNextPoint(${placeId})" style="margin-top:0;">Идти к следующей точке ➡</button>
        </div>`;
        
      infoPanel.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}

window.answerQuiz = function(quizId, placeId, qIndex, selectedIdx) {
  const place = places.find(p => p.id === placeId);
  if (!place || answeredQuizzes[quizId]) return;

  const question = place.quiz[qIndex];
  const isCorrect = selectedIdx === question.answer;
  
  if (!attemptsTracker[quizId]) attemptsTracker[quizId] = 0;
  attemptsTracker[quizId]++;
  
  const quizBox = document.getElementById(`quiz-box-${quizId}`);
  const buttons = quizBox.querySelectorAll('.quiz-option');
  const attemptIndicator = document.getElementById(`attempts-${quizId}`);

  if (isCorrect) {
    // ПРАВИЛЬНЫЙ ОТВЕТ
    playCorrect(); // Включаем звук успеха и вибрацию
    score++;
    answeredQuizzes[quizId] = 'correct';
    updateProgress();
    
    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === question.answer) btn.classList.add('correct');
    });
    
    // Конфетти
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.8 }, colors: ['#2481cc', '#4caf50', '#ffeb3b'] });
    
    const resultDiv = document.createElement('div');
    resultDiv.className = 'quiz-result correct';
    resultDiv.textContent = '✅ Верно! +1 балл';
    quizBox.appendChild(resultDiv);

  } else {
    // НЕПРАВИЛЬНЫЙ ОТВЕТ
    playWrong(); // Включаем звук ошибки и вибрацию
    buttons[selectedIdx].classList.add('wrong');
    buttons[selectedIdx].disabled = true;

    if (attemptsTracker[quizId] >= 2) {
      answeredQuizzes[quizId] = 'wrong';
      updateProgress();
      
      buttons.forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === question.answer) btn.classList.add('correct');
      });
      
      const resultDiv = document.createElement('div');
      resultDiv.className = 'quiz-result wrong';
      resultDiv.textContent = '❌ Попытки закончились. Правильный ответ выделен.';
      quizBox.appendChild(resultDiv);

    } else {
      attemptIndicator.textContent = 'Осталась 1 попытка';
      attemptIndicator.classList.add('danger');
      
      const resultDiv = document.createElement('div');
      resultDiv.className = 'quiz-result info';
      resultDiv.id = `msg-${quizId}`;
      resultDiv.textContent = '❌ Неверно. Попробуйте еще раз!';
      quizBox.appendChild(resultDiv);
      
      setTimeout(() => {
        const msg = document.getElementById(`msg-${quizId}`);
        if (msg) msg.remove();
        buttons.forEach((btn, idx) => {
          if (!btn.classList.contains('wrong')) btn.disabled = false;
        });
      }, 1500);
    }
  }

  checkQuizCompletion(placeId);
}

window.goToNextPoint = function(currentPlaceId) {
  if (currentUnlockedId === currentPlaceId) {
    currentUnlockedId++;
    
    if (currentUnlockedId <= places.length) {
      updateMarkers();
      showToast(`Точка №${currentPlaceId} пройдена! Открыта точка №${currentUnlockedId}.`, 'success');
    } else {
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
      showToast(`Маршрут пройден!`, 'success');
    }
  }

  if (currentPlaceId < places.length) {
    const nextPlace = places.find(p => p.id === currentPlaceId + 1);
    showStartScreen(nextPlace);
  } else {
    showFinalReward(); 
  }
};

window.showFinalReward = function() {
  infoTitle.textContent = "Квест завершен!";
  
  let rank = "Знаток Сормова";
  let medal = "🥉";
  if (score >= 8) { rank = "Эксперт-краевед"; medal = "🥈"; }
  if (score === 10) { rank = "Легенда Сормова"; medal = "🥇"; }

  let html = `
    <div class="reward-container">
      <div class="medal-icon">${medal}</div>
      <div class="reward-title">${rank}</div>
      <div class="reward-subtitle">Вы успешно прошли маршрут!</div>
      <div class="reward-score">🏆 Набрано баллов: ${score} из ${totalQuestions}</div>
    </div>
  `;
  
  if (window.Telegram && window.Telegram.WebApp) {
      html += `<button class="action-btn" onclick="shareResult('${rank}', ${score})" style="margin-top:20px;">Поделиться в Telegram ✈️</button>`;
  }
  
  html += `<button class="action-btn secondary" onclick="closePanel()">На главную карту</button>`;

  infoContent.innerHTML = html;
  infoPanel.classList.add('active');
  
  // Финальный большой салют
  let duration = 3 * 1000;
  let animationEnd = Date.now() + duration;
  let defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
  
  function randomInRange(min, max) { return Math.random() * (max - min) + min; }
  
  let interval = setInterval(function() {
    let timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) { return clearInterval(interval); }
    let particleCount = 50 * (timeLeft / duration);
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
  }, 250);
}

window.shareResult = function(rank, score) {
  if (window.Telegram && window.Telegram.WebApp) {
    const text = `Я прошел квест по памятникам Сормова! Мое звание: ${rank} (${score} из 10 баллов). Попробуй и ты!`;
    window.Telegram.WebApp.switchInlineQuery(text, ["users", "groups", "channels"]);
  }
}

function updateMarkers() {
  document.querySelectorAll('.custom-marker').forEach((markerDiv, index) => {
    const placeId = index + 1;
    if (placeId === currentUnlockedId) {
      const innerDiv = markerDiv.firstChild;
      innerDiv.style.background = '#2481cc';
      innerDiv.style.opacity = '1';
      innerDiv.classList.add('marker-pulse'); 
    }
  });
}

window.closePanel = function() {
  infoPanel.classList.remove('active');
};

map.on('click', () => {
  infoPanel.classList.remove('active');
});