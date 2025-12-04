# Auto-update .env file with Firebase configuration
$envPath = ".env"

# Read current .env content
$currentContent = Get-Content $envPath -Raw

# Get the current Gemini API key (preserve it)
$geminiKey = (Select-String -Path $envPath -Pattern "VITE_GEMINI_API_KEY=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()

# Create new .env content
$newContent = @"
# Gemini API Key (Get from https://aistudio.google.com/app/apikey)
VITE_GEMINI_API_KEY=$geminiKey

# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyD9v0QKWRtMVaHHfhho5OcVYkCjOAxUya4
VITE_FIREBASE_AUTH_DOMAIN=c3talk-b19ef.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=c3talk-b19ef
VITE_FIREBASE_STORAGE_BUCKET=c3talk-b19ef.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=434910550026
VITE_FIREBASE_APP_ID=1:434910550026:web:de814a9b6d16d10bc327f3
"@

# Write new content
Set-Content -Path $envPath -Value $newContent

Write-Host "✅ .env file updated successfully!"
Write-Host "⚠️  Please restart your dev server (Ctrl+C, then npm run dev)"
