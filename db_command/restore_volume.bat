@echo off
set VOLUME_NAME=loko-project_db
set BACKUP_FILE=db_data_backup.tar.gz

echo Đang restore dữ liệu vào volume "%VOLUME_NAME%"...

docker volume create %VOLUME_NAME%

echo Dung container dang su dung volume (neu co)...
docker stop postgres_container_name 2>NUL

docker run --rm ^
    -v %VOLUME_NAME%:/to ^
    -v "%cd%":/from ^
    alpine sh -c "cd /to && tar -xzvf /from/%BACKUP_FILE%"

echo.
echo Restore hoàn tất!
echo Volume "%VOLUME_NAME%" đã được phục hồi!
pause