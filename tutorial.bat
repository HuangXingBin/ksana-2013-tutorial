node launcher\portavail.js
@if errorlevel 1 (
	echo Port Occupied!
	start http://127.0.0.1:2555/tutorial/
) else (
    cd launcher
	node server.js tutorial
	cd ..
)
)