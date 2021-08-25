FROM python:3.7-slim

COPY requirements.txt requirements.txt

COPY download_stanza_model.py download_stanza_model.py

RUN apt-get update \
    && apt-get install --no-install-recommends unixodbc-dev gcc g++ default-jre -y

RUN pip install --upgrade pip setuptools wheel \
    && pip install -r requirements.txt \
    && pip cache purge \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /root/.cache/pip

RUN gdown -O stacked-standard-flair-150-wikiner.pt https://drive.google.com/uc?id=1n6SCcOcwvrxDaH8C8IZOxZ133uZ31pzc

RUN python download_stanza_model.py

COPY . .
WORKDIR .
CMD [ "streamlit", "run", "pipeline_st.py" ]