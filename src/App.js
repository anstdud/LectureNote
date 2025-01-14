// src/App.js
import React, { useState } from 'react';
import Header from './components/Header/Header.js';
import Modal from './components/Modal/Modal.js';
import LectureList from './components/LectureList/LectureList.js';

const App = () => {
  const [lectures, setLectures] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLectureIndex, setCurrentLectureIndex] = useState(null);

  const openModal = (index = null) => {
    setCurrentLectureIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentLectureIndex(null);
  };

  const saveLecture = (lecture) => {
    if (currentLectureIndex !== null) {
      const updatedLectures = [...lectures];
      updatedLectures[currentLectureIndex] = lecture;
      setLectures(updatedLectures);
    } else {
      setLectures([...lectures, lecture]);
    }
  };

  return (
      <div className="App">
        <Header />
        <main className="main">
          <div className="lectures">
            <LectureList lectures={lectures} onEdit={(index) => openModal(index)}/>
          </div>
        </main>
        <Modal
            isOpen={isModalOpen}
            onClose={closeModal}
            onSave={saveLecture}
            currentLecture={currentLectureIndex !== null ? lectures[currentLectureIndex] : null}
            setCurrentLecture={setCurrentLectureIndex}
        />
      </div>
  );
};

export default App;