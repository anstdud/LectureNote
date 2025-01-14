import { Sequelize } from 'sequelize';
import Note from './models/Notes.js';

const sequelize = new Sequelize('LectureNote', 'admin', '1111', {
    host: 'localhost',
    dialect: 'postgres',
});

sequelize.sync({ alter: true })
    .then(() => console.log('Database synchronized'))
    .catch(err => console.error('Error synchronizing database:', err));

export default sequelize;
