// Выпадающий список
function toggleMenu() {
    var menu = document.getElementById("dropdownMenu");
    if (menu.style.display === "block") {
        menu.style.display = "none";
    } else {
        menu.style.display = "block";
    }
}

// Закрытие меню при клике вне его области
window.onclick = function(event) {
    // Проверяем, является ли нажатый элемент кнопкой или частью меню
    if (!event.target.matches('.navbar-profile') && !event.target.closest('.navbar-menu')) {
        var dropdowns = document.getElementsByClassName("dropdownMenu");
        for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.style.display === "block") {
                openDropdown.style.display = "none";
            }
        }
    }
}

// document.getElementById("openButton").addEventListener("click", function() {
//     var modal = document.getElementById("modalWindow");
//     modal.classList.add("show");
// });

// document.getElementById("closeButton").addEventListener("click", function() {
//     var modal = document.getElementById("modalWindow");
//     modal.classList.remove("show");
// });

// document.querySelectorAll('.lectures-item').forEach(function(button) {
//     button.addEventListener('click', function() {
//         var modalId = this.getAttribute('data-modal');
//         document.getElementById(modalId).classList.add('show');
//     });
// });

// document.querySelectorAll('.close-btn').forEach(function(button) {
//     button.addEventListener('click', function() {
//         var modalId = this.getAttribute('data-modal');
//         document.getElementById(modalId).classList.remove('show');
//     });
// });

// Функция открытия модального окна
document.querySelectorAll('.lectures-item').forEach(function(button) {
    button.addEventListener('click', function() {
        var modalId = this.getAttribute('data-modal');
        var modal = document.getElementById(modalId);
        modal.classList.add('show');
    });
});

// Функция закрытия модального окна
document.querySelectorAll('.close-btn').forEach(function(button) {
    button.addEventListener('click', function() {
        var modalId = this.getAttribute('data-modal');
        var modal = document.getElementById(modalId);
        modal.classList.remove('show');
    });
});

// Закрытие меню при клике вне его области
window.onclick = function(event) {
    if (!event.target.closest('.lectures-modal-content') && !event.target.matches('.lectures-item')) {
        document.querySelectorAll('.lectures-modal').forEach(function(modal) {
            modal.classList.remove('show');
        });
    }
};

let currentLectureIndex = null; // Для отслеживания текущей лекции
let lectures = []; // Массив для хранения лекций
function createLectureItem(title, text) {
    const lectureItem = document.createElement('div');
    lectureItem.className = 'lecture-item lectures-existing';
    lectureItem.innerHTML = `
    <button class="lectures-btn lectures-item-existing" onclick="openLecture(${lectures.length - 1})">
        <span class="circle-icon"><img src="img/book.svg" alt="Значок книжки"></span> ${title}
     </button>
        `;
    document.getElementById('lecture-list').appendChild(lectureItem);
}

function saveLecture() {
    const title = document.getElementById('lecture-title').value;
    const text = document.getElementById('lecture-text').value;
    if (title && text) {
        if (currentLectureIndex === null) {
            lectures.push({ title, text }); // Создаем новую лекцию
            createLectureItem(title, text); // Создаем элемент списка
        } else {
            lectures[currentLectureIndex].title = title; // Обновляем название
            lectures[currentLectureIndex].text = text; // Обновляем текст
            updateLectureItem(currentLectureIndex); // Обновляем элемент списка
        }
        closeModal();
        resetButtons(); 
    }
}

function updateLectureItem(index) {
    const lectureItems = document.querySelectorAll('.lectures-item-existing');
    lectureItems[index].innerHTML = `
    <span class="circle-icon"><img src="img/book.svg" alt="Значок книжки"></span> ${lectures[index].title}
        `;
}

function openLecture(index) {
    currentLectureIndex = index; // Сохраняем индекс текущей лекции
    const title = lectures[index].title;
    const text = lectures[index].text;
    document.getElementById('lecture-title').value = title; // Заполняем значение в поле ввода
    document.getElementById('lecture-title-display').innerText = title; // Отображаем название
    document.getElementById('lecture-display').innerText = text; // Отображаем текст лекции
    openModal(); // Открываем модальное окно
    document.getElementById('export-button').style.display = 'block'; // Показываем кнопку "Отправить"
    document.getElementById('edit-button').style.display = 'block'; // Показываем кнопку "Изменить"
    document.getElementById('save-button').style.display = 'none'; // Скрываем кнопку "Сохранить"
    document.getElementById('lecture-display').style.display = 'block'; // Показываем текст
    document.getElementById('lecture-text').style.display = 'none'; // Скрываем textarea
    document.getElementById('lecture-title').style.display = 'none'; // Скрываем поле ввода названия
    document.getElementById('lecture-title-display').style.display = 'block'; // Показываем отображаемое название
}

function enableEdit() {
    document.getElementById('lecture-title').style.display = 'block'; // Показываем поле для редактирования названия
    document.getElementById('lecture-title-display').style.display = 'none'; // Скрываем отображаемое название
    const textArea = document.getElementById('lecture-text');
    textArea.style.display = 'block'; // Показываем textarea
    textArea.value = lectures[currentLectureIndex].text; // Вставляем текст лекции
    document.getElementById('lecture-display').style.display = 'none'; // Скрываем текст для чтения
    document.getElementById('save-button').style.display = 'block'; // Показываем кнопку "Сохранить"
    document.getElementById('edit-button').style.display = 'none'; // Скрываем кнопку "Изменить"
    document.getElementById('export-button').style.display = 'none'; // Скрываем кнопку "Отправить"
}

function openModal() {
    document.getElementById('modal-create').style.display = 'block';
    resetButtons();
}

function closeModal() {
    document.getElementById('modal-create').style.display = 'none';
    resetForm(); // Очищаем форму при закрытии
}

function resetForm() {
    document.getElementById('lecture-title').value = ''; // Очищаем заголовок
    document.getElementById('lecture-text').value = ''; // Очищаем текст лекции
    document.getElementById('lecture-display').innerText = ''; // Очищаем отображаемый текст
    document.getElementById('lecture-title-display').innerText = ''; // Очищаем отображаемое название
    currentLectureIndex = null; // Сбрасываем индекс текущей лекции
}

function resetButtons() {
    document.getElementById('edit-button').style.display = 'none'; // Скрываем кнопку "Изменить"
    document.getElementById('export-button').style.display = 'none'; // Скрываем кнопку "Отправить"
    document.getElementById('save-button').style.display = 'block'; // Показываем кнопку "Сохранить"
    document.getElementById('lecture-text').style.display = 'block'; // Показываем textarea для создания новой лекции
    document.getElementById('lecture-display').style.display = 'none'; // Скрываем текст лекции
    document.getElementById('lecture-title-display').style.display = 'none'; // Скрываем отображаемое название
    document.getElementById('lecture-title').style.display = 'block'; // Показываем поле для создания названия
}

function exportToWord() {
    // Логика для экспорта в Word
} 
