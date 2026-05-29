const CURRENT_PLANS_KEY = 'field-standards-current-plans';
const CHANGE_LOG_KEY = 'field-standards-change-log';

const channels = ['Dr', 'MT', 'Fr', 'Pb', 'TM', 'HoReCa'];

const usersByChannel = {
  Dr: ['Іваненко Іван', 'Мельник Дмитро', 'Шевченко Оксана', 'Бондар Андрій'],
  MT: ['Петренко Петро', 'Кравченко Наталія', 'Лисенко Артем', 'Гнатюк Ірина'],
  Fr: ['Сидоренко Олена', 'Ткаченко Роман', 'Мороз Вікторія', 'Романюк Павло'],
  Pb: ['Коваленко Марія', 'Онищенко Сергій', 'Данилюк Анна', 'Клименко Юрій'],
  TM: ['Захарченко Богдан', 'Поліщук Катерина', 'Савчук Максим', 'Левченко Алла'],
  HoReCa: ['Гриценко Олег', 'Черненко Юлія', 'Кузьменко Назар', 'Марченко Валерія'],
};

const months = [
  'Січень 2026',
  'Лютий 2026',
  'Березень 2026',
  'Квітень 2026',
  'Травень 2026',
  'Червень 2026',
  'Липень 2026',
  'Серпень 2026',
  'Вересень 2026',
  'Жовтень 2026',
  'Листопад 2026',
  'Грудень 2026',
];

const form = document.querySelector('#planForm');
const channelSelect = document.querySelector('#channel');
const userSearch = document.querySelector('#userSearch');
const selectedUserName = document.querySelector('#selectedUserName');
const userSuggestions = document.querySelector('#userSuggestions');
const userHelper = document.querySelector('#userHelper');
const monthSelect = document.querySelector('#month');
const exportMonthSelect = document.querySelector('#exportMonth');
const successMessage = document.querySelector('#successMessage');
const errorMessage = document.querySelector('#errorMessage');
const historyMessage = document.querySelector('#historyMessage');
const tableWrap = document.querySelector('#tableWrap');
const tableBody = document.querySelector('#plansTableBody');
const exportCurrentPlansButton = document.querySelector('#exportCurrentPlans');
const exportChangeLogButton = document.querySelector('#exportChangeLog');

const numberInputs = [
  document.querySelector('#audits'),
  document.querySelector('#adminDays'),
  document.querySelector('#negotiations'),
];

const errors = {
  channel: document.querySelector('#channelError'),
  user: document.querySelector('#userError'),
  month: document.querySelector('#monthError'),
  audits: document.querySelector('#auditsError'),
  adminDays: document.querySelector('#adminDaysError'),
  negotiations: document.querySelector('#negotiationsError'),
};

function createId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `plan-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getNowLabel() {
  return new Intl.DateTimeFormat('uk-UA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());
}

function populateSelect(selectElement, items) {
  items.forEach((item) => {
    const option = document.createElement('option');
    option.value = item;
    option.textContent = item;
    selectElement.append(option);
  });
}

function readStorage(key) {
  const storedValue = localStorage.getItem(key);

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(storedValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getCurrentPlans() {
  return readStorage(CURRENT_PLANS_KEY);
}

function saveCurrentPlans(plans) {
  writeStorage(CURRENT_PLANS_KEY, plans);
}

function getChangeLog() {
  return readStorage(CHANGE_LOG_KEY);
}

function saveChangeLog(records) {
  writeStorage(CHANGE_LOG_KEY, records);
}

function getPlanKey(plan) {
  return `${plan.channel}||${plan.userName}||${plan.month}`;
}

function isIntegerValue(value) {
  return /^\d+$/.test(value);
}

function clearMessages() {
  successMessage.hidden = true;
  errorMessage.hidden = true;
  successMessage.textContent = '';
  errorMessage.textContent = '';
}

function showSuccess(message) {
  successMessage.textContent = message;
  successMessage.hidden = false;
  errorMessage.hidden = true;
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
  successMessage.hidden = true;
}

function setFieldError(name, message) {
  errors[name].textContent = message;
}

function clearFieldErrors() {
  Object.values(errors).forEach((error) => {
    error.textContent = '';
  });
}

function resetUserField() {
  userSearch.value = '';
  selectedUserName.value = '';
  userSuggestions.hidden = true;
  userSuggestions.innerHTML = '';
}

function getFilteredUsers() {
  const channel = channelSelect.value;
  const query = userSearch.value.trim().toLowerCase();
  const channelUsers = usersByChannel[channel] || [];

  if (!query) {
    return channelUsers;
  }

  return channelUsers.filter((user) => user.toLowerCase().includes(query));
}

function renderUserSuggestions() {
  const channel = channelSelect.value;

  userSuggestions.innerHTML = '';

  if (!channel) {
    userSuggestions.hidden = true;
    return;
  }

  const filteredUsers = getFilteredUsers();

  if (filteredUsers.length === 0) {
    const emptyItem = document.createElement('div');
    emptyItem.className = 'autocomplete-empty';
    emptyItem.textContent = 'Користувача не знайдено';
    userSuggestions.append(emptyItem);
    userSuggestions.hidden = false;
    return;
  }

  filteredUsers.forEach((user) => {
    const button = document.createElement('button');
    button.className = 'autocomplete-option';
    button.type = 'button';
    button.textContent = user;
    button.addEventListener('click', () => {
      userSearch.value = user;
      selectedUserName.value = user;
      userSuggestions.hidden = true;
      setFieldError('user', '');
      renderCurrentPlans();
    });
    userSuggestions.append(button);
  });

  userSuggestions.hidden = false;
}

function handleChannelChange() {
  resetUserField();
  clearMessages();

  if (!channelSelect.value) {
    userSearch.disabled = true;
    userSearch.placeholder = 'Спочатку оберіть канал збуту';
    userHelper.textContent = 'Оберіть канал збуту, щоб побачити доступних користувачів.';
  } else {
    userSearch.disabled = false;
    userSearch.placeholder = 'Почніть вводити ПІБ';
    userHelper.textContent = 'Пошук працює лише серед користувачів обраного каналу.';
  }

  renderCurrentPlans();
}

function handleUserInput() {
  selectedUserName.value = '';
  setFieldError('user', '');
  renderUserSuggestions();
  renderCurrentPlans();
}

function handleNumericInput(event) {
  event.target.value = event.target.value.replace(/\D/g, '');
}

function validateForm() {
  clearFieldErrors();
  let isValid = true;

  if (!channelSelect.value) {
    setFieldError('channel', 'Оберіть канал збуту.');
    isValid = false;
  }

  if (!selectedUserName.value) {
    setFieldError('user', 'Оберіть ПІБ зі списку користувачів.');
    isValid = false;
  }

  if (!monthSelect.value) {
    setFieldError('month', 'Оберіть місяць планування.');
    isValid = false;
  }

  numberInputs.forEach((input) => {
    const value = input.value.trim();

    if (!value) {
      setFieldError(input.name, 'Заповніть це поле.');
      isValid = false;
    } else if (!isIntegerValue(value)) {
      setFieldError(input.name, 'Вкажіть ціле число 0 або більше.');
      isValid = false;
    }
  });

  if (!isValid) {
    showError('Перевірте поля форми та спробуйте ще раз.');
  }

  return isValid;
}

function getSelectedUserPlans() {
  const channel = channelSelect.value;
  const userName = selectedUserName.value;

  if (!channel || !userName) {
    return [];
  }

  return getCurrentPlans()
    .filter((plan) => plan.channel === channel && plan.userName === userName)
    .sort((a, b) => months.indexOf(a.month) - months.indexOf(b.month));
}

function renderCurrentPlans() {
  const channel = channelSelect.value;
  const userName = selectedUserName.value;

  tableBody.innerHTML = '';

  if (!channel || !userName) {
    historyMessage.textContent = 'Оберіть канал збуту та ПІБ для перегляду історії.';
    historyMessage.hidden = false;
    tableWrap.hidden = true;
    return;
  }

  const plans = getSelectedUserPlans();

  if (plans.length === 0) {
    historyMessage.textContent = 'Для обраного користувача ще немає збережених планів.';
    historyMessage.hidden = false;
    tableWrap.hidden = true;
    return;
  }

  historyMessage.hidden = true;
  tableWrap.hidden = false;

  plans.forEach((plan) => {
    const row = document.createElement('tr');
    const cells = [
      ['Місяць планування', plan.month],
      ['Аудити / Сторчеки', plan.audits],
      ['Адміністративні дні', plan.adminDays],
      ['Перемовини', plan.negotiations],
      ['Коментар', plan.comment || '-'],
      ['Версія', plan.version],
      ['Останнє оновлення', plan.updatedAt],
    ];

    cells.forEach(([label, value]) => {
      const cell = document.createElement('td');
      cell.dataset.label = label;
      cell.textContent = value;
      row.append(cell);
    });

    tableBody.append(row);
  });
}

function addChangeLogRecord(plan, actionType, logRecords) {
  const planKey = getPlanKey(plan);
  const nextRecords = logRecords.map((record) => (
    getPlanKey(record) === planKey ? { ...record, isCurrent: 'Ні' } : record
  ));

  nextRecords.unshift({
    id: createId(),
    channel: plan.channel,
    userName: plan.userName,
    month: plan.month,
    audits: plan.audits,
    adminDays: plan.adminDays,
    negotiations: plan.negotiations,
    comment: plan.comment,
    version: plan.version,
    actionType,
    isCurrent: 'Так',
    changedAt: plan.updatedAt,
  });

  return nextRecords;
}

function buildPlanFromForm(version, existingId) {
  const now = getNowLabel();

  return {
    id: existingId || createId(),
    channel: channelSelect.value,
    userName: selectedUserName.value,
    month: monthSelect.value,
    audits: Number(document.querySelector('#audits').value.trim()),
    adminDays: Number(document.querySelector('#adminDays').value.trim()),
    negotiations: Number(document.querySelector('#negotiations').value.trim()),
    comment: document.querySelector('#comment').value.trim(),
    version,
    updatedAt: now,
  };
}

function handleSubmit(event) {
  event.preventDefault();
  clearMessages();

  if (!validateForm()) {
    return;
  }

  const currentPlans = getCurrentPlans();
  const changeLog = getChangeLog();
  const draftPlan = buildPlanFromForm(1);
  const existingIndex = currentPlans.findIndex((plan) => getPlanKey(plan) === getPlanKey(draftPlan));

  if (existingIndex === -1) {
    const newPlan = draftPlan;
    saveCurrentPlans([newPlan, ...currentPlans]);
    saveChangeLog(addChangeLogRecord(newPlan, 'Створено', changeLog));
    showSuccess('План успішно збережено.');
  } else {
    const shouldUpdate = confirm(
      'План для цього користувача, каналу та місяця вже існує. Бажаєте оновити актуальний план?',
    );

    if (!shouldUpdate) {
      return;
    }

    const existingPlan = currentPlans[existingIndex];
    const updatedPlan = buildPlanFromForm(existingPlan.version + 1, existingPlan.id);
    const nextPlans = [...currentPlans];
    nextPlans[existingIndex] = updatedPlan;

    saveCurrentPlans(nextPlans);
    saveChangeLog(addChangeLogRecord(updatedPlan, 'Оновлено', changeLog));
    showSuccess('План успішно оновлено.');
  }

  monthSelect.value = '';
  numberInputs.forEach((input) => {
    input.value = '';
  });
  document.querySelector('#comment').value = '';
  renderCurrentPlans();
}

function escapeCsvValue(value) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(fileName, headers, rows) {
  const csv = [
    headers.map(escapeCsvValue).join(';'),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(';')),
  ].join('\r\n');

  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function validateExportMonth() {
  if (!exportMonthSelect.value) {
    alert('Оберіть місяць планування для експорту.');
    return false;
  }

  return true;
}

function exportCurrentPlans() {
  if (!validateExportMonth()) {
    return;
  }

  const selectedMonth = exportMonthSelect.value;
  const headers = [
    'Канал збуту',
    'ПІБ',
    'Місяць планування',
    'Аудити / Сторчеки',
    'Адміністративні дні',
    'Перемовини',
    'Коментар',
    'Версія',
    'Останнє оновлення',
  ];

  const rows = getCurrentPlans()
    .filter((plan) => plan.month === selectedMonth)
    .map((plan) => ({
      'Канал збуту': plan.channel,
      'ПІБ': plan.userName,
      'Місяць планування': plan.month,
      'Аудити / Сторчеки': plan.audits,
      'Адміністративні дні': plan.adminDays,
      'Перемовини': plan.negotiations,
      'Коментар': plan.comment,
      'Версія': plan.version,
      'Останнє оновлення': plan.updatedAt,
    }));

  downloadCsv(`Field Standards - Current Plans - ${selectedMonth}.csv`, headers, rows);
}

function exportChangeLog() {
  if (!validateExportMonth()) {
    return;
  }

  const selectedMonth = exportMonthSelect.value;
  const headers = [
    'Канал збуту',
    'ПІБ',
    'Місяць планування',
    'Аудити / Сторчеки',
    'Адміністративні дні',
    'Перемовини',
    'Коментар',
    'Версія',
    'Тип дії',
    'Актуальний запис',
    'Дата зміни',
  ];

  const rows = getChangeLog()
    .filter((record) => record.month === selectedMonth)
    .map((record) => ({
      'Канал збуту': record.channel,
      'ПІБ': record.userName,
      'Місяць планування': record.month,
      'Аудити / Сторчеки': record.audits,
      'Адміністративні дні': record.adminDays,
      'Перемовини': record.negotiations,
      'Коментар': record.comment,
      'Версія': record.version,
      'Тип дії': record.actionType,
      'Актуальний запис': record.isCurrent,
      'Дата зміни': record.changedAt,
    }));

  downloadCsv(`Field Standards - Change Log - ${selectedMonth}.csv`, headers, rows);
}

function closeSuggestionsOnOutsideClick(event) {
  if (!event.target.closest('.autocomplete-field')) {
    userSuggestions.hidden = true;
  }
}

populateSelect(channelSelect, channels);
populateSelect(monthSelect, months);
populateSelect(exportMonthSelect, months);

channelSelect.addEventListener('change', handleChannelChange);
userSearch.addEventListener('input', handleUserInput);
userSearch.addEventListener('focus', renderUserSuggestions);
document.addEventListener('click', closeSuggestionsOnOutsideClick);
numberInputs.forEach((input) => input.addEventListener('input', handleNumericInput));
form.addEventListener('submit', handleSubmit);
exportCurrentPlansButton.addEventListener('click', exportCurrentPlans);
exportChangeLogButton.addEventListener('click', exportChangeLog);

renderCurrentPlans();
