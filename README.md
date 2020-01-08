# Luokitin

Luokitin on luokitusten ja luokkien hakemiseen, selaamiseen ja valitsemiseen tarkoitettu komponenttiperhe. Luokitin koostuu useasta erillisestä keskenään kommunikoivasta [web-komponentista](https://www.webcomponents.org/introduction). Komponentit on toteutettu [Polymer](https://polymer-library.polymer-project.org/3.0/docs/devguide/feature-overview) web-komponenttikirjastolla.

##### Luokittimen esimerkkitoteutuksia:
**[Rakennusluokitin](https://www.stat.fi/rakennusluokitin)**
**[Toimialaluokitin](http://pxnet2.stat.fi/fi/luokitukset/toimialaluokitin.html)** 

### Käyttö

Lataa luokitin.

Asenna [Polymer](https://polymer-library.polymer-project.org/3.0/docs/install-3-0) esim. ```npm install -g polymer-cli```.

Asenna luokittimen paketit esim. ```npm i```.

#### Kehitys

Aja ```polymer serve```.

Avaa selaimessa ohjelman antama osoite (oletuksena http://127.0.0.1:8081/).

#### Tuotantoon
```npm i```
```polymer build```

Projektiin ilmestyy build kansio, jonka sisältä löytyvät tuotantoa varten optimoidut tiedostot.

Katso Polymerin tarkemmat [ohjeet](https://polymer-library.polymer-project.org/3.0/docs/apps/build-for-production).

### Komponentit

**stat-search**

Hakukenttä luokituksen luokkien suodattamiseen.

**stat-tree**

Luokitus selattavana hierarkisena listana.

**stat-result**

Näyttää valitun luokan tiedot.

**stat-buttons**

Linkityksen aiempien ja nykyisten luokitusversioiden välillä.
*Kehitetty vain Rakennusluokitinta varten.*

**(index.html)**

Esimerkkitiedosto web-komponenttien käytöstä.

### Komponenttien ominaisuudet
 Voit määritellä komponenteille kielen (fi/en/sv):
```sh
<stat-search language="en"></stat-search>
```
tai käytettävän luokituksen:
```sh
<stat-tree classification="rakennus_1_20180712"></stat-tree>
```

### Tapahtumakuuntelijat
Komponentit kommunikoivat keskenään tapahtumilla (events). Esimerkiksi yksittäisen luokan klikkaaminen triggeröi stat-class tapahtuman, joka välittää klikatun luokan tiedot tapahtumaa kuuntelevalle koodille. Täten luokan voi vastaanottaa myös muualla, kuin tämän projektin koodissa. Tällä hetkellä komponentit lähettävät tai kuuntelevat näitä tapahtumia:
```sh
stat-classification
stat-class
```

### Selainyhteensopivuus
Web-komponentit ovat melko tuore teknologia ja kaikki selaimet eivät tue niitä sellaisenaan. Tätä varten tarvitaan *polyfillejä*, kuten [Webcomponents.js](https://github.com/WebComponents/webcomponentsjs) -polyfillkokoelmaa. Myös Polymer [ohjeistaa](https://polymer-library.polymer-project.org/3.0/docs/polyfills) asiasta. Esimerkki niiden käytöstä löytyy index.html-tiedostosta.

Luokittimen komponentit toimivat käytetyimpien selainten tuoreilla versioilla. Internet Explorer-toimivuus ei ole taattua.
