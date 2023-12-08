/* Set the time format
  Ref: https://github.com/d3/d3-time-format */
const parseTime = d3.timeParse("%Y");

/* Load the dataset and formatting variables
  Ref: https://www.d3indepth.com/requests/ */
// d3.csv("./data.csv").then(data => {
// Print out the data on the console
d3.csv("./spain_tidy_subcategories.csv", d => {
  return {
      Place: d.Place,
      Category: d.Category,
      SubCategory: d.SubCategory,
      Year: +d.Year,
      Amount: +d.Amount,
      date: parseTime(d.Year)
  }
}).then(data => {

    console.log(data);
    //data.forEach(d => console.log(typeof d));

    /* Data Manipulation in D3 
      Ref: https://observablehq.com/@d3/d3-extent?collection=@d3/d3-array */

    // Get the minimum and maximum of the percent pay gap
    // console.log(d3.min(data, d => d.value));
    // console.log(d3.max(data, d => d.value));
    // console.log(d3.extent(data, d => d.value));

    // Filter the data from the year 2020
    let newData = data.filter(d => d.Year === 2020);
    console.log(newData);

    //Data for the bar chart
    const rollupByPlace = d3.rollup(data, i => d3.sum(i, data => data.Amount), data => data.Place)
    const dataArrayByPlace = Array.from(rollupByPlace, ([Place, Amount]) => ({ Place, Amount }));
    dataArrayByPlace.sort((a, b) => b.Amount - a.Amount); // Sort the country by the percentage in the descending order
    console.log(dataArrayByPlace)

    //Data for sunburst
    let rollupBySubcategory = d3.rollup(data, i => d3.sum(i, data => data.Amount), data => data.Category, data => data.SubCategory)
    console.log(rollupBySubcategory);

    const transformedData = {
      name: "root",
      children: [...rollupBySubcategory.entries()].map(([category, subcategoriesMap]) => ({
        name: category,
        children: [...subcategoriesMap.entries()].map(([subCategory, value]) => ({
          name: subCategory,
          value,
        })),
      })),
    };

    console.log(transformedData);


    // Get the mean and median of gender gap percentage
    console.log(d3.mean(newData, d => d.Amount));
    console.log(d3.median(newData, d => d.Amount));

  /*

  // Move the color scale here to share with both charts
  const provinces = newData.map(d => d.Place);
  const colors = d3.scaleOrdinal()
    .domain(provinces)
    .range(d3.quantize(d3.interpolateRainbow, provinces.length));*/

    // Move the color scale here to share with both charts
const provinces = data.map(d=> d.Place);
const uniqueProvinces = Array.from(new Set(provinces));
const colors = d3.scaleOrdinal().domain(uniqueProvinces).range(d3.quantize(d3.interpolateRainbow, uniqueProvinces.length));


    //Plot Sunburst
    createSunburstChartZoomable2(transformedData);
    
    // Plot the bar chart
    createBarChart2(dataArrayByPlace, colors);

    // Call the drawSpainMap function
    //drawSpainMap();

})

const createBarChart2 = (data, colors) => {
  /* Set the dimensions and margins of the graph
    Ref: https://observablehq.com/@d3/margin-convention */
  const width = 1000, height = 1000;
  const margins = { top: 10, right: 30, bottom: 140, left: 20 };

  /* Create the SVG container.....
  # selects object in HTML... select all/ single div as well*/
  const svg = d3.select("#bar")
      .append("svg")
      .attr("viewBox", [-20, -50, width, height]);

  /* Define x-axis, y-axis, and color scales
    Ref: https://observablehq.com/@d3/introduction-to-d3s-scales */

  /* xScale: scaleBand() https://observablehq.com/@d3/d3-scaleband */
  // the x-axis was categorical
  const xScale = d3.scaleBand()
      .domain(data.map(d => d.Place))
      .range([margins.left, width - margins.right])
      .padding(0.2);

  /* yScale: scaleLinear() https://observablehq.com/@d3/d3-scalelinear */
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.Amount)])
    .range([height - margins.bottom, margins.top]);

console.log("yScale domain:", yScale.domain());  // Log the yScale domain to the console

// Create y-axis
const yAxis = d3.axisLeft(yScale)
    .tickFormat(d3.format(".2s")); // Use ".2s" format to display numbers in a concise way

// Append y-axis to the chart
const yGroup = svg.append("g")
    .attr("transform", `translate(${margins.left}, 0)`)
    .call(yAxis)
    .call(g => g.select(".domain").remove());


  /* Create the bar elements and append to the SVG group
    Ref: https://observablehq.com/@d3/bar-chart */
  let bar = svg.append("g")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", d => xScale(d.Place))
      .attr("y", d => yScale(d.Amount))
      .attr("width", d => xScale.bandwidth())
      .attr("height", d => height - margins.bottom - yScale(d.Amount))
      .attr("fill", d => colors(d.Place));

  /* Add vertical text with the Amount of each bar */
  svg.append("g")
    .selectAll("text")
    .data(data)
    .join("text")
    .text(d => d.Amount)
    .attr("x", d => xScale(d.Place) + xScale.bandwidth() +30)
    .attr("y", d => yScale(d.Amount) -15) // Adjust Y position for text
    .attr("dy", "1em") // Vertical alignment
    .attr("text-anchor", "middle") // Center text
    .style("font-size", "12px")
    .style("fill", d => colors(d.Place)) // Use the same color scale for text
    .attr("transform", d => `rotate(-65 ${xScale(d.Place) + xScale.bandwidth() / 2},${yScale(d.Amount)})`);

  /* Create the x and y axes and append them to the chart
    Ref: https://www.d3indepth.com/axes/ and https://github.com/d3/d3-axis */

  const xAxis = d3.axisBottom(xScale);

  const xGroup = svg.append("g")
      .attr("transform", `translate(0, ${height - margins.bottom})`)
      .call(xAxis);

  xGroup.selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-65)")
      .style("font-size", "12px")
      .style("font-weight", "bold");
}

function calculatePercentage(value, total) {
  return ((value / total) * 100).toFixed(2) + "%";
}

function createSunburstChartZoomable2(data){
  const width = 1000, height = 1000;
  const imageUrl = "map.png";

  // Specify the chart’s colors and approximate radius (it will be adjusted at the end).
  const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children.length + 1));
  const radius = 165;

  // Compute the layout.
  const hierarchy = d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value);
  const root = d3.partition()
    .size([2 * Math.PI, hierarchy.height + 1])
    (hierarchy);
  root.each(d => d.current = d);

  // Create the arc generator.
  const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(radius)
    .innerRadius(d => d.y0 * radius)
    .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));

  // Create the SVG container.
  const svg = d3.select("#sunburst-container")
    .append("svg")
    .attr("viewBox", [0, 0, width, height])
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);

  // Add the "Spain" label in the middle
    svg.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "-3.5em")
    .style("font-size", "30px")
    .style("font-weight", "bold")
    .text("Spain");

  // Append the arcs.
  const path = svg.append("g")
    .selectAll("path")
    .data(root.descendants().slice(1))
    .join("path")
    .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
    .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
    .attr("pointer-events", d => arcVisible(d.current) ? "auto" : "none")
    .attr("d", d => arc(d.current))
    .on("click", clicked);

  // Make them clickable if they have children.
  path.filter(d => d.children)
    .style("cursor", "pointer");

  const format = d3.format(",d");
  path.append("title")
    .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(d.value)}`);

  const label = svg.append("g")
    .attr("pointer-events", "none")
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .style("font-weight", "bold")
    .style("user-select", "none")
    .selectAll("text")
    .data(root.descendants().slice(1))
    .join("text")
    .attr("dy", "0.35em")
    .attr("fill-opacity", d => +labelVisible(d.current))
    .attr("transform", d => labelTransform(d.current))
    .text(d => {
      const percentage = calculatePercentage(d.value, root.value);
      return `${d.data.name} (${percentage})`;
    });
  

  const parent = svg.append("circle")
    .datum(root)
    .attr("r", radius)
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .on("click", clicked);

  const nameLabel = svg.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "-18em")
    .attr("font-size", 20)
    .attr("fill", "black");

  // Handle zoom on click.
  // ...

  // Handle zoom on click.
  function clicked(event, p) {
    parent.datum(p.parent || root);

    root.each(d => d.target = {
      x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      y0: Math.max(0, d.y0 - p.depth),
      y1: Math.max(0, d.y1 - p.depth)
    });

    const t = svg.transition().duration(750);

    // Transition the data on all arcs
    path.transition(t)
      .tween("data", d => {
        const i = d3.interpolate(d.current, d.target);
        return t => d.current = i(t);
      })
      .filter(function (d) {
        return +this.getAttribute("fill-opacity") || arcVisible(d.target);
      })
      .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
      .attr("pointer-events", d => arcVisible(d.target) ? "auto" : "none")
      .attrTween("d", d => () => arc(d.current));

    // Transition the labels
    label.filter(function (d) {
      return +this.getAttribute("fill-opacity") || labelVisible(d.target);
    }).transition(t)
      .attr("fill-opacity", d => +labelVisible(d.target))
      .attrTween("transform", d => () => labelTransform(d.current));

    // Show or hide the nameLabel based on whether there are children (subcategories) or parent
    nameLabel.transition().duration(750)
      .text(p.parent ? p.data.name : "")
      .attr("fill", color(p.data.name))
      .attr("opacity", p.parent ? 1 : 0);

    // Calculate the percentage for the clicked section
    const percentage = calculatePercentage(p.value, root.value);

    // Update the nameLabel text with the name and percentage
    nameLabel.transition().duration(750)
      .text(p.parent ? `${p.data.name} (${percentage})` : "")
      .attr("fill", color(p.data.name))
      .attr("opacity", p.parent ? 1 : 0);
  }

  function arcVisible(d) {
    return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
  }

  function labelVisible(d) {
    return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
  }

  function labelTransform(d) {
    const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
    const y = (d.y0 + d.y1) / 2 * radius;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }

  //Image
  svg.append("image")
    .attr("xlink:href", imageUrl)
    .attr("width", 250)
    .attr("height", 250)
    .attr("x", -120)
    .attr("y", -120);
}















