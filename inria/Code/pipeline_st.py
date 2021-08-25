from show_results import *
import pandas as pd
from flair.models import SequenceTagger
import stanza
import streamlit as st

def main():
    MODEL_PATH = "stacked-standard-flair-150-wikiner.pt"
    nb_mesures = None

    flair_model = SequenceTagger.load(MODEL_PATH)
    nlp = stanza.Pipeline(lang='fr', processors='tokenize,mwt,pos,lemma,depparse', logging_level="FATAL")
    heideltime_parser = Heideltime()
    ##################################################################################

    # Reading dataset of all location names
    communes_ = pd.read_csv("demonyms/Data/locations/commune2021.csv", encoding='utf-8')["LIBELLE"].tolist()
    departements_ = pd.read_csv("demonyms/Data/locations/departement2021.csv", encoding='utf-8')["LIBELLE"].tolist()
    regions_ = pd.read_csv("demonyms/Data/locations/region2021.csv", encoding='utf-8')["LIBELLE"].tolist()
    all_locations = list(map(replace, np.unique(np.concatenate((communes_, departements_, regions_)))))

    # Reading the dictionnary of demonyms
    demonym_dict = {"communes": json.load(open("demonyms/Data/final/gentiles_merged_reversed_stemmed.json")),
                    "departements": json.load(open("demonyms/Data/deps_stemmed_reversed.json"))}

    # Getting user's IP adress
    with requests.get("https://geolocation-db.com/json") as url:
        data = json.loads(url.text)
        ip_address = data["IPv4"]


    with st.form(key='my_form'):
        query = st.text_input(label='Entrer la question')
        submit_button = st.form_submit_button(label='Submit')

        ####################################################################################################################

        if query != "" and submit_button:
            final_result = show_results(query, flair_model, nlp, heideltime_parser, nb_mesures, all_locations,
                                        demonym_dict, ip_address)
            for text, elem in final_result.items():

                if text == "tables":
                    for tb in elem:
                        st.text(tb["start_date"])
                        st.text(tb["end_date"])
                        st.text(tb["table"])
                else:
                    st.text(text)
                    st.json(elem)

if __name__ == "__main__":
    main()

