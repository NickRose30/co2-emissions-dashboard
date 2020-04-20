const mapWidth = 800;
const mapHeight = 575;

// simple svg initializations
const mapSvg = d3.select('#map')
              .attr('width', mapWidth)
              .attr('height', mapHeight);
mapSvg
  .append('text')
  .attr('x', mapWidth / 2)
  .attr('y', 30)
  .attr('text-anchor', 'middle')
  .style('font-size', '20px');
mapSvg
  .append('g')
  .classed('map-graph', true);
    
const drawMap = ({
  year,
  countryData,
  mapData,
  onCountryClick,
  emissionType,
  showTooltip,
  hideTooltip
}) => {
  // data
  const yearData = countryData.filter(R.propEq('Year', year));
  const geoData = topojson.feature(mapData, mapData.objects.countries).features;
  const populatedGeoData = geoData.map(geoObject => {
    const countryCode = R.prop('id', geoObject);
    const properties = yearData.find(R.propEq('Country Code', countryCode));
    // these next two lines are only necessary when there is no data for a countryCode in
    // the given year. it searches all of the data for that country's name
    const countries = countryData.filter(R.propEq('Country Code', countryCode));
    const countryName = R.length(countries) ? countries[0].Country : '';
    return {
      ...geoObject,
      properties: R.defaultTo({ Country: countryName }, properties)
    };
  });

  // create a projection of how we want the map to look
  // then create the path function with it
  const projection = d3
    .geoMercator()
    .scale(125)
    .translate([mapWidth / 2, mapHeight / 1.4]);
  const path = d3.geoPath().projection(projection);

  // set chart title
  mapSvg
    .select('text')
    .text(
      `Total emissions ${
        emissionType === 'Emissions Per Capita' ? 'per capita' : ''
      } by country in ${year}`
    );

  // create color scale for countries
  const colors = ["#f1c40f", "#e67e22", "#e74c3c", "#c0392b"];
  const colorDomains = {
    Emissions: [0, 2.5e5, 1e6, 5e6],
    'Emissions Per Capita': [0, 0.5, 2, 10]
  };
  const colorScale = d3
                      .scaleLinear()
                      .domain(colorDomains[emissionType])
                      .range(colors);
  
  // update selection
  const map = d3.select('.map-graph')
                .selectAll('.country')
                .data(populatedGeoData);

  // exit selection
  map.exit().remove();

  // enter selection
  map
    .enter()
      .append('path')
      .classed('country', true)
      .attr('d', path)
      .on('click', function(d) {
        d3.selectAll('.country').classed('active', false);
        d3.select(this).classed('active', true);
        onCountryClick(d.properties.Country);
      })
      .on('mousemove', R.compose(
        showTooltip,
        R.prop('properties')
      ))
      .on('mouseout', hideTooltip)
    .merge(map)
      .transition()
        .duration(450)
        .ease(d3.easeQuad)
        .attr('fill', ({ properties }) => {
          const data = properties[emissionType];
          return data ? colorScale(data) : '#ccc';
        });
};
