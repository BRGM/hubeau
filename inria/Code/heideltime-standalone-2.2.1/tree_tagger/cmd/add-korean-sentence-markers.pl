#!/usr/bin/perl

use warnings;
use strict;
use utf8;
use open ':utf8';       # all open() use UTF-8
use open ':std';        # standard filehandles too

my $sf_seen = 1;  # SF tag encountered in previous segment
my $sf_context = 1; # possible ordinal number encountered.
# A following SF tag no longer signals a sentence boundary.

while (<>) {
    if ($_ eq "<seg>\n" && $sf_seen) {
	print "<s>\n";
	$sf_seen = 0;
    }
    if ($_ eq "</s>\n") {
	if (!$sf_seen) {
	    print;
	    $sf_seen = 1;
	}
	$_ = '';
    }
    elsif ($_ eq "<s>\n") {
	$sf_seen = 1;
	$_ = '';
    }
    print;
    if ($_ eq "</seg>\n" && $sf_seen) {
	print "</s>\n";
    }
    $sf_seen = 1 if /\tSF\t/ and $sf_context;
    if (/^([0-9]+|[a-z]|[ivx]+)\t/) {
	$sf_context = 0
    }
    elsif (!/^<.*>\n$/) {
	$sf_context = 1
    }
}
