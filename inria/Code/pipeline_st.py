from location_extraction import *
from time_extraction import *
from show_results import *
import pandas as pd
from termcolor import colored
from pprintpp import pprint
from flair.models import SequenceTagger
import stanza
import streamlit as st
# stanza.download('fr') # run once

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

#Reading the dictionnary of demonyms
demonym_dict = {"communes": json.load(open("demonyms/Data/final/gentiles_merged_reversed_stemmed.json")),
                "departements": json.load(open("demonyms/Data/deps_stemmed_reversed.json"))}

#Getting user's IP adress
with requests.get("https://geolocation-db.com/json") as url:
    data = json.loads(url.text)
    ip_address = data["IPv4"]

with open("queries.txt", "a") as a_file:
    with st.form(key='my_form'):
        query = st.text_input(label='Enter your name')
        submit_button = st.form_submit_button(label='Submit')
        ## User Query
        # query = "Y'a-t-il de l'eau dans le sous-sol en mars 2020 et avril 2020 ?"

        ####################################################################################################################

        if query != "" and submit_button:
            dates_to_keep, normalized_query = get_time(query, heideltime_parser)

            st.text("Expressions temporelles extraites :\n")
            st.json(dates_to_keep)
            st.text("\n-----------------------------------------------------------------------------------\n")

            ####################################################################################################################
            data = []
            bss_codes = get_bss(normalized_query)
            if len(bss_codes) > 0:
                st.text("Codes BSS extraits: \n")
                st.text(bss_codes)
                data = get_table_data_bss(bss_codes, dates_to_keep)
                if len(data) == 0:
                    st.text("Le(s) code(s) ne correspond(ent)  à aucune station de mesure")
                print_ = False
            else:

                locations = get_locations(normalized_query, all_locations, demonym_dict,
                                                                        flair_model, nlp,
                                                                        ip_address=ip_address)

                st.text("Toutes les données recoltées sur les lieux :")
                st.json(locations)

                communes, departements, regions = classify(normalized_query, locations, nlp)

                st.text("Après classifications des lieux :")
                st.text("Communes\n")
                st.json(communes)
                st.text("\nDepartements\n")
                st.json(departements)
                st.text("\nRegions\n")
                st.json(regions)

                coms_to_keep, deps_to_keep, regs_to_keep = get_relevant(communes, departements, regions)

                st.text("Lieux pertinents utilisés pour afficher les mesures:")
                st.text("Communes:\n")
                st.json(coms_to_keep)
                st.text("Departements:\n")
                st.json(deps_to_keep)
                st.text("Regions:\n")
                st.json(regs_to_keep)

                data = get_table_data_locations(coms_to_keep, deps_to_keep, regs_to_keep,dates_to_keep)
                print_ = True
            st.text("\n-----------------------------------------------------------------------------------\n")

            for data_ in data:
                table_general, text = format_table_general(data_["data"], nb_mesures, return_text=print_)
                for _ in text:
                    st.text(_)
                st.text(f"Tableau des mesures correspondant à la periode: {data_.get('start_date', '')}  {data_.get('end_date', '')}  \n")
                st.text(table_general)
