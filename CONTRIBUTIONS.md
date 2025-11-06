**0. Prerequisites**

GitHub Pro, free as a student.



**1. Creating a ticket**

Navigate to the Kanban board on github, decide which column your ticket falls under and click the add item button at the bottom.

<img width="502" height="334" alt="image" src="https://github.com/user-attachments/assets/32b8043b-3b3a-4ebd-9137-f15a3b299259" />

From which, click the small plus on the bottom LHS corner, then "create new issue".

<img width="668" height="213" alt="image" src="https://github.com/user-attachments/assets/cb688e5e-d5ed-4d99-b739-4223d0e8b66a" />

Fill out the details as asked. 



**2. Starting work on a ticket**

Once you have created a ticket that you would like to work on or have found one previously made; click on the text to open the ticket and, in the top right corner, click the blue text "Assign Yourself" so that it becomes your job and noone else will try and take it on.

<img width="453" height="127" alt="image" src="https://github.com/user-attachments/assets/8f1569bb-4954-45fe-83be-23b7895af38c" />

Then drag the ticket across into the "in progress" column.

Once there, return to the description of the ticket and find the "Development" section on the right hand side and click "Create a new branch" then "Create Branch".

<img width="449" height="121" alt="image" src="https://github.com/user-attachments/assets/dbba79e1-a989-4a33-a420-de2e80b3ab9b" />

Copy the suggested commands and paste them into your vscode terminal.

<img width="666" height="129" alt="image" src="https://github.com/user-attachments/assets/969122bf-ea34-4ec6-8b49-a14ae9922e7e" />

Assuming you have set up the repo correctly, confirm you are working on the correct branch by checking this text in the bottom right corner is correct.

<img width="563" height="41" alt="image" src="https://github.com/user-attachments/assets/88d64967-4ea4-4ff6-96a6-9065d6ca6b78" />



**3. Pushing and Committing**

**Method 1 - VS Code (recommended)**

Once you are happy with the work you have done on a ticket - navigate to the LHS of VSc and select the "Source Control" tab.

Right click the files you want to commit and click "Stage Changes". Confirm the correct files are under the staged changes banner"

<img width="437" height="198" alt="image" src="https://github.com/user-attachments/assets/cc5a60b1-c609-47c3-8f6a-732b6e08b997" />

Add a commit message, outlining the changes you've made and press commit, then in the bottom left hit the arrows to "synchronise changes" to push your commit.

<img width="334" height="117" alt="image" src="https://github.com/user-attachments/assets/71e665b8-67cf-41da-a5e3-41124f5a4e4b" />

**Method 2 - Bash**

Once you are happy with your work, open a bash terminal and:

`git add .` to stage all changes made 

or

`git add <filename>` to stage specific files

`git commit -m "Description of your work"` To commit your staged changes, ensure there is a detailed description alongside your changes

`git push origin feature/<short-description>` To push your changes.



**4. Merging**

Navigate to the ticket again and open a pull request. Wait until the automatic tests are ran and fix any changes suggested by those.

Then, in the top right click reviewers then CoPilot (GitHub Pro required). CoPilot with then offer a code review, it is strongly suggested you make these changes.

Finally, request the "Avis Code team" as a reviewer, and one of the official code reviewers will look over your work.

If they deem it suitable to merged, you will be cleared to merge; alternatively, changes will be suggested which you will make and then request another review.






















