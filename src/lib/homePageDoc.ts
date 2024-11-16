export const homePageDoc = `# Markdown

![Markdown](https://github.com/WilliamDavidson-02/markdown/raw/main/static/logo_banner_full.svg)

## Table of Contents

- [Markdown](#markdown)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
    - [Auto resize table](#auto-resize-table)
    - [Extend selection](#extend-selection)
    - [Checkbox](#checkbox)
    - [Links](#links)

## Features

This markdown editor has your standard editor features, like syntax highlighting, bracket matching, multiple cursors and more. But there are some unique features that makes your markdown experience better and that is:

### Auto resize table

It can be frustrating to manually resize tables. This editor will automatically resize the table to fit the content as you are typing.

| Dish Name           | Ingredients                    | Cooking Time |
| :------------------ | :----------------------------: | -----------: |
| Spaghetti Carbonara | Pasta, Eggs, Pecorino          | 20 minutes   |
| Chicken Stir Fry    | Chicken, Vegetables, Soy Sauce | 30 minutes   |
| Caesar Salad        | Romaine, Croutons, Parmesan    | 15 minutes   |
| Beef Tacos          | Ground Beef, Tortillas, Cheese | 25 minutes   |
| Apple Pie           | Apples, Cinnamon, Pastry       | 45 minutes   |

### Table rows & columns

You can add new rows to a table by typing a pipe character (\`|\`) at the end of the header row.

| Dish Name           | Ingredients                    | New column 
| :------------------ | :----------------------------: |
| Spaghetti Carbonara | Pasta, Eggs, Pecorino          |
| Chicken Stir Fry    | Chicken, Vegetables, Soy Sauce |

You can add new columns to a table by adding a new with in the table rows.
Press either \`Cmd+Enter\` or \`Shift+Cmd+Enter\` to add a new column above or below the current line.

| Dish Name           | Ingredients                    |
| :------------------ | :----------------------------: |
| Spaghetti Carbonara | Pasta, Eggs, Pecorino          |
| Chicken Stir Fry    | Chicken, Vegetables, Soy Sauce |
| Caesar Salad        | Romaine, Croutons, Parmesan    |

### Extend selection

You can extend or contract your selection using keyboard shortcuts. This is particularly useful when working with nested markdown structures like lists or headings.

- Keybinding:
  - \`Ctrl+Alt+ArrowUp\` Extends the selection to include the parent element
  - \`Ctrl+Alt+ArrowDown\` Contracts the selection to the child element

This makes it easy to select and manipulate nested markdown structures without having to manually drag your cursor.

### Checkbox

The editor provides a convenient way to toggle checkboxes in markdown lists. When your cursor is on a line with a checkbox, simply press \`Cmd+Enter\` to toggle it between checked and unchecked states.

For example:

- [ ] Unchecked item
- [x] Checked item
- [ ] Another unchecked item

You can also toggle multiple checkboxes at once by selecting multiple lines:

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

This makes it easy to manage task lists without having to manually edit the markdown syntax. Just place your cursor on a line or select multiple lines and use the keyboard shortcut to toggle the checkbox states.

### Links

The editor automatically formats pasted URLs into markdown links. When you paste a URL, it will be converted into a markdown link format \`[title](url)\`.

For example, if you paste: https://www.google.com
`
