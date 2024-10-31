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

let currentLectureIndex = null; 
let lectures = []; 
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
            lectures.push({ title, text }); 
            createLectureItem(title, text); 
        } else {
            lectures[currentLectureIndex].title = title; 
            lectures[currentLectureIndex].text = text; 
            updateLectureItem(currentLectureIndex); 
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
    currentLectureIndex = index; 
    const title = lectures[index].title;
    const text = lectures[index].text;
    document.getElementById('lecture-title').value = title; 
    document.getElementById('lecture-title-display').innerText = title; 
    document.getElementById('lecture-display').innerText = text; 
    openModal(); 
    document.getElementById('export-button').style.display = 'block'; 
    document.getElementById('edit-button').style.display = 'block'; 
    document.getElementById('save-button').style.display = 'none'; 
    document.getElementById('lecture-display').style.display = 'block';
    document.getElementById('lecture-text').style.display = 'none'; 
    document.getElementById('lecture-title').style.display = 'none'; 
    document.getElementById('lecture-title-display').style.display = 'block'; 
}

function enableEdit() {
    document.getElementById('lecture-title').style.display = 'block';
    document.getElementById('lecture-title-display').style.display = 'none';
    const textArea = document.getElementById('lecture-text');
    textArea.style.display = 'block'; 
    textArea.value = lectures[currentLectureIndex].text; 
    document.getElementById('lecture-display').style.display = 'none'; 
    document.getElementById('save-button').style.display = 'block'; 
    document.getElementById('edit-button').style.display = 'none';
    document.getElementById('export-button').style.display = 'none'; 
}

function openModal() {
    document.getElementById('modal-create').style.display = 'block';
    resetButtons();
}

function closeModal() {
    document.getElementById('modal-create').style.display = 'none';
    resetForm(); 
}

function resetForm() {
    document.getElementById('lecture-title').value = ''; 
    document.getElementById('lecture-text').value = ''; 
    document.getElementById('lecture-display').innerText = '';
    document.getElementById('lecture-title-display').innerText = ''; 
    currentLectureIndex = null; 
}

function resetButtons() {
    document.getElementById('edit-button').style.display = 'none';
    document.getElementById('export-button').style.display = 'none'; 
    document.getElementById('save-button').style.display = 'block'; 
    document.getElementById('lecture-text').style.display = 'block'; 
    document.getElementById('lecture-display').style.display = 'none'; 
    document.getElementById('lecture-title-display').style.display = 'none'; 
    document.getElementById('lecture-title').style.display = 'block'; 
}

function exportToWord() {

} 
