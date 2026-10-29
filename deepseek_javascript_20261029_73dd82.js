// Защита: если Телеграм не загрузился, сайт не сломается
if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
}

// Переменные для баллов и прогресса
let score = 0;
let totalQuestions = 10; // 5 памятников по 2 вопроса
let answeredQuizzes = {}; 

// ========== ДАННЫЕ ПАМЯТНИКОВ ==========
const places = [
  {
    id: 1,
    lat: 56.347592, lng: 43.868608,
    title: "Памятник Ростиславу Алексееву",
    desc: "Советский кораблестроитель, создатель судов на подводных крыльях («Ракета», «Метеор») и экранопланов. Памятник открыт в 2009 году на пересечении Юбилейного бульвара и ул. Коминтерна. Скульптор — Татьяна Холуева. Конструктор запечатлён в движении: в одной руке блокнот, в другой — развевающийся плащ.",
    img: "https://via.placeholder.com/600x300?text=Памятник+Р.Алексееву",
    quiz: [
      {
        q: "1. Кем был Ростислав Алексеев?",
        options: ["Создателем судов на подводных крыльях", "Основателем завода «Красное Сормово»", "Директором завода в 1990-е"],
        answer: 0
      },
      {
        q: "2. В каком году был открыт памятник Алексееву?",
        options: ["В 2009 году", "В 1991 году", "В 2015 году"],
        answer: 0
      }
    ]
  },
  {
    id: 2,
    lat: 56.3500, lng: 43.8700,
    title: "Судно «Метеор»",
    desc: "Памятник пассажирскому судну на подводных крыльях, установленный на площади Буревестника напротив администрации Сормовского района. Корпус построен в 1960-х годах на заводе «Красное Сормово». Это символ скорости и достижений советского судостроения.",
    img: "https://via.placeholder.com/600x300?text=Метеор",
    quiz: [
      {
        q: "1. Где установлен памятник «Метеор»?",
        options: ["На площади Буревестника", "В сквере на ул. Ефремова", "На Юбилейном бульваре"],
        answer: 0
      },
      {
        q: "2. На каком заводе был построен корпус судна?",
        options: ["На заводе «Красное Сормово»", "На Волжском автозаводе", "На заводе «Красный Октябрь»"],
        answer: 0
      }
    ]
  },
  {
    id: 3,
    lat: 56.3490, lng: 43.8650,
    title: "Памятник Дмитрию Бенардаки",
    desc: "Основатель Сормовского завода (будущее «Красное Сормово»). Памятник открыт 18 июля 2019 года в сквере на улице Ефремова в честь 170-летия завода. Бенардаки изображён стоящим у рабочего стола с чертежами.",
    img: "https://via.placeholder.com/600x300?text=Д.Бенардаки",
    quiz: [
      {
        q: "1. Какую роль сыграл Дмитрий Бенардаки в истории Сормова?",
        options: ["Основал Сормовский завод", "Спроектировал первый «Метеор»", "Был главным конструктором ЦКБ"],
        answer: 0
      },
      {
        q: "2. В каком году был открыт памятник Бенардаки?",
        options: ["В 2019 году", "В 2010 году", "В 2005 году"],
        answer: 0
      }
    ]
  },
  {
    id: 4,
    lat: 56.345646, lng: 43.863940,
    title: "Памятник Николаю Жаркову",
    desc: "Легендарный кораблестроитель, 57 лет проработал на заводе «Красное Сормово», из них 34 года — генеральным директором. Под его руководством было построено более 100 подводных лодок. Памятник открыт 25 апреля 2025 года.",
    img: "https://via.placeholder.com/600x300?text=Н.Жарков",
    quiz: [
      {
        q: "1. Сколько лет Николай Жарков руководил заводом?",
        options: ["34 года", "20 лет", "57 лет"],
        answer: 0
      },
      {
        q: "2. Что производил завод под руководством Жаркова?",
        options: ["Подводные лодки", "Космические ракеты", "Тракторы"],
        answer: 0
      }
    ]
  },
  {
    id: 5,
    lat: 56.3480, lng: 43.8690,
    title: "Памятник Валерию Иконникову",
    desc: "Главный конструктор ЦКБ по судам на подводных крыльях (1968–1988), участвовал в создании экранопланов «Орлёнок», «Лунь». Памятный знак открыт 1 августа 2024 года в сквере его имени. Рядом установлена модель экраноплана «Орлёнок».",
    img: "https://via.placeholder.com/600x300?text=В.Иконников",
    quiz: [
      {
        q: "1. Что установлено рядом с памятным знаком Иконникову?",
        options: ["Модель экраноплана «Орлёнок»", "Копия «Метеора»", "Якорь с крейсера"],
        answer: 0
      },
      {
        q: "2. В каком году был открыт памятный знак?",
        options: ["В 2024 году", "В 2020 году", "В 2018 году"],
        answer: 0
      }
    ]
  }
];

// ========== КАРТА ==========
const map = L.map('map').setView([56.347, 43.867], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap',
  maxZoom: 19
}).addTo(map);

// ========== МАРКЕРЫ + ТЕСТ ==========
const infoPanel = document.getElementById('infoPanel');
const infoTitle = document.getElementById('infoTitle');
const infoContent = document.getElementById('infoContent');

places.forEach(place => {
  const icon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:#2481cc;color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${place.id}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  const marker = L.marker([place.lat, place.lng], { icon }).addTo(map);

  marker.on('click', () => {
    infoTitle.textContent = place.title;

    let html = `<img src="${place.img}" alt="${place.title}">`;
    html += `<p>${place.desc}</p>`;
    html += `<p style="color: #2481cc; font-weight: bold;">🏆 Ваши баллы: ${score} из ${totalQuestions}</p>`;

    // Рендерим вопросы
    place.quiz.forEach((q, qIndex) => {
      const quizId = `${place.id}_${qIndex}`; // Уникальный ID для каждого вопроса
      
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
  });
});

// ========== ЛОГИКА ТЕСТА И БАЛЛОВ ==========
window.answerQuiz = function(quizId, placeId, qIndex, selectedIdx) {
  const place = places.find(p => p.id === placeId);
  if (!place || answeredQuizzes[quizId]) return;

  const question = place.quiz[qIndex];
  const isCorrect = selectedIdx === question.answer;
  answeredQuizzes[quizId] = true;

  if (isCorrect) score++;

  // Обновляем счет в панели
  const scoreDisplay = document.querySelector('#infoContent p[style*="color: #2481cc"]');
  if (scoreDisplay) {
    scoreDisplay.textContent = `🏆 Ваши баллы: ${score} из ${totalQuestions}`;
  }

  // Меняем цвета кнопок
  const quizBox = document.getElementById(`quiz-box-${quizId}`);
  const buttons = quizBox.querySelectorAll('.quiz-option');
  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === question.answer) {
      btn.style.background = '#2e7d32'; // зеленый правильный
    } else if (idx === selectedIdx && !isCorrect) {
      btn.style.background = '#c62828'; // красный неправильный
    }
  });

  // Добавляем текст результата
  const resultDiv = document.createElement('div');
  resultDiv.className = 'quiz-result ' + (isCorrect ? 'correct' : 'wrong');
  resultDiv.textContent = isCorrect ? '✅ Верно! +1 балл' : '❌ Неверно. Правильный ответ выделен зелёным.';
  quizBox.appendChild(resultDiv);

  // Проверка на прохождение всего маршрута
  if (Object.keys(answeredQuizzes).length === totalQuestions) {
    setTimeout(() => {
      alert(`Вы прошли весь маршрут! Ваш результат: ${score} из ${totalQuestions} баллов.`);
    }, 800);
  }
};

window.closePanel = function() {
  infoPanel.classList.remove('active');
};

map.on('click', () => {
  infoPanel.classList.remove('active');
});