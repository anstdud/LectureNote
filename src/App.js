import React, { useState, useEffect } from 'react';
import Header from './components/Header/Header.js';
import Modal from './components/Modal/Modal.js';
import LectureList from './components/LectureList/LectureList.js';
import AuthModal from './components/AuthModal/AuthModal.js';

const App = () => {
  const [lectures, setLectures] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLectureIndex, setCurrentLectureIndex] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchLectures();
    }
  }, [isAuthenticated]);

  const openModal = (index = null) => {
    setCurrentLectureIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentLectureIndex(null);
  };

  const fetchLectures = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Необходимо войти в систему');
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/lectures', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка при загрузке лекций');
      }

      const data = await response.json();
      setLectures(data);
    } catch (error) {
      console.error('Ошибка запроса:', error);
      alert('Не удалось загрузить лекции');
    }
  };


  const saveLecture = async (updatedLecture) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Необходимо войти в систему');
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/lectures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedLecture),
      });

      if (!response.ok) {
        throw new Error('Ошибка при сохранении лекции');
      }

      const newLecture = await response.json();
      setLectures([...lectures, newLecture]);
      closeModal();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка при сохранении лекции');
    }
  };

  return (
      <div>
        <Header setIsAuthenticated={setIsAuthenticated} />
        {isAuthenticated ? (
            <div>
              <LectureList lectures={lectures} openModal={openModal} />
              {isModalOpen && (
                  <Modal
                      lecture={lectures[currentLectureIndex]}
                      saveLecture={saveLecture}
                      closeModal={closeModal}
                  />
              )}
            </div>
        ) : (
            <AuthModal setIsAuthenticated={setIsAuthenticated} />
        )}
      </div>
  );
};

export default App;
