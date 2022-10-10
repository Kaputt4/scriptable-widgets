# Scriptable Widgets
Compilation of different scripts developed by me for [Scriptable iOS app](https://scriptable.app/).

[![CodeQL](https://github.com/Kaputt4/scriptable_widgets/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/Kaputt4/scriptable_widgets/actions/workflows/codeql-analysis.yml)

## TFL Near Stations
This widget uses [Transport for London Unified API](https://api-portal.tfl.gov.uk/), and presents the nearest transport stations, the next trains and their destination.
In order to use it, you have to register to obtain a `app_key`. In order to obtain the key, you have to subscribe to `500 Requests per min` product in [Products tab](https://api-portal.tfl.gov.uk/products).

[![Download with ScriptDude](https://scriptdu.de/download.svg)](https://scriptdu.de/?name=TFL+Near+Stations&source=https%3A%2F%2Fraw.githubusercontent.com%2FKaputt4%2Fscriptable_widgets%2Fmain%2Ftfl_widget%2Ftfl-near-stations.js&docs=https%3A%2F%2Fgithub.com%2FKaputt4%2Fscriptable_widgets)

<img src="https://user-images.githubusercontent.com/73181608/194946079-15993fa8-58dd-40fd-9d31-2bfe9c903cc6.jpg" width="500">

Three variables can be customized:

1. `const app_key = "API-TOKEN-HERE"` ➡️ TFL API token obtained after registering in their website.

2. `const stop_modes = ["tube", "elizabeth-line", "dlr"]` ➡️ Stations modes, obtained from [TFL StopPoint API](https://api-portal.tfl.gov.uk/api-details#api=StopPoint&operation=StopPoint_MetaModes).

    Available modes are: `["bus", "cable-car", "coach", "cycle", "cycle-hire", "dlr", "elizabeth-line", "interchange-keep-sitting", "interchange-secure", "national-rail", "overground", "replacement-bus", "river-bus", "river-tour", "taxi", "tram", "tube", "walking"]`
  
3. `const radius = 1000` ➡️ Radius in meters from current location where stations will be searched.
