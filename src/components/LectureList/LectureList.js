import React, { useState } from 'react';
import Modal from '../Modal/Modal.js';
import './LectureList.css';
import Book from '../img/book.svg';

const LectureList = () => {
    const [lectures, setLectures] = useState([]); // Состояние для заметок
    const [modalOpen, setModalOpen] = useState(false);
    const [activeLecture, setActiveLecture] = useState(null);

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
                setLectures(lectures.map((lecture) =>
                    lecture.title === activeLecture.title ? updatedLecture : lecture
                ));
            } else {
                setLectures([...lectures, updatedLecture]);
            }
            closeModal();
        }
    };

    const deleteLecture = (title) => {
        setLectures(lectures.filter(lecture => lecture.title !== title));
    };

    return (
        <div className="lectures-list">
            <button
                className="lecture-item lectures-btn-create"
                onClick={() => openModal(null)}
            >
                <span className="circle-icon">+</span> Создать новую запись
            </button>

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
