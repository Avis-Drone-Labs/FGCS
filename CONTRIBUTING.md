# Contributing

This document outlines the full process for creating, working on, and merging tickets within the FGCS repository.  
All steps can be completed directly through GitHub and VS Code.

---

## Creating a Ticket

Navigate to the **Kanban board** on GitHub, decide which column your ticket belongs in, and click the **“Add item”** button at the bottom.

<p align="center">
  <img width="1274" height="742" alt="image" src="https://github.com/user-attachments/assets/73d45392-fa9c-4ee0-83f7-53e009584363" />
</p>

Then click the small **“+”** on the lower left-hand side and select **“Create new issue.”**

<p align="center">
  <img width="1280" height="743" alt="image" src="https://github.com/user-attachments/assets/23bf0b32-bb68-4abc-861c-a58c2a6b8ee2" />
</p>

Fill in all required details clearly and concisely.

> 💡 **Tip:** Write your ticket titles in a short, descriptive format — e.g. `Fix telemetry dashboard alignment` or `Add settings panel layout`.

---

## Starting Work on a Ticket

You can either:
- Create a new ticket to work on, **or**
- Select a **pre-existing ticket** that hasn’t yet been assigned.

1. Open the ticket and click **“Assign yourself”** in the top-right corner so no one else duplicates the work.

2. Drag your ticket into the **“In Progress”** column on the board.

3. Open the ticket again, locate the **Development** section on the right-hand side, and click **“Create a new branch.”**  
   Then click **“Create Branch.”**

   <p align="center">
     <img width="1274" height="742" alt="image" src="https://github.com/user-attachments/assets/f938c231-57f9-47d7-9605-71aa5776bf84" />
   </p>

4. Copy the suggested Git commands and paste them into your VS Code terminal.

5. Verify that you’re on the correct branch — the branch name appears in the **bottom-left corner** of VS Code.

   <p align="center">
     <img width="1280" height="809" alt="image" src="https://github.com/user-attachments/assets/3e3f4ba7-ff25-412c-8db9-2c56b3bbb67e" />
   </p>

---

## Committing and Pushing Changes

You can commit changes using **VS Code (recommended)** or **Bash**.

### Method 1: VS Code (Recommended)

1. Open the **Source Control** tab on the left-hand side.  
2. Right-click the files you want to commit and select **“Stage Changes.”**  
   Confirm the correct files appear under the *Staged Changes* section.
3. Add a clear commit message describing your changes.  
4. Press **Commit**, then click the **arrows in the bottom-left corner** to *Synchronize Changes* (push your commit).

   <p align="center">
     <img width="1294" height="798" alt="image" src="https://github.com/user-attachments/assets/925c060c-fd4b-4e0f-af9d-bfbcb666ccdc" />
   </p>


---

### Method 2: Bash (Terminal)

If you prefer the command line, use the following:

```bash
# Stage all changes
git add .

# Or stage specific files
git add <filename>

# Commit your staged changes with a descriptive message
git commit -m "Description of your work"

# Push your changes to your branch
git push origin <branch name>
```

---

### Merging
Navigate to the ticket again and open a pull request. Wait until the automatic tests are ran and fix any changes suggested by those. 

Then, in the top right click reviewers then Copilot (GitHub Pro required). Copilot will then offer a code review, it is strongly suggested you make these changes. 

Finally, request the "Avis Code team" as a reviewer, and one of the official code reviewers will look over your work. If they deem it suitable to merge, you will be cleared to merge; alternatively, changes will be suggested which you will make and then request another review.
