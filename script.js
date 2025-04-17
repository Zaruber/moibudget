// Глобальные переменные для хранения данных
let incomes = [];
let fixedExpenses = [];
let variableExpenses = [];
let currentFilter = 'all';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем данные из localStorage, если они есть
    loadData();
    
    // Инициализируем обработчики событий
    initEventListeners();
    
    // Отрисовываем начальные формы и данные
    renderIncomes();
    renderExpenses();
    updateIncomeOptions();
    updateSummary();
    updateForecastTable();
    
    // Обновляем информацию о расходах на фильтрах
    updateFilterButtonsInfo();
    
    // Инициализируем отображение текущей даты и времени
    updateDateTime();
    setInterval(updateDateTime, 1000); // Обновляем каждую секунду
});

// Загрузка сохраненных данных
function loadData() {
    if (localStorage.getItem('financeData')) {
        const data = JSON.parse(localStorage.getItem('financeData'));
        incomes = data.incomes || [];
        fixedExpenses = data.fixedExpenses || [];
        variableExpenses = data.variableExpenses || [];
        
        // Проверяем, содержат ли расходы поле incomeId
        fixedExpenses.forEach(expense => {
            if (!('incomeId' in expense)) {
                expense.incomeId = '';
            }
        });
        
        variableExpenses.forEach(expense => {
            if (!('incomeId' in expense)) {
                expense.incomeId = '';
            }
        });
    } else {
        // Добавляем пример дохода, если нет сохраненных данных
        incomes.push({
            id: generateId(),
            name: 'Зарплата',
            amount: 50000,
            frequency: 'monthly'
        });
        
        // Добавляем пример постоянного расхода
        fixedExpenses.push({
            id: generateId(),
            name: 'Аренда жилья',
            amount: 20000,
            incomeId: ''
        });
        
        // Добавляем пример переменного расхода
        variableExpenses.push({
            id: generateId(),
            name: 'Продукты',
            amount: 10000,
            incomeId: ''
        });
    }
}

// Сохранение данных
function saveData() {
    const data = {
        incomes: incomes,
        fixedExpenses: fixedExpenses,
        variableExpenses: variableExpenses
    };
    localStorage.setItem('financeData', JSON.stringify(data));
}

// Инициализация обработчиков событий
function initEventListeners() {
    // Обработка фильтров доходов
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Получаем значение фильтра
            currentFilter = this.dataset.filter || 'all';
            
            // Если это фильтр "Все", удаляем детальное представление дохода и показываем прогноз
            if (currentFilter === 'all') {
                removeSingleIncomeView();
                document.getElementById('forecast-card').style.display = 'block';
            } else {
                // Скрываем прогноз при выборе конкретного дохода
                document.getElementById('forecast-card').style.display = 'none';
            }
            
            // Обновляем интерфейс
            renderIncomes();
            renderExpenses();
            
            // Обновляем информацию о расходах для выбранного фильтра
            updateFilterButtonsInfo(currentFilter);
        });
    });
    
    // Кнопки добавления элементов
    document.getElementById('add-income').addEventListener('click', () => showIncomeModal());
    document.getElementById('add-income-link').addEventListener('click', () => showIncomeModal());
    document.getElementById('add-expense-link').addEventListener('click', () => showExpenseModal());
    
    // Сохранение дохода
    document.getElementById('saveIncomeBtn').addEventListener('click', saveIncome);
    
    // Сохранение расхода
    document.getElementById('saveExpenseBtn').addEventListener('click', saveExpense);
    
    // Переключение типа расхода
    document.querySelectorAll('input[name="expense-type-radio"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.getElementById('expense-type').value = this.value;
        });
    });
}

// Показать модальное окно добавления/редактирования дохода
function showIncomeModal(incomeId = null) {
    const modalTitle = document.getElementById('incomeModalTitle');
    const incomeIdInput = document.getElementById('income-id');
    const incomeNameInput = document.getElementById('income-name');
    const incomeAmountInput = document.getElementById('income-amount');
    const incomeFrequencySelect = document.getElementById('income-frequency');
    
    if (incomeId) {
        // Редактирование существующего дохода
        const income = incomes.find(inc => inc.id === incomeId);
        modalTitle.textContent = 'Редактирование дохода';
        incomeIdInput.value = income.id;
        incomeNameInput.value = income.name;
        incomeAmountInput.value = income.amount;
        incomeFrequencySelect.value = income.frequency;
    } else {
        // Добавление нового дохода
        modalTitle.textContent = 'Добавление дохода';
        incomeIdInput.value = '';
        incomeNameInput.value = '';
        incomeAmountInput.value = '';
        incomeFrequencySelect.value = 'monthly';
    }
    
    const modal = new bootstrap.Modal(document.getElementById('incomeModal'));
    modal.show();
}

// Показать модальное окно добавления/редактирования расхода
function showExpenseModal(expenseId = null, type = 'fixed', preselectedIncomeId = null) {
    // Заполняем форму данными
    if (expenseId) {
        // Редактирование существующего расхода
        const expense = fixedExpenses.find(exp => exp.id === expenseId) || variableExpenses.find(exp => exp.id === expenseId);
        
        if (!expense) {
            console.error('Расход не найден:', expenseId);
            return;
        }
        
        // Заполняем форму существующими данными
        document.getElementById('expense-id').value = expense.id;
        document.getElementById('expense-name').value = expense.name;
        document.getElementById('expense-amount').value = expense.amount;
        document.getElementById('expense-income').value = expense.incomeId;
        document.getElementById('expense-type').value = type;
        
        // Устанавливаем заголовок модального окна
        document.getElementById('expenseModalTitle').textContent = 'Редактировать расход';
    } else {
        // Добавление нового расхода
        document.getElementById('expense-id').value = '';
        document.getElementById('expense-name').value = '';
        document.getElementById('expense-amount').value = '';
        document.getElementById('expense-income').value = preselectedIncomeId || '';
        document.getElementById('expense-type').value = type;
        
        // Устанавливаем заголовок модального окна
        document.getElementById('expenseModalTitle').textContent = 'Добавление расхода';
    }
    
    // Устанавливаем правильный тип расхода
    if (type === 'fixed') {
        document.getElementById('fixed-expense-radio').checked = true;
        document.getElementById('variable-expense-radio').checked = false;
    } else {
        document.getElementById('fixed-expense-radio').checked = false;
        document.getElementById('variable-expense-radio').checked = true;
    }
    
    // Обновляем опции выбора дохода
    const expenseIncomeSelect = document.getElementById('expense-income');
    expenseIncomeSelect.innerHTML = '<option value="">Не привязывать</option>';
    incomes.forEach(income => {
        const option = document.createElement('option');
        option.value = income.id;
        option.textContent = income.name;
        expenseIncomeSelect.appendChild(option);
    });
    
    // Открываем модальное окно
    const expenseModal = new bootstrap.Modal(document.getElementById('expenseModal'));
    expenseModal.show();
}

// Сохранение дохода
function saveIncome() {
    const incomeId = document.getElementById('income-id').value;
    const incomeName = document.getElementById('income-name').value;
    const incomeAmount = parseFloat(document.getElementById('income-amount').value) || 0;
    const incomeFrequency = document.getElementById('income-frequency').value;
    
    if (!incomeName) {
        showMessage('Ошибка', 'Необходимо указать название дохода');
        return;
    }
    
    if (incomeId) {
        // Обновление существующего дохода
        const income = incomes.find(inc => inc.id === incomeId);
        income.name = incomeName;
        income.amount = incomeAmount;
        income.frequency = incomeFrequency;
        
        // Если мы редактировали доход, который отображается в детальном виде,
        // нужно обновить представление детального просмотра
        if (currentFilter !== 'all' && currentFilter === income.name.toLowerCase()) {
            removeSingleIncomeView();
        }
    } else {
        // Добавление нового дохода
        const newIncome = {
            id: generateId(),
            name: incomeName,
            amount: incomeAmount,
            frequency: incomeFrequency
        };
        incomes.push(newIncome);
    }
    
    // Если был создан новый доход, добавляем для него фильтр
    if (!incomeId) {
        addIncomeFilter(incomeName);
    }
    
    saveData();
    
    // Если текущий фильтр "Все", то удаляем детальное представление дохода
    if (currentFilter === 'all') {
        removeSingleIncomeView();
    }
    
    // Переносим фокус на безопасный элемент перед закрытием модального окна
    document.querySelector('.container').focus();
    
    // Обновляем интерфейс
    renderIncomes();
    updateIncomeOptions();
    renderExpenses();
    updateForecastTable();
    updateSummary();
    updateFilterButtonsInfo();
    
    // Закрываем модальное окно
    bootstrap.Modal.getInstance(document.getElementById('incomeModal')).hide();
}

// Сохранение расхода
function saveExpense() {
    const expenseId = document.getElementById('expense-id').value;
    const expenseType = document.getElementById('expense-type').value;
    const expenseName = document.getElementById('expense-name').value;
    const expenseAmount = parseFloat(document.getElementById('expense-amount').value) || 0;
    const expenseIncomeId = document.getElementById('expense-income').value;
    
    if (!expenseName) {
        showMessage('Ошибка', 'Необходимо указать название расхода');
        return;
    }
    
    const expenseData = {
        id: expenseId || generateId(),
        name: expenseName,
        amount: expenseAmount,
        incomeId: expenseIncomeId
    };
    
    if (expenseId) {
        // Обновление существующего расхода
        if (expenseType === 'fixed') {
            const index = fixedExpenses.findIndex(exp => exp.id === expenseId);
            if (index !== -1) {
                fixedExpenses[index] = expenseData;
            }
        } else {
            const index = variableExpenses.findIndex(exp => exp.id === expenseId);
            if (index !== -1) {
                variableExpenses[index] = expenseData;
            }
        }
    } else {
        // Добавление нового расхода
        if (expenseType === 'fixed') {
            fixedExpenses.push(expenseData);
        } else {
            variableExpenses.push(expenseData);
        }
    }
    
    // Переносим фокус на безопасный элемент перед закрытием модального окна
    // Это решает проблему с aria-hidden и сохранением фокуса
    document.querySelector('.container').focus();
    
    // Закрываем модальное окно
    const modal = bootstrap.Modal.getInstance(document.getElementById('expenseModal'));
    modal.hide();
    
    // Обновляем интерфейс
    saveData();
    renderExpenses();
    renderIncomes();
    updateSummary();
    updateForecastTable();
    updateFilterButtonsInfo(expenseIncomeId);
}

// Добавление фильтра дохода
function addIncomeFilter(incomeName) {
    // Проверяем, существует ли уже такой фильтр
    const filterName = incomeName.toLowerCase();
    if (!document.getElementById('income-filter-' + filterName)) {
        // Создаем кнопку фильтра
    const filterBtn = document.createElement('button');
        filterBtn.classList.add('filter-btn');
    filterBtn.id = 'income-filter-' + filterName;
        filterBtn.setAttribute('data-filter', filterName);
        filterBtn.textContent = incomeName;
        
        // Добавляем обработчик событий
        filterBtn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
            // Получаем значение фильтра
            currentFilter = this.dataset.filter || 'all';
            
            // Если это фильтр "Все", удаляем детальное представление дохода
            if (currentFilter === 'all') {
                removeSingleIncomeView();
            }
            
            // Обновляем интерфейс
        renderIncomes();
        renderExpenses();
            updateFilterButtonsInfo(currentFilter);
        });
        
        // Находим кнопку "Добавить доход" для вставки перед ней
        const addIncomeBtn = document.getElementById('add-income');
        const filtersContainer = document.querySelector('.income-filters');
        
        // Вставляем кнопку фильтра перед кнопкой добавления
        if (filtersContainer && addIncomeBtn) {
            filtersContainer.insertBefore(filterBtn, addIncomeBtn);
        }
    }
}

// Генерация уникального ID
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// Обновление опций выбора дохода
function updateIncomeOptions() {
    // Функция больше не требуется из-за удаления чеков, но оставляем её пустой
    // для совместимости с остальным кодом
}

// Форматирование числа с разделением разрядов пробелами
function formatNumber(num) {
    return parseFloat(num).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// Расчет ежемесячной суммы дохода
function calculateMonthlyIncome(income) {
    let amount = parseFloat(income.amount) || 0;
    switch (income.frequency) {
        case 'daily': amount *= 30; break;
        case 'weekly': amount *= 4.33; break;
        case 'biweekly': amount *= 2.17; break;
        case 'monthly': break;
        case 'quarterly': amount /= 3; break;
        case 'yearly': amount /= 12; break;
    }
    return amount;
}

// Получить текстовое описание частоты дохода
function getFrequencyText(frequency) {
    switch (frequency) {
        case 'daily': return '/день';
        case 'weekly': return '/нед';
        case 'biweekly': return '/2 нед';
        case 'monthly': return '/мес';
        case 'quarterly': return '/кв';
        case 'yearly': return '/год';
        default: return '';
    }
}

// Отрисовка списка доходов
function renderIncomes() {
    const incomeList = document.getElementById('income-list');
    incomeList.innerHTML = '';
    
    // Получение и обновление заголовков карточек
    const incomeCard = document.getElementById('income-card');
    const expenseCard = document.getElementById('expense-card');
    const forecastCard = document.getElementById('forecast-card');
    
    // Расчет общей суммы доходов
    let totalIncome = 0;
    incomes.forEach(income => totalIncome += calculateMonthlyIncome(income));
    
    // Обновляем отображение общей суммы
    document.getElementById('total-income-display').textContent = formatNumber(totalIncome) + ' ₽/мес';
    
    if (currentFilter !== 'all') {
        // Отображаем детали одного выбранного дохода
        const selectedIncome = incomes.find(income => income.name.toLowerCase() === currentFilter);
        if (selectedIncome) {
            // Скрываем карточки доходов, расходов и прогноза
            if (incomeCard) incomeCard.style.display = 'none';
            if (expenseCard) expenseCard.style.display = 'none';
            if (forecastCard) forecastCard.style.display = 'none';
            
            // Создаем представление для отдельного дохода
            renderSingleIncome(selectedIncome);
        } else {
            // Если доход не найден, отображаем сообщение
            if (incomeCard) incomeCard.style.display = 'block';
            if (expenseCard) expenseCard.style.display = 'block';
            if (forecastCard) forecastCard.style.display = 'none';
            
            // Удаляем существующий вид детального просмотра, если есть
            removeSingleIncomeView();
            
            const noIncomeMessage = document.createElement('div');
            noIncomeMessage.className = 'no-data-message';
            noIncomeMessage.textContent = 'Доход не найден';
            incomeList.appendChild(noIncomeMessage);
        }
    } else {
        // Показываем карточки доходов, расходов и прогноза
        if (incomeCard) incomeCard.style.display = 'block';
        if (expenseCard) expenseCard.style.display = 'block';
        if (forecastCard) forecastCard.style.display = 'block';
        
        // Обновляем таблицу прогноза
        updateForecastTable();
        
        // Удаляем существующий вид детального просмотра, если есть
        removeSingleIncomeView();
        
        // Отображаем список всех доходов
        if (incomes.length > 0) {
            incomes.forEach(income => {
        const monthlyAmount = calculateMonthlyIncome(income);
                
                const incomeItem = document.createElement('div');
                incomeItem.className = 'finance-item';
                
                // Создаем элемент имени
                const incomeName = document.createElement('div');
                incomeName.className = 'finance-item-name';
                incomeName.textContent = income.name;
                
                // Создаем элемент суммы
                const incomeAmount = document.createElement('div');
                incomeAmount.className = 'finance-item-amount';
                incomeAmount.textContent = formatNumber(monthlyAmount) + ' ₽';
                
                // Добавляем в контейнер
                incomeItem.appendChild(incomeName);
                incomeItem.appendChild(incomeAmount);
                
                // Делаем всю строку кликабельной для фильтрации
                incomeItem.style.cursor = 'pointer';
                incomeItem.addEventListener('click', () => {
                    const filterBtn = document.getElementById(`income-filter-${income.name.toLowerCase()}`);
                    if (filterBtn) {
                        filterBtn.click();
                    }
                });
                
                // Добавляем элемент в список
                incomeList.appendChild(incomeItem);
            });
        } else {
            // Если нет доходов, показываем сообщение
            const noIncomeMessage = document.createElement('div');
            noIncomeMessage.className = 'no-data-message';
            noIncomeMessage.textContent = 'Нет доходов';
            incomeList.appendChild(noIncomeMessage);
        }
        
        // Обновляем общий баланс
        updateSummary();
    }
}

// Функция для удаления вида детального просмотра дохода
function removeSingleIncomeView() {
    const existingView = document.getElementById('single-income-view');
    if (existingView) {
        existingView.remove();
    }
}

// Отрисовка детального просмотра одного дохода
function renderSingleIncome(income) {
    // Находим контейнер для вывода
    const container = document.querySelector('.container');
    
    // Сначала удаляем существующее представление, если оно уже есть
    removeSingleIncomeView();
    
    // Создаем элемент для отображения одного дохода
    const singleIncomeView = document.createElement('div');
    singleIncomeView.className = 'finance-card single-income-card mb-4';
    singleIncomeView.id = 'single-income-view';
    
    // Вычисляем суммы
    const monthlyAmount = calculateMonthlyIncome(income);
    const linkedExpenses = [...fixedExpenses, ...variableExpenses].filter(e => e.incomeId === income.id);
    const totalExpenses = linkedExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const remainingAmount = monthlyAmount - totalExpenses;
    
    // Создаем компактный интерфейс
    singleIncomeView.innerHTML = `
        <div class="single-income-header">
            <div class="single-income-top">
                <div class="income-title-area">
                    <h3>${income.name}</h3>
                    <span class="income-frequency">${getFrequencyText(income.frequency)}</span>
                </div>
                <div class="single-income-actions">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="showIncomeModal('${income.id}')">
                    <i class="bi bi-pencil"></i>
                </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="removeIncome('${income.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
                    </div>
            <div class="single-income-amount-row">
                <div class="amount-block">
                    <div class="amount-label">Доход</div>
                    <div class="amount-value income">${formatNumber(monthlyAmount)} ₽</div>
                    </div>
                <div class="amount-block">
                    <div class="amount-label">Расходы</div>
                    <div class="amount-value expense">${formatNumber(totalExpenses)} ₽</div>
                </div>
                <div class="amount-block">
                    <div class="amount-label">Остаток</div>
                    <div class="amount-value ${remainingAmount >= 0 ? 'positive' : 'negative'}">${formatNumber(remainingAmount)} ₽</div>
                </div>
                    </div>
                </div>
            `;
    
    // Создаем список расходов
    const expensesList = document.createElement('div');
    expensesList.className = 'single-income-expenses';
    
    // Заголовок секции расходов
    const expensesHeader = document.createElement('div');
    expensesHeader.className = 'expenses-section-header';
    expensesHeader.innerHTML = `
        <div class="section-title">Связанные расходы</div>
        <button class="btn btn-sm btn-primary add-expense-compact" onclick="showExpenseModal(null, 'fixed', '${income.id}')">
            <i class="bi bi-plus-lg"></i> Добавить
        </button>
    `;
    expensesList.appendChild(expensesHeader);
    
    // Если есть расходы, добавляем их
    if (linkedExpenses.length > 0) {
        const expensesContainer = document.createElement('div');
        expensesContainer.className = 'expenses-container';
        
        linkedExpenses.sort((a, b) => parseFloat(b.amount || 0) - parseFloat(a.amount || 0));
        
        linkedExpenses.forEach(expense => {
            const expenseItem = document.createElement('div');
            expenseItem.className = 'expense-compact-item';
            
            expenseItem.innerHTML = `
                <div class="expense-name">${expense.name || expense.category || 'Без названия'}</div>
                <div class="expense-actions">
                    <button class="btn btn-sm btn-link p-0 me-2" title="Редактировать" onclick="event.stopPropagation(); showExpenseModal('${expense.id}', '${expense.type || (fixedExpenses.some(e => e.id === expense.id) ? 'fixed' : 'variable')}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-link text-danger p-0" title="Удалить" onclick="event.stopPropagation(); removeExpense('${expense.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
                <div class="expense-amount">${formatNumber(expense.amount || 0)} ₽</div>
            `;
            
            // Добавляем обработчик для редактирования при клике
            expenseItem.style.cursor = 'pointer';
            if (expense.type !== 'receipt') {
                expenseItem.addEventListener('click', () => {
                    showExpenseModal(expense.id, expense.type || (fixedExpenses.some(e => e.id === expense.id) ? 'fixed' : 'variable'));
                });
            } else {
                expenseItem.title = 'Расход из чека';
            }
            
            expensesContainer.appendChild(expenseItem);
        });
        
        expensesList.appendChild(expensesContainer);
    } else {
        // Если нет расходов, отображаем сообщение
        const noExpenses = document.createElement('div');
        noExpenses.className = 'no-expenses-message';
        noExpenses.textContent = 'Нет связанных расходов';
        expensesList.appendChild(noExpenses);
    }
    
    // Добавляем список расходов в представление
    singleIncomeView.appendChild(expensesList);
    
    // Добавляем кнопку возврата к общему списку
    const backButtonContainer = document.createElement('div');
    backButtonContainer.className = 'text-center pb-3';
    const backButton = document.createElement('button');
    backButton.className = 'btn btn-sm btn-outline-secondary';
    backButton.innerHTML = '<i class="bi bi-arrow-left"></i> Вернуться к списку';
    backButton.addEventListener('click', () => {
        // Сбрасываем фильтр на "Все"
        const allFilterBtn = document.querySelector('.filter-btn[data-filter="all"]');
        if (allFilterBtn) {
            allFilterBtn.click();
        } else {
            // Если кнопка не найдена, просто сбрасываем вручную
            currentFilter = 'all';
            removeSingleIncomeView();
            renderIncomes();
            renderExpenses();
            
            // Показываем карточки доходов, расходов и прогноза
            const incomeCard = document.getElementById('income-card');
            const expenseCard = document.getElementById('expense-card');
            const forecastCard = document.getElementById('forecast-card');
            if (incomeCard) incomeCard.style.display = 'block';
            if (expenseCard) expenseCard.style.display = 'block';
            if (forecastCard) forecastCard.style.display = 'block';
            
            // Обновляем таблицу прогноза
            updateForecastTable();
        }
    });
    backButtonContainer.appendChild(backButton);
    singleIncomeView.appendChild(backButtonContainer);
    
    // Добавляем карточку дохода после фильтров
    const filtersContainer = document.querySelector('.income-filters');
    container.insertBefore(singleIncomeView, filtersContainer.nextSibling);
    
    // Обновляем отображение остатка
    updateBalanceForIncome(income.id, remainingAmount);
}

// Обновление отображения остатка для конкретного дохода
function updateBalanceForIncome(incomeId, remainingAmount) {
    const balanceDisplay = document.getElementById('balance-display');
    balanceDisplay.textContent = `${formatNumber(remainingAmount)} ₽`;
    balanceDisplay.classList.remove('text-success', 'text-danger');
    balanceDisplay.classList.add(remainingAmount >= 0 ? 'text-success' : 'text-danger');
}

// В функции renderExpenses обновляем заголовок карточки расходов
function renderExpenses() {
    const expenseList = document.getElementById('expense-list');
    expenseList.innerHTML = '';
    
    // Получаем все расходы
    let allExpenses = [];
    
    if (currentFilter !== 'all') {
        // Если выбран конкретный доход, показываем только связанные с ним расходы
        const selectedIncome = incomes.find(income => income.name.toLowerCase() === currentFilter);
        if (selectedIncome) {
            // При детальном просмотре дохода эта функция не используется
            return;
        }
    } else {
        // В противном случае показываем все расходы
        allExpenses = [...fixedExpenses, ...variableExpenses];
    }
    
    // Сортировка расходов по убыванию суммы
    allExpenses.sort((a, b) => parseFloat(b.amount || 0) - parseFloat(a.amount || 0));
    
    // Общая сумма расходов
    let totalExpenses = 0;
    
    allExpenses.forEach(expense => {
        const amount = parseFloat(expense.amount) || 0;
        totalExpenses += amount;
        
        // Создаем элемент расхода
        const expenseItem = document.createElement('div');
        expenseItem.className = 'finance-item';
        
        // Создаем контейнер для имени и действий
        const expenseNameWrapper = document.createElement('div');
        expenseNameWrapper.className = 'finance-item-name-wrapper';
        
        // Создаем элемент имени
        const expenseName = document.createElement('div');
        expenseName.className = 'finance-item-name';
        expenseName.textContent = expense.name || expense.category || 'Без названия';
        
        // Добавляем имя в контейнер
        expenseNameWrapper.appendChild(expenseName);
        
        // Создаем контейнер для действий
        const expenseActions = document.createElement('div');
        expenseActions.className = 'finance-item-actions';
        
        // Создаем кнопку редактирования
        const editButton = document.createElement('button');
        editButton.className = 'btn btn-sm btn-link p-0 me-2';
        editButton.innerHTML = '<i class="bi bi-pencil"></i>';
        editButton.title = 'Редактировать';
        editButton.addEventListener('click', (event) => {
            event.stopPropagation();
            showExpenseModal(expense.id, expense.type || (fixedExpenses.some(e => e.id === expense.id) ? 'fixed' : 'variable'));
        });
        
        // Создаем кнопку удаления
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-sm btn-link text-danger p-0';
        deleteButton.innerHTML = '<i class="bi bi-trash"></i>';
        deleteButton.title = 'Удалить';
        deleteButton.addEventListener('click', (event) => {
            event.stopPropagation();
            removeExpense(expense.id);
        });
        
        // Добавляем кнопки в контейнер действий
        expenseActions.appendChild(editButton);
        expenseActions.appendChild(deleteButton);
        
        // Добавляем контейнер действий в контейнер имени
        expenseNameWrapper.appendChild(expenseActions);
        
        // Создаем элемент суммы
        const expenseAmount = document.createElement('div');
        expenseAmount.className = 'finance-item-amount';
        expenseAmount.textContent = formatNumber(amount) + ' ₽';
        
        // Добавляем в контейнер расхода
        expenseItem.appendChild(expenseNameWrapper);
        expenseItem.appendChild(expenseAmount);
        
        // Добавляем обработчик для редактирования при клике на всю строку
        expenseItem.style.cursor = 'pointer';
        if (expense.type !== 'receipt') {
            expenseItem.addEventListener('click', () => {
                showExpenseModal(expense.id, expense.type || (fixedExpenses.some(e => e.id === expense.id) ? 'fixed' : 'variable'));
            });
        }
        
        // Добавляем элемент в список
        expenseList.appendChild(expenseItem);
    });
    
    // Обновляем отображение общей суммы
    document.getElementById('total-expenses-display').textContent = `${formatNumber(totalExpenses)} ₽/мес`;
    
    // Обновляем баланс
    updateSummary();
}

// Функция для удаления дохода
function removeIncome(incomeId) {
    if (!confirm('Вы уверены, что хотите удалить этот доход и все связанные с ним расходы?')) {
            return;
        }
        
    const incomeIndex = incomes.findIndex(income => income.id === incomeId);
    
    if (incomeIndex === -1) {
        alert('Доход не найден');
        return;
    }
    
    // Удаляем все расходы, связанные с этим доходом
    fixedExpenses = fixedExpenses.filter(expense => expense.incomeId !== incomeId);
    variableExpenses = variableExpenses.filter(expense => expense.incomeId !== incomeId);
    
    // Удаляем сам доход
    incomes.splice(incomeIndex, 1);
    
    // Сохраняем изменения
    saveData();
    
    // Возвращаемся к общему списку
    removeSingleIncomeView();
    renderIncomes();
    renderExpenses();
    
    // Показываем уведомление
    showNotification('Доход и связанные расходы успешно удалены', 'success');
}

// Удаление постоянного расхода
function removeFixedExpense(id) {
    fixedExpenses = fixedExpenses.filter(exp => exp.id !== id);
    saveData();
    renderExpenses();
    renderIncomes();
    updateSummary();
    updateForecastTable();
}

// Удаление переменного расхода
function removeVariableExpense(id) {
    variableExpenses = variableExpenses.filter(exp => exp.id !== id);
    saveData();
    renderExpenses();
    renderIncomes();
    updateSummary();
    updateForecastTable();
}

// Удаление расхода (определяет тип и вызывает соответствующую функцию)
function removeExpense(id) {
    if (!confirm('Вы уверены, что хотите удалить этот расход?')) {
        return;
    }
    
    // Определяем, к какому типу относится расход
    const isFixed = fixedExpenses.some(exp => exp.id === id);
    
    if (isFixed) {
        removeFixedExpense(id);
    } else {
        removeVariableExpense(id);
    }
    
    // Показываем уведомление
    showNotification('Расход успешно удален', 'success');
}

// Обновление общей сводки
function updateSummary() {
    // Расчет общего ежемесячного дохода
    let totalMonthlyIncome = 0;
    incomes.forEach(income => {
        totalMonthlyIncome += calculateMonthlyIncome(income);
    });
    
    // Расчет общих ежемесячных расходов
    const totalFixedExpenses = fixedExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
    const totalVariableExpenses = variableExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
    const totalExpenses = totalFixedExpenses + totalVariableExpenses;
    
    // Баланс
    const balance = totalMonthlyIncome - totalExpenses;
    
    // Обновляем отображение баланса только если мы в режиме "Все"
    if (currentFilter === 'all') {
    const balanceDisplay = document.getElementById('balance-display');
    balanceDisplay.textContent = `${formatNumber(balance)} ₽`;
    balanceDisplay.classList.remove('text-success', 'text-danger');
    balanceDisplay.classList.add(balance >= 0 ? 'text-success' : 'text-danger');
    }
}

// Обновление таблицы прогноза
function updateForecastTable() {
    // Проверяем наличие элементов прогноза на странице
    const monthlyIncomeElem = document.getElementById('monthly-income');
    if (!monthlyIncomeElem) {
        // Если элементы не найдены, просто выходим из функции
        console.log('Элементы таблицы прогноза не найдены');
        return;
    }
    
    // Расчет общего ежемесячного дохода
    let totalMonthlyIncome = 0;
    incomes.forEach(income => {
        totalMonthlyIncome += calculateMonthlyIncome(income);
    });
    
    // Расчет общих ежемесячных расходов
    const totalFixedExpenses = fixedExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
    const totalVariableExpenses = variableExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
    const totalExpenses = totalFixedExpenses + totalVariableExpenses;
    
    // Баланс
    const monthlyBalance = totalMonthlyIncome - totalExpenses;
    
    // Расчет по периодам
    const dailyIncome = totalMonthlyIncome / 30;
    const dailyExpense = totalExpenses / 30;
    const dailyBalance = dailyIncome - dailyExpense;
    
    const yearlyIncome = totalMonthlyIncome * 12;
    const yearlyExpense = totalExpenses * 12;
    const yearlyBalance = yearlyIncome - yearlyExpense;
    
    const decadeIncome = yearlyIncome * 10;
    const decadeExpense = yearlyExpense * 10;
    const decadeBalance = decadeIncome - decadeExpense;
    
    // Получаем ссылки на таблицу и тело таблицы
    const forecastTable = document.querySelector('.forecast-table');
    const tableBody = forecastTable.querySelector('tbody');
    
    // Очищаем тело таблицы
    tableBody.innerHTML = '';
    
    // Создаем основную строку доходов с возможностью раскрытия
    const incomeRow = document.createElement('tr');
    incomeRow.className = 'income-row expandable';
    incomeRow.innerHTML = `
        <td><i class="bi bi-chevron-right me-1 toggle-icon"></i> Доходы</td>
        <td id="monthly-income">${formatNumber(totalMonthlyIncome)} ₽</td>
        <td id="daily-income">${formatNumber(dailyIncome)} ₽</td>
        <td id="yearly-income">${formatNumber(yearlyIncome)} ₽</td>
        <td id="decade-income">${formatNumber(decadeIncome)} ₽</td>
    `;
    tableBody.appendChild(incomeRow);
    
    // Добавляем обработчик для раскрытия/сворачивания доходов
    incomeRow.addEventListener('click', function() {
        toggleDetailRows(this, 'income');
    });
    
    // Добавляем детализацию по доходам (скрыты по умолчанию)
    incomes.forEach(income => {
        const monthlyAmount = calculateMonthlyIncome(income);
        const dailyAmount = monthlyAmount / 30;
        const yearlyAmount = monthlyAmount * 12;
        const decadeAmount = yearlyAmount * 10;
        
        const detailRow = document.createElement('tr');
        detailRow.className = 'income-detail-row detail-row';
        detailRow.style.display = 'none'; // Скрыт по умолчанию
        detailRow.innerHTML = `
            <td class="ps-4">${income.name}</td>
            <td>${formatNumber(monthlyAmount)} ₽</td>
            <td>${formatNumber(dailyAmount)} ₽</td>
            <td>${formatNumber(yearlyAmount)} ₽</td>
            <td>${formatNumber(decadeAmount)} ₽</td>
        `;
        tableBody.appendChild(detailRow);
    });
    
    // Создаем основную строку расходов с возможностью раскрытия
    const expenseRow = document.createElement('tr');
    expenseRow.className = 'expense-row expandable';
    expenseRow.innerHTML = `
        <td><i class="bi bi-chevron-right me-1 toggle-icon"></i> Расходы</td>
        <td id="monthly-expense">${formatNumber(totalExpenses)} ₽</td>
        <td id="daily-expense">${formatNumber(dailyExpense)} ₽</td>
        <td id="yearly-expense">${formatNumber(yearlyExpense)} ₽</td>
        <td id="decade-expense">${formatNumber(decadeExpense)} ₽</td>
    `;
    tableBody.appendChild(expenseRow);
    
    // Добавляем обработчик для раскрытия/сворачивания расходов
    expenseRow.addEventListener('click', function() {
        toggleDetailRows(this, 'expense');
    });
    
    // Объединяем все расходы в один массив
    const allExpenses = [...fixedExpenses, ...variableExpenses];
    
    // Добавляем детализацию по расходам (скрыты по умолчанию)
    allExpenses.forEach(expense => {
        const monthlyAmount = parseFloat(expense.amount) || 0;
        const dailyAmount = monthlyAmount / 30;
        const yearlyAmount = monthlyAmount * 12;
        const decadeAmount = yearlyAmount * 10;
        
        const detailRow = document.createElement('tr');
        detailRow.className = 'expense-detail-row detail-row';
        detailRow.style.display = 'none'; // Скрыт по умолчанию
        detailRow.innerHTML = `
            <td class="ps-4">${expense.name}</td>
            <td>${formatNumber(monthlyAmount)} ₽</td>
            <td>${formatNumber(dailyAmount)} ₽</td>
            <td>${formatNumber(yearlyAmount)} ₽</td>
            <td>${formatNumber(decadeAmount)} ₽</td>
        `;
        tableBody.appendChild(detailRow);
    });
    
    // Создаем строку баланса
    const balanceRow = document.createElement('tr');
    balanceRow.className = 'balance-row';
    balanceRow.innerHTML = `
        <td>Остаток</td>
        <td id="monthly-balance">${formatNumber(monthlyBalance)} ₽</td>
        <td id="daily-balance">${formatNumber(dailyBalance)} ₽</td>
        <td id="yearly-balance">${formatNumber(yearlyBalance)} ₽</td>
        <td id="decade-balance">${formatNumber(decadeBalance)} ₽</td>
    `;
    tableBody.appendChild(balanceRow);
}

// Функция для раскрытия/сворачивания детализации
function toggleDetailRows(row, type) {
    // Находим иконку переключения в строке
    const toggleIcon = row.querySelector('.toggle-icon');
    
    // Определяем класс для детализации
    const detailClass = `${type}-detail-row`;
    
    // Находим все строки с детализацией
    const detailRows = document.querySelectorAll(`.${detailClass}`);
    
    // Проверяем, раскрыты ли строки
    const isExpanded = toggleIcon.classList.contains('bi-chevron-down');
    
    // Переключаем иконку
    if (isExpanded) {
        toggleIcon.classList.replace('bi-chevron-down', 'bi-chevron-right');
    } else {
        toggleIcon.classList.replace('bi-chevron-right', 'bi-chevron-down');
    }
    
    // Переключаем видимость строк
    detailRows.forEach(detailRow => {
        detailRow.style.display = isExpanded ? 'none' : 'table-row';
    });
}

// Показ модального окна с сообщением
function showMessage(title, message) {
    const modal = new bootstrap.Modal(document.getElementById('messageModal'));
    document.getElementById('messageModalTitle').textContent = title;
    document.getElementById('messageModalBody').textContent = message;
    modal.show();
}

// Обновление информации на кнопках фильтрации
function updateFilterButtonsInfo(selectedIncomeId = null) {
    // Обновляем общий фильтр "Все"
    const allFilterBtn = document.querySelector('.filter-btn[data-filter="all"]');
    if (allFilterBtn) {
        const totalExpenses = calculateTotalExpenses();
        if (totalExpenses > 0) {
            allFilterBtn.innerHTML = `Все <span class="filter-expenses">${formatNumber(totalExpenses)} ₽</span>`;
        } else {
            allFilterBtn.textContent = 'Все';
        }
    }
    
    // Обновляем фильтры по каждому доходу
    incomes.forEach(income => {
        const incomeFilterBtn = document.getElementById(`income-filter-${income.name.toLowerCase()}`);
        if (incomeFilterBtn) {
            const incomeExpensesAmount = calculateExpensesForIncome(income.id);
            
            // Если есть расходы, показываем сумму
            if (incomeExpensesAmount > 0) {
                incomeFilterBtn.innerHTML = `${income.name} <span class="filter-expenses">${formatNumber(incomeExpensesAmount)} ₽</span>`;
            } else {
                incomeFilterBtn.textContent = income.name;
            }
            
            // Выделяем кнопку, если выбран конкретный доход
            if (selectedIncomeId && selectedIncomeId === income.id) {
                incomeFilterBtn.classList.add('highlighted');
            } else {
                incomeFilterBtn.classList.remove('highlighted');
            }
        }
    });
}

// Вычисление общей суммы расходов
function calculateTotalExpenses() {
    const fixedTotal = fixedExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const variableTotal = variableExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    return fixedTotal + variableTotal;
}

// Вычисление суммы расходов для конкретного дохода
function calculateExpensesForIncome(incomeId) {
    const fixedTotal = fixedExpenses
        .filter(expense => expense.incomeId === incomeId)
        .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    
    const variableTotal = variableExpenses
        .filter(expense => expense.incomeId === incomeId)
        .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    
    return fixedTotal + variableTotal;
}

// Показываем уведомление
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} mt-3`;
    notification.textContent = message;
    
    const notificationContainer = document.getElementById('notification-container');
    notificationContainer.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Функция для обновления даты и времени
function updateDateTime() {
    const dateSelector = document.querySelector('.date-selector');
    if (!dateSelector) return;
    
    const now = new Date();
    
    // Форматируем дату
    const options = { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    };
    const dateStr = now.toLocaleDateString('ru-RU', options);
    
    // Форматируем время
    const timeStr = now.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    
    // Обновляем содержимое
    dateSelector.innerHTML = `
        <i class="bi bi-calendar3 me-1"></i>
        <span>${dateStr} - ${timeStr}</span>
    `;
} 