import React, { useRef } from "react";
import { WebView } from "react-native-webview";
import { View, Text, StyleSheet, Button } from "react-native";

const mapHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Mapa Leaflet</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      #map {
        width: 100%;
        height: 100%;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const map = L.map("map").setView([12.1364, -86.2514], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
      }).addTo(map);

      document.addEventListener("message", function (event) {
        const data = JSON.parse(event.data);
        if (data.type === "drawRoute") {
          if (window.routeLayer) {
            map.removeLayer(window.routeLayer);
          }
          window.routeLayer = L.polyline(data.coords, { color: "blue" }).addTo(map);
          map.fitBounds(window.routeLayer.getBounds());
        }
      });
    </script>
  </body>
</html>
`;


export default function MapViewLeaflet() {
  const webViewRef = useRef(null);

  const exampleRoute = [
    [12.1364, -86.2514],
    [12.1405, -86.2570],
    [12.1450, -86.2600],
  ];

  const drawRoute = () => {
    webViewRef.current.postMessage(
      JSON.stringify({ type: "drawRoute", coords: exampleRoute })
    );
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: mapHtml }}
        style={styles.webview}
      />
      <Button title="Mostrar ruta" onPress={drawRoute} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1, width: "100%", height: "100%" },
});
