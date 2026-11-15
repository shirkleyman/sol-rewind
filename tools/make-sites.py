"""Builds src/data/sites.json: the real place and the real NASA photo behind each level.
Photo captions are short kid-friendly versions of the NASA captions. Coordinates come from the sources named in each entry."""
import json

NSS_MOON = "NASA NSSDCA, Apollo Landing Site Coordinates (lunar module), https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html"


def photo(file, nid, title, credit, caption, w, h):
    return dict(file=file, nasaId=nid, title=title, credit=credit, caption=caption, w=w, h=h, page="https://images.nasa.gov/details/" + nid)


def moon(level, id_, name, place, when, text, ph):
    return dict(level=level, id=id_, name=name, body="Moon", place=place, when=when,
                coords=dict(text=text, note="Landing site (lunar module)", source=NSS_MOON), photo=ph)


sites = [
    moon(1, "apollo11", "Apollo 11", "Tranquility Base, Moon", "20 July 1969", "0.674° N, 23.473° E",
         photo("apollo11.jpg", "KSC-as11-40-5964", "KSC-as11-40-5964", "NASA",
               "Astronaut Buzz Aldrin sets up a solar wind experiment near Tranquility Base. Footprints surround him, and the lunar module Eagle is nearby.", 1532, 1920)),
    moon(2, "apollo12", "Apollo 12", "Ocean of Storms, Moon", "20 November 1969", "3.013° S, 23.422° W",
         photo("apollo12.jpg", "AS12-48-7134", "Apollo 12 Mission image - Astronaut Alan L. Bean, lunar module pilot, and two U.S. spacecraft", "NASA",
               "The Apollo 12 lunar module is in the background and the unmanned Surveyor 3 spacecraft is in the foreground. The crew landed about 600 feet (180 meters) from Surveyor 3.", 1920, 1920)),
    moon(3, "apollo15", "Apollo 15", "Hadley Rille, near St. George Crater, Moon", "31 July 1971", "26.132° N, 3.633° E",
         photo("apollo15.jpg", "as15-85-11425", "Apollo 15 Mission image - Panoramic view north of Station 1, northwest of Hadley Rille", "NASA",
               "A view of Hadley Rille, a long winding valley on the Moon. You can see layers in the rille wall and big blocks on its floor.", 1889, 1920)),
    moon(4, "apollo16", "Apollo 16", "Descartes highlands, Moon", "21 April 1972", "8.973° S, 15.501° E",
         photo("apollo16.jpg", "as16-107-17436", "View of the Lunar Module \"Orion\" and Lunar Roving Vehicle during first EVA", "NASA",
               "The lunar module Orion and the lunar roving vehicle at the Descartes landing site. John Young stands behind the rover, and Stone Mountain rises in the background.", 1853, 1920)),
    moon(5, "apollo17", "Apollo 17", "Taurus-Littrow valley, Moon", "13 December 1972", "20.191° N, 30.772° E",
         photo("apollo17.jpg", "as17-140-21497", "Apollo 17 Mission image - Sta 6, Panoramic, LMP", "NASA",
               "Scientist-astronaut Harrison Schmitt stands next to a huge, split boulder at the Taurus-Littrow landing site. Eugene Cernan took the picture.", 1920, 1897)),
    dict(level=6, id="viking1", name="Viking 1", body="Mars", place="Chryse Planitia, Mars", when="Landed 20 July 1976",
         coords=dict(text="22.27° N, 312.05° E (planetocentric)", note="Landing site",
                     source="NASA NSSDCA, Viking 1 Lander, https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1975-075C"),
         photo=photo("viking1.jpg", "PIA00563", "First Color Image From Viking Lander 1", "NASA/JPL",
                     "The first color image from Viking Lander 1, taken on the surface of Mars.", 563, 512)),
    dict(level=7, id="opportunity", name="Opportunity", body="Mars", place="Perseverance Valley, rim of Endeavour Crater, Mars", when="13 May to 10 June 2018",
         coords=dict(text="1.946° S, 354.473° E", note="Landing site in Meridiani Planum (this photo was taken years later, at Perseverance Valley)",
                     source="NASA NSSDCA, Mars Exploration Rover B, https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-032A"),
         photo=photo("opportunity.jpg", "PIA22909", "Opportunity Legacy Pan (True Color)", "NASA/JPL-Caltech/Cornell/ASU",
                     "Opportunity's last panorama, taken at its final resting place in Perseverance Valley. A global dust storm silenced the solar-powered rover on 10 June 2018.", 900, 201)),
    dict(level=8, id="spirit", name="Spirit", body="Mars", place="Troy, Gusev Crater, Mars", when="Spring 2009",
         coords=dict(text="14.572° S, 175.478° E", note="Landing site in Gusev Crater (this photo was taken at Troy, years later)",
                     source="NASA NSSDCA, Mars Exploration Rover A, https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-027A"),
         photo=photo("spirit.jpg", "PIA12203", "Calypso Panorama of Spirit View from Troy", "NASA/JPL-Caltech/Cornell University",
                     "A full-circle view of the terrain around Troy, where Spirit got stuck in soft soil in the spring of 2009.", 1920, 422)),
    dict(level=9, id="insight", name="InSight", body="Mars", place="Western Elysium Planitia, Mars", when="24 April 2022",
         coords=dict(text="4.502° N, 135.623° E", note="Landing site (the lander never moved)",
                     source="Golombek et al., Lunar and Planetary Science Conference 2019 (a scientific paper, not a NASA page)"),
         photo=photo("insight.jpg", "PIA25287", "InSight's Final Selfie", "NASA/JPL-Caltech",
                     "InSight's final selfie. The lander is covered in far more dust than in its first selfie, so its solar panels made less power.", 1920, 1152)),
    dict(level=10, id="curiosity", name="Curiosity", body="Mars", place="Gale Crater, Mars", when="August 2012",
         coords=dict(text="4.5895° S, 137.4417° E", note="Landing site in Gale Crater",
                     source="Vasavada et al., Journal of Geophysical Research 2014 (a scientific paper, not a NASA page)"),
         photo=photo("curiosity.jpg", "PIA16032", "Mount Sharp on the Horizon", "NASA/JPL-Caltech/MSSS",
                     "A piece of Curiosity's first color 360-degree panorama. Mount Sharp, a mountain in the middle of Gale Crater, starts to rise in the distance.", 1920, 1080)),
    dict(level=11, id="pathfinder", name="Mars Pathfinder", body="Mars", place="Ares Vallis, Mars", when="1997",
         coords=dict(text="19.33° N, 33.55° W", note="Landing site",
                     source="NASA NSSDCA, Mars Pathfinder, https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1996-068A"),
         photo=photo("pathfinder.jpg", "PIA01551", "Newly Deployed Sojourner Rover", "NASA/JPL",
                     "The Sojourner rover, newly deployed on the surface after Mars Pathfinder landed in the Ares Vallis region.", 1099, 572)),
    dict(level=12, id="perseverance", name="Perseverance", body="Mars", place="Floor of Jezero Crater, Mars", when="3 July 2021",
         coords=dict(text="Jezero Crater, western edge of Isidis Planitia", note="Landing region (no exact point given)",
                     source="NASA NSSDCA, Mars 2020 Perseverance, https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2020-052A"),
         photo=photo("perseverance.jpg", "PIA24744", "The End of One Drive by Perseverance on the Floor of Jezero Crater", "NASA/JPL-Caltech",
                     "Perseverance's tracks at the end of one autonomous drive on the floor of Jezero Crater, on 3 July 2021.", 2160, 859)),
]

with open("src/data/sites.json", "w", encoding="utf-8") as f:
    json.dump(dict(sites=sites), f, indent=1, ensure_ascii=False)
print(len(sites), "sites written")
