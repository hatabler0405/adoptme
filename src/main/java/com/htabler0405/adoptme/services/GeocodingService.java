package com.htabler0405.adoptme.services;

import org.json.JSONArray;
import org.json.JSONObject;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class GeocodingService {

    private static final Logger log = LoggerFactory.getLogger(GeocodingService.class);
    private final RestTemplate restTemplate = new RestTemplate();
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    /**
     * Accepts a zip code or full street address and returns a PostGIS Point (X=Longitude, Y=Latitude).
     */
    public Point getCoordinatesFromAddressOrZip(String addressOrZip) {
        if (addressOrZip == null || addressOrZip.trim().isEmpty()) {
            return null;
        }

        try {
            // Properly builds and URL-encodes query params to prevent drops on spaces and punctuation
            String url = UriComponentsBuilder.fromHttpUrl("https://nominatim.openstreetmap.org/search")
                    .queryParam("q", addressOrZip.trim())
                    .queryParam("format", "json")
                    .queryParam("limit", "1")
                    .build()
                    .toUriString();

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "AdoptMe-App/1.0 (contact@adoptme.local)");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            if (response.getBody() != null) {
                JSONArray array = new JSONArray(response.getBody());

                if (!array.isEmpty()) {
                    JSONObject location = array.getJSONObject(0);
                    
                    double lat = location.getDouble("lat"); // Y
                    double lon = location.getDouble("lon"); // X

                    log.info("Geocoded '{}' -> Lat: {}, Lng: {}", addressOrZip, lat, lon);
                    return geometryFactory.createPoint(new Coordinate(lon, lat));
                } else {
                    log.warn("Nominatim found 0 results for address: '{}'", addressOrZip);
                }
            }
        } catch (Exception e) {
            log.error("Could not geocode address: {}. Error: {}", addressOrZip, e.getMessage());
        }
        return null;
    }
}