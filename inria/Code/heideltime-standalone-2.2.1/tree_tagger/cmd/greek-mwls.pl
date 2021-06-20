#!/usr/bin/perl

use warnings;
use strict;
use utf8::all;

# script recognizes numerical and date expressions in one-token-perl-line input

my @buffer;
my $state = 0;
while (<>) {
    chomp;
    next if $_ eq '';

    if (/^[1-9][0-9]?ης?$/) {
	push @buffer, $_;
	$state = 1; # 12ης
    }
    elsif (/^Ιανουαρίου|Φεβρουαρίου|[ΜM]αρτίου|Απριλίου|Μαϊου|Μαΐου|Ιουνίου|Ιούλιου|Ιουλίου|Αυγούστου|Σεπτεμβρίου|Οκτωβρίου|Νοεμβρίου|Δεκεμβρίου|Ιανουάριος?|Φεβρουάριος?|[ΜM]άρτιος?|Απρίλιος?|Μάιος?|Ιούνιος?|Ιούλιος?|Σεπτέμβριος?|Οκτώβριος?|Νοέμβριος?|Δεκέμβριος?|Ιαν.|Σεπτ./) {
	push @buffer, $_;
	$state = 2; # 12ης Μαρτίου 
    }
    elsif ($state == 2 && /^(19|20)[0-9][0-9]$/) {
	push @buffer, $_;
	print join('_',@buffer),"\n"; 
	@buffer = ();
	$state = 0;  # 12ης Μαρτίου 2012
    }
    elsif ($state == 0 && /^[0-9]+$/) {
	push @buffer, $_;
	$state = 3;
    }
    elsif (($state == 0 || $state == 3) && /^[0-9][0-9][0-9]$/) {
	push @buffer, $_;
	$state = 3;
    }
    elsif ($state == 3 && /^[0-9]$/) {
	print join('_',@buffer),"\n"; 
	@buffer = ();
	push @buffer, $_;
	$state = 3;
    }
    elsif (($state == 0 || $state == 6) && /^[0-9]([,.0-9-]*[0-9])?$/) {
	push @buffer, $_;
	$state = 5;  # 12  or  12 -
    }
    elsif (($state == 3 || $state == 5) && $_ eq '-') {
	push @buffer, $_;
	$state = 6;  # 12 -
    }
    elsif (($state == 3 || $state == 5) && $_ eq '%') {
	push @buffer, $_;
	print join('_',@buffer),"\n"; 
	@buffer = ();
	$state = 0;   # 12 %
    }
    elsif ($state == 6) {
	my $s = pop @buffer;
	print join('_',@buffer),"\n"; 
	@buffer = ();
	print "$s\n$_\n"; 
	$state = 0;
    }
    else {
	if (@buffer) {
	    print join('_',@buffer),"\n";
	    @buffer = ();
	}
	print "$_\n";
	$state = 0;
    }

    # print "state: $state\n";
}

# DATE = /^([1-9][0-9]?(ης?)?\t)?(Ιανουαρίου|Φεβρουαρίου|Μαρτίου|Απριλίου|Ιουνίου|Ιούλιο|Ιουλίου|Αυγούστου|Σεπτεμβρίου|Οκτωβρίου|Νοεμβρίου|Δεκεμβρίου)(\t(19|20)[0-9][0-9]$/ or /^[0-9]+[.\/][0-9]+[.\/](19|20)?[0-9][0-9])?$/
# DIG = /^([0-9]+(_?[,._-]_?))*[0-9]+(_?%)?$/
