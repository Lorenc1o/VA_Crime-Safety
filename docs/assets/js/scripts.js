// Select the SVG element and get its width and height
var width = 1000,
height = 300;
const parseTime = d3.timeParse("%Y");
duration = 3000;

margin = {
    top: height * 0.1,
    right: width * 0.15,
    bottom: height * 0.1,
    left: width * 0.3
}

// Adjust SVG transformation to account for margins
var svg = d3.select("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Append a title to the SVG
svg.append("text")
    .attr("x", width/3) // Position the title in the middle of the SVG
    .attr("y", height*-1.85) // Position the title 20px from the top of the SVG
    .attr("text-anchor", "middle") // Anchor the text in the middle
    .attr("fill", "black")
    .style("font-size", "15px") // Set the font size
    .style("font-weight", "bold") // Set the font weight
    .attr("transform", "rotate(-90, " + (width / 2) + ", " + (-height * 0.05) + ")") // Rotate the text vertically
    .text("Crimes per 1.000 inhabitants"); // Set the title text


// Define a color scale
var color = d3.scaleOrdinal(d3.schemeCategory10);

// Define categories
var categoriesToInclude = [
    "    1.1.-Homicidios dolosos/asesinatos", 
    "    3.1.-Agresión sexual", 
    "    3.2.-Agresión sexual con penetración", 
    "    5.1.-Hurtos", 
    "    5.2.-Robos con fuerza en las cosas", 
    "    5.3.1.-Robos con violencia en vía pública", 
    "    5.3.2.-Robos con violencia en viviendas", 
    "    5.3.3.-Robos con violencia en establecimientos", 
    "    6.2.-Contra la seguridad vial"];

var categoryTranslations = {
    "    1.1.-Homicidios dolosos/asesinatos": "Murder",
    "    3.1.-Agresión sexual": "Sexual Assault",
    "    3.2.-Agresión sexual con penetración": "Rape",
    "    5.1.-Hurtos": "Thefts",
    "    5.2.-Robos con fuerza en las cosas": "Burglaries",
    "    5.3.1.-Robos con violencia en vía pública": "Violent Street Robberies",
    "    5.3.2.-Robos con violencia en viviendas": "Violent Home Robberies",
    "    5.3.3.-Robos con violencia en establecimientos": "Violent Establishment Robberies",
    "    6.2.-Contra la seguridad vial": "Road Safety"
};


categoriesToInclude.forEach(category => {
    var checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.name = "category";
    checkbox.value = category;
    checkbox.id = category;
    checkbox.checked = true;

    var label = document.createElement('label');
    label.htmlFor = category;
    label.appendChild(document.createTextNode(categoryTranslations[category]));

    var container = document.getElementById('category-selectors');
    container.appendChild(checkbox);
    container.appendChild(label);
    container.appendChild(document.createElement('br'));
});

function computeCrimeRateLastYearPerProvince(data, selectedCategories, selectedProvinces) {
  var lastYear = d3.max(data, d => d.Year);
  var filteredData = data.filter(d => selectedCategories.includes(d["Crime Category"]) && selectedProvinces.includes(d.Place) && d.Population > 0 && d.Year.getFullYear() == lastYear.getFullYear());
  var aggregatedData = d3.rollup(filteredData, 
      v => d3.sum(v, d => d.Amount) / d3.max(v, d => d.Population) * 1000, // Compute the crime rate per 1000 inhabitants
      d => d.Place
  );
  return aggregatedData;
}

function computeCrimeRatePerProvince(data) {
  var aggregatedData = d3.rollup(data, 
      v => d3.sum(v, d => d.Amount) / d3.max(v, d => d.Population) * 1000, // Compute the crime rate per 1000 inhabitants
      d => d.Place
  );
  return aggregatedData;
}



// Load the data
d3.csv("data.csv").then((data) => {
// Parse the data
data.forEach(d => {
    d.Year = d3.timeParse("%Y")(d.Year);
    d.Amount = +d.Amount;
    d.Province = d.Place;
    d.Population = +d.Population;
});

const provinces = Array.from(new Set(data.map(d => d.Place)));
console.log("Provinces:", provinces);
// From provinces, remove: 'Total Nacional', 'En el extranjero', 'Desconocida', 'TOTAL INFRACCIONES PENALES' and 'Notas'
const provincesToRemove = ['Total Nacional', 'En el extranjero', 'Desconocida', '    TOTAL INFRACCIONES PENALES', 'Notas:'];
provincesToRemove.forEach(province => {
    const index = provinces.indexOf(province);
    if (index > -1) {
        provinces.splice(index, 1);
    }
});

initialProvinces = ['Madrid', 'Barcelona', 'Murcia']

// Create checkboxes for provinces
provinces.forEach(province => {
    var checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.name = "province";
    checkbox.value = province;
    checkbox.id = province;
    checkbox.checked = initialProvinces.includes(province);

    var label = document.createElement('label');
    label.htmlFor = province;
    label.appendChild(document.createTextNode(province));

    var container = document.getElementById('province-selectors');
    container.appendChild(checkbox);
    container.appendChild(label);
    container.appendChild(document.createElement('br'));
});

// Function to process the data
function processData(data, categoriesToInclude, provincesToInclude){
    var filteredData = data.filter(d => categoriesToInclude.includes(d["Crime Category"]) && provincesToInclude.includes(d.Place) && d.Population > 0);
    // We compute the population in the selected provinces, noticing that there can be multiple entries for the same province and year
    var populationPerYear = d3.rollup(filteredData,
        v => d3.sum(Array.from(d3.group(v, d => d.Place + d.Year.getFullYear()).values(), arr => arr[0].Population)),
        d => d.Year.getFullYear()
    );    

    // We compute the crime rate per 1000 inhabitants in the selected provinces for each year
    var aggregatedData = d3.rollup(filteredData,
        (v) => {
            // For each group (crime category and year), calculate the crime rate
            return d3.rollup(v,
                (vv) => {
                    // Calculate total crimes for the group
                    const totalCrimes = d3.sum(vv, d => d.Amount);
                    // Retrieve the population for the year of the current group
                    const year = vv[0].Year.getFullYear();
                    const population = populationPerYear.get(year);
                    // Calculate and return the crime rate per 1000 inhabitants
                    return population ? (totalCrimes / population) * 1000 : 0;
                },
                d => d.Year.getFullYear() // Group by year within each crime category
            );
        },
        d => d["Crime Category"] // Group by crime category
    );
    

    console.log("Aggregated Data:", aggregatedData);

    return aggregatedData;
}

// Function to create scales
function createScales(data) {
    var allYears = Array.from(data.values()).flatMap(map => Array.from(map.keys()));
    // Unique years
    allYears = Array.from(new Set(allYears));
    console.log("All Years Raw:", allYears); // Check the raw year values
    const xScale = d3.scaleLinear().domain(d3.extent(allYears)).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, d3.max(data, ([, yearMap]) => d3.max(yearMap.values()))]).range([height, 0]);

    console.log(xScale.domain(), xScale.range());

    const line = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.amount));

    const xAxis = d3.axisBottom(xScale); // Format ticks to show years
    const yAxis = d3.axisLeft(yScale);

    return {xScale, yScale, xAxis, yAxis, line};
}

// Function to draw axes
function drawAxes(xAxis, yAxis) {
    svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

    svg.append("g")
    .call(yAxis);

    // Append x-axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("font-size", 15)
        .style("font-weight", "bold")
        .attr("transform", "translate(" + (width / 2) + "," + (height + 30) + ")")
        .text("Year");

}

// Function to create lines for each category
function drawCategoryLines(aggregatedData, line) {
    aggregatedData.forEach((yearMap, category) => {
    const dataArray = Array.from(yearMap, ([year, amount]) => ({ year: new Date(year), amount }));
    
    svg.append("path")
        .datum(dataArray)
        .attr("fill", "none")
        .attr("stroke", color(category))
        .attr("stroke-width", 2)
        .attr("d", line);
    });
}

// Function to compute the most dangerous provinces
// Returns a map with the top n provinces and their crime rate, and the rest of the provinces grouped in "Rest", with their average crime rate
function mostDangerousProvinces(crimeRatePerProvince, n=2) {
    var sortedProvinces = Array.from(crimeRatePerProvince, ([province, crimeRate]) => ({ province, crimeRate })).sort((a, b) => b.crimeRate - a.crimeRate);
    var topNProvinces = sortedProvinces.slice(0, n);
    var otherProvinces = sortedProvinces.slice(n);
    var averageCrimeRate = d3.mean(otherProvinces, d => d.crimeRate);

    // If there are no other provinces, return the top n provinces
    if (otherProvinces.length == 0) {
        return topNProvinces;
    }

    var otherProvincesMap = new Map();
    otherProvinces.forEach(d => otherProvincesMap.set(d.province, averageCrimeRate));
    topNProvinces.push({province: "Rest", crimeRate: averageCrimeRate});
    console.log("Top N Provinces:", topNProvinces);
    return topNProvinces;
}

// Function to draw the legend
function drawLegend(selectedCategories) {
    var legend = svg.selectAll(".legend")
    .data(color.domain().filter(d => selectedCategories.includes(d)))
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => "translate(0," + i * 20 + ")");

    legend.append("rect")
    .attr("x", -margin.left)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", color);

    legend.append("text")
    .attr("x", -margin.left + 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "start")
    .style("font-size", "14px")
    .text(d => categoryTranslations[d]);
}

function drawStackedBarChart(data, selectedCategories, selectedProvinces) {
    var crimeRatePerProvince = computeCrimeRateLastYearPerProvince(data, selectedCategories, selectedProvinces.map(d => d.value));
    var stackedData = mostDangerousProvinces(crimeRatePerProvince, 2);

    // Now we draw a stacked bar chart with the crime rate per province (a single bar having all provinces)
    var keys = stackedData.map(d => d.province);
    console.log("Keys:", keys);
    var transformedStackedData = [{name: "crimeRate"}];
    stackedData.forEach(d => {
        transformedStackedData[0][d.province] = d.crimeRate;
    });

    console.log("Stacked Data:", transformedStackedData);

    // Stack the data in ascending order
    var stack = d3.stack().keys(keys).order(d3.stackOrderAscending).offset(d3.stackOffsetNone);

    var series = stack(transformedStackedData);

    console.log("Series:", series);

    var colors = ["#BAE3F2", "#C9F2EB", "#E6FCED"]; 

    var yScaleStacked = d3.scaleLinear()
        .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
        .range([height, 0]);

    var xScaleStacked = d3.scaleBand()
        .domain(["crimeRate"])
        .range([width, width/10*11])
        .padding(0.1);

    var color = d3.scaleOrdinal()
        .domain(keys)
        .range(colors);

    svg.append("g")
        .selectAll("g")
        .data(series)
        .enter().append("g")
            .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .enter().append("rect")
            .attr("x", (d, i) => xScaleStacked("crimeRate"))
            .attr("y", d => yScaleStacked(d[1]))
            .attr("height", d => yScaleStacked(d[0]) - yScaleStacked(d[1]))
            .attr("width", xScaleStacked.bandwidth());

    svg.append("g")
    .selectAll("g")
    .data(series)
    .enter().append("g")
    .attr("transform", d => `translate(${xScaleStacked("crimeRate") + xScaleStacked.bandwidth() / 2}, ${yScaleStacked(d[0][1]) + (yScaleStacked(d[0][0]) - yScaleStacked(d[0][1])) / 2})`)
    .each(function(d) {
        d3.select(this).append("text")
            .attr("text-anchor", "middle")
            //.attr("transform", "rotate(-90)")
            .attr("dy", "-0.35em") // Adjust for spacing
            .attr("fill", "black")
            .text(d.key);

        d3.select(this).append("text")
            .attr("text-anchor", "middle")
            //.attr("transform", "rotate(-90)")
            .attr("dy", "0.7em") // Adjust for spacing
            .attr("fill", "black")
            .text((d[0][1] - d[0][0]).toFixed(2));
    });

    // Add title
    svg.append("text")
        .attr("x", width + margin.right/3)
        .attr("y", -margin.top/1.5)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .text("Most dangerous provinces");

    // Add subtitle
    svg.append("text")
        .attr("x", width + margin.right/3)
        .attr("y", -margin.top/1.5 + 15)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text("(Crimes per 1000 inhabitants in 2022)");
}

// Function to update the chart
function updateChart() {
    var selectedCategories = d3.selectAll("input[name='category']:checked").nodes()
    .map(d => d.value);

    var selectedProvinces = d3.selectAll("input[name='province']:checked").nodes()

    // Filter the aggregated data based on selected categories
    var filteredData = processData(data, selectedCategories, selectedProvinces.map(d => d.value));

    // Clear the existing elements
    svg.selectAll("path").remove();
    svg.selectAll(".legend").remove();
    svg.selectAll("g").remove();

    // Redraw lines and legend
    const {xScale, yScale, xAxis, yAxis, line} = createScales(filteredData);
    drawAxes(xAxis, yAxis);
    drawCategoryLines(new Map(filteredData), line);
    drawLegend(selectedCategories);  
    drawStackedBarChart(data, selectedCategories, selectedProvinces);  
}

updateChart();

d3.selectAll("input[name='category']").on("change", updateChart);
d3.selectAll("input[name='category'], input[name='province']").on("change", updateChart);

document.getElementById("select-all-categories").addEventListener("click", function() {
    document.querySelectorAll("#category-selectors input[type='checkbox']").forEach(function(checkbox) {
        checkbox.checked = true;
    });
    updateChart();
});

document.getElementById("deselect-all-categories").addEventListener("click", function() {
    document.querySelectorAll("#category-selectors input[type='checkbox']").forEach(function(checkbox) {
        checkbox.checked = false;
    });
    updateChart();
});

document.getElementById("select-all-provinces").addEventListener("click", function() {
    document.querySelectorAll("#province-selectors input[type='checkbox']").forEach(function(checkbox) {
        checkbox.checked = true;
    });
    updateChart();
});

document.getElementById("deselect-all-provinces").addEventListener("click", function() {
    document.querySelectorAll("#province-selectors input[type='checkbox']").forEach(function(checkbox) {
        checkbox.checked = false;
    });
    updateChart();
});

})

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
  
  const provinces = data.map(d=> d.Place);
  const uniqueProvinces = Array.from(new Set(provinces));
  const colors = d3.scaleOrdinal().domain(uniqueProvinces).range(d3.quantize(d3.interpolateRainbow, uniqueProvinces.length));
 

  const normalizedColorScale = d3.scaleSequential(d3.interpolateRgb("white","red"))
  .domain([0, d3.max(data, d => d.Amount)/2]);

  
      //Plot Sunburst
      createSunburstChartZoomable2(transformedData);
      
      // Plot the bar chart
      createBarChart(dataArrayByPlace);

      createPieChart(80.4, '.pie-chart-container');
  
      // Call the drawSpainMap function
      //drawSpainMap(); 


      document.getElementById('testButton').addEventListener('click', function () {
        // Disable the button
        this.disabled = true;

        // Add 'clicked' class to initiate button animation
        this.classList.add('clicked');
      
        // Start sunburst spin animation
        document.getElementById('sunburst-container').style.animation = 'spin 3s linear';
      
        // Select all bars and apply the color change
        var bars = document.querySelectorAll('#bar rect');
      
        // Store the original colors
        var originalColors = Array.from(bars, bar => bar.style.fill);
      
        // Get the total number of bars
        const numBars = bars.length;
      
        // Create a function to update bar colors
        function updateBarColors() {
          bars.forEach(function (bar) {
            // Generate a random color
            const randomColor = getRandomColor();
            bar.style.fill = randomColor;
          });
        }
      
        // Call the function to update bar colors every 500 milliseconds
        var interval = setInterval(updateBarColors, 100);
      
        // Reset animations after 3 seconds
        setTimeout(function () {
          document.getElementById('testButton').classList.remove('clicked');
          document.getElementById('sunburst-container').style.animation = '';
      
          // Stop the color-changing interval
          clearInterval(interval);
      
          // Restore original bar colors
          bars.forEach(function (bar, i) {
            bar.style.fill = originalColors[i];
          });

          // Enable the button
          document.getElementById('testButton').disabled = false;

          // Display the image based on probabilities
          displayLuckResult();
        }, 3000);
      });
      
      // Function to generate a random color
      function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      }

      function displayLuckResult() {
        const overlay = document.getElementById("overlay");
      
        // Get a random value between 0 and 1
        const randomValue = Math.random();
      
        // Use probabilities to determine which image to display
        let imageUrl;
        if (randomValue < 0.4) {
          imageUrl = "assets/Rullet/lottery_luck.gif";
        } else if (randomValue < 0.3) {
          imageUrl = "assets/Rullet/patrimony_luck.gif";
        } else {
          imageUrl = "assets/Rullet/safe_luck.png";
        }
      
        // Display the selected image in the overlay
        const imageElement = document.createElement("img");
        imageElement.src = imageUrl;
        overlay.innerHTML = "";
        overlay.appendChild(imageElement);
        
      
        // Show the overlay
        overlay.style.display = "flex";
      }
      
      // Add an event listener to close the overlay when clicked
      document.getElementById("overlay").addEventListener("click", function () {
        this.style.display = "none";
      });
      
  
  });

  function calculatePercentage(value, total) {
    return ((value / total) * 100).toFixed(2) + "%";
  }

  function createSunburstChartZoomable2(data){
    const width = 1000, height = 1000;
    const imageUrl = "map.png";
  
    // Specify the chart’s colors and approximate radius (it will be adjusted at the end).
    const color = d3.scaleOrdinal(d3.quantize(d3.interpolateSinebow, data.children.length + 1));
    //const color = d3.scaleOrdinal(d3.schemeSet1); // You can use other color schemes as well

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
      .style("color", "white")
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
      .attr("font-size", 14)
      .attr("fill", "black")
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

  const createBarChart = (data) => {
    const width = 1000, height = 1000;
    const margins = { top: 10, right: 30, bottom: 140, left: 50 };
  
    const svg = d3.select("#bar")
      .append("svg")
      .attr("viewBox", [0, -50, width+100, height]);
  
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.Place))
      .range([margins.left, width - margins.right])
      .padding(0.2);
  
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.Amount)])
      .range([height - margins.bottom, margins.top]);
  
    console.log("yScale domain:", yScale.domain());
  
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d3.format(".2s"));
  
    const yGroup = svg.append("g")
      .attr("transform", `translate(${margins.left}, 0)`)
      .call(yAxis)
      .call(g => g.select(".domain").remove());
  
    const normalizedColorScale = d3.scaleSequential(d3.interpolateRgb("white","red"))
      .domain([0, d3.max(data, d => d.Amount)/2]);
  
    let bar = svg.append("g")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", d => xScale(d.Place))
      .attr("y", d => yScale(d.Amount))
      .attr("width", d => xScale.bandwidth())
      .attr("height", d => height - margins.bottom - yScale(d.Amount))
      .attr("fill", d => normalizedColorScale(d.Amount));
  
    svg.append("g")
      .selectAll("text")
      .data(data)
      .join("text")
      .text(d => d.Amount)
      .attr("x", d => xScale(d.Place) + xScale.bandwidth() + 30)
      .attr("y", d => yScale(d.Amount) - 15)
      .attr("dy", "1em")
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", d => normalizedColorScale(d.Amount))
      .attr("transform", d => `rotate(-65 ${xScale(d.Place) + xScale.bandwidth() / 2},${yScale(d.Amount)})`);
  
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
  };
  
  function createPieChart(percentage, containerSelector) {
    const data = [percentage, 100 - percentage];
  
    const width = 200;
    const height = 200;
    const radius = Math.min(width, height) / 2;
  
    const color = d3.scaleOrdinal()
      .range(['#02c40a', '#c4c4c4']);
  
    const pie = d3.pie();
    const arc = d3.arc().innerRadius(0).outerRadius(radius);
  
    const svg = d3.select(containerSelector)
      .append('svg')
      .attr('width', width )
      .attr('height', height + 30)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2 + margin.top})`);
  
    const arcs = svg.selectAll('arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');
  
    arcs.append('path')
      .attr('d', arc)
      .attr('fill', (d, i) => color(i));
  
    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '15px')
      .attr('fill', 'white')
      .text(d => `${d.data.toFixed(1)}%`);
  }

  

  