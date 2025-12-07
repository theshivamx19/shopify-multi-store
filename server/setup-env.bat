@echo off
echo Creating .env file...
echo.

REM Copy from example
copy .env.example .env

echo .env file created! 
echo.
echo IMPORTANT: Edit the .env file and update these values:
echo   1. SHOPIFY_API_KEY - Your app's Client ID from Partner Dashboard
echo   2. SHOPIFY_API_SECRET - Your app's Client Secret from Partner Dashboard  
echo   3. DB_PASSWORD - Your MySQL password
echo.
echo Then restart the server with: npm run dev
echo.
pause
