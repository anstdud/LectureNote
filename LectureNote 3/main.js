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


// const editButton = document.getElementById('editButton');
// const text = document.getElementById('editableText');
// const textArea = document.getElementById('textArea');
// const exportButton = document.getElementById('exportButton');
// const saveButton = document.getElementById('saveButton');

// editButton.addEventListener('click', function() {
//     if (text.style.display !== "none") {
//         // Переход к редактированию
//         textArea.value = text.innerText;
//         text.style.display = "none";
//         textArea.style.display = "block";
//         editButton.innerText = "Сохранить";
        
//         // Скрываем кнопку "Отправить"
//         exportButton.style.display = "none";
        
//         // Показываем кнопку "Сохранить"
//         saveButton.style.display = "block";
//     } else {
//         // Сохранение изменений
//         text.innerText = textArea.value;
//         text.style.display = "block";
//         textArea.style.display = "none";
//         editButton.innerText = "Изменить";
        
//         // Показываем кнопку "Отправить"
//         exportButton.style.display = "inline-block";
        
//         // Скрываем кнопку "Сохранить"
//         saveButton.style.display = "none";
//     }
// });

document.addEventListener('DOMContentLoaded', function () {
    const editButtons = document.querySelectorAll('.lectures-editbtn');
    const exportButtons = document.querySelectorAll('.lectures-exportbtn');
    const modals = document.querySelectorAll('.lectures-modal');

    editButtons.forEach((editButton, index) => {
        const modalContent = editButton.closest('.lectures-modal-content');
        const text = modalContent.querySelector('.editableText');
        const textArea = modalContent.querySelector('textarea');

        editButton.addEventListener('click', function () {
            if (text.style.display !== "none") {
                // Переход к редактированию
                textArea.value = text.innerText;
                text.style.display = "none";
                textArea.style.display = "block";
                editButton.innerText = "Сохранить";
                exportButtons[index].style.display = "none"; // Скрыть кнопку отправки
            } else {
                // Сохранение изменений
                text.innerText = textArea.value;
                text.style.display = "block";
                textArea.style.display = "none";
                editButton.innerText = "Изменить";
                exportButtons[index].style.display = "block"; // Показать кнопку отправки
            }
        });
    });

    // Обработчик для кнопок закрытия
    modals.forEach(modal => {
        const closeButton = modal.querySelector('.close-btn');
        closeButton.addEventListener('click', function () {
            modal.style.display = 'none';
        });
    });
});

// Функция для открытия модального окна
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}
