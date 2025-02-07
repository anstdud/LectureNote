import React, {  } from 'react';
import './LectureList.css';
import Book from '../img/book.svg';

const LectureList = ({ lectures, openModal, deleteLecture }) => {
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
                        onClick={() => deleteLecture(lecture.id)}
                    >
                        Удалить
                    </button>
                </div>
            ))}
        </div>
    );
};

export default LectureList;