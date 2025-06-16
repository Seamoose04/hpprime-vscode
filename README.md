# HP Prime Programming Language Support for VSCode

This extension provides **syntax highlighting**, **command auto-completion**, and **function documentation** for the **HP Prime Programming Language (HP PPL)** in **Visual Studio Code (VSCode)**. It is based on the original Notepad++ HP Prime Programming Language extension, with enhancements for better integration into the VSCode environment.

## Features
- **Syntax Highlighting**: Keywords, operators, and functions are highlighted for easier reading and editing of HP PPL code.
- **Code Completion**: Provides suggestions for HP PPL keywords, functions, and syntax during code writing.
- **Function Documentation**: Integrated documentation for over 800 functions, including overloads, for quick reference as you code.

## Credits
This extension is inspired by the work done by the following individuals:
- **Juerg W. Buser**: The original author of most of the contents in `userDefineLang.xml` (2015). He can be contacted at `jwbuser@bluewin.ch`.
- **Terje Vallestad**: The contributor who extracted the function documentation from the HP Prime calculator (firmware revision 10077) and adapted it for use with Notepad++.
- **Eric Rechlin**: Developer and maintainer of the Notepad++ version, who helped optimize the integration of function documentation into Notepad++.

The original Notepad++ extension can be found at [https://www.hpcalc.org/details/7564](https://www.hpcalc.org/details/7564).

The function documentation, including the complete list of over 800 functions and their overloads, was adapted from Terje Vallestad's work to fit into this extension.

## Installation

To install this extension, follow these steps:
1. Download the extension from GitHub or directly from the VSCode marketplace.
2. Open **Visual Studio Code** and go to **Extensions** (click on the Extensions icon in the left sidebar or press `Ctrl+Shift+X`).
3. Search for **HP Prime Programming Language**.
4. Click **Install** to add the extension to your VSCode setup.

## Usage

After installing the extension, you can start writing HP Prime Programming Language (HP PPL) code in VSCode by opening a `.hpprgm` file or creating a new one. The extension will automatically activate, providing syntax highlighting and auto-completion for HP PPL code.

### Building a Combined Program

A simple build script is included to merge a project with `#include` dependencies into a single `combined.hpprgm` file. Run the following from your project folder:

```bash
npm run bundle <entry-file.hpprgm> [output.hpprgm]
```

The script resolves `#include` directives, orders files by function dependencies, and writes the result to `combined.hpprgm` (or the output path you provide).

You can also wire the bundler to VSCode's **Run Build Task** command by creating a `tasks.json` with an `hpprime` task:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "HP Prime: Build",
      "type": "hpprime",
      "entry": "src/main.hpprgm",
      "output": "combined.hpprgm",
      "group": "build",
      "problemMatcher": []
    }
  ]
}
```

Press `Ctrl+Shift+B` to run the task and produce the combined program.

### Acknowledgements
- The original work for **HP Prime Programming Language** support in Notepad++ was written by **Juerg W. Buser** and **Terje Vallestad**. Their contributions made this extension possible.
- This extension was developed by **Seamoose04** to provide the HP Prime community with enhanced support in VSCode.
