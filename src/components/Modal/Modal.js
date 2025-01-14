import React, { useState, useEffect } from 'react';
import './Modal.css';
import Close from '../img/chevron-down-solid.svg';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

const Modal = ({ isOpen, onClose, onSave, lecture, onExport }) => {
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (lecture) {
            setTitle(lecture.title);
            setText(lecture.text);
            setIsEditing(false);
        } else {
            setTitle('');
            setText('');
            setIsEditing(true);
        }
    }, [lecture]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (title && text) {
            const newLecture = { title, text };
            onSave(newLecture);
            setIsEditing(false); // Выходим из режима редактирования
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const capitalizeFirstLetter = (input) => {
        if (!input) return input;
        return input.charAt(0).toUpperCase() + input.slice(1);
    };

    const capitalizeAfterDot = (input) => {
        return input.replace(/([.!?]\s*)([a-zа-я])/g, (match, p1, p2) => {
            return p1 + p2.toUpperCase();
        });
    };

    const handleTitleChange = (e) => {
        const value = e.target.value;
        if (value.length === 1) {
            setTitle(capitalizeFirstLetter(value));
        } else {
            setTitle(capitalizeAfterDot(value));
        }
    };

    const handleTextChange = (e) => {
        const value = e.target.value;
        if (value.length === 1) {
            setText(capitalizeFirstLetter(value));
        } else {
            setText(capitalizeAfterDot(value));
        }
    };

    // Функция для экспорта в Word с нужным стилем
    const handleExport = () => {
        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: [
                        // Заголовок (по центру, жирный, размер 14)
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: title,
                                    bold: true, // Жирный шрифт для заголовка
                                    font: "Times New Roman", // Шрифт Times New Roman
                                    size: 28, // 14pt (в docx размер указывается в половинках пункта, т.е. 28 = 14pt)
                                }),
                            ],
                        }),
                        // Текст лекции с отступом только у первой строки
                        new Paragraph({
                            alignment: AlignmentType.JUSTIFY, // Выравнивание по ширине
                            children: [
                                new TextRun({
                                    text: text,
                                    font: "Times New Roman", // Шрифт Times New Roman
                                    size: 28, // 14pt
                                }),
                            ],
                            // Стиль текста
                            spacing: {
                                after: 120, // Межстрочный интервал 1.5
                            },
                            indentation: {
                                firstLine: 240, // Отступ первой строки 1.25 см (240 twips)
                                left: 0, // Убираем отступы для остальных строк
                            },
                        }),
                    ],
                },
            ],
        });

        Packer.toBlob(doc).then((blob) => {
            // Создаём ссылку для скачивания файла
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${title}.docx`; // Имя файла — это заголовок лекции
            link.click(); // Инициируем скачивание
        });
    };

    return (
        <div className="lecture-modal">
            <div className="lecture-modal-content">
                <button className="close-btn" onClick={onClose}>
                    <img src={Close} alt="Закрыть" />
                </button>
                <div className="lectures-modal-text-container">
                    <input
                        className="lectures-modal-title"
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        placeholder="Название лекции"
                        disabled={!isEditing}
                    />
                    <textarea
                        className="lectures-modal-textarea"
                        value={text}
                        onChange={handleTextChange}
                        placeholder="Текст лекции"
                        disabled={!isEditing}
                    ></textarea>

                    {!isEditing ? (
                        lecture ? (
                            <div className="lectures-button-container">
                                <button className="lectures-exportbtn" onClick={handleExport}>Отправить</button>
                                <button className="lectures-editbtn" onClick={handleEdit}>Изменить</button>
                            </div>
                        ) : null
                    ) : (
                        <button className="lectures-savebtn" onClick={handleSave}>Сохранить</button>
                    )}
                </div>
            </div>
        </div>
    );
    ///////////
};
export default Modal;
