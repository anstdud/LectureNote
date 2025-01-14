import bcrypt from 'bcrypt';

// Тестируем хеширование
const testPassword = async () => {
    const password = 'mysecretpassword';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Оригинальный пароль:', password);
    console.log('Хешированный пароль:', hashedPassword);

    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log('Проверка пароля:', isValid ? 'Успех' : 'Ошибка');
};

testPassword();
