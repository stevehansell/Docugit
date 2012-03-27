##Docugit
Docugit automates creating Markdown from your code documentation, so you don't have to!

###Setup
Docugit depends on [Grit](https://github.com/mojombo/grit), Ruby and Git.

Clone Docugit and make sure that bin/docugit is in your load path.

###Usage

####Code comments
Docugit looks for documentation in files between /\*+ and +\*/ tags.

```javascript
/*+
	This is some sweet documentation!
+*/
````

####Initializing Docugit
Docugit works with an outside Git repo, typically a Wiki like Gollum. From your project directory, 
tell Docugit what Git repo to send Markdown files to. `docugit init ~/Some/Git/Repo` will create a .docugit-config 
file with the repo location in your project directory.

####Running Docugit
After initializing Docugit, commit the files with documentation. Simply run `docugit` from the project directory. The 
files will be read and Markdown versions with just your documentation will be created in the outside Git repo location, 
added, and commited with a Docugit commit message.