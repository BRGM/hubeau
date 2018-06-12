#---------------------------------------------------------------------------
#Tracé d'une chronique piézométrique dans Rstudio
#---------------------------------------------------------------------------

# Chargement des paquets R
require(data.table)
require(ggplot2)

# Appel du endpoint chroniques en CSV de l'API Piézo
NPstation<-fread("http://api.hubeau.fr/v1/niveaux_nappes/chroniques.csv?code_bss=08756X0032/F1")
NPstation$date_mesure<-as.Date(NPstation$date_mesure)
NPstation$niveau_nappe_eau<-as.numeric(NPstation$niveau_nappe_eau)

# Appel de ggplot, affichage de la chronique piézo
p<-ggplot(NPstation)+geom_path(aes(x=date_mesure, y=niveau_nappe_eau))
p<-p+theme_bw()+labs(x='',y='m NGF', title='08756X0032/F1')+guides(color='none')+scale_x_date(date_breaks = "1 year", date_labels = "%Y")
print(p)
