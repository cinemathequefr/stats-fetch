# stats-fetch
Stats: fetches data over HTTP and processes them



## seances.js

(2017-09-01)

Note : on veut ajouter des time series pour suivre l'évolution des préventes. Les données de **future.json** étant actuellement réécrites intégralement à chaque requête, on ne peut donc pas les y inscrire.

Solution envisagée : un fichier **series.json** inscrivant pour chaque séance, à chaque nouvelle requête, le nombre de tickets vendus (s'il est différent du précédent). Inclut aussi les séances passées pour inscrire le nombre définitif. Pour celles-ci, l'opération ne doit avoir lieu qu'une seule fois et utilisera comme valeur de timestamp la date/heure de la séance.

Exemple (la clé de premier niveau correspond à l'id de séance) :

    {
      "4817525": {
        "2017-08-31T15:00:00+02:00": 7,
        "2017-08-31T20:17:21+02:00": 11,
        "2017-09-01T11:06:40+02:00": 14
      }
    }

(Variante : inscrire l'évolution du nombre de tickets plutôt que le total)

