from python_heideltime import Heideltime
import re


#Heideltime
def get_time(query):
    """
    Extract dates from query
    """

    heideltime_parser = Heideltime()
    heideltime_parser.set_document_type('NEWS')
    heideltime_parser.set_language('FRENCH')
    heideltime_parser.set_interval_tagger('True')
    result = heideltime_parser.parse(query)
    regex = "<TIMEX3 tid=\".*?\" type=\"(.*?)\" value=\"(.*?)\">(.*?)</TIMEX3>"
    return re.findall(regex, result)
