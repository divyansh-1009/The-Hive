# How to Run – Desktop Architecture

## 1. Initialize Submodules

Since the desktop app is added as a pointer submodule, first run:

```bash 
git submodule update --init --recursive
```

## 2. Build the Installer

```bash
python python BUILD_INSTALLER.py
```

## 3. Run the App

Once the build completes, an executable named **FocusRank-Setup-1.0.0.exe** will be generated in /. Simply run it to install and launch the application.
