from location_extraction import *
from time_extraction import *
import pandas as pd

# stanza.download('fr') # run once


query = "niveau de la nappe a paris aujourd'hui"
MODEL_PATH = "NER_tool/stacked-standard-flair-150-wikiner.pt"
##################################################################################

communes_ = pd.read_csv("demonyms/Data/commune2021.csv", encoding='utf-8')["LIBELLE"].to_numpy().reshape(-1)
all_communes = list(map(lambda x: x.lower(), np.unique(communes_)))

with requests.get("https://geolocation-db.com/json") as url:
    data = json.loads(url.text)
    ip_address = data["IPv4"]

bss = get_bss(query)
if bss == -1:
    bss = []
    locations = get_locations(query, all_communes, MODEL_PATH, ip_address=ip_address)
    print("Extracted locations: \n", locations)
    __ = {"commune": {}, "departement": {}, "region": {}}
    for loc in locations:
        _ = get_insee(loc)
        __[_["type"]][loc] = _["codes"]
    communes, departements, regions = __["commune"], __["departement"], __["region"]
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

    print("Relevant Locations:")
    print("communes:\n", coms_to_keep)
    print("departements:\n", deps_to_keep)
    print("regions:\n", regs_to_keep)

dates_to_keep = get_time(query)
print("Extracted temporal expressions:")
print(dates_to_keep)


