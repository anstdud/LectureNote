import React from 'react';
import PropTypes from 'prop-types';
import './SuccessModal.css';

const SuccessModal = ({ onClose }) => {
    return (
        <div className="success-modal-overlay">
            <div className="success-modal">
                <h3>Лекция успешно добавлена!</h3>
                <button className="close-button" onClick={onClose}>
                    Закрыть
                </button>
            </div>
        </div>
    );
};

SuccessModal.propTypes = {
    onClose: PropTypes.func.isRequired,
};

export default SuccessModal;