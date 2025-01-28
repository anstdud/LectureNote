import React, { useState, useEffect } from 'react';
import './Modal.css';
import Close from '../img/chevron-down-solid.svg';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

const Modal = ({ isOpen, onClose, onSave, lecture }) => {
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [isEditing, setIsEditing] = useState(true);

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
    }, [isOpen, lecture]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (title.trim() && text.trim()) {
            onSave({ title, text });
            onClose();
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const capitalizeText = (input) => {
        return input
            .replace(/(?:^|\.\s*)([a-zа-я])/g, (match, p1) => p1.toUpperCase());
    };

    const handleTitleChange = (e) => {
        const value = e.target.value;
        setTitle(capitalizeText(value));
    };

    const handleTextChange = (e) => {
        const value = e.target.value;
        setText(capitalizeText(value));
    };

    const handleExport = () => {
        const doc = new Document({
            sections: [
                {
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: title,
                                    bold: true,
                                    font: 'Times New Roman',
                                    size: 28, // 14pt
                                }),
                            ],
                        }),
                        new Paragraph({
                            alignment: AlignmentType.JUSTIFY,
                            children: [
                                new TextRun({
                                    text: text,
                                    font: 'Times New Roman',
                                    size: 28, // 14pt
                                }),
                            ],
                            spacing: { after: 120 },
                            indentation: { firstLine: 240 },
                        }),
                    ],
                },
            ],
        });

        Packer.toBlob(doc).then((blob) => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${title}.docx`;
            link.click();
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
                        <div className="lectures-button-container">
                            <button className="lectures-exportbtn" onClick={handleExport}>
                                Отправить
                            </button>
                            <button className="lectures-editbtn" onClick={handleEdit}>
                                Изменить
                            </button>
                        </div>
                    ) : (
                        <button className="lectures-savebtn" onClick={handleSave}>
                            Сохранить
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Modal;
/////