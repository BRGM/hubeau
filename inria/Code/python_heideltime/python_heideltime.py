#    Python Wrapper to call HeidelTime-standalone from Python
#    Copyright (C) 2019  Philip Hausner
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU General Public License as published by
#    the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU General Public License for more details.
#
#    You should have received a copy of the GNU General Public License
#    along with this program.  If not, see <https://www.gnu.org/licenses/>.

import subprocess
import tempfile
from .config_Heideltime import Heideltime_path

# calls the HeidelTime standalone application
# documentation: https://gate.ac.uk/gate/plugins/Tagger_GATE-Time/doc/HeidelTime-Standalone-Manual.pdf
class Heideltime:
    # initialize most important settings
    # all parameters are explained in the HeidelTime standalone documentation
    def __init__(self):
        # assure that path to HeidelTime is in the correct format
        if Heideltime_path is None:
            raise ValueError('Please specify the path to HeidelTime-standalone in config_Heideltime.py.')
        elif Heideltime_path[-1] == '/':
            self.heidel_path = Heideltime_path[:-1]
        else:
            self.heidel_path = Heideltime_path
        self.document_time = None
        self.language = 'ENGLISH'
        self.doc_type = 'NARRATIVES'
        self.output_type = 'TIMEML'
        self.encoding = 'UTF-8'
        self.config_file = self.heidel_path + '/config.props'

        # this features are not tested and might not work
        self.verbosity = False
        self.interval_tagger = False
        self.locale = None
        self.pos_tagger = None

    # called document creation time or dct in HeidelTime
    def set_document_time(self, document_time):
        self.document_time = document_time

    def set_language(self, language):
        self.language = language

    # called Type in HeidelTime
    def set_document_type(self, doc_type):
        self.doc_type = doc_type

    def set_output_type(self, output_type):
        self.output_type = output_type

    def set_encoding(self, encoding):
        self.encoding = encoding

    # this needs a full path
    def set_config_file(self, config_file):
        self.config_file = config_file

    # True / False
    def set_verbosity(self, verbosity):
        self.verbosity = verbosity

    # True / False
    def set_interval_tagger(self, interval_tagger):
        self.interval_tagger = interval_tagger

    def set_locale(self, locale):
        self.locale = locale

    def set_pos_tagger(self, pos_tagger):
        self.pos_tagger = pos_tagger

    def parse(self, document):
        # temporary file since HeidelTime standalone needs input file
        temp = tempfile.NamedTemporaryFile()
        temp.write(document.encode('utf-8'))
        temp.flush()
        # create string to execute in bash shell
        inputs = ['java', '-jar', self.heidel_path + '/de.unihd.dbs.heideltime.standalone.jar', \
                  '-l', self.language, '-t', self.doc_type, '-o', self.output_type,
                  '-c', self.config_file, '-e', self.encoding]
        # add all optional arguments
        if self.document_time:
            inputs.append('-dct')
            inputs.append(self.document_time)
        if self.verbosity:
            inputs.append('-v')
        if self.interval_tagger:
            inputs.append('-it')
        if self.locale:
            inputs.append('-locale')
            inputs.append(self.locale)
        if self.pos_tagger:
            inputs.append('-pos')
            inputs.append(self.pos_tagger)
        # lastly append the temporary file
        inputs.append(temp.name)
        # execute string in the bash shell
        return subprocess.check_output(inputs).decode('utf-8')
