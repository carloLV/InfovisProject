# InfovisProject
This folder contains the final project for InfoVis course. It takes knowledge graphs computed in BigData project and visualizes them.

# Info 
The project is composed by 3 main pieces:
1. A JAR file, simplified version of [this project](https://github.com/carloLV/KnowledgeGraph)
2. Some input file, subsets of the biggest file.
3. The **html** page to visualize the output of the JAR.

## infovisDemo.jar
Runnable with `java -jar infovisDemo.jar 3utenti.json`. The *.sh* script simply runs this command.
**Note**
Run jar on file too big is useless for the analysis. The operation are implemented to study on subsets of users.

## Modify the project
If you want to use others files, you have to change the logic of the extraction. In this file operations are performed using `d3.text` and `d3.json`. Modify that functions to change behaviour.
The extraction made by jar file is the same of the original project, so go to the link upside if you want more information

