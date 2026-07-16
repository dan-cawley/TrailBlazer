@echo off
setlocal EnableDelayedExpansion

REM Sets up a local TrailBlazer checkout after the Supabase project has been created.
REM Usage: scripts\setup-local.cmd

set "ENV_FILE=.env.local"
set "ENV_TEMPLATE=.env.example"

if not exist "%ENV_FILE%" (
  copy "%ENV_TEMPLATE%" "%ENV_FILE%" >nul
  echo Created %ENV_FILE% from %ENV_TEMPLATE%.
  echo.
  echo Error: Add your Supabase URL, publishable key, and DATABASE_URL to %ENV_FILE%, then run this script again.
  exit /b 1
)

set "missing="
for %%K in (NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY DATABASE_URL) do (
  call :has_value "%%K"
  if errorlevel 1 (
    if defined missing (
      set "missing=!missing!, %%K"
    ) else (
      set "missing=%%K"
    )
  )
)

if defined missing (
  echo.
  echo Error: Set these values in %ENV_FILE% before continuing: %missing%
  exit /b 1
)

echo Installing dependencies...
npm install
if errorlevel 1 exit /b 1

echo Generating the Prisma client...
npm run db:generate
if errorlevel 1 exit /b 1

echo Applying database migrations...
npx prisma migrate deploy
if errorlevel 1 exit /b 1

echo.
echo Local setup is complete.
echo Before uploading a district calendar, run supabase/storage.sql once in the Supabase SQL Editor.
echo Start the app with: npm run dev
exit /b 0

:has_value
set "key=%~1"
set "value="
for /f "usebackq tokens=1* delims==" %%A in (`findstr /b /c:"%key%=" "%ENV_FILE%"`) do (
  set "value=%%B"
)
if not defined value exit /b 1

echo !value! | findstr /i /c:"your-project-ref" >nul
if not errorlevel 1 exit /b 1
echo !value! | findstr /i /c:"your-publishable-key" >nul
if not errorlevel 1 exit /b 1
echo !value! | findstr /i /c:"[YOUR-PASSWORD]" >nul
if not errorlevel 1 exit /b 1

exit /b 0
