#!/bin/sh

mkdir cmd
mkdir lib
mkdir bin
mkdir doc
echo ''

if [ -r tree-tagger-linux-3.2.3.tar.gz ]
then
    tar -zxf tree-tagger-linux-3.2.3.tar.gz
    echo 'TreeTagger version for PC-Linux installed.'
fi

if [ -r tree-tagger-MacOSX-3.2.3.tar.gz ]
then
    tar -zxf tree-tagger-MacOSX-3.2.3.tar.gz
    echo 'TreeTagger version for Mac OS-X installed.'
fi

if [ -r tree-tagger-ARM32-3.2.tar.gz ]
then
    tar -zxf tree-tagger-ARM32-3.2.tar.gz
    echo 'TreeTagger version for ARM Linux 32 bit installed.'
fi

if [ -r tree-tagger-ARM64-3.2.tar.gz ]
then
    tar -zxf tree-tagger-ARM64-3.2.tar.gz
    echo 'TreeTagger version for ARM Linux 64 bit (HF) installed.'
fi

if [ -r tree-tagger-ARM32-Android-3.2.2.tar.gz ]
then
    tar -zxf tree-tagger-ARM32-Android-3.2.2.tar.gz
    echo 'TreeTagger version for ARM Linux 32 bit (Android) installed.'
fi

if [ -r tagger-scripts.tar.gz ] 
then
    gzip -cd tagger-scripts.tar.gz | tar -xf -
    chmod +x cmd/*
    echo 'Tagging scripts installed.'
fi

if [ -r estonian.par.gz ] 
then
    gzip -cd estonian.par.gz > lib/estonian.par
    echo 'Estonian parameter file installed.'
fi

if [ -r finnish.par.gz ] 
then
    gzip -cd finnish.par.gz > lib/finnish.par
    echo 'Finnish parameter file installed.'
fi

if [ -r lithuanian.par.gz ] 
then
    gzip -cd lithuanian.par.gz > lib/lithuanian.par
    echo 'Lithuanian parameter file installed.'
fi

if [ -r greek.par.gz ] 
then
    gzip -cd greek.par.gz > lib/greek.par
    echo 'Greek parameter file installed.'
fi

if [ -r german.par.gz ]
then
    gzip -cd german.par.gz > lib/german.par
    echo 'German parameter file installed.'
fi

if [ -r german-spoken.par.gz ]
then
    gzip -cd german-spoken.par.gz > lib/german-spoken.par
    echo 'Spoken German parameter file installed.'
fi

if [ -r korean.par.gz ]
then
    gzip -cd korean.par.gz > lib/korean.par
    echo 'Korean parameter file installed.'
fi

if [ -r middle-high-german.par.gz ]
then
    gzip -cd middle-high-german.par.gz > lib/middle-high-german.par
    echo 'Middle High German parameter file installed.'
fi

if [ -r german-chunker.par.gz ] 
then
    gzip -cd german-chunker.par.gz > lib/german-chunker.par
    echo 'German chunker parameter file installed.'
fi

if [ -r english.par.gz ]
then
    gzip -cd english.par.gz > lib/english.par
    echo 'English parameter file installed.'
fi

if [ -r english-chunker.par.gz ] 
then
    gzip -cd english-chunker.par.gz > lib/english-chunker.par
    echo 'English chunker parameter file installed.'
fi

if [ -r english-bnc.par.gz ]
then
    gzip -cd english-bnc.par.gz > lib/english.par
    echo 'English BNC parameter file installed.'
fi

if [ -r spanish-chunker.par.gz ] 
then
    gzip -cd spanish-chunker.par.gz > lib/spanish-chunker.par
    echo 'Spanish chunker parameter file installed.'
fi

if [ -r french.par.gz ]
then
    gzip -cd french.par.gz > lib/french.par
    echo 'French parameter file installed.'
fi

if [ -r french-spoken.par.gz ]
then
    gzip -cd french-spoken.par.gz > lib/french-spoken.par
    echo 'Spoken French parameter file installed.'
fi

if [ -r old-french.par.gz ]
then
    gzip -cd old-french.par.gz > lib/old-french.par
    echo 'Old French parameter file installed.'
fi

if [ -r french-chunker.par.gz ] 
then
    gzip -cd french-chunker.par.gz > lib/french-chunker.par
    echo 'French chunker parameter file installed.'
fi

if [ -r romanian.par.gz ]
then
    gzip -cd romanian.par.gz > lib/romanian.par
    echo 'Romanian parameter file installed.'
fi

if [ -r italian.par.gz ]
then
    gzip -cd italian.par.gz > lib/italian.par
    echo 'Italian parameter file installed.'
fi

if [ -r italian2.par.gz ]
then
    gzip -cd italian2.par.gz > lib/italian.par
    echo 'alternative Italian parameter file installed.'
fi

if [ -r bulgarian.par.gz ]
then
    gzip -cd bulgarian.par.gz > lib/bulgarian.par
    echo 'Bulgarian parameter file installed.'
fi

if [ -r catalan.par.gz ]
then
    gzip -cd catalan.par.gz > lib/catalan.par
    echo 'Catalan parameter file installed.'
fi

if [ -r polish.par.gz ]
then
    gzip -cd polish.par.gz > lib/polish.par
    echo 'Polish parameter file installed.'
fi

if [ -r czech.par.gz ]
then
    gzip -cd czech.par.gz > lib/czech.par
    echo 'Czech parameter file installed.'
fi

if [ -r portuguese.par.gz ]
then
    gzip -cd portuguese.par.gz > lib/portuguese.par
    echo 'Portuguese parameter file installed.'
fi

if [ -r portuguese2.par.gz ]
then
    gzip -cd portuguese2.par.gz > lib/portuguese2.par
    echo 'Alternative Portuguese parameter file installed.'
fi

if [ -r portuguese-finegrained.par.gz ]
then
    gzip -cd portuguese-finegrained.par.gz > lib/portuguese-finegrained.par
    echo 'Portuguese parameter file with fine-grained tagset installed.'
fi

if [ -r russian.par.gz ]
then
    gzip -cd russian.par.gz > lib/russian.par
    echo 'Russian parameter file installed.'
fi

if [ -r spanish.par.gz ]
then
    gzip -cd spanish.par.gz > lib/spanish.par
    echo 'Spanish parameter file installed.'
fi

if [ -r spanish-ancora.par.gz ]
then
    gzip -cd spanish-ancora.par.gz > lib/spanish-ancora.par
    echo 'Spanish Ancora parameter file installed.'
fi

if [ -r galician.par.gz ]
then
    gzip -cd galician.par.gz > lib/galician.par
    echo 'Galician parameter file installed.'
fi

if [ -r hungarian.par.gz ]
then
    gzip -cd hungarian.par.gz > lib/hungarian.par
    echo 'Hungarian parameter file installed.'
fi

if [ -r persian.par.gz ]
then
    gzip -cd persian.par.gz > lib/persian.par
    echo 'Persian parameter file installed.'
fi

if [ -r persian-coarse.par.gz ]
then
    gzip -cd persian-coarse.par.gz > lib/persian-coarse.par
    echo 'Persian parameter file with coarse tagset installed.'
fi

if [ -r danish.par.gz ]
then
    gzip -cd danish.par.gz > lib/danish.par
    echo 'Danish parameter file installed.'
fi

if [ -r swedish.par.gz ]
then
    gzip -cd swedish.par.gz > lib/swedish.par
    echo 'Swedish parameter file installed.'
fi

if [ -r norwegian.par.gz ]
then
    gzip -cd norwegian.par.gz > lib/norwegian.par
    echo 'Norwegian (Bokmaal) parameter file installed.'
fi

if [ -r dutch.par.gz ]
then
    gzip -cd dutch.par.gz > lib/dutch.par
    echo 'Dutch parameter file installed.'
fi

if [ -r dutch2.par.gz ]
then
    gzip -cd dutch2.par.gz > lib/dutch.par
    echo 'Dutch parameter file installed.'
fi

if [ -r swahili.par.gz ]
then
    gzip -cd swahili.par.gz > lib/swahili.par
    echo 'Swahili parameter file installed.'
fi

if [ -r slovak.par.gz ]
then
    gzip -cd slovak.par.gz > lib/slovak.par
    echo 'Slovak parameter file installed.'
fi

if [ -r slovak2.par.gz ]
then
    gzip -cd slovak2.par.gz > lib/slovak.par
    echo 'Slovak parameter file (full tagset) installed.'
fi

if [ -r slovenian.par.gz ]
then
    gzip -cd slovenian.par.gz > lib/slovenian.par
    echo 'Slovenian parameter file installed.'
fi

if [ -r latin.par.gz ]
then
    gzip -cd latin.par.gz > lib/latin.par
    echo 'Latin parameter file installed.'
fi

if [ -r latinIT.par.gz ]
then
    gzip -cd latinIT.par.gz > lib/latin.par
    echo 'Latin Index Thomisticus parameter file installed.'
fi

if [ -r ancient-greek-beta.par.gz ]
then
    gzip -cd ancient-greek-beta.par.gz > lib/ancient-greek-beta.par
    echo 'Ancient Greek parameter file (beta encoding) installed.'
fi

if [ -r ancient-greek.par.gz ]
then
    gzip -cd ancient-greek.par.gz > lib/ancient-greek.par
    echo 'Ancient Greek parameter file installed.'
fi


# installation of uncompressed files

if [ -r tree-tagger-linux-3.2.3.tar ]
then
    tar -xf tree-tagger-linux-3.2.3.tar
    echo 'TreeTagger version for PC-Linux installed.'
fi

if [ -r tree-tagger-MacOSX-3.2.3.tar ]
then
    tar -xf tree-tagger-MacOSX-3.2.3.tar
    echo 'TreeTagger version for Mac OS-X installed.'
fi

if [ -r tree-tagger-ARM32-3.2.tar ]
then
    tar -xf tree-tagger-ARM32-3.2.tar
    echo 'TreeTagger version for ARM Linux 32 bit installed.'
fi

if [ -r tree-tagger-ARM64-3.2.tar ]
then
    tar -xf tree-tagger-ARM64-3.2.tar
    echo 'TreeTagger version for ARM Linux 64 bit (HF) installed.'
fi

if [ -r tree-tagger-ARM32-Android-3.2.2.tar ]
then
    tar -xf tree-tagger-ARM32-Android-3.2.2.tar
    echo 'TreeTagger version for ARM Linux 32 bit (Android) installed.'
fi

if [ -r tagger-scripts.tar ] 
then
    tar -xf tagger-scripts.tar
    chmod +x cmd/*
    echo 'Tagging scripts installed.'
fi

if [ -r estonian.par ] 
then
    mv estonian.par lib/estonian.par
    echo 'Estonian parameter file installed.'
fi

if [ -r finnish.par ] 
then
    mv finnish.par lib/finnish.par
    echo 'Finnish parameter file installed.'
fi

if [ -r lithuanian.par ] 
then
    mv lithuanian.par lib/lithuanian.par
    echo 'Lithuanian parameter file installed.'
fi

if [ -r greek.par ] 
then
    mv greek.par lib/greek.par
    echo 'Greek parameter file installed.'
fi

if [ -r german.par ]
then
    mv german.par lib/german.par
    echo 'German parameter file installed.'
fi

if [ -r german-spoken.par ]
then
    mv german-spoken.par lib/german-spoken.par
    echo 'Spoken German parameter file installed.'
fi

if [ -r korean.par ]
then
    mv korean.par lib/korean.par
    echo 'Korean parameter file installed.'
fi

if [ -r middle-high-german.par ]
then
    mv middle-high-german.par lib/middle-high-german.par
    echo 'Middle High German parameter file installed.'
fi

if [ -r german-chunker.par ] 
then
    mv german-chunker.par lib/german-chunker.par
    echo 'German chunker parameter file installed.'
fi

if [ -r english.par ]
then
    mv english.par lib/english.par
    echo 'English parameter file installed.'
fi

if [ -r english-bnc.par ]
then
    mv english-bnc.par lib/english.par
    echo 'English BNC parameter file installed.'
fi

if [ -r english-chunker.par ] 
then
    mv english-chunker.par lib/english-chunker.par
    echo 'English chunker parameter file installed.'
fi

if [ -r spanish-chunker.par ] 
then
    mv spanish-chunker.par lib/spanish-chunker.par
    echo 'Spanish chunker parameter file installed.'
fi

if [ -r french.par ]
then
    mv french.par lib/french.par
    echo 'French parameter file installed.'
fi

if [ -r french-spoken.par ]
then
    mv french-spoken.par lib/french-spoken.par
    echo 'Spoken French parameter file installed.'
fi

if [ -r old-french.par ]
then
    mv old-french.par lib/old-french.par
    echo 'Old French parameter file installed.'
fi

if [ -r french-chunker.par ] 
then
    mv french-chunker.par lib/french-chunker.par
    echo 'French chunker parameter file installed.'
fi

if [ -r romanian.par ]
then
    mv romanian.par lib/romanian.par
    echo 'Romanian parameter file installed.'
fi

if [ -r italian.par ]
then
    mv italian.par lib/italian.par
    echo 'Italian parameter file installed.'
fi

if [ -r italian.par2 ]
then
    mv italian.par2 lib/italian.par
    echo 'alternative Italian parameter file installed.'
fi

if [ -r bulgarian.par ]
then
    mv bulgarian.par lib/bulgarian.par
    echo 'Bulgarian parameter file installed.'
fi

if [ -r catalan.par ]
then
    mv catalan.par lib/catalan.par
    echo 'Catalan parameter file installed.'
fi

if [ -r polish.par ]
then
    mv polish.par lib/polish.par
    echo 'Polish parameter file installed.'
fi

if [ -r czech.par ]
then
    mv czech.par lib/czech.par
    echo 'Czech parameter file installed.'
fi

if [ -r portuguese.par ]
then
    mv portuguese.par lib/portuguese.par
    echo 'Portuguese parameter file installed.'
fi

if [ -r portuguese2.par ]
then
    mv portuguese2.par lib/portuguese2.par
    echo 'Alternative Portuguese parameter file installed.'
fi

if [ -r portuguese-finegrained.par ]
then
    mv portuguese-finegrained.par lib/portuguese-finegrained.par
    echo 'Portuguese parameter file with fine-grained tagset installed.'
fi

if [ -r russian.par ]
then
    mv russian.par lib/russian.par
    echo 'Russian parameter file installed.'
fi

if [ -r spanish.par ]
then
    mv spanish.par lib/spanish.par
    echo 'Spanish parameter file installed.'
fi

if [ -r spanish-ancora.par ]
then
    mv spanish-ancora.par lib/spanish-ancora.par
    echo 'Spanish Ancora parameter file installed.'
fi

if [ -r galician.par ]
then
    mv galician.par lib/galician.par
    echo 'Galician parameter file installed.'
fi

if [ -r hungarian.par ]
then
    mv hungarian.par lib/hungarian.par
    echo 'Hungarian parameter file installed.'
fi

if [ -r persian.par ]
then
    mv persian.par > lib/persian.par
    echo 'Persian parameter file installed.'
fi

if [ -r persian-coarse.par ]
then
    mv persian-coarse.par > lib/persian-coarse.par
    echo 'Persian parameter file with coarse tagset installed.'
fi

if [ -r danish.par ]
then
    mv danish.par lib/danish.par
    echo 'Danish parameter file installed.'
fi

if [ -r swedish.par ]
then
    mv swedish.par lib/swedish.par
    echo 'Swedish parameter file installed.'
fi

if [ -r norwegian.par ]
then
    mv norwegian.par lib/norwegian.par
    echo 'Norwegian (Bokmaal) parameter file installed.'
fi

if [ -r dutch.par ]
then
    mv dutch.par lib/dutch.par
    echo 'Dutch parameter file installed.'
fi

if [ -r dutch2.par ]
then
    mv dutch2.par lib/dutch.par
    echo 'Dutch parameter file installed.'
fi

if [ -r swahili.par ]
then
    mv swahili.par lib/swahili.par
    echo 'Swahili parameter file installed.'
fi

if [ -r slovak.par ]
then
    mv slovak.par lib/slovak.par
    echo 'Slovak parameter file installed.'
fi

if [ -r slovak2.par ]
then
    mv slovak2.par lib/slovak.par
    echo 'Slovak parameter file (full tagset) installed.'
fi

if [ -r slovenian.par ]
then
    mv slovenian.par lib/slovenian.par
    echo 'Slovenian parameter file installed.'
fi

if [ -r latin.par ]
then
    mv latin.par lib/latin.par
    echo 'Latin parameter file installed.'
fi

if [ -r latinIT.par ]
then
    mv latinIT.par lib/latin.par
    echo 'Latin Index Thomisticus parameter file installed.'
fi




for file in cmd/*
do
    awk '$0=="BIN=./bin"{print "BIN=\"'`pwd`'/bin\"";next}\
         $0=="CMD=./cmd"{print "CMD=\"'`pwd`'/cmd\"";next}\
         $0=="LIB=./lib"{print "LIB=\"'`pwd`'/lib\"";next}\
         {print}' $file > $file.tmp;
    mv $file.tmp $file;
done
echo 'Path variables modified in tagging scripts.'

chmod 0755 cmd/*

echo ''
echo 'You might want to add '`pwd`'/cmd and '`pwd`'/bin to the PATH variable so that you do not need to specify the full path to run the tagging scripts.'
echo ''
