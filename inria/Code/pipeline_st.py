from python_heideltime import Heideltime
from show_results import *
import pandas as pd
from flair.models import SequenceTagger
import stanza
import streamlit as st


def main():
    MODEL_PATH = "NER_tool/stacked-standard-flair-150-wikiner.pt"
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
    demonym_dict = {"communes": json.load(open("demonyms/Data/final/gentiles_merged_stemmed_reversed.json")),
                    "departements": json.load(open("demonyms/Data/final/deps_stemmed_reversed.json")),
                    "regions": json.load(open("demonyms/Data/final/regs_stemmed_reversed.json"))
                    }

    # Getting user's IP address
    with requests.get("https://geolocation-db.com/json") as url:
        data = json.loads(url.text)
        ip_address = data["IPv4"]
    st.set_page_config(
        page_title="Chatbot",
        layout="wide")

    with st.form(key='my_form'):
        st.header("Hub'eau Chatbot")
        st.markdown("Le chatbot Hub'eau est specialisé dans les données sur la qualité de l'eau, plus précisement les eaux souterraines! \
        Il prend des questions du genre \" Quelle a été la profondeur des nappes chez moi, cette année? \" ou encore \"Y a t il de l'eau dans les sous-sols orléanais ?\"")
        query = st.text_input(label='Entrer la question')
        submit_button = st.form_submit_button(label='Suivant')

        if query != "" and submit_button:
            final_result = show_results(query, flair_model, nlp, heideltime_parser, nb_mesures, all_locations,
                                        demonym_dict, ip_address)
            exp = final_result["temporal_expressions"]
            st.header("Contraintes de temps:")
            if len(exp) > 0:
                st.subheader("Expressions temporelles extraites:")
                st.markdown(
                    "Le tableau représente les intervalles de temps (debut et fin) utilisés pour récuperer les mesures piézométriques:")
                df = pd.DataFrame([[e["start_date"], e["end_date"]]for e in exp], columns = ["Date de debut", "Date de fin"])
                st.dataframe(df)
            else:
                st.markdown("Aucune expression temporelle detectée")

            st.header("Contraintes de lieu:")

            if final_result["type"] == "bss":
                st.subheader("Codes BSS de stations mentionnés: ")
                st.markdown(", ".join(final_result["BSS_codes"]))

            else:
                all = final_result['all_location_data']

                for dict in all:
                    if dict["method"] in ["NAME", "DEMONYM"]:
                        loc_expressions, temp_exact_match, temp_sim = [], [], []
                        if dict["method"] == "NAME":
                            for l in dict["locations"]:
                                loc_expressions.append([l, "nom" , "-"])
                            for name, data in dict["exact_match"].items():
                                coms = ", ".join([info["nom"]+"("+com+")" for com, info in data["communes"].items()])
                                deps = ", ".join([info["nom"]+"("+com+")" for com, info in data["departements"].items()])
                                regs = ", ".join([info["nom"]+"("+com+")" for com, info in data["regions"].items()])
                                temp_exact_match.append([name, coms if coms!="" else "-", deps if deps!="" else "-", regs if regs!="" else "-"])

                            for name, data in dict["similar"].items():
                                coms = ", ".join([info["nom"] + "(" + com + ")" for com, info in data["communes"].items()])
                                deps = ", ".join([info["nom"] + "(" + com + ")" for com, info in data["departements"].items()])
                                regs = ", ".join([info["nom"] + "(" + com + ")" for com, info in data["regions"].items()])
                                temp_sim.append([name, coms if coms!="" else "-", deps if deps!="" else "-", regs if regs!="" else "-"])


                        elif dict["method"] == "DEMONYM":
                            for dem, locs in dict["locations"].items():
                                loc_expressions.append([dem,"gentilé", ", ".join(locs)])
                            for dem, data in dict["exact_match"].items():
                                coms = ", ".join([info["nom"]+"("+com+")" for com, info in data["communes"].items()])
                                deps = ", ".join([info["nom"]+"("+com+")" for com, info in data["departements"].items()])
                                regs = ", ".join([info["nom"]+"("+com+")" for com, info in data["regions"].items()])
                                temp_exact_match.append([dem, coms if coms!="" else "-", deps if deps!="" else "-", regs if regs!="" else "-"])

                        st.subheader("Noms de lieux et gentilés mentionnés :")
                        st.dataframe(pd.DataFrame(loc_expressions, columns=["Expression de lieu", "Type",
                                                                            "Noms de lieux correspondant"]))

                        st.subheader("Divisions adiministratives (à correspondance exacte):")
                        st.table(pd.DataFrame(temp_exact_match,
                                              columns=["Expression de lieu", "Communes", "Départements", "Régions"]))

                        if len(temp_sim)>0:
                            st.subheader("Divisions adimistratives (à peu près semblables):")
                            st.table(pd.DataFrame(temp_sim,
                                                  columns=["Expression de lieu", "Communes", "Départements", "Régions"]))

                        # classified = final_result['classified_location_data']
                        # st.subheader("Choix du type de division à considérer :")
                        # st.markdown("Pour les cas où un noms correspond à differents types de divisions")
                        # temp = []
                        # for div, data in classified.items():
                        #     text = []
                        #     for name, locs in data.items():
                        #         text.append(", ".join([info["nom"] + "(" + com + ")" for com, info in locs.items()]))
                        #     _ = ", ".join(text)
                        #     temp.append(_ if _ != "" else "-")
                        #
                        # st.table(
                        #     pd.DataFrame(temp, index=["Communes", "Départements", "Régions"], columns=["Divisions"]))


                    elif dict["method"] == "GEOLOCATION":
                       st.markdown("Aucune contrainte de lieu detectée, l'utilisateur est géolocalisé via son adresse IP.")


                relevent = final_result['relevant_location_data']
                st.header("Récapitulatifs des lieux pertinents retenus pour sélectionner les piézomètres:")
                temp = []
                for div, locs in relevent.items():
                    for insee, data in locs.items():
                        temp.append([data["nom"], re.sub("s$", "", div), insee])

                st.table(pd.DataFrame(temp, columns=["Nom", "Type de division", "Code INSEE"]))

                stations = final_result['stations']
                st.header("Listes des stations de mesure:")
                for insee, data in stations.items():
                    st.subheader(data["name"] + "(" + insee + ") : " + f"{data['nb_stations']} stations" if data["nb_stations"] > 0 else "")
                    text = ", ".join(data["stations"]) if data["nb_stations"] > 0 else "Aucune station de mesure"
                    st.markdown(text)

            tables = final_result["recaps"]
            if len(tables) == 0:
                st.text("Le(s) code(s) ne correspond(ent) à aucun piézomètre existant")
            else:
                st.header("Tableaux récapitulatifs")
                for tb in tables:
                    if tb["start_date"] != '' and tb["end_date"] != '':
                        st.markdown(
                            "Tableau récapitulatif des mesures prises entre le " + tb["start_date"] + " et le " + tb[
                                "end_date"] + ":")

                    else:
                        st.text("Tableau récapitulatif de toutes les mesures prises sur les piézomètres selectionnés:")
                    df = pd.json_normalize(tb["recap"])
                    df.columns = ["Lieu", "Code station", "Nombre de mesures", "Date plus ancienne", "Date plus récente",
                   "Niveau enregistré (altitude / mer)\nMIN", "Niveau enregistré (altitude / mer)\nMAX",
                   "Niveau enregistré (altitude / mer)\nAVG", "Niveau enregistré (altitude / mer)\nLAST",
                   "Profondeur de la nappe (/ au sol)\nMIN", "Profondeur de la nappe (/ au sol)\nMAX",
                   "Profondeur de la nappe (/ au sol)\nAVG", "Profondeur de la nappe (/ au sol)\nLAST"]
                    st.table(df)


if __name__ == "__main__":
    main()
