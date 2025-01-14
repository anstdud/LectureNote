// src/components/ExportToWord.js
import React from 'react';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver'; // Для сохранения файла

const ExportToWord = () => {
    const handleExport = () => {
        // Создаем документ
        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun("Пример текста для экспорта."),
                                new TextRun({
                                    text: " Это следующий текст в том же параграфе.",
                                    bold: true,
                                }),
                            ],
                        }),
                        new Paragraph("Это отдельный параграф."),
                    ],
                },
            ],
        });

        // Генерация файла и его скачивание
        Packer.toBlob(doc).then((blob) => {
            saveAs(blob, "example.docx");
        });
    };

    return (
        <button onClick={handleExport}>
            Экспортировать в Word
        </button>
    );
};

export default ExportToWord;
