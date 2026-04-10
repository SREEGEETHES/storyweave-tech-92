# Read .env file and upload API keys to Supabase
$envContent = Get-Content .env

foreach ($line in $envContent) {
    if ($line -match "^(OPENAI_API_KEY|ELEVENLABS_API_KEY|FAL_KEY|SHOTSTACK_API_KEY)=(.+)$") {
        $keyName = $matches[1]
        $keyValue = $matches[2]
        Write-Host "Uploading $keyName..."
        npx supabase secrets set "$keyName=$keyValue" --project-ref mfmykffrogsmnjlyywky
    }
}

Write-Host "All API keys uploaded successfully!"
