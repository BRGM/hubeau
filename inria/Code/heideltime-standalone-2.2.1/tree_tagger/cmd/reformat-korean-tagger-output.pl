#!/usr/bin/perl

use warnings;
use strict;

use utf8;
use open ':utf8';       # all open() use UTF-8
use open ':std';        # standard filehandles too

while (<>) {
    chomp;
    if (/^<[^\t]*>$/) {
	print "$_\n";
    }
    else {
	chomp;
	my($w,$t,$l) = split(/\t/);
	$w =~ s/"/\\"/g;
	print "<w form=\"$w\" tag=\"$t\">\n";
	my @tags = split(/_/,$t);
	my @morphs = split(/_/,$l);
	if ($#tags == $#morphs) {
	    for( my $i=0; $i<=$#tags&&$i<=$#morphs; $i++ ) {
		print "$morphs[$i]\t$tags[$i]\n";
	    }
	}
	else {
	    print "$w\t$t\n"
	}
	print "</w>\n";
    }
}
