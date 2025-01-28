import React, { useState } from 'react';
import Modal from '../Modal/Modal.js';
import './LectureList.css';
import Book from '../img/book.svg';

const LectureList = () => {
    const [lectures, setLectures] = useState([]); // Состояние для заметок
    const [modalOpen, setModalOpen] = useState(false);
    const [activeLecture, setActiveLecture] = useState(null);

    // Открытие модального окна для новой записи или редактирования существующей
    const openModal = (lecture = null) => {
        setActiveLecture(lecture);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setActiveLecture(null);
    };

    const saveLecture = (updatedLecture) => {
        if (updatedLecture) {
            if (activeLecture) {
                // Обновляем лекцию по названию
                setLectures(lectures.map((lecture) =>
                    lecture.title === activeLecture.title ? updatedLecture : lecture
                ));
            } else {
                // Добавляем новую лекцию
                setLectures([...lectures, updatedLecture]);
            }
            closeModal();
        }
    };

    const deleteLecture = (title) => {
        // Удаляем лекцию по названию
        setLectures(lectures.filter(lecture => lecture.title !== title));
    };

    return (
        <div className="lectures-list">
            {/* Кнопка для создания новой записи */}
            <button
                className="lecture-item lectures-btn-create"
                onClick={() => openModal(null)}
            >
                <span className="circle-icon">+</span> Создать новую запись
            </button>

            {/* Отображение всех лекций */}
            {lectures.map((lecture, index) => (
                <div key={index} className="lecture-item">
                    <button
                        onClick={() => openModal(lecture)}
                        className="lecture-item-btn lecture-item"
                    >
                        <span className="circle-icon">
                            <img src={Book} alt="Значок книжки" />
                        </span>
                        {lecture.title}
                    </button>
                    <button
                        className="lecture-item-delete"
                        onClick={() => deleteLecture(lecture.title)}
                    >
                        Удалить
                    </button>
                </div>
            ))}

            {/* Модальное окно для создания или редактирования лекции */}
            <Modal
                isOpen={modalOpen}
                onClose={closeModal}
                onSave={saveLecture}
                lecture={activeLecture}
            />
        </div>
    );
};

export default LectureList;
