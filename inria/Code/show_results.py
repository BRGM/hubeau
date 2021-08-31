import requests
import json
import numpy as np
from datetime import datetime, date
from math import cos, asin, sqrt, pi
import itertools
from tabulate import tabulate
from termcolor import colored
from pprint import pprint
import pandas as pd
from location_extraction import *
from time_extraction import *


def distance(lon1, lat1, lon2, lat2):
    p = pi / 180
    a = 0.5 - cos((lat2 - lat1) * p) / 2 + cos(lat1 * p) * cos(lat2 * p) * (1 - cos((lon2 - lon1) * p)) / 2
    return 12742 * asin(sqrt(a))  # 2*R*asin...


def insee_to_bss(code_location, type_location):
    """
    Returns the BSS codes corresponding to the INSEE code
    """
    url = ""
    if type_location == 'commune':
        url = "https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/stations?code_commune={c}&format=json&size=500".format(
            c=code_location)

    elif type_location == 'departement':
        url = "https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/stations?code_departement={c}&format=json&size=500".format(
            c=code_location)
    elif type_location == "region":
        q = ",".join(code_location)
        url = "https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/stations?code_departement={c}&format=json&size=500".format(
            c=q)

    exists = json.loads(requests.get(url).text)["count"]
    if exists > 0:
        data = json.loads(requests.get(url).text)
        bss = {station["code_bss"]: {"date_debut_mesure": station["date_debut_mesure"],
                                     "date_fin_mesure": station["date_fin_mesure"]} for station in
               data["data"]}
        return bss

    else:
        return -1


def get_mesure_piezo(station, start_date=None, end_date=None):
    """
    Returns mesures corresponding to all stations in the location
    """
    url = f'{"https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/chroniques?code_bss={bss}".format(bss=station)}' + \
          f'{"&date_debut_mesure={d1}".format(d1=start_date) if start_date is not None else ""}' + \
          f'{"&date_fin_mesure={d2}&size=1".format(d2=end_date) if end_date is not None else "&size=1"}'

    response = json.loads(requests.get(url).text)
    number = response["count"]
    if number > 0:
        url = f'{"https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/chroniques?code_bss={bss}".format(bss=station)}' + \
              f'{"&date_debut_mesure={d1}".format(d1=start_date) if start_date is not None else ""}' + \
              f'{"&date_fin_mesure={d2}&size={s}".format(d2=end_date, s=number + 1) if end_date is not None else "&size={s}".format(s=number + 1)}'
        response = json.loads(requests.get(url).text)
        return {"count": response["count"], "mesures": response["data"]}
    else:
        return {"count": 0, "mesures": -1}


def get_details_from_bss(bss):
    url = "https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/stations?code_bss={c}&format=json&size=200".format(c=bss)
    exists = json.loads(requests.get(url).text)["count"]
    if exists > 0:
        data = json.loads(requests.get(url).text)
        infos = data["data"]
        return {info["code_bss"]: {"code_commune": info["code_commune_insee"],
                                   "nom_commune": info["nom_commune"],
                                   "code_departement": info["code_departement"],
                                   "long": info["geometry"]["coordinates"][0],
                                   "lat": info["geometry"]["coordinates"][1],
                                   "date_fin_mesure": info["date_fin_mesure"],
                                   "date_debut_mesure": info["date_debut_mesure"]
                                   } for info in infos}
    else:
        return -1  # bss codes do not correspond to any station


def get_closest_stations(bss, N=4):
    info = get_details_from_bss(bss)
    if info != -1:
        dep, long, lat = info[bss]["code_departement"], info[bss]["long"], info[bss]["lat"]
        dep_stations = insee_to_bss(dep, "departement")
        if len(dep_stations) <= 200:
            query = ",".join(dep_stations)
            infos = get_details_from_bss(query)
        else:
            lists = np.array_split(dep_stations, int(len(dep_stations) / 200))
            infos = [get_details_from_bss(",".join(l)) for l in lists]
            infos = list(itertools.chain.from_iterable(infos))

        dist = {}
        for station, _ in infos.items():
            long_, lat_, date = _["long"], _["lat"], _["date_fin_mesure"]
            if date is not None:
                last_mesure_date = date.fromisoformat(date)

                if last_mesure_date >= datetime(2005, 1, 1):  # the last mesure date must be later than 01-01-2005
                    dist[station] = distance(long, lat, long_, lat_)

        sortd = dict(sorted(dist.items(), key=lambda item: item[1]))
        return list(sortd.keys())[: min(N, len(sortd.keys()))]

    return -1


def format_table(mesures, nb_mesures):
    headers = ["Nom", "Code station", "Nombre de mesures", "Niveau enregistré (altitude / mer)",
               "Profondeur de la nappe (/ au sol)", "Date d'enregistrement"]
    table_data = []
    for location, data_ in mesures.items():
        s, n1, n2, d = "", "", "", ""
        for station, data in data_.items():
            s += station
            if data == -1:
                table_data.append([station, 0, "-", "-", "-"])
            else:
                for mesure in data['mesures'][:nb_mesures]:
                    s += "\n"
                    n1 += "\n" + str(mesure["niveau_nappe_eau"])
                    n2 += "\n" + str(mesure["profondeur_nappe"])
                    d += "\n" + mesure["date_mesure"]
        table_data.append([location, s, data["count"], n1, n2, d])

    return tabulate(table_data, headers, tablefmt="grid")


def get_table_data_bss(bss_codes, dates):
    details_ = get_details_from_bss(",".join(bss_codes))
    data = []
    if details_ != -1:
        if len(dates) > 0:
            for date in dates:
                data_ = {}
                for code, details in details_.items():
                    result = get_mesure_piezo(code, start_date=date.get("start_date", None),
                                              end_date=date.get("end_date", None))
                    if details["code_commune"] not in data_:
                        data_[details["code_commune"]] = {"data": {}, "name": details["nom_commune"]}

                    data_[details["code_commune"]]["data"][code] = {"date_debut_mesure": details["date_debut_mesure"],
                                                                    "date_fin_mesure": details["date_fin_mesure"],
                                                                    "mesures": result["mesures"],
                                                                    "count": result["count"]
                                                                    }
                _ = {"data": data_,
                     "start_date": date.get("start_date", None), "end_date": date.get("end_date", None)}
                data.append(_)
        else:
            data_ = {}
            for code, details in details_.items():
                result = get_mesure_piezo(code)
                if details["code_commune"] not in data_:
                    data_[details["code_commune"]] = {"data": {}, "name": details["nom_commune"]}
                data_[details["code_commune"]]["data"][code] = {"date_debut_mesure": details["date_debut_mesure"],
                                                                "date_fin_mesure": details["date_fin_mesure"],
                                                                "mesures": result["mesures"],
                                                                "count": result["count"]
                                                                }
            _ = {"data": data_}
            data.append(_)

    return data


def get_table_data_locations(coms_to_keep, deps_to_keep, regs_to_keep, dates_to_keep):
    data_ = []
    stations = {}
    if len(dates_to_keep) > 0:
        for date in dates_to_keep:
            data = {}
            for gran, gran_dict in {"commune": coms_to_keep, "departement": deps_to_keep,
                                    "region": regs_to_keep}.items():
                for loc, details in gran_dict.items():
                    data[loc] = {}
                    code = details.get("codesDepartements", loc)
                    bss = insee_to_bss(code, gran)
                    stations[loc] = {}
                    if bss == -1:
                        data[loc]["data"] = -1
                        data[loc]["name"] = details['nom']
                        stations[loc]["nb_stations"] = 0
                        stations[loc]["stations"] = []
                        stations[loc]["name"] = details['nom']
                    else:
                        for station in bss:
                            result = get_mesure_piezo(station, start_date=date.get("start_date", None),
                                                      end_date=date.get("end_date", None))
                            bss[station]["mesures"] = result["mesures"]
                            bss[station]["count"] = result["count"]

                        data[loc]["data"] = bss
                        data[loc]["name"] = details['nom']

                        stations[loc]["nb_stations"] = len(bss)
                        stations[loc]["stations"] = list(bss.keys())
                        stations[loc]["name"] = details['nom']

            _ = {"data": data,
                 "start_date": date.get("start_date", None), "end_date": date.get("end_date", None)}
            data_.append(_)
    else:
        data = {}
        for gran, gran_dict in {"commune": coms_to_keep, "departement": deps_to_keep,
                                "region": regs_to_keep}.items():
            for loc, details in gran_dict.items():
                data[loc] = {}
                code = details.get("codesDepartements", loc)
                bss = insee_to_bss(code, gran)
                stations[loc] = {}
                if bss == -1:
                    data[loc]["data"] = -1
                    data[loc]["name"] = details['nom']
                    stations[loc]["nb_stations"] = 0
                    stations[loc]["stations"] = []
                    stations[loc]["name"] = details['nom']
                else:
                    for station in bss:
                        result = get_mesure_piezo(station)
                        bss[station]["mesures"] = result["mesures"]
                        bss[station]["count"] = result["count"]

                    data[loc]["data"] = bss
                    data[loc]["name"] = details['nom']
                    stations[loc]["nb_stations"] = len(bss)
                    stations[loc]["stations"] = list(bss.keys())
                    stations[loc]["name"] = details['nom']
        _ = {"data": data}
        data_.append(_)

    return data_, stations


def format_table_general(mesures, nb_mesures=None):
    headers = ["Lieu", "Code station", "Nombre de mesures", "Date plus ancienne", "Date plus récente",
               "Niveau enregistré (altitude / mer)\nMIN", "Niveau enregistré (altitude / mer)\nMAX",
               "Niveau enregistré (altitude / mer)\nAVG",
               "Profondeur de la nappe (/ au sol)\nMIN", "Profondeur de la nappe (/ au sol)\nMAX",
               "Profondeur de la nappe (/ au sol)\nAVG"]
    table_data = []
    for location, data_ in mesures.items():
        if data_["data"] == -1:
            table_data.append([data_["name"] + "(" + location + ")", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"])
        else:
            s, c, d1, d2, n1_max, n1_min, n1_avg, n2_max, n2_min, n2_avg = "", "", "", "", "", "", "", "", "", ""
            for station, data in data_['data'].items():
                s += station + "\n"
                if data["mesures"] == -1:
                    c += "0" + "\n"
                    d1 += "-" + "\n"
                    d2 += "-" + "\n"
                    n1_min += "-" + "\n"
                    n1_max += "-" + "\n"
                    n1_avg += "-" + "\n"
                    n2_min += "-" + "\n"
                    n2_max += "-" + "\n"
                    n2_avg += "-" + "\n"
                else:
                    n1_, n2_, dates = [], [], []
                    nb_mesures = data["count"] if nb_mesures is None else nb_mesures
                    for mesure in data['mesures']:
                        n1_.append(mesure["niveau_nappe_eau"])
                        n2_.append(mesure["profondeur_nappe"])
                        dates.append(date.fromisoformat(mesure["date_mesure"]))

                    n1_, n2_ = np.array(n1_), np.array(n2_)
                    sortd = np.argsort(dates)[-nb_mesures:]
                    c += str(min(data["count"], nb_mesures)) + "\n"
                    d1 += str(dates[sortd[0]]) + "\n"
                    d2 += str(dates[sortd[-1]]) + "\n"
                    n1_min += str(min(n1_[sortd])) + "\n"
                    n1_max += str(max(n1_[sortd])) + "\n"
                    n1_avg += str(sum(n1_[sortd]) / nb_mesures) + "\n"
                    n2_min += str(min(n2_[sortd])) + "\n"
                    n2_max += str(max(n2_[sortd])) + "\n"
                    n2_avg += str(sum(n2_[sortd]) / nb_mesures) + "\n"

            table_data.append(
                [data_.get("name", '') + "(" + location + ")", s, c, d1, d2, n1_min, n1_max, n1_avg, n2_min, n2_max,
                 n2_avg])

    return tabulate(table_data, headers, tablefmt="grid")


def format_dict_general(mesures, nb_mesures=None):
    result = []
    for location, data_ in mesures.items():
        dict_data = {"location": data_["name"] + "(" + location + ")"}
        if data_["data"] == -1:
            dict_data["station"] = "-"
            dict_data["nb_mesures"] = "-"
            dict_data["earliest_date"] = "-"
            dict_data["latest_date"] = "-"
            dict_data["min_sea"] = "-"
            dict_data["max_sea"] = "-"
            dict_data["avg_sea"] = "-"
            dict_data["last_sea"] = "-"
            dict_data["min_ground"] = "-"
            dict_data["max_ground"] = "-"
            dict_data["avg_ground"] = "-"
            dict_data["last_ground"] = "-"

            result.append(dict_data)
        else:
            for station, data in data_['data'].items():
                dict_data["station"] = station
                if data["mesures"] == -1:
                    dict_data["nb_mesures"] = "0"
                    dict_data["earliest_date"] = "-"
                    dict_data["latest_date"] = "-"
                    dict_data["min_sea"] = "-"
                    dict_data["max_sea"] = "-"
                    dict_data["avg_sea"] = "-"
                    dict_data["last_sea"] = "-"
                    dict_data["min_ground"] = "-"
                    dict_data["max_ground"] = "-"
                    dict_data["avg_ground"] = "-"
                    dict_data["last_ground"] = "-"

                else:
                    n1_, n2_, dates = [], [], []
                    nb_mesures = data["count"] if nb_mesures is None else nb_mesures
                    for mesure in data['mesures']:
                        n1_.append(mesure["niveau_nappe_eau"])
                        n2_.append(mesure["profondeur_nappe"])
                        dates.append(date.fromisoformat(mesure["date_mesure"]))

                    n1_, n2_ = np.array(n1_), np.array(n2_)
                    sortd = np.argsort(dates)[-nb_mesures:]
                    dict_data["nb_mesures"] = str(min(data["count"], nb_mesures))
                    dict_data["earliest_date"] = str(dates[sortd[0]])
                    dict_data["latest_date"] = str(dates[sortd[-1]])
                    dict_data["min_sea"] = str(min(n1_[sortd]))
                    dict_data["max_sea"] = str(max(n1_[sortd]))
                    dict_data["avg_sea"] = str(sum(n1_[sortd]) / nb_mesures)
                    dict_data["last_sea"] = str(n1_[sortd[-1]])
                    dict_data["min_ground"] = str(min(n2_[sortd]))
                    dict_data["max_ground"] = str(max(n2_[sortd]))
                    dict_data["avg_ground"] = str(sum(n2_[sortd]) / nb_mesures)
                    dict_data["last_ground"] = str(n2_[sortd[-1]])

                result.append(dict_data.copy())
    return result


def show_results(query, flair_model, nlp, heideltime_parser, nb_mesures, all_locations, demonym_dict, ip_address):
    final_result = {}
    dates_to_keep, normalized_query = get_time(query, heideltime_parser)
    final_result["temporal_expressions"] = dates_to_keep
    bss_codes = get_bss(normalized_query)
    if len(bss_codes) > 0:
        final_result["BSS_codes"] = bss_codes
        data = get_table_data_bss(bss_codes, dates_to_keep)
        final_result["type"] = "bss"
    else:

        locations = get_locations(normalized_query, all_locations, demonym_dict,
                                  flair_model, nlp,
                                  ip_address=ip_address)
        final_result["all_location_data"] = locations

        communes, departements, regions = classify(normalized_query, locations, nlp)

        final_result["classified_location_data"] = {
            "communes": communes,
            "departements": departements,
            "regions": regions
        }

        coms_to_keep, deps_to_keep, regs_to_keep = get_relevant(communes, departements, regions)
        final_result["relevant_location_data"] = {
            "communes": coms_to_keep,
            "departements": deps_to_keep,
            "regions": regs_to_keep
        }

        data, stations = get_table_data_locations(coms_to_keep, deps_to_keep, regs_to_keep, dates_to_keep)
        final_result["stations"] = stations
        final_result["type"] = "loc"

    final_result["recaps"] = []
    for data_ in data:
        dict_general = format_dict_general(data_["data"], nb_mesures)
        final_result["recaps"].append(
            {"start_date": data_.get('start_date', ''), "end_date": data_.get('end_date', ''), "recap": dict_general})

    return final_result

# def get_closest_stations(bss, N=4):
#     info = get_coordinates(bss)
#     if info != -1:
#         dep, long, lat = info["code_departement"], info["long"], info["lat"]
#         dep_stations = insee_to_bss(dep, "departement")
#         dist = {}
#
#         for station in dep_stations:
#             _ = get_coordinates(station)
#             long_, lat_, date = _["long"], _["lat"], _["date_fin_mesure"]
#             if date is not None:
#                 date = date.split("-")
#                 last_mesure_date = datetime(int(date[0]), int(date[1]), int(date[2]))
#
#                 if last_mesure_date >= datetime(2005, 1, 1):  # the last mesure date must be later than 01-01-2005
#                     dist[station] = distance(long, lat, long_, lat_)
#
#         sortd = dict(sorted(dist.items(), key=lambda item: item[1]))
#         return list(sortd.keys())[: min(N, len(sortd.keys()))]
#
#     return -1
# def get_table_data_bss2(bss_codes, start_date=None, end_date=None):
#     details_ = get_details_from_bss(",".join(bss_codes))
#     data = {}
#     if details_ != -1:
#         for code, details in details_.items():
#             result = get_mesure_piezo(code, start_date=start_date, end_date=end_date)
#             if details["code_commune"] not in data:
#                 data[details["code_commune"]] = {"data":{}}
#             data[details["code_commune"]]["data"][code] = {"date_debut_mesure": details["date_debut_mesure"],
#                                                    "date_fin_mesure": details["date_fin_mesure"],
#                                                    "mesures": result["mesures"],
#                                                    "count": result["count"]
#                                                    }
#     return data
# def get_table_data_locations2(coms_to_keep, deps_to_keep, regs_to_keep, start_date=None, end_date=None):
#     data = {}
#     for gran, gran_dict in {"commune": coms_to_keep, "departement": deps_to_keep, "region": regs_to_keep}.items():
#         for loc, details in gran_dict.items():
#             data[loc] = {}
#             code = details.get("codesDepartements", loc)
#             bss = insee_to_bss(code, gran)
#             if bss == -1:
#                 data[loc]["data"] = -1
#                 data[loc]["name"] = details['nom']
#             else:
#
#                 for station in bss:
#                     result = get_mesure_piezo(station, start_date=start_date, end_date=end_date)
#                     bss[station]["mesures"] = result["mesures"]
#                     bss[station]["count"] = result["count"]
#
#                 data[loc]["data"] = bss
#                 data[loc]["name"] = details['nom']
#     return data
