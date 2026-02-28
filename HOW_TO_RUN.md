# How to Run – Desktop Application (Windows)

## 1. Initialize Submodules

Since the desktop app is added as a pointer submodule, first run:

```bash
git submodule update --init --recursive
```

## 2. Build the Installer

```bash
cd productivity-tracker
python BUILD_INSTALLER.py
```

## 3. Run the App

Once the build completes, the installer will be generated at:

```
productivity-tracker/frontend/dist_electron/FocusRank-Setup-1.0.0.exe
```

Simply run **FocusRank-Setup-1.0.0.exe** to install and launch the application.
