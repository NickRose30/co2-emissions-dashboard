const pieWidth = 400;
const pieHeight = 450;

// simple svg initializations
const pieSvg = d3
            .select('#pie')
            .attr('width', pieWidth)
            .attr('height', pieHeight);
pieSvg
  .append('text')
  .attr('x', pieWidth / 2)
  .attr('y', 30)
  .attr('text-anchor', 'middle')
  .style('font-size', '20px');
pieSvg
  .append('g')
  .classed('pie-chart', true)
  .attr('transform', `translate(${pieWidth / 2}, ${pieHeight / 2 + 15})`);

// HELPERS
const getContinents = R.compose(
  R.sort((a, b) => a.localeCompare(b)),
  R.uniq,
  R.pluck('Continent')
);

const drawPie = ({
  year,
  emissionType,
  showTooltip,
  hideTooltip,
  data
}) => {
// colors
const Africa = '#26a69a';
const Americas = '#42a5f5';
const Asia = '#ab47bc';
const Europe = '#7e57c2';
const Oceania = '#78909c';
// data
const yearData = data.filter(R.propEq('Year', year));
const continents = getContinents(data);

// set chart title
pieSvg
  .select('text')
  .text(
    `Total emissions ${
      emissionType === 'Emissions Per Capita' ? 'per capita' : ''
    } by country in ${year}`
  );

  // create color scale
  const colorScale = d3
    .scaleOrdinal()
    .domain(continents)
    .range([Africa, Americas, Asia, Europe, Oceania]);

  // pie chart initialization function, specifying the value to use
  const arcs = d3
    .pie()
    .value(d => +d[emissionType])
    .sort((a, b) => {
      const continentCompare = a.Continent.localeCompare(b.Continent);
      if (continentCompare === 0) return +a[emissionType] - +b[emissionType];
      return continentCompare;
    });

  // function to create the d attribute for each arc
  const path = d3
    .arc()
    .outerRadius(pieWidth / 2 - 10)
    .innerRadius(0);

  // ENTER/EXIT/UPDATE
  // update selection
  const pie = d3.select('.pie-chart').selectAll('.arc').data(arcs(yearData));

  // exit selection
  pie.exit().remove();

  // enter selection
  pie
    .enter()
    .append('path')
      .classed('arc', true)
      .attr('stroke', 'white')
      .attr('stroke-width', '0.25px')
      .on('mousemove', R.compose(
        showTooltip,
        R.prop('data')
      ))
      .on('mouseout', hideTooltip)
    .merge(pie)
      .attr('fill', d => colorScale(d.data.Continent))
      .attr('d', path);
};
