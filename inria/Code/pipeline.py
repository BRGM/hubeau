import numpy as np

from location_extraction import *
from time_extraction import *
import pandas as pd
from termcolor import colored
from pprint import pprint
import socket

# stanza.download('fr') # run once


MODEL_PATH = "NER_tool/stacked-standard-flair-150-wikiner.pt"


##################################################################################
communes_ = pd.read_csv("demonyms/Data/commune2021.csv", encoding='utf-8')["LIBELLE"].tolist()
departements_ = pd.read_csv("demonyms/Data/departement2021.csv", encoding='utf-8')["LIBELLE"].tolist()
regions_ = pd.read_csv("demonyms/Data/region2021.csv", encoding='utf-8')["LIBELLE"].tolist()
_ = np.concatenate((communes_, departements_, regions_))
all_locations = list(map(replace, np.unique(_)))
demonym_dict = json.load(open("demonyms/Data/merged_reversed_stemmed.json"))


with requests.get("https://geolocation-db.com/json") as url:
    data = json.loads(url.text)
    ip_address = data["IPv4"]

with open("queries.txt", "a") as a_file:
    # while True:
    #     query = input("\n\nPlease enter a new query: ")
    query = "Quelle est la profondeur de la nappe à Sainte-colombe en ile-de-france ?"
    a_file.write(query)
    a_file.write("\n")
    bss = get_bss(query)
    if len(bss) > 0:
        print("Extracted bss codes: \n", bss)
    else:
        locations, method, exact_match, similar = get_locations(query, all_locations,demonym_dict, MODEL_PATH, ip_address=ip_address)
        print(colored("After classifying the locations:", "red"))
        communes, departements, regions = classify(query, locations, method, exact_match, similar)
        print("Communes\n")
        pprint(communes)
        print("\nDepartements\n")
        pprint(departements)
        print("\nRegions\n")
        pprint(regions)

        deps_to_keep, coms_to_keep, regs_to_keep = {}, {}, {}
        if len(regions) == 0 and len(departements) == 0 and len(
                communes) > 0:  # Simple case where there are only communes
            for name, content in communes.items():
                coms_to_keep.update(content)

        elif len(regions) == 0 and len(departements) > 0 and len(
                communes) == 0:  # simple case where there are only departements
            for name, content in departements.items():
                deps_to_keep.update(content)

        elif len(regions) > 0 and len(departements) == 0 and len(
                communes) == 0:  # simple case where there are only regions
            for name, content in regions.items():
                regs_to_keep.update(content)

        elif len(regions) == 0 and len(departements) > 0 and len(communes) > 0:

            """
                There are communes and departements, the rules would be:
                for each commune name (as there can be communes with the same name in different departements):
                 gather all the departements of the communes having that name
                 Chose the one that has its departement sited.
                 if none has a departement sited, take all of them
                if a departement is sited without having a commune sited, all its stations are added.
                """

            dep_codes = {k_: v_ for k, v in departements.items() for k_, v_ in v.items()}
            deps_to_omit = set()
            coms_to_keep = {}
            for name, content in communes.items():
                if len(content) == 1:  # commune name is unique, commune is added its departement is ommited
                    coms_to_keep.update(content)
                    deps_to_omit.add(list(content.values())[0]["codeDepartement"])

                else:  # more than one communes correspond to the name, so we chose the one that has a departement cited (omit the departement), if none take all of them
                    _ = {}
                    for com, info in content.items():
                        if info["codeDepartement"] in dep_codes:
                            _[com] = info
                            deps_to_omit.add(info["codeDepartement"])
                    if len(_) > 0:
                        coms_to_keep.update(_)
                    else:
                        coms_to_keep.update(content)

            # We still have to add departements that have no commune sited
            deps_to_keep = {k: v for k, v in dep_codes.items() if k not in deps_to_omit}

        elif len(regions) > 0 and len(departements) == 0 and len(communes) > 0:

            """
                There are communes and regions, the rules would be:
                for each commune name (as there can be communes with the same name in different regions):
                 gather all the regions of the communes having that name
                 Chose the ones that have the region extracted, the region is omitted.
                 if none has a region extracted, take all of them
                if a region is extracted without having a commune extracted, all its stations are added.
                """

            regs_codes = {k_: v_ for k, v in regions.items() for k_, v_ in v.items()}
            regs_to_omit = set()
            coms_to_keep = {}
            for name, content in communes.items():
                if len(content) == 1:  # commune name is unique, commune is added its region is ommited
                    coms_to_keep.update(content)
                    regs_to_omit.add(list(content.values())[0]["codeRegion"])

                else:  # more than one communes correspond to the name, so we chose the one that has its region extrcated (omit the region), if none take all of them
                    _ = {}
                    for com, info in content.items():
                        if info["codeRegion"] in regs_codes:
                            _[com] = info
                            regs_to_omit.add(info["codeRegion"])
                    if len(_) > 0:
                        coms_to_keep.update(_)
                    else:
                        coms_to_keep.update(content)

            # We still have to add regions that have no commune extracted
            regs_to_keep = {k: v for k, v in regs_codes.items() if k not in regs_to_omit}

        print(colored("Relevant Locations that will be used to get stations:", "red"))
        print("Communes:\n")
        pprint(coms_to_keep)
        print("Departements:\n")
        pprint(deps_to_keep)
        print("Regions:\n")
        pprint(regs_to_keep)

    print("\n-----------------------------------------------------------------------------------\n")
    data = {}
    for gran, gran_dict in {"commune": coms_to_keep, "departement": deps_to_keep, "region": regs_to_keep}.items():
        for loc, details in gran_dict.items():
            _ = insee_to_bss(details["codesDepartements"], gran) if gran == "region" else insee_to_bss(loc, gran)# get the stations located in loc
            if _ == -1:
                print(colored(f"There are no stations in {details['nom']} ({loc}):\n", "green"))
                data[loc] = -1
            else:
                print(colored(f"There are {len(_)} stations bss codes in {details['nom']} ({loc}):\n", "green"))
                print(colored(f"List of the stations bss codes:\n", "green"))
                pprint(list(_.keys()))
                for station in _:
                    result = get_mesure_piezo(station)
                    _[station]["mesures"] = result["mesures"]
                    _[station]["count"] = result["count"]

                data[loc] = _

    table_general = format_table_general(data, 30)
    print(table_general)


# dates_to_keep = get_time(query)
# print(colored("Extracted temporal expressions:", "green"))
# print(dates_to_keep)
