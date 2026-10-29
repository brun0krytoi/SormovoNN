// Защита: если Телеграм не загрузился, сайт не сломается
if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
}

let score = 0;
let totalQuestions = 10;
let answeredQuizzes = {}; 
let currentUnlockedId = 1; 

const places = [
  {
    id: 1,
    lat: 56.347592, lng: 43.868608,
    title: "Памятник Ростиславу Алексееву",
    desc: "Всемирно известный конструктор судов на подводных крыльях и экранопланов. Памятник открыт в 2009 году. Бронзовая скульптура установлена на гранитном постаменте в форме носа корабля. Алексеев изображён идущим с блокнотом и логарифмической линейкой в руке, а за его спиной развеваются «паруса-крылья».",
    img: "https://via.placeholder.com/600x300?text=Памятник+Р.Алексееву",
    quiz: [
      { q: "1. Кем был Ростислав Алексеев?", options: ["Создателем судов на подводных крыльях", "Основателем завода «Красное Сормово»", "Директором завода в 1990-е"], answer: 0 },
      { q: "2. В каком году был открыт памятник Алексееву?", options: ["В 2009 году", "В 1991 году", "В 2015 году"], answer: 0 }
    ]
  },
  {
    id: 2,
    lat: 56.3500, lng: 43.8700,
    title: "Судно «Метеор»",
    desc: "Памятник пассажирскому судну на подводных крыльях, установленный на площади Буревестника. «Метеор» — это символ скорости и достижений советского судостроения. Корпус судна был построен в 1960-х годах на заводе «Красное Сормово».",
    img: "https://via.placeholder.com/600x300?text=Метеор",
    quiz: [
      { q: "1. Где установлен памятник «Метеор»?", options: ["На площади Буревестника", "В сквере на ул. Ефремова", "На Юбилейном бульваре"], answer: 0 },
      { q: "2. На каком заводе был построен корпус судна?", options: ["На заводе «Красное Сормово»", "На Волжском автозаводе", "На заводе «Красный Октябрь»"], answer: 0 }
    ]
  },
  {
    id: 3,
    lat: 56.3490, lng: 43.8650,
    title: "Памятник Дмитрию Бенардаки",
    desc: "Основатель Сормовского завода (будущее «Красное Сормово»). Памятник открыт 18 июля 2019 года в сквере на улице Ефремова. Бронзовая фигура высотой около трёх метров установлена на гранитном постаменте. Бенардаки изображён стоящим рядом с макетом первого двухпалубного парохода «Переворот».",
    img: "https://via.placeholder.com/600x300?text=Д.Бенардаки",
    quiz: [
      { q: "1. Какую роль сыграл Дмитрий Бенардаки?", options: ["Основал Сормовский завод", "Спроектировал первый «Метеор»", "Был главным конструктором ЦКБ"], answer: 0 },
      { q: "2. В каком году был открыт памятник Бенардаки?", options: ["В 2019 году", "В 2010 году", "В 2005 году"], answer: 0 }
    ]
  },
  {
    id: 4,
    lat: 56.345646, lng: 43.863940,
    title: "Памятник Николаю Жаркову",
    desc: "Легендарный кораблестроитель, 57 лет проработал на заводе «Красное Сормово», из них 34 года — генеральным директором. Под его руководством построено 105 подводных лодок. Памятник открыт 25 апреля 2025 года на Юбилейном бульваре.",
    img: "https://via.placeholder.com/600x300?text=Н.Жарков",
    quiz: [
      { q: "1. Сколько лет Николай Жарков руководил заводом?", options: ["34 года", "20 лет", "57 лет"], answer: 0 },
      { q: "2. Что производил завод под руководством Жаркова?", options: ["Подводные лодки", "Космические ракеты", "Тракторы"], answer: 0 }
    ]
  },
  {
    id: 5,
    lat: 56.3480, lng: 43.8690,
    title: "Памятник Валерию Иконникову",
    desc: "Главный конструктор ЦКБ по судам на подводных крыльях (1968–1988). Участвовал в создании экранопланов «Орлёнок», «Лунь». Памятный знак открыт 1 августа 2024 года в сквере его имени. Рядом установлена модель экраноплана «Орлёнок». На стеле размещены QR-коды.",
    img: "https://via.placeholder.com/600x300?text=В.Иконников",
    quiz: [
      { q: "1. Что установлено рядом с памятным знаком Иконникову?", options: ["Модель экраноплана «Орлёнок»", "Копия «Метеора»", "Якорь с крейсера"], answer: 0 },
      { q: "2. В каком году был открыт памятный знак?", options: ["В 2024 году", "В 2020 году", "В 2018 году"], answer: 0 }
    ]
  }
];

const map = L.map('map').setView([56.347, 43.867], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap',
  maxZoom: 19
}).addTo(map);

const infoPanel = document.getElementById('infoPanel');
const infoTitle = document.getElementById('infoTitle');
const infoContent = document.getElementById('infoContent');
const progressBar = document.getElementById('progressBar');

// Функция для показа красивых уведомлений
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `show ${type}`;
  setTimeout(() => { toast.className = ''; }, 3500);
}

// Функция для обновления прогресс-бара
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
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  const marker = L.marker([place.lat, place.lng], { icon }).addTo(map);

  marker.on('click', () => {
    if (place.id !== currentUnlockedId) {
      if (place.id < currentUnlockedId) {
        showPlaceInfo(place);
      } else {
        showToast(`Сначала пройдите точку №${currentUnlockedId}`, 'error');
      }
      return;
    }
    showPlaceInfo(place);
  });
});

function showPlaceInfo(place) {
  infoTitle.textContent = place.title;

  let html = `<img src="${place.img}" alt="${place.title}">`;
  html += `<p>${place.desc}</p>`;

  place.quiz.forEach((q, qIndex) => {
    const quizId = `${place.id}_${qIndex}`;
    
    if (!answeredQuizzes[quizId]) {
      html += `<div class="quiz-box" id="quiz-box-${quizId}"><p>📝 ${q.q}</p>`;
      q.options.forEach((opt, optIndex) => {
        html += `<button class="quiz-option" onclick="answerQuiz('${quizId}', ${place.id}, ${qIndex}, ${optIndex})">${opt}</button>`;
      });
      html += `</div>`;
    } else {
      html += `<div class="quiz-box"><p>✅ Вы уже ответили на этот вопрос.</p></div>`;
    }
  });

  infoContent.innerHTML = html;
  infoPanel.classList.add('active');
}

window.answerQuiz = function(quizId, placeId, qIndex, selectedIdx) {
  const place = places.find(p => p.id === placeId);
  if (!place || answeredQuizzes[quizId]) return;

  const question = place.quiz[qIndex];
  const isCorrect = selectedIdx === question.answer;
  answeredQuizzes[quizId] = true;

  const quizBox = document.getElementById(`quiz-box-${quizId}`);
  const buttons = quizBox.querySelectorAll('.quiz-option');
  
  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === question.answer) {
      btn.classList.add('correct');
    } else if (idx === selectedIdx && !isCorrect) {
      btn.classList.add('wrong');
    }
  });

  if (isCorrect) {
    score++;
    updateProgress();
    // Взрыв конфетти!
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#2481cc', '#4caf50', '#ffeb3b']
    });
  }

  const resultDiv = document.createElement('div');
  resultDiv.className = 'quiz-result ' + (isCorrect ? 'correct' : 'wrong');
  resultDiv.textContent = isCorrect ? '✅ Верно! +1 балл' : '❌ Неверно. Правильный ответ выделен.';
  quizBox.appendChild(resultDiv);

  const allQuestionsForPlace = place.quiz.length;
  const answeredForPlace = Object.keys(answeredQuizzes).filter(key => key.startsWith(placeId + '_')).length;

  if (answeredForPlace === allQuestionsForPlace && currentUnlockedId === placeId) {
    currentUnlockedId++;
    
    if (currentUnlockedId <= places.length) {
      updateMarkers();
      showToast(`Точка №${currentUnlockedId - 1} пройдена! Открыта точка №${currentUnlockedId}.`, 'success');
    } else {
      // Финальный фейерверк!
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
      showToast(`Маршрут пройден! Ваш результат: ${score} из ${totalQuestions}`, 'success');
    }
  }
};

function updateMarkers() {
  document.querySelectorAll('.custom-marker').forEach((markerDiv, index) => {
    const placeId = index + 1;
    if (placeId === currentUnlockedId) {
      const innerDiv = markerDiv.firstChild;
      innerDiv.style.background = '#2481cc';
      innerDiv.style.opacity = '1';
      innerDiv.classList.add('marker-pulse'); // Добавляем анимацию пульсации
    }
  });
}

window.closePanel = function() {
  infoPanel.classList.remove('active');
};

map.on('click', () => {
  infoPanel.classList.remove('active');
});