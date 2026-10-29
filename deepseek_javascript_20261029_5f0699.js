const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// ========== ДАННЫЕ ПАМЯТНИКОВ ==========
// ⚠️ Координаты с пометкой «требуется проверка» взяты по адресу, перед использованием сверьте на карте!
const places = [
  {
    id: 1,
    lat: 56.347592, lng: 43.868608, // ✅ точные координаты
    title: "Памятник Ростиславу Алексееву",
    desc: "Советский кораблестроитель, создатель судов на подводных крыльях («Ракета», «Метеор») и экранопланов. Памятник открыт в 2009 году на пересечении Юбилейного бульвара и ул. Коминтерна. Скульптор — Татьяна Холуева. Конструктор запечатлён в движении: в одной руке блокнот с логарифмической линейкой, в другой — развевающийся плащ. Постамент выполнен в форме носа корабля[citation:15][citation:25].",
    img: "https://via.placeholder.com/600x300?text=Памятник+Р.Алексееву",
    quiz: {
      q: "Кем был Ростислав Алексеев?",
      options: ["Создателем судов на подводных крыльях", "Основателем завода «Красное Сормово»", "Директором завода в 1990-е"],
      answer: 0
    }
  },
  {
    id: 2,
    lat: 56.3500, lng: 43.8700, // ⚠️ требуется проверка (площадь Буревестника)
    title: "Судно «Метеор»",
    desc: "Памятник пассажирскому судну на подводных крыльях, установленный на площади Буревестника напротив администрации Сормовского района. Корпус построен в 1960-х годах на заводе «Красное Сормово». В 2026 году из-за снега верхняя часть конструкции деформировалась, сейчас готовится ремонт[citation:1][citation:5][citation:11].",
    img: "https://via.placeholder.com/600x300?text=Метеор",
    quiz: {
      q: "Где установлен памятник «Метеор»?",
      options: ["На площади Буревестника", "В сквере на ул. Ефремова", "На Юбилейном бульваре"],
      answer: 0
    }
  },
  {
    id: 3,
    lat: 56.3490, lng: 43.8650, // ⚠️ требуется проверка (сквер на ул. Ефремова)
    title: "Памятник Дмитрию Бенардаки",
    desc: "Основатель Сормовского завода (будущее «Красное Сормово»). Памятник открыт 18 июля 2019 года в сквере на улице Ефремова в честь 170-летия завода и 220-летия со дня рождения промышленника. Выполнен из бронзы и гранита, высота около 3 метров. Бенардаки изображён стоящим у рабочего стола с чертежами[citation:13][citation:26].",
    img: "https://via.placeholder.com/600x300?text=Д.Бенардаки",
    quiz: {
      q: "Какую роль сыграл Дмитрий Бенардаки в истории Сормова?",
      options: ["Основал Сормовский завод", "Спроектировал первый «Метеор»", "Был главным конструктором ЦКБ"],
      answer: 0
    }
  },
  {
    id: 4,
    lat: 56.345646, lng: 43.863940, // ✅ точные координаты
    title: "Памятник Николаю Жаркову",
    desc: "Легендарный кораблестроитель, 57 лет проработал на заводе «Красное Сормово», из них 34 года — генеральным директором. Под его руководством построено 105 подводных лодок (включая 26 атомных) и 25 глубоководных аппаратов. Герой Труда РФ (2019). Памятник открыт 25 апреля 2025 года на Юбилейном бульваре, скульптор — Алексей Щитов[citation:14][citation:17].",
    img: "https://via.placeholder.com/600x300?text=Н.Жарков",
    quiz: {
      q: "Сколько лет Николай Жарков руководил заводом «Красное Сормово»?",
      options: ["34 года", "20 лет", "57 лет"],
      answer: 0
    }
  },
  {
    id: 5,
    lat: 56.3480, lng: 43.8690, // ⚠️ требуется проверка (сквер имени Иконникова, рядом с памятником Алексееву)
    title: "Памятник Валерию Иконникову",
    desc: "Главный конструктор ЦКБ по судам на подводных крыльях (1968–1988), участвовал в создании экранопланов «Орлёнок», «Лунь», «Волга-2». Памятный знак открыт 1 августа 2024 года в благоустроенном сквере его имени. Рядом установлена модель экраноплана «Орлёнок». На стеле размещены QR-коды и изображения судов, в разработке которых он участвовал[citation:2][citation:6].",
    img: "https://via.placeholder.com/600x300?text=В.Иконников",
    quiz: {
      q: "Что установлено рядом с памятным знаком Валерию Иконникову?",
      options: ["Модель экраноплана «Орлёнок»", "Копия «Метеора»", "Якорь с крейсера"],
      answer: 0
    }
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

let answeredQuizzes = {}; // 记录已回答的题目，防止重复作答

places.forEach(place => {
  // Иконка с номером
  const icon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:#2481cc;color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${place.id}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  const marker = L.marker([place.lat, place.lng], { icon }).addTo(map);

  marker.on('click', () => {
    infoTitle.textContent = place.title;

    // 构建内容
    let html = `<img src="${place.img}" alt="${place.title}">`;
    html += `<p>${place.desc}</p>`;

    // 测试题
    if (!answeredQuizzes[place.id]) {
      html += `<div class="quiz-box"><p>📝 Проверь себя: ${place.quiz.q}</p>`;
      place.quiz.options.forEach((opt, idx) => {
        html += `<button class="quiz-option" onclick="answerQuiz(${place.id}, ${idx})">${opt}</button>`;
      });
      html += `</div>`;
    } else {
      html += `<div class="quiz-box"><p>✅ Вы уже ответили на этот вопрос.</p></div>`;
    }

    infoContent.innerHTML = html;
    infoPanel.classList.add('active');
  });
});

// ========== ЛОГИКА ТЕСТА ==========
window.answerQuiz = function(placeId, selectedIdx) {
  const place = places.find(p => p.id === placeId);
  if (!place || answeredQuizzes[placeId]) return;

  const isCorrect = selectedIdx === place.quiz.answer;
  answeredQuizzes[placeId] = true;

  // 重新渲染题目区域，显示结果
  const quizBox = infoContent.querySelector('.quiz-box');
  const buttons = quizBox.querySelectorAll('.quiz-option');
  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === place.quiz.answer) {
      btn.style.background = '#2e7d32'; // 正确答案变绿
    } else if (idx === selectedIdx && !isCorrect) {
      btn.style.background = '#c62828'; // 选错的变红
    }
  });

  const resultDiv = document.createElement('div');
  resultDiv.className = 'quiz-result ' + (isCorrect ? 'correct' : 'wrong');
  resultDiv.textContent = isCorrect ? '✅ Верно!' : '❌ Неверно. Правильный ответ выделен зелёным.';
  quizBox.appendChild(resultDiv);
};

window.closePanel = function() {
  infoPanel.classList.remove('active');
};

// 点击地图空白处关闭面板
map.on('click', () => {
  infoPanel.classList.remove('active');
});