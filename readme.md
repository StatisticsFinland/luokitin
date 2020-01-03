# Luokitin

Luokitin on luokitusten ja luokkien hakemiseen, selaamiseen ja valitsemiseen tarkoitettu komponenttiperhe. Luokitin koostuu useasta erillisestä keskenään kommunikoivasta [web-komponentista](https://www.webcomponents.org/introduction). Komponentit on toteutettu [Polymer](https://polymer-library.polymer-project.org/3.0/docs/devguide/feature-overview) web-komponenttikirjastolla.

##### Luokittimen esimerkkitoteutuksia:
**[Rakennusluokitin](https://www.stat.fi/rakennusluokitin)**
**[Toimialaluokitin](http://pxnet2.stat.fi/fi/luokitukset/toimialaluokitin.html)** 

### Kehitys

Lataa luokitin.

Asenna [Polymer](https://polymer-library.polymer-project.org/3.0/docs/install-3-0) esim. ```npm install -g polymer-cli```.

Asenna luokittimen paketit esim. ```npm install```.

Aja ```polymer serve```.

Avaa selaimessa http://127.0.0.1:8081/.

### Tuotantoon
```polymer build```

Katso Polymerin tarkemmat [ohjeet](https://polymer-library.polymer-project.org/3.0/docs/apps/build-for-production).

### Komponentit

**tk-luokkahaku**

Hakukenttä luokituksen luokkien suodattamiseen.

**tk-luokituspuu**

Luokitus selattavana hierarkisena listana.

**tk-valinta**

Näyttää valitun luokan tiedot.

**tk-lahdeluokitus**

Linkityksen aiempien ja nykyisten luokitusversioiden välillä.
*Kehitetty vain Rakennusluokitinta varten.*

**tk-luokitushaku**

Tarjoaa luokituksen haun ja valinnan.
*Vanhentunut. Toimintaan saattaminen vaatii jatkokehitystä.*

### Komponenttien ominaisuudet
 Voit määritellä komponenteille kielen (fi/en/sv):
```sh
<tk-luokkahaku language="en"></tk-luokkahaku>
```
tai käytettävän luokituksen esim:
```sh
<tk-luokituspuu classification="rakennus_1_20180712"></tk-luokituspuu>
```

### Tapahtumakuuntelijat
Komponentit kommunikoivat keskenään tapahtumilla (events). Esimerkiksi yksittäisen luokan klikkaaminen triggeröi tk-luokkahaku-luokka tapahtuman, joka välittää klikatun luokan tiedot tapahtumaa kuuntelevalle koodille. Täten luokan voi vastaanottaa myös muualla, kuin tämän projektin koodissa. Tällä hetkellä komponentit lähettävät tai kuuntelevat näitä tapahtumia:
```sh
tk-luokitushaku-luokitus
tk-luokkahaku-luokka
```

### Selainyhteensopivuus
Web-komponentit ovat melko tuore teknologia ja kaikki selaimet eivät tue niitä sellaisenaan. Tätä varten tarvitaan *polyfillejä*, kuten [Webcomponents.js](https://github.com/WebComponents/webcomponentsjs) -polyfillkokoelmaa. Myös Polymer [ohjeistaa](https://polymer-library.polymer-project.org/3.0/docs/polyfills) asiasta. Esimerkki niiden käytöstä löytyy index.html-tiedostosta.

Luokittimen komponentit toimivat käytetyimpien selainten tuoreilla versioilla. Internet Explorer-toimivuus ei ole taattua.
