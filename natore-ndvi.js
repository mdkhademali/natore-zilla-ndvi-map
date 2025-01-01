// Md. Khadem Ali
// https://github.com/mdkhademali

// Define the region of interest: Natore Zilla
var natore = ee.FeatureCollection("FAO/GAUL/2015/level2")
                .filter(ee.Filter.eq('ADM2_NAME', 'Natore'))
                .filter(ee.Filter.eq('ADM0_NAME', 'Bangladesh'));

// Load Sentinel-2 image collection
var sentinel2 = ee.ImageCollection("COPERNICUS/S2")
                  .filterDate('2023-01-01', '2023-12-31') // Define the time period
                  .filterBounds(natore)
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10)); // Filter for low cloud coverage

// Mosaic images to ensure continuous coverage over the region
var composite = sentinel2.median().clip(natore);

// Calculate NDVI: (NIR - Red) / (NIR + Red)
var ndvi = composite.normalizedDifference(['B8', 'B4']).rename('NDVI');

// Clip NDVI to the full Natore Zilla region
var ndviClipped = ndvi.clip(natore);

// Improved NDVI visualization: Balanced green to yellow transition
var ndviParams = {
  min: -1,
  max: 1,
  palette: [
    '004d00',  // -1.0 to -0.8: Deep green (barren land or water)
    '008000',  // -0.8 to -0.4: Dark green (low vegetation)
    '00FF00',  // -0.4 to 0.0: Bright green (moderate NDVI)
    'ADFF2F',  // 0.0 to 0.2: Green-yellow (healthy vegetation starting)
    'FFFF00',  // 0.2 to 0.4: Yellow (moderate to healthy vegetation)
    'FFA500',  // 0.4 to 0.6: Orange (dense vegetation)
    'FF4500',  // 0.6 to 0.8: Red-orange (very dense vegetation)
    '800000'   // 0.8 to 1.0: Deep red (extremely dense vegetation or forest)
  ]
};

// Add NDVI layer to the map
Map.centerObject(natore, 10);
Map.addLayer(ndviClipped, ndviParams, 'NDVI - Balanced Green and Yellow');
// Display Natore boundary with a transparent fill and subtle outline
Map.addLayer(natore.style({color: 'black', fillColor: '00000000'}), {}, 'Natore Boundary');

// Calculate NDVI statistics for the full Zilla
var stats = ndviClipped.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: natore.geometry(),
  scale: 10,
  maxPixels: 1e9
});
print('Mean NDVI for Natore:', stats.get('NDVI'));

// Export the NDVI image to Google Drive
Export.image.toDrive({
  image: ndviClipped,
  description: 'Full_NDVI_Natore_Balanced_Green_Yellow',
  scale: 10,
  region: natore.geometry(),
  maxPixels: 1e9
});

// Export NDVI statistics to Google Drive
Export.table.toDrive({
  collection: ee.FeatureCollection([
    ee.Feature(null, {Mean_NDVI: stats.get('NDVI')})
  ]),
  description: 'NDVI_Stats_Natore_Balanced_Green_Yellow',
  fileFormat: 'CSV'
});