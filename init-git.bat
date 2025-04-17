@echo off
echo Инициализация Git-репозитория для проекта "Мой бюджет"...

:: Инициализируем Git репозиторий
git init

:: Добавляем все файлы
git add .

:: Делаем первый коммит
git commit -m "Первоначальная версия проекта Мой бюджет"

:: Выводим информацию о том, что нужно сделать далее
echo.
echo Git-репозиторий успешно инициализирован!
echo.
echo Для связи с удаленным репозиторием выполните:
echo git remote add origin YOUR_REPOSITORY_URL
echo git push -u origin master
echo.
echo Нажмите любую клавишу для выхода...
pause > nul 