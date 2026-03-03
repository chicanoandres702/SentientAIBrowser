# Move BuildLocalAndroid to top and rename
function BuildLocalAndroid {
    function TestBlock {
        Write-Host "Hello from TestBlock"
    }
    TestBlock
    Write-Ok 'Submitted to Play Store'
}

Write-Host ''
Write-Ok "Android deploy complete! (target=$Target, profile=$Profile)"
Write-Host ''
    Write-Ok 'Submitted to Play Store'
}

Write-Host ''
Write-Ok "Android deploy complete! (target=$Target, profile=$Profile)"
Write-Host ''