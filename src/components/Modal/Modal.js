import React, { useState, useEffect } from 'react';
import './Modal.css';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

const Modal = ({ lecture, isOpen, saveLecture, closeModal }) => {
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [isEditing, setIsEditing] = useState(true);
    const [isClosing] = useState(false);

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

    if ((!lecture && !isEditing) || (isClosing && !isOpen)) return null;

    const handleSave = () => {
        if (title.trim() && text.trim()) {
            saveLecture({ title, text });
            if (!lecture) {
                setTitle('');
                setText('');
            }
        }
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                         stroke="#201209" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
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

                    <div className="lectures-button-container">
                        {!isEditing ? (
                            <div className="view-mode-buttons">
                                <button className="lectures-editbtn" onClick={() => setIsEditing(true)}>
                                    Изменить
                                </button>
                                <button className="lectures-exportbtn" onClick={handleExport}>
                                    Отправить
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
        </div>
    );
};

export default Modal;