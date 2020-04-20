/**
 * IMPORTANT - SETUP
 * This code make asynchronous requests over http, so an http server needs to be started
 * to run. To run: navigate to the root of this project in terminal and run the command
 * 'http-server'. It will serve this whole project at localhost:8080
 */
/**
 * ALSO IMPORTANT - TRANSITIONS
 * The css for the tooltip-related elements is very important.
 * They will not look or function properly without the css
 */

const getEmissionType = (value) => {
  if (value === 'emissions') return 'Emissions';
  else if (value === 'emissionsPerCapita') return 'Emissions Per Capita';
  return null;
};

const getTooltipHtml = ({
  year,
  country,
  emissionsLabel,
  emissions,
  percentage,
}) => `
  <p>${year}</p>
  <p>Country: ${country}</p>
  <p>${emissionsLabel}: ${emissions} ${
    emissionsLabel === 'Emissions' ? 'thousand' : ''
  } metric tons</p>
`;

d3.queue()
  .defer(d3.csv, './data/all_data.csv')
  .defer(d3.json, 'https://unpkg.com/world-atlas@1/world/50m.json')
  .await((err, countryData, mapData) => {
    if (err) throw err;

    // initial variables
    const minYear = d3.min(countryData, R.prop('Year'));
    const maxYear = d3.max(countryData, R.prop('Year'));
    let year = minYear;
    let selectedCountry = '';
    let emissionType = d3.select('input[name=data-type]:checked').attr('value');

    // append the tooltip to the page
    const tooltip = d3.select('body').append('div').classed('tooltip', true);

    const showTooltip = (data, isBar = false) => {
      const emissionValue = getEmissionType(emissionType);
      // TODO: the percentage does not work because totalData is never changing.
      // it gets passed in the mousover event that only gets set once, and doesn't
      // reevaluate every time data changes
      // const totalEmissions = d3.sum(totalData, R.prop(emissionValue));
      // const percentage = Number(data[emissionValue]) / totalEmissions;
      // const percentageFormatted = percentage.toLocaleString('en', {
      //   style: 'percent',
      //   maximumFractionDigits: 2,
      // });
      tooltip
        .style('opacity', 1)
        .style(
          'left',
          `${d3.event.pageX - tooltip.node().offsetWidth / 2 - 5}px`
        )
        .style('top', `${d3.event.pageY - tooltip.node().offsetHeight - 15}px`)
        .html(
          getTooltipHtml({
            year: isBar ? data.Year : year,
            country: data.Country,
            emissionsLabel: emissionValue,
            emissions: Number(data[emissionValue]).toLocaleString('en', {
              maximumFractionDigits: 2,
            }),
          })
        );
    };

    const hideTooltip = (_) => {
      tooltip.style('opacity', 0);
    };

    // create dashboard function that will get called once when the page
    // loads and then any time input values change
    const createDashboard = _ => {
      const emissionValue = getEmissionType(emissionType);
      d3.select('#year-val').text(year);
      d3.select('input#year').attr('value', year);
      drawPie({
        year,
        emissionType: emissionValue,
        showTooltip,
        hideTooltip,
        data: countryData,
      });
      drawMap({
        year,
        countryData,
        mapData,
        onCountryClick: country => {
          selectedCountry = country;
          createDashboard();
        },
        emissionType: emissionValue,
        showTooltip,
        hideTooltip,
      });
      drawBar({
        year,
        country: selectedCountry,
        data: countryData,
        emissionType: emissionValue,
        showTooltip,
        hideTooltip,
        setYear: targetYear => {
          year = targetYear
          createDashboard();
        },
      });
    };

    // get the nav values and set their update events
    d3.select('input#year')
      .attr('min', minYear)
      .attr('max', maxYear)
      .attr('value', minYear)
      .on('input', _ => {
        year = d3.event.target.value;
        createDashboard();
      });
    d3.selectAll('input[name=data-type]').on('change', (_) => {
      emissionType = d3.event.target.value;
      createDashboard();
    });
    d3.select('#year-val').text(year);

    // create dashboard for inital page load
    createDashboard();
  });