let currentGame = null;
let round = [];
let index = 0;
let score = 0;
let lives = 3;
let answered = false;
let lastSpokenExplanation = "";

function shuffle(array){
  const copy = [...array];
  for(let i=copy.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [copy[i],copy[j]] = [copy[j],copy[i]];
  }
  return copy;
}

function setScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function startGame(type){
  currentGame = type;
  const source = type === 'concept' ? conceptQuestions : missionQuestions;
  round = shuffle(source).slice(0, Math.min(QUESTIONS_PER_GAME, source.length));
  index = 0;
  score = 0;
  lives = 3;
  answered = false;
  setScreen('game');
  renderQuestion();
}

function renderQuestion(){
  if("speechSynthesis" in window) window.speechSynthesis.cancel();
  lastSpokenExplanation = "";
  answered = false;
  const item = round[index];
  document.getElementById('questionKind').textContent =
    currentGame === 'concept' ? '🧠 Comprende la situación' : '🔬 ' + item.kind;

  document.getElementById('questionText').textContent = item.q;
  document.getElementById('scoreStat').textContent = '⭐ ' + score;
  document.getElementById('lifeStat').textContent = '❤️'.repeat(Math.max(lives,0)) + '🖤'.repeat(Math.max(3-lives,0));
  document.getElementById('countStat').textContent = (index+1) + ' / ' + round.length;
  document.getElementById('progressBar').style.width = ((index)/round.length*100) + '%';

  const answers = shuffle([item.correct, ...item.wrong]);
  const box = document.getElementById('answers');
  box.innerHTML = '';

  answers.forEach(text=>{
    const btn = document.createElement('button');
    btn.className = 'answer';
    btn.textContent = text;
    btn.onclick = ()=>checkAnswer(btn, text, item);
    box.appendChild(btn);
  });

  const feedback = document.getElementById('feedback');
  feedback.className = 'feedback';
  feedback.innerHTML = '';
  document.getElementById('nextBtn').style.display = 'none';
}

function speakExplanation(text){
  lastSpokenExplanation = text;

  if(!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)){
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-CR";
  utterance.rate = 0.9;
  utterance.pitch = 1.05;
  utterance.volume = 1;

  const voices = window.speechSynthesis.getVoices();
  const spanishVoice =
    voices.find(v => v.lang && v.lang.toLowerCase().startsWith("es-cr")) ||
    voices.find(v => v.lang && v.lang.toLowerCase().startsWith("es"));

  if(spanishVoice) utterance.voice = spanishVoice;

  window.speechSynthesis.speak(utterance);
}

function replayExplanation(){
  if(lastSpokenExplanation){
    speakExplanation(lastSpokenExplanation);
  }
}

function checkAnswer(button, selected, item){
  if(answered) return;
  answered = true;

  const buttons = [...document.querySelectorAll('.answer')];
  buttons.forEach(b=>b.disabled = true);

  const feedback = document.getElementById('feedback');
  const isCorrect = selected === item.correct;

  if(isCorrect){
    score += 10;
    button.classList.add('correct');
    feedback.className = 'feedback show good';
    feedback.innerHTML = '<strong>✅ ¡Correcto!</strong>' + item.explain;
  } else {
    lives--;
    button.classList.add('wrong');
    buttons.forEach(b=>{
      if(b.textContent === item.correct) b.classList.add('correct');
    });
    const spokenText =
      'La respuesta correcta es ' + item.correct + '. ' +
      item.explain +
      ' Recuerda: busca la pista en la situación. Puede ser dónde vive, qué come o qué está pasando con la naturaleza.';

    feedback.className = 'feedback show bad';
    feedback.innerHTML =
      '<strong>💡 La respuesta correcta es: ' + escapeHtml(item.correct) + '</strong>' +
      item.explain +
      '<br><br><b>Busca la pista:</b> ¿dónde vive?, ¿qué come? o ¿qué está pasando con la naturaleza?' +
      '<div class="voice-row">' +
      '<button type="button" class="voice-btn" onclick="replayExplanation()">🔊 Escuchar otra vez</button>' +
      '</div>';

    speakExplanation(spokenText);

    document.getElementById('questionCard').classList.add('shake');
    setTimeout(()=>document.getElementById('questionCard').classList.remove('shake'),300);
  }

  document.getElementById('scoreStat').textContent = '⭐ ' + score;
  document.getElementById('lifeStat').textContent = '❤️'.repeat(Math.max(lives,0)) + '🖤'.repeat(Math.max(3-lives,0));
  document.getElementById('nextBtn').style.display = 'inline-block';
}

function nextQuestion(){
  index++;
  if(index >= round.length || lives <= 0){
    showResults();
  } else {
    renderQuestion();
  }
}

function showResults(){
  setScreen('results');
  document.getElementById('progressBar').style.width = '100%';
  const max = round.length * 10;
  const pct = Math.round(score/max*100);

  let icon='🏆', title='¡Excelente trabajo!', text='Entendiste muy bien los conceptos.', stars='⭐⭐⭐';
  if(pct < 80){
    icon='🌱'; title='¡Vas aprendiendo!'; text='Conviene repetir el juego y explicar en voz alta por qué eliges cada respuesta.'; stars='⭐⭐';
  }
  if(pct < 50){
    icon='🔍'; title='Misión de detective'; text='No memorices la palabra. Busca la pista en cada situación: dónde vive, qué come o qué acción está ocurriendo.'; stars='⭐';
  }
  if(lives <= 0){
    text += ' Te quedaste sin vidas, pero puedes volver a intentarlo con preguntas en otro orden.';
  }

  document.getElementById('resultIcon').textContent = icon;
  document.getElementById('resultStars').textContent = stars;
  document.getElementById('resultTitle').textContent = title;
  document.getElementById('finalScore').textContent = score + ' de ' + max + ' puntos';
  document.getElementById('resultText').textContent = text;
}

function restartGame(){
  startGame(currentGame);
}

function goHome(){
  if("speechSynthesis" in window) window.speechSynthesis.cancel();
  lastSpokenExplanation = "";
  setScreen('home');
}

function escapeHtml(str){
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}
