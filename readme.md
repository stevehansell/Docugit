##Docugit
Docugit automates creating Markdown from your code documentation, so you don't have to!

###Setup
Docugit depends on [Grit](https://github.com/mojombo/grit), Ruby and Git.

Clone Docugit and make sure that bin/docugit is in your load path.

###Usage

####Code comments
Docugit reads JavaScript, HTML, and CSS files and comments. Append a plus symbol after the opening comment tag 
and before the closing comment tag and Docugit will grab the documentation in between.

```javascript
/*+
	This is some sweet JavaScript or CSS style documentation!
+*/
````

```html
<!--+
	More HTML style documentation
+-->
```

####Initializing Docugit
Docugit works with an outside Git repo, typically a Wiki like Gollum. From your project directory, 
tell Docugit what Git repo to send Markdown files to. `docugit init ~/Some/Git/Repo` will create a .docugit-config 
file with the repo location in your project directory.

####Running Docugit
After initializing Docugit, commit the files with documentation. Simply run `docugit` from the project directory. The 
files will be read and Markdown versions with just your documentation will be created in the outside Git repo location, 
added, and committed with a Docugit commit message.