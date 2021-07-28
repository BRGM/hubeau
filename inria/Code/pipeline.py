from location_extraction import *
from time_extraction import *
from show_results import *
import pandas as pd
from termcolor import colored
from pprint import pprint

# stanza.download('fr') # run once


MODEL_PATH = "NER_tool/stacked-standard-flair-150-wikiner.pt"
nb_mesures = None

##################################################################################
communes_ = pd.read_csv("demonyms/Data/commune2021.csv", encoding='utf-8')["LIBELLE"].tolist()
departements_ = pd.read_csv("demonyms/Data/departement2021.csv", encoding='utf-8')["LIBELLE"].tolist()
regions_ = pd.read_csv("demonyms/Data/region2021.csv", encoding='utf-8')["LIBELLE"].tolist()
_ = np.concatenate((communes_, departements_, regions_))
all_locations = list(map(replace, np.unique(_)))
demonym_dict = {"communes": json.load(open("demonyms/Data/coms_reversed_stemmed.json")),
                "departements": json.load(open("demonyms/Data/deps_stemmed_reversed.json"))}

with requests.get("https://geolocation-db.com/json") as url:
    data = json.loads(url.text)
    ip_address = data["IPv4"]

with open("queries.txt", "a") as a_file:
    # while True:
    # query = input("\n\nPlease enter a new query: ")
    #
    query = "Quelle est la qualité de l'eau souterraine dans mon departement"

    # a_file.write(query)
    # a_file.write("\n")
    ####################################################################################################################

    dates_to_keep, normalized_query = get_time(query)

    print(colored("Expressions temporelles extraites :\n", "green"))
    pprint(dates_to_keep)
    print("\n-----------------------------------------------------------------------------------\n")

    ####################################################################################################################
    data = []
    bss_codes = get_bss(normalized_query)
    if len(bss_codes) > 0:
        print(colored("Codes BSS extraits: \n", "green"))
        print(bss_codes)
        if len(dates_to_keep) > 0:
            for date in dates_to_keep:
                _ = {"data": get_table_data_bss(bss_codes, start_date=date.get("start_date", None),
                                                end_date=date.get("end_date", None)),
                     "start_date": date.get("start_date", None), "end_date": date.get("end_date", None)}
                data.append(_)
        else:
            _ = {"data": get_table_data_bss(bss_codes)}
            data.append(_)
    else:

        locations, method, exact_match, similar = get_locations(normalized_query, all_locations, demonym_dict,
                                                                MODEL_PATH,
                                                                ip_address=ip_address)
        if exact_match is not None:
            print(colored("Tous les lieux correspondant:", "red"))
            pprint(exact_match)
        communes, departements, regions = classify(normalized_query, locations, method, exact_match, similar)

        print(colored("Après classifications des lieux :", "red"))
        print("Communes\n")
        pprint(communes)
        print("\nDepartements\n")
        pprint(departements)
        print("\nRegions\n")
        pprint(regions)

        deps_to_keep, coms_to_keep, regs_to_keep = get_relevant(communes, departements, regions)

        print(colored("Lieux pertinents utilisés pour afficher les mesures:", "red"))
        print("Communes:\n")
        pprint(coms_to_keep)
        print("Departements:\n")
        pprint(deps_to_keep)
        print("Regions:\n")
        pprint(regs_to_keep)
        if len(dates_to_keep) > 0:
            for date in dates_to_keep:
                _ = {"data": get_table_data_locations(coms_to_keep, deps_to_keep, regs_to_keep,
                                                      start_date=date["start_date"],
                                                      end_date=date["end_date"]),
                     "start_date": date.get("start_date", None), "end_date": date.get("end_date", None)}
                data.append(_)
        else:
            _ = {"data": get_table_data_locations(coms_to_keep, deps_to_keep, regs_to_keep)}
            data.append(_)
    # pprint(data)
    print("\n-----------------------------------------------------------------------------------\n")
    print_ = True
    for data_ in data:
        table_general = format_table_general(data_["data"], nb_mesures, print_=print_)
        print_ = False

        print(colored(f"Tableau des mesures correspondant à la periode: {data_.get('start_date', '')}  {data_.get('start_date', '')}  \n",
                      "red"))
        print(table_general)
