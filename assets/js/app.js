const API_BASE_URL = 'http://localhost:8888';
const STORAGE_KEY = 'webquiz:data:v1';
const USER_KEY = 'webquiz:user:v1';
const MAX_OPTIONS = 6;
const DEFAULT_OPTION_COUNT = 4;

const SEED_QUIZZES = [
  {
    id: 'q1',
    title: 'HTML Basics',
    text: 'Which tag is used to create a hyperlink?',
    options: ['<a>', '<p>', '<div>', '<span>'],
    answer: [0]
  },
  {
    id: 'q2',
    title: 'JavaScript Essentials',
    text: 'Which method converts JSON into a JavaScript object?',
    options: ['JSON.parse()', 'JSON.stringify()', 'Object.from()', 'Array.toJSON()'],
    answer: [0]
  }
];

const ui = {
  modeChip: document.getElementById('mode-chip'),
  quizCount: document.getElementById('quiz-count'),
  attemptCount: document.getElementById('attempt-count'),
  userLabel: document.getElementById('user-label'),
  formPanel: document.getElementById('form-panel'),
  quizForm: document.getElementById('quiz-form'),
  optionsGrid: document.getElementById('options-grid'),
  answerSelect: document.getElementById('answer-select'),
  quizGrid: document.getElementById('quiz-grid'),
  emptyState: document.getElementById('empty-state'),
  output: document.getElementById('output')
};

const state = {
  mode: 'local',
  quizzes: [],
  completed: [],
  user: null
};

function logOutput(message, data) {
  const timestamp = new Date().toLocaleTimeString();
  const lines = [`${timestamp} - ${message}`];
  if (data !== undefined) {
    lines.push(JSON.stringify(data, null, 2));
  }
  ui.output.textContent = lines.join('\n');
}

function createId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function loadUser() {
  const stored = localStorage.getItem(USER_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  const user = {
    id: createId(),
    email: `guest-${Math.floor(Math.random() * 1000)}@webquiz.local`
  };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  state.user = user;
  ui.userLabel.textContent = user.email;
}

function loadLocalStore() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const seed = { quizzes: SEED_QUIZZES, completed: [], users: [] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(stored);
  } catch (error) {
    const seed = { quizzes: SEED_QUIZZES, completed: [], users: [] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

function saveLocalStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 1500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function listQuizzesApi() {
  return fetchJson('/quizzes');
}

async function listCompletedApi() {
  return fetchJson('/completed');
}

async function createQuizApi(payload) {
  return fetchJson('/quizzes', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

async function deleteQuizApi(id) {
  return fetchJson(`/quizzes/${id}`, {
    method: 'DELETE'
  });
}

async function createCompletedApi(payload) {
  return fetchJson('/completed', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

async function createUserApi(payload) {
  return fetchJson('/users', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

function listQuizzesLocal() {
  const store = loadLocalStore();
  return store.quizzes;
}

function listCompletedLocal() {
  const store = loadLocalStore();
  return store.completed;
}

function createQuizLocal(payload) {
  const store = loadLocalStore();
  const created = { ...payload, id: createId() };
  store.quizzes.unshift(created);
  saveLocalStore(store);
  return created;
}

function deleteQuizLocal(id) {
  const store = loadLocalStore();
  store.quizzes = store.quizzes.filter((quiz) => String(quiz.id) !== String(id));
  saveLocalStore(store);
}

function createCompletedLocal(payload) {
  const store = loadLocalStore();
  const created = { ...payload, id: createId() };
  store.completed.unshift(created);
  saveLocalStore(store);
  return created;
}

function createUserLocal(payload) {
  const store = loadLocalStore();
  const created = { ...payload, id: createId() };
  store.users.unshift(created);
  saveLocalStore(store);
  return created;
}

async function resolveMode() {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/quizzes`);
    if (!response.ok) {
      throw new Error('API offline');
    }
    await response.json();
    state.mode = 'api';
  } catch (error) {
    state.mode = 'local';
  }
  updateModeChip();
}

function updateModeChip() {
  if (state.mode === 'api') {
    ui.modeChip.textContent = 'API mode (live)';
    ui.modeChip.dataset.mode = 'api';
  } else {
    ui.modeChip.textContent = 'Local mode (offline)';
    ui.modeChip.dataset.mode = 'local';
  }
}

async function refreshData() {
  await resolveMode();
  try {
    if (state.mode === 'api') {
      state.quizzes = await listQuizzesApi();
      state.completed = await listCompletedApi();
      logOutput('Loaded data from API.');
    } else {
      state.quizzes = listQuizzesLocal();
      state.completed = listCompletedLocal();
      logOutput('Loaded data from local storage.');
    }
  } catch (error) {
    state.mode = 'local';
    state.quizzes = listQuizzesLocal();
    state.completed = listCompletedLocal();
    updateModeChip();
    logOutput('API failed. Switched to local storage.', { error: error.message });
  }
  render();
}

function render() {
  ui.quizCount.textContent = state.quizzes.length;
  ui.attemptCount.textContent = state.completed.length;

  ui.quizGrid.innerHTML = '';
  ui.emptyState.hidden = state.quizzes.length !== 0;

  state.quizzes.forEach((quiz, index) => {
    const card = document.createElement('article');
    card.className = 'quiz-card';
    card.style.setProperty('--delay', `${index * 0.05}s`);

    const title = document.createElement('h3');
    title.textContent = quiz.title;

    const text = document.createElement('p');
    text.textContent = quiz.text;

    const actions = document.createElement('div');
    actions.className = 'quiz-actions';

    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = `Options: ${quiz.options.length}`;

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete-btn';
    deleteButton.textContent = 'Delete';
    deleteButton.dataset.action = 'delete-quiz';
    deleteButton.dataset.quizId = quiz.id;

    actions.append(tag, deleteButton);

    const optionsList = document.createElement('div');
    optionsList.className = 'options-list';

    quiz.options.forEach((option, optionIndex) => {
      const optionButton = document.createElement('button');
      optionButton.type = 'button';
      optionButton.className = 'option-btn';
      optionButton.textContent = option;
      optionButton.dataset.action = 'answer';
      optionButton.dataset.quizId = quiz.id;
      optionButton.dataset.optionIndex = optionIndex;
      optionsList.appendChild(optionButton);
    });

    const result = document.createElement('div');
    result.className = 'result';
    result.dataset.quizId = quiz.id;

    card.append(title, text, actions, optionsList, result);
    ui.quizGrid.appendChild(card);
  });
}

function createOptionField(value = '') {
  const wrapper = document.createElement('div');
  wrapper.className = 'option-field';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'option-input';
  input.placeholder = 'Option text';
  input.value = value;
  input.addEventListener('input', syncAnswerSelect);

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'icon-btn';
  removeButton.textContent = 'Remove';
  removeButton.dataset.action = 'remove-option';

  wrapper.append(input, removeButton);
  return wrapper;
}

function updateOptionControls() {
  const optionFields = Array.from(ui.optionsGrid.querySelectorAll('.option-field'));
  const canRemove = optionFields.length > 2;
  optionFields.forEach((field) => {
    const button = field.querySelector('[data-action="remove-option"]');
    if (button) {
      button.disabled = !canRemove;
    }
  });
}

function syncAnswerSelect() {
  const optionInputs = Array.from(ui.optionsGrid.querySelectorAll('input'));
  ui.answerSelect.innerHTML = '';
  optionInputs.forEach((input, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = input.value ? `${index + 1}. ${input.value}` : `Option ${index + 1}`;
    ui.answerSelect.appendChild(option);
  });
}

function resetForm() {
  ui.quizForm.reset();
  ui.optionsGrid.innerHTML = '';
  for (let i = 0; i < DEFAULT_OPTION_COUNT; i += 1) {
    ui.optionsGrid.appendChild(createOptionField(''));
  }
  syncAnswerSelect();
  updateOptionControls();
}

async function handleQuizSubmit(event) {
  event.preventDefault();
  const formData = new FormData(ui.quizForm);
  const title = formData.get('title').trim();
  const text = formData.get('text').trim();
  const answerIndex = Number(formData.get('answer'));

  const options = Array.from(ui.optionsGrid.querySelectorAll('input')).map((input) => input.value.trim());

  if (options.length < 2 || options.some((option) => option === '')) {
    logOutput('Please fill in at least two complete options.');
    return;
  }

  if (Number.isNaN(answerIndex) || answerIndex >= options.length) {
    logOutput('Please select a valid correct answer.');
    return;
  }

  const payload = {
    title,
    text,
    options,
    answer: [answerIndex]
  };

  try {
    let created;
    if (state.mode === 'api') {
      created = await createQuizApi(payload);
    } else {
      created = createQuizLocal(payload);
    }
    state.quizzes.unshift(created);
    render();
    resetForm();
    logOutput('Quiz created.', created);
  } catch (error) {
    logOutput('Failed to create quiz.', { error: error.message });
  }
}

async function handleDeleteQuiz(quizId) {
  const confirmed = window.confirm('Delete this quiz?');
  if (!confirmed) {
    return;
  }

  try {
    if (state.mode === 'api') {
      await deleteQuizApi(quizId);
    } else {
      deleteQuizLocal(quizId);
    }
    state.quizzes = state.quizzes.filter((quiz) => String(quiz.id) !== String(quizId));
    render();
    logOutput('Quiz deleted.');
  } catch (error) {
    logOutput('Failed to delete quiz.', { error: error.message });
  }
}

async function handleAnswer(quizId, optionIndex) {
  const quiz = state.quizzes.find((item) => String(item.id) === String(quizId));
  if (!quiz) {
    return;
  }
  const isCorrect = quiz.answer.includes(optionIndex);
  const result = ui.quizGrid.querySelector(`.result[data-quiz-id="${quizId}"]`);
  if (result) {
    result.textContent = isCorrect
      ? 'Correct answer!'
      : `Wrong answer. Correct: ${quiz.options[quiz.answer[0]]}`;
    result.classList.toggle('correct', isCorrect);
    result.classList.toggle('wrong', !isCorrect);
  }

  const completionPayload = {
    quizId: quiz.id,
    user: state.user.email,
    date: new Date().toISOString(),
    isCorrect,
    answer: optionIndex
  };

  try {
    let created;
    if (state.mode === 'api') {
      created = await createCompletedApi(completionPayload);
    } else {
      created = createCompletedLocal(completionPayload);
    }
    state.completed.unshift(created);
    ui.attemptCount.textContent = state.completed.length;
    logOutput('Answer recorded.', created);
  } catch (error) {
    logOutput('Failed to record answer.', { error: error.message });
  }
}

async function handleRegisterUser() {
  const newUser = {
    email: `user-${Math.floor(Math.random() * 10000)}@webquiz.local`,
    password: createId().slice(0, 8)
  };
  try {
    if (state.mode === 'api') {
      await createUserApi(newUser);
    } else {
      createUserLocal(newUser);
    }
    saveUser(newUser);
    logOutput('Demo user created.', newUser);
  } catch (error) {
    logOutput('Failed to create user.', { error: error.message });
  }
}

function toggleForm() {
  ui.formPanel.hidden = !ui.formPanel.hidden;
}

function handleAction(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const action = target.dataset.action;
  if (!action) {
    return;
  }

  if (action === 'refresh') {
    refreshData();
  }

  if (action === 'toggle-form') {
    toggleForm();
  }

  if (action === 'add-option') {
    const optionFields = ui.optionsGrid.querySelectorAll('.option-field');
    if (optionFields.length >= MAX_OPTIONS) {
      logOutput(`Maximum of ${MAX_OPTIONS} options reached.`);
      return;
    }
    ui.optionsGrid.appendChild(createOptionField(''));
    syncAnswerSelect();
    updateOptionControls();
  }

  if (action === 'remove-option') {
    const optionFields = Array.from(ui.optionsGrid.querySelectorAll('.option-field'));
    if (optionFields.length <= 2) {
      return;
    }
    const field = target.closest('.option-field');
    if (field) {
      field.remove();
      syncAnswerSelect();
      updateOptionControls();
    }
  }

  if (action === 'reset-form') {
    resetForm();
  }

  if (action === 'delete-quiz') {
    handleDeleteQuiz(target.dataset.quizId);
  }

  if (action === 'answer') {
    handleAnswer(target.dataset.quizId, Number(target.dataset.optionIndex));
  }

  if (action === 'register') {
    handleRegisterUser();
  }
}

function init() {
  state.user = loadUser();
  ui.userLabel.textContent = state.user.email;
  resetForm();
  refreshData();

  document.addEventListener('click', handleAction);
  ui.quizForm.addEventListener('submit', handleQuizSubmit);
}

init();
