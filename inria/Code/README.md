
Create environment that runs python 3.6 with command **virtualenv --python python3.6 venv** and activate it **source venv/bin/activate**


Clone the github repository, go to the "hubeau/inria/Code" directory


Run "python -m pip install -r requirements.txt" to install dependencies


Download the flair model "stacked-standard-flair-150-wikiner.pt". You can use https://drive.google.com/file/d/1n6SCcOcwvrxDaH8C8IZOxZ133uZ31pzc/view?usp=sharing
The model path is used in the function get_locations as the parameter MODEL_PATH, so you have
to set the right path in the file pipeline.py


In the directory Code/python_heideltime:
  - In file **python_heideltime/config_Heideltime** change the path *"/home/maya/Documents/hubeau/sinria/Code/python_heideltime/heideltime-standalone-2.2.1/heideltime-standalone"*
    to  *"your_folder/hubeau/inria/Code/python_heideltime/heideltime-standalone-2.2.1/heideltime-standalone"*
    

  - In file **python_heideltime/heideltime-standalone-2.2.1/heideltime-standalone/config.props**
     change path to treetagger :
    *"treeTaggerHome = /home/maya/Documents/hubeau/inria/Code/python_heideltime/heideltime-standalone-2.2.1/tree_tagger"* to
    *"treeTaggerHome = your_folder/hubeau/inria/Code/python_heideltime/heideltime-standalone-2.2.1/tree_tagger"*

Run the file **pipeline.py**, after setting MODEL_PATH,
 for now, it gives extracted locations, and the relevant locations informations that will be used to get the stations and 
   also extracted time expressions.