# InfovisProject
This folder contains the final project for [InfoVis course](http://www.dia.uniroma3.it/~infovis/index.php). It takes knowledge graphs computed in BigData project and visualizes them.

# Info 
The project is composed by 3 main pieces:
1. A JAR file, simplified version of [this project](https://github.com/carloLV/KnowledgeGraph)
2. Some input file, subsets of the biggest file.
3. The **html** page to visualize the output of the JAR.

## infovisDemo.jar
Runnable with `java -jar infovisDemo.jar 3utenti.json`. The *.sh* script simply runs this command.
**Note**
Run jar on file too big is useless for the analysis. The operation are implemented to study subsets of users.

## Modify the project
If you want to use others files, you have to change the logic of the extraction. In this file operations are performed using `d3.text` and `d3.json`. Modify that functions to change behaviour.
The extraction made by jar file is the same of the original project, so go to the link upside if you want more information

## Use
To visualize **output** run in this folder a new python server with command `python -m SimpleHTTPServer 8000`.
Then open browser and visit `localhost:8000/demod3graph.html`
You can use the selection menu to decide files and operations. If you want you can add your file, following the sintax of examples (or rewriting the parser).

## GUI
The **top div** contains a selection menu to choose your file, and four **buttons** to hide or show the two kind of links.

In the **second div** there are three slidebars, to change some parameters of the force layout.

The node representing **interests** of user are *grey*, while **users** are *red*.

The links **User <-> Interest** are *blue* and **Interest <-> Parents Interests** are *red*. 

**Mouse Hover** on node highlights its links and shows the node name. In the bottom of page are shown some informations about the node.

**Click** on a node highlights only the node and its links. 

**Note**
1. The jar needs to be computed externally. Some example files are already present, with their outputs.
2. To add files to the menu you have to manually add it in the *html* file.

