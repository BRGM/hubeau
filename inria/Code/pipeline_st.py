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
    demonym_dict = {"communes": json.load(open("demonyms/Data/final/gentiles_merged_reversed_stemmed.json")),
                    "departements": json.load(open("demonyms/Data/deps_stemmed_reversed.json"))}

    # Getting user's IP adress
    with requests.get("https://geolocation-db.com/json") as url:
        data = json.loads(url.text)
        ip_address = data["IPv4"]
    st.set_page_config(
        page_title="Chatbot",
        layout="wide")

    with st.form(key='my_form'):
        query = st.text_input(label='Entrer la question')
        submit_button = st.form_submit_button(label='Submit')

        if query != "" and submit_button:
            final_result = show_results(query, flair_model, nlp, heideltime_parser, nb_mesures, all_locations,
                                        demonym_dict, ip_address)
            exp = final_result["temporal_expressions"]
            st.header("Contraintes de temps:")
            if len(exp) > 0:
                st.subheader("Expressions temporelles extraites:")
                df = pd.json_normalize(exp)
                df.columns = ["Date de debut", "Date de fin"]
                st.dataframe(df)
            else:
                st.header("Aucune expression temporelle detectée")

            st.header("Contraintes de lieu:")

            if final_result["type"] == "bss":
                st.subheader("Codes BSS de stations mentionnés: ")
                st.markdown(", ".join(final_result["BSS_codes"]))

            else:
                all = final_result['all_location_data']
                for dict in all:
                    if dict["method"] == "NAME":

                        names = pd.DataFrame(dict["locations"], columns=["Noms de lieux"])
                        temp1 = []
                        for name, data in dict["exact_match"].items():
                            coms = ", ".join([info["nom"]+"("+com+")" for com, info in data["communes"].items()])
                            deps = ", ".join([info["nom"]+"("+com+")" for com, info in data["departements"].items()])
                            regs = ", ".join([info["nom"]+"("+com+")" for com, info in data["regions"].items()])
                            temp1.append([name, coms, deps, regs])
                        temp2 = []
                        for name, data in dict["similar"].items():
                            coms = ", ".join([info["nom"] + "(" + com + ")" for com, info in data["communes"].items()])
                            deps = ", ".join(
                                [info["nom"] + "(" + com + ")" for com, info in data["departements"].items()])
                            regs = ", ".join([info["nom"] + "(" + com + ")" for com, info in data["regions"].items()])
                            temp2.append([name, coms if coms!="" else "-", coms if deps!="" else "-", coms if regs!="" else "-"])


                    elif dict["method"] == "DEMONYM":

                        temp = [[dem, ", ".join(locs)] for dem, locs in dict["locations"].items()]
                        demonyms = pd.DataFrame(temp, columns=["Gentilé", "Noms de lieux correspondant"])
                        temp3 = []
                        for dem, data in dict["exact_match"].items():
                            coms = ", ".join([info["nom"]+"("+com+")" for com, info in data["communes"].items()])
                            deps = ", ".join([info["nom"]+"("+com+")" for com, info in data["departements"].items()])
                            regs = ", ".join([info["nom"]+"("+com+")" for com, info in data["regions"].items()])
                            temp3.append([dem, coms if coms!="" else "-", coms if deps!="" else "-", coms if regs!="" else "-"])






                    elif dict["method"] == "GEOLOCATION":
                        st.text("geo")
                if len(names) > 0:
                    st.subheader("Noms de lieux mentionnés :")
                    st.dataframe(names)
                if len(demonyms) > 0:
                    st.subheader("Gentilé mentionnés et noms de lieux correspondant:")
                    st.dataframe(demonyms)

                if len(names) > 0:
                    st.subheader("Divisions adimistratives  portant les noms :")
                    st.table(pd.DataFrame(temp1, columns=["Nom", "Communes", "Départements", "Régions"]))
                    st.subheader("Divisions adimistratives  portant des noms ressemblant:")
                    st.table(pd.DataFrame(temp2, columns=["Nom", "Communes", "Départements", "Régions"]))
                if len(demonyms) > 0:
                    st.subheader("Divisions adimistratives correspondant aux gentilés:")
                    st.table(pd.DataFrame(temp3, columns=["Gentilé", "Communes", "Départements", "Régions"]))

                classified = final_result['classified_location_data']
                st.subheader("Classification :")
                temp = []
                for div, data in classified.items():
                    text = []
                    for name, locs in data.items():
                        text.append(", ".join([info["nom"] + "(" + com + ")" for com, info in locs.items()]))
                    _ = ", ".join(text)
                    temp.append(_ if _!="" else "-")

                st.table(pd.DataFrame(temp, index = ["Communes", "Départements", "Régions"], columns=["Divisions"]))

                relevent = final_result['relevant_location_data']
                st.header("Lieux pertinents retenus pour sélectionner les piézomètres:")
                temp = []
                for div, locs in relevent.items():
                    for insee, data in locs.items():
                        temp.append([data["nom"], re.sub("s$", "", div), insee])

                st.table(pd.DataFrame(temp, columns=["Nom", "Type de division", "Code INSEE"]))

                stations = final_result['stations']
                st.header("Listes des stations de mesure:")
                for insee, data in stations.items():
                    st.subheader(data["name"] + "(" + insee + ")")
                    text = ", ".join(data["stations"]) if data["nb_stations"] > 0 else "Aucune station de mesure"
                    st.markdown(text)

            tables = final_result["recaps"]
            if len(tables) == 0:
                st.text("Le(s) code(s) ne correspond(ent) à aucun piézomètre existant")
            else:
                st.header("Tableau récapitulatifs")
                for tb in tables:
                    if tb["start_date"] != '' and tb["end_date"] != '':
                        st.markdown(
                            "Tableau récapitulatif des mesures prises entre le " + tb["start_date"] + " et le " + tb[
                                "end_date"] + ":")

                    else:
                        st.text("hello")
                    df = pd.json_normalize(tb["recap"])
                    df.reset_index(drop=True, inplace=True)
                    st.table(df)


if __name__ == "__main__":
    main()
