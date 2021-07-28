from python_heideltime import Heideltime
import re
import xml.dom.minidom
from datetime import datetime, timedelta
import isodate
import calendar


def preprocess_date(date):
    """
    If the year in date > current year, replaces it by current year
    If date is 29 february and the year is not a leap year, replace by 28 february
    Return string format yyyy-mm-dd
    """
    today_year = datetime.now().year

    match = re.match('([0-9]{4}-02)-29', date)
    if match:
        d = isodate.parse_date(match.group(1))
        if today_year < d.year:
            d = d.replace(year=today_year)
        d = d.replace(day=calendar.monthrange(d.year, d.month)[1])

        return d

    d = isodate.parse_date(date)
    if today_year < d.year:
        d = d.replace(year=today_year)
    return d


# Heideltime
def get_time(query):
    """
    Extract dates from query
    """
    query = re.sub(r"\.", "-", query)
    print(query)
    heideltime_parser = Heideltime()
    heideltime_parser.set_document_type('NEWS')
    heideltime_parser.set_language('FRENCH')
    heideltime_parser.set_interval_tagger('True')
    heideltime_parser.set_document_time(datetime.now().strftime("%Y-%m-%d"))
    parsed = heideltime_parser.parse(query)
    # dom = xml.dom.minidom.parseString(parsed)
    # pretty_xml_as_string = dom.toprettyxml()
    #
    regex1 = "<TIMEX3INTERVAL earliestBegin=\"(.*?)\" latestBegin=\".*?\"" \
             " earliestEnd=\".*?\" latestEnd=\"(.*?)\">(.*?)</TIMEX3INTERVAL>"

    regex = "<TIMEX3 tid=\".*?\" type=\"(.*?)\" value=\"(.*?)\">(.*?)</TIMEX3>"

    intervals = re.findall(regex1, parsed)
    normalized_q = query
    result = []

    if len(intervals) > 0:
        for start_date, end_date, exp in intervals:
            start_date_ = preprocess_date(start_date)
            end_date_ = preprocess_date(end_date)

            if end_date_ > start_date_:
                result.append(
                    {"start_date": start_date_.strftime("%Y-%m-%d"), "end_date": end_date_.strftime("%Y-%m-%d")})

                interval_exp = re.sub("<TIMEX3 .*?>|</TIMEX3>", "", exp)
                normalized_q = re.sub(interval_exp, f'du {start_date_} au {end_date_}', normalized_q)

        return result, normalized_q

    dates = re.findall(regex, parsed)

    if len(dates) > 0:
        for type, date, exp in dates:
            start_date_, end_date_ = "", ""
            if type == 'DATE':
                start_date_ = preprocess_date(date)
                match = re.search(f"depuis {exp}", query)
                if match:
                    end_date_ = datetime.now()
                    result.append(
                        {"start_date": start_date_.strftime("%Y-%m-%d"), "end_date": end_date_.strftime("%Y-%m-%d")})

                else:
                    match = re.match(r"^[0-9]{4}-[0-9]{2}-[0-9]{2}$", date)
                    if match:
                        end_date_ = start_date_ + timedelta(days=1)
                        result.append(
                            {"start_date": start_date_.strftime("%Y-%m-%d"),
                             "end_date": end_date_.strftime("%Y-%m-%d")})

                    else:
                        match = re.match(r"^[0-9]{4}-[0-9]{2}$", date)
                        if match:
                            end_date_ = start_date_.replace(
                                day=calendar.monthrange(start_date_.year, start_date_.month)[1])
                            result.append(
                                {"start_date": start_date_.strftime("%Y-%m-%d"),
                                 "end_date": end_date_.strftime("%Y-%m-%d")})

                        else:
                            match = re.match(r"^[0-9]{4}$", date)
                            if match:
                                end_date_ = start_date_.replace(day=31, month=12)
                                result.append(
                                    {"start_date": start_date_.strftime("%Y-%m-%d"),
                                     "end_date": end_date_.strftime("%Y-%m-%d")})

                            else:
                                match = re.match(r"^[0-9]{4}-W[0-9]{2}$", date)
                                if match:
                                    end_date_ = start_date_ + timedelta(days=7)
                                    result.append(
                                        {"start_date": start_date_.strftime("%Y-%m-%d"),
                                         "end_date": end_date_.strftime("%Y-%m-%d")})

            if type == 'DURATION':
                end_date_ = datetime.now()
                start_date_ = end_date_ - isodate.parse_duration(date)
                result.append(
                    {"start_date": start_date_.strftime("%Y-%m-%d"), "end_date": end_date_.strftime("%Y-%m-%d")})

            normalized_q = re.sub(exp, f'du {start_date_} au {end_date_}', normalized_q)

        return result, normalized_q

    return result, query
