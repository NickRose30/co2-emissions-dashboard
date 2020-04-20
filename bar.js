const barHeight = 500;
const barWidth = 800;
const barGraphPadding = 80;
const barPadding = 1;

// simple svg initializations
const barSvg = d3
  .select('#bar')
  .attr('height', barHeight)
  .attr('width', barWidth)
  .style('margin', 'auto');
barSvg
  .append('text')
  .attr('x', barWidth / 2)
  .attr('y', 30)
  .attr('text-anchor', 'middle')
  .style('font-size', '20px');
const histogram = barSvg.append('g').classed('histogram', true);

// create the axes ----------------------
histogram
  .append('g')
  .attr('transform', `translate(0, ${barHeight - barGraphPadding})`)
  .classed('x-axis', true);
histogram
  .append('g')
  .attr('transform', `translate(${barGraphPadding}, 0)`)
  .classed('y-axis', true);
histogram
  .append('text')
  .attr('x', barWidth / 2)
  .attr('y', barHeight - 30)
  .style('text-anchor', 'middle')
  .text('Year');
histogram
  .append('text')
  .classed('y-label', true)
  .attr('transform', 'rotate(-90)')
  .attr('x', -barHeight / 2)
  .attr('y', 15)
  .style('text-anchor', 'middle');
  // ------------------------------------

const drawBar = ({
  year,
  country,
  data,
  emissionType,
  showTooltip,
  hideTooltip,
  setYear,
}) => {
  const countryData = data.filter(R.propEq('Country', country));

  // set chart title
  barSvg
    .select('text')
    .text(country ? `${country} C02 emissions` : 'Select a country');

  // create the x scale
  const xDomain = d3.extent(countryData, R.prop('Year'));
  const xScale = d3
    .scaleLinear()
    .domain(xDomain)
    .rangeRound([barGraphPadding, barWidth - barGraphPadding]);

  // create the y scale based on the length of the largest bin
  const yDomain = [0, d3.max(countryData, d => +d[emissionType])];
  const yScale = d3
    .scaleLinear()
    .domain(yDomain)
    .range([barHeight - barGraphPadding, barGraphPadding]);

  // set the axix values
  d3.select('.x-axis').call(d3.axisBottom(xScale).tickFormat(d3.format('d')));
  d3.select('.y-axis').transition().duration(500).call(d3.axisLeft(yScale));
  d3.select('.y-label').text(
    `CO2 Emissions, ${
      emissionType === 'Emissions'
        ? 'thousand metric tons'
        : 'metric tons per capita'
    }`
  );

  const update = barSvg.selectAll('rect').data(countryData);

  const transition = d3.transition().duration(1000).ease(d3.easeBounceOut);

  update
    .exit()
    .transition(transition)
    .delay((d, i, nodes) => (nodes.length - i - 1) * 100)
    .attr('y', barHeight - barGraphPadding.bottom)
    .attr('height', 0)
    .remove();

  update
    .enter()
    .append('rect')
      .classed('bar', true)
      .attr("y", barHeight - barGraphPadding)
      .attr("height", 0)
      .on('mousemove', function(d) {
        d3.selectAll('.bar').classed('bar-active', false);
        d3.select(this).classed('bar-active', true);
        showTooltip(d, true);
      })
      .on('mouseout', hideTooltip)
      .on('click', function(d) {
        d3.selectAll('.bar').classed('bar-focused', false);
        d3.select(this).classed('bar-focused', true);
        setYear(d.Year);
      })
    .merge(update)
      .attr('x', ({ Year }) => xScale(Year))
      .attr('width', ({ Year }) => xScale(+Year + 1) - xScale(Year) - barPadding)
      .attr('fill', d => d.Year === year ? '#149279' : '#1abc9c')
      .transition(transition)
      .delay((d, i) => i * 100)
        .attr(
          'height',
          d => barHeight - barGraphPadding - yScale(+R.prop(emissionType, d))
        )
        .attr('y', d => yScale(+R.prop(emissionType, d)));
  };