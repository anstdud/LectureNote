import React from 'react';
import PropTypes from 'prop-types';
import './CodeModal.css';

const CodeModal = ({ code, onClose }) => {
    return (
        <div className="code-modal-overlay">
            <div className="code-modal">
                <h3>Код для доступа</h3>
                <div className="code-content">{code}</div>
                <button className="copy-button" onClick={() => navigator.clipboard.writeText(code)}>
                    Скопировать
                </button>
                <button className="close-button" onClick={onClose}>
                    Закрыть
                </button>
            </div>
        </div>
    );
};

CodeModal.propTypes = {
    code: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default CodeModal;