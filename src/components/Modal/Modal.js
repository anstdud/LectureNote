import React, { useState, useEffect } from 'react';
import './Modal.css';
import Close from '../img/chevron-down-solid.svg';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

const Modal = ({ lecture, saveLecture, closeModal }) => {
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
    }, [lecture]);

    if (!lecture && !isEditing) return null;

    const handleSave = () => {
        if (title.trim() && text.trim()) {
            saveLecture({ title, text });
            closeModal();
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
        const paragraphs = text.split('\n').map((paragraph) => {
            return new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                children: [
                    new TextRun({
                        text: paragraph,
                        font: 'Times New Roman',
                        size: 28,
                    }),
                ],
                spacing: {
                    line: 360,
                    before: 0,
                    after: 0
                },
                indent: { firstLine: 710 },
                style: 'Normal',
            });
        });

        const doc = new Document({
            styles: {
                paragraphStyles: [{
                    id: 'Normal',
                    name: 'Normal',
                    basedOn: 'Normal',
                    next: 'Normal',
                    quickFormat: true,
                    paragraph: {
                        alignment: AlignmentType.JUSTIFIED,
                    },
                }]
            },
            sections: [
                {
                    properties: {
                        page: {
                            pageNumbers: {
                                start: 1,
                                formatType: 'decimal',
                            },
                        },
                    },
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: title,
                                    bold: true,
                                    font: 'Times New Roman',
                                    size: 28,
                                }),
                            ],
                            spacing: { before: 0, after: 0 },
                        }),
                        ...paragraphs,
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
                <button className="close-btn" onClick={closeModal}>
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