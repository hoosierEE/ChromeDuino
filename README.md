# Chrome Arduino 
Serial messages to/from a Chrome App, from/to an Arduino

## Install Development Version

1. open Google Chrome browser
2. go to `chrome://extensions` by typing it in the address bar
3. check the `Developer mode` box
4. some new buttons will appear; click the one labeled `Load unpacked extension...`
5. navigate to this folder and click `Open`
6. the app will appear in the list of extensions
7. (optional) un-check `Developer mode` box. The app will remain usable.

## Install Stable Version

1. click link (todo: add link to Chrome Web Store here)
2. click the `Add to Chrome` button


## Run
Click the `Launch` link in the extensions page to start the app.

Or, if you have the Chrome App Launcher already installed, the app should appear there.

### This Repository
```
.
├── Arduino
│   ├── lib
│   └── src
│       ├── src.ino
│       └── StateMachine.h
├── ChromeApp
│   ├── assets
│   │   ├── icon_128x128.png
│   │   └── icon_16x16.png
│   ├── background.js
│   ├── index.html
│   ├── js
│   │   ├── dragndrop.js
│   │   ├── files.js
│   │   └── serial.js
│   └── manifest.json
└── README.md
```
