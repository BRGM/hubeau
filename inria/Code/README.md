The text below describes the steps to follow to be able to execute the code 


Create environment that runs python 3.7 with command 
```
virtualenv --python python3.7 venv
```
and activate it 
```
source venv/bin/activate
```
You also need to have java installed
```
sudo apt install default-jre
```

Clone the github repository, go to the "hubeau/inria/Code" directory
```
cd hubeau/inria/Code
```

Run the command below to install dependencies
```
python -m pip install -r requirements.txt
```
Download the flair model "stacked-standard-flair-150-wikiner.pt". You can use https://drive.google.com/file/d/1n6SCcOcwvrxDaH8C8IZOxZ133uZ31pzc/view?usp=sharing
The model path is used in the function get_locations as the parameter MODEL_PATH, so you have
to set the right path in the files pipeline.py end pipeline_st.py if you decide to change the directory
```console
gdown -O stacked-standard-flair-150-wikiner.pt https://drive.google.com/uc?id=1n6SCcOcwvrxDaH8C8IZOxZ133uZ31pzc
```

Download the stanza model
```console 
python download_stanza_model.py
```

In the directory Code/python_heideltime:
  - In file **config_Heideltime** change the path *"/heideltime-standalone-2.2.1/heideltime-standalone"*
    to  *"your_folder/hubeau/inria/Code/heideltime-standalone-2.2.1/heideltime-standalone"*
    
In the directory Code/heideltime-standalone-2.2.1:
  - In file **heideltime-standalone/config.props**
     change path to treetagger :
    *"treeTaggerHome = /heideltime-standalone-2.2.1/tree_tagger"* to
    *"treeTaggerHome = your_folder/hubeau/inria/Code/heideltime-standalone-2.2.1/tree_tagger"*

Run the file **pipeline.py** for console execution, after setting MODEL_PATH,
for now, it gives extracted locations, and the relevant locations informations that will be used to get the stations and 
also extracted time expressions.