from location_extraction import *
from time_extraction import *
import pandas as pd
from termcolor import colored

# stanza.download('fr') # run once


MODEL_PATH = "NER_tool/stacked-standard-flair-150-wikiner.pt"
##################################################################################

communes_ = pd.read_csv("demonyms/Data/commune2021.csv", encoding='utf-8')["LIBELLE"].tolist()
departements_ = pd.read_csv("demonyms/Data/departement2021.csv", encoding='utf-8')["LIBELLE"].tolist()
regions_ = pd.read_csv("demonyms/Data/region2021.csv", encoding='utf-8')["LIBELLE"].tolist()
_ = np.concatenate((communes_, departements_, regions_))
all_locations = list(map(lambda x: x.lower(), np.unique(_)))

with requests.get("https://geolocation-db.com/json") as url:
    data = json.loads(url.text)
    ip_address = data["IPv4"]

with open("queries.txt", "a") as a_file:

    while True:
        query = input("\n\nPlease enter a new query: ")
        a_file.write(query)
        a_file.write("\n")
        bss = get_bss(query)
        if len(bss) > 0:
            print("Extracted bss codes: \n", bss)
        else:
            all, communes, departements, regions, count = get_locations(query, all_locations, MODEL_PATH, ip_address=ip_address)
            print(colored("All corresponding insee codes:\n", "red"))
            print("Communes\n", all["communes"], "\nDepartements\n", all["departements"], "\nRegions\n", all["regions"])
            print(colored("After classifying the locations:", "red"))
            print("Communes\n", communes, "\nDepartements\n", departements, "\nRegions\n", regions)
            deps_to_keep, coms_to_keep, regs_to_keep = {}, {}, {}
            if len(regions) == 0 and len(departements) == 0 and len(communes) > 0:  # Simple case where there are only communes
                for name, content in communes.items():
                    coms_to_keep.update(content)

            elif len(regions) == 0 and len(departements) > 0 and len(
                    communes) == 0:  # simple case where there are only departements
                for name, content in departements.items():
                    deps_to_keep.update(content)

            elif len(regions) > 0 and len(departements) == 0 and len(communes) == 0:  # simple case where there are only regions
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

            print(colored("Relevant Locations that will be used to get stations:", "red"))
            print("communes:\n", coms_to_keep)
            print("departements:\n", deps_to_keep)
            print("regions:\n", regs_to_keep)
        print("\n-----------------------------------------------------------------------------------\n")
        dates_to_keep = get_time(query)
        print(colored("Extracted temporal expressions:", "green"))
        print(dates_to_keep)


