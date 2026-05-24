@echo off
echo ========================================================
echo   Parnasala Fellowship Deploy Script
echo ========================================================
echo.

set /p PushDB="Do you want to push the local database and uploads to git? (y/n)? WARNING: Pushing local database will overwrite internet data: "
if /i "%PushDB%"=="y" (
    echo [INFO] Adding database.db and uploads/ to git...
    git add -f database.db
    git add -f uploads/
) else (
    echo [INFO] Keeping database untracked. Only code will be pushed.
)

git add .
set /p CommitMsg="Enter commit message: "
git commit -m "%CommitMsg%"
git push

echo.
echo [SUCCESS] Deployment complete!
pause
