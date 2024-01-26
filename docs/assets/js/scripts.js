// Select the SVG element and get its width and height
var viewportWidth = window.innerWidth,
    viewportHeight = window.innerHeight;

var width = viewportWidth * 0.67,
height = viewportHeight * 0.35;
const parseTime = d3.timeParse("%Y");
duration = 3000;

margin = {
    top: height * 0.2,
    right: width * 0.15,
    bottom: height * 0.15,
    left: width * 0.25
}

// Adjust SVG transformation to account for margins
var svg = d3.select("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Append a title to the SVG
svg.append("text")
    .attr("x", width*0.5) // Position the title in the middle of the SVG
    .attr("y", -margin.top/2) // Position the title 20 units above the top margin
    .attr("text-anchor", "middle") // Anchor the text in the middle
    .attr("fill", "black")
    .style("font-size", "15px") // Set the font size
    .style("font-weight", "bold") // Set the font weight
    //.attr("transform", "rotate(-90, " + (width / 2) + ", " + (-height * 0.05) + ")") // Rotate the text vertically
    .text("Crime rates in Spain in the past years"); // Set the title text

// Define a custom color scale
var myColors = ["#1F0954", //Murders: dark blue
"#CCFF66", //Sexual Assault: soft green
"#123524", //Rape: dark green
"#f1c232", //Thefts: dark yellow
"#ffe599", //Burglaries: soft yellow
"#FF0000", //Violent Street Robberies: red
"#990000", //Violent Home Robberies: dark red
"#660000", //Violent Establishment Robberies: dark red
"#9D92F0"]; //Road Safety: red
var color = d3.scaleOrdinal(myColors);

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
// University data; https://www.universidades.gob.es/wp-content/uploads/2022/11/Datos_y_Cifras_2021_22.pdf
// GDP per capita data: https://www.ine.es/prensa/cre_2022.pdf
// Police data: https://www.newtral.es/numero-policias-espana-total-policia-nacional-guardia-civil/20211220/

var provinceInfo = {
  "Almería": { universities: 1, gdppc: 21464, police: 292.0},
  "Cádiz": { universities: 5, gdppc: 18114, police: 292.0},
  "Córdoba": { universities: 2, gdppc: 18838, police: 292.0},
  "Granada": { universities: 4, gdppc: 18537, police: 292.0},
  "Huelva": { universities: 1, gdppc: 20317, police: 292.0},
  "Jaén": { universities: 2, gdppc: 18791, police: 292.0},
  "Málaga": { universities: 4, gdppc: 18044, police: 292.0},
  "Sevilla": { universities: 5, gdppc: 20859, police: 292.0},
  "Huesca": { universities: 1, gdppc: 30295, police: 356.3},
  "Teruel": { universities: 1, gdppc: 25827, police: 356.3},
  "Zaragoza": { universities: 7, gdppc: 28679, police: 356.3},
  "Asturias": { universities: 4, gdppc: 23369, police: 326.2},
  "Balears (Illes)": { universities: 3, gdppc: 25420, police: 282.2},
  "Palmas (Las)": { universities: 4, gdppc: 19506, police: 309.8},
  "Santa Cruz de Tenerife": { universities: 1, gdppc: 19833, police: 309.8},
  "Cantabria": { universities: 4, gdppc: 23988, police: 272.5},
  "Albacete": { universities: 1, gdppc: 22438, police: 308.1},
  "Ciudad Real": { universities: 2, gdppc: 22039, police: 308.1},
  "Cuenca": { universities: 1, gdppc: 23383, police: 308.1},
  "Guadalajara": { universities: 1, gdppc: 20608, police: 308.1},
  "Toledo": { universities: 1, gdppc: 18641, police: 308.1},
  "Ávila": { universities: 2, gdppc: 20750, police: 392.1},
  "Burgos": { universities: 2, gdppc: 28942, police: 392.1},
  "León": { universities: 3, gdppc: 22698, police: 392.1},
  "Palencia": { universities: 1, gdppc: 27177, police: 392.1},
  "Salamanca": { universities: 5, gdppc: 22337, police: 392.1},
  "Segovia": { universities: 1, gdppc: 22519, police: 392.1},
  "Soria": { universities: 1, gdppc: 28621, police: 392.1},
  "Valladolid": { universities: 4, gdppc: 27595, police: 392.1},
  "Zamora": { universities: 1, gdppc: 21277, police: 392.1},
  "Barcelona": { universities: 18, gdppc: 30481, police: 85.4},
  "Girona": { universities: 2, gdppc: 27127, police: 85.4},
  "Lleida": { universities: 3, gdppc: 28598, police: 85.4},
  "Tarragona": { universities: 2, gdppc: 29617, police: 85.4},
  "Alicante": { universities: 5, gdppc: 19705, police: 258.2},
  "Castellón/Castelló": { universities: 1, gdppc: 27452, police: 258.2},
  "Valencia": { universities: 16, gdppc: 23647, police: 258.2},
  "Badajoz": { universities: 3, gdppc: 19012, police: 355.3},
  "Cáceres": { universities: 3, gdppc: 20354, police: 355.3},
  "La Coruña": { universities: 6, gdppc: 24457, police: 283.5},
  "Lugo": { universities: 1, gdppc: 22781, police: 283.5},
  "Ourense": { universities: 2, gdppc: 23357, police: 283.5},
  "Pontevedra": { universities: 2, gdppc: 23279, police: 283.5},
  "Madrid": { universities: 22, gdppc: 35380, police: 553.6},
  "Murcia": { universities: 4, gdppc: 21482, police: 222.8},
  "Navarra": { universities: 5, gdppc: 31042, police: 333.1},
  "Araba/Áraba": { universities: 2, gdppc: 38829, police: 159.2},
  "Vizcaya": { universities: 10, gdppc: 30848, police: 159.2},
  "Gipuzkoa": { universities: 3, gdppc: 32971, police: 159.2},
  "Rioja (La)": { universities: 1, gdppc: 26977, police: 454.8},
  "Ceuta": { universities: 0, gdppc: 21228, police: 1275.4},
  "Melilla": { universities: 0, gdppc: 18819, police: 1294.9}
};


var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

function generateProvinceText(province, showPopulation, showUniversities, showGDP, showPolice) {
  var provinceText = province;
  var info = provinceInfo[province];
  
  if (!info) {
      console.warn("No data found for province:", province);
      return provinceText;
  }

  var population = data.find(d => d.Place == province && d.Year.getFullYear() == 2022).Population;

  if (showPopulation && population > 1000000) {
      provinceText += " 🏙️";
  }
  if (showUniversities && info.universities > 3) {
      provinceText += " 📚";
  }
  if (showGDP && info.gdppc > 30000) {
      provinceText += " 💰";
  }
  if (showPolice && info.police > 400) {
      provinceText += " 👮";
  }

  return provinceText;
}
  

provinces.forEach(province => {
  var checkbox = document.createElement('input');
  checkbox.type = "checkbox";
  checkbox.name = "province";
  checkbox.value = province;
  checkbox.id = province;
  checkbox.checked = initialProvinces.includes(province);

  var label = document.createElement('label');
  label.htmlFor = province;
  
  // Add emojis based on conditions
  var provinceText = generateProvinceText(province, true, true, true, true);

  label.appendChild(document.createTextNode(provinceText));

  var container = document.getElementById('province-selectors');
  container.appendChild(checkbox);
  container.appendChild(label);
  container.appendChild(document.createElement('br'));

  // Convert label to D3 selection and add mouseover and mouseout handlers
  d3.select(label)
    .on("mouseover", function(event) {
        tooltip.transition()
            .duration(200)
            .style("opacity", .9);
        population = data.find(d => d.Place == province && d.Year.getFullYear() == 2022).Population;
        tooltip.html("Population: " + population + "<br/>" +
                    "Universities: " + provinceInfo[province].universities + "<br/>" +
                    "GDP per capita: " + provinceInfo[province].gdppc + "€" + "<br/>")
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    });
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

    // Append y-axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("font-size", 15)
        .style("font-weight", "bold")
        .attr("transform", "translate(" + (-30) + "," + (height / 2) + ")rotate(-90)")
        .text("Crimes per 1.000 inhabitants");
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
// Returns a map with the top n provinces and their crime rate, also the top n provinces with lowest crime rate, the rest are averaged
// For example, if n = 2, the map will contain 4 provinces: the 2 most dangerous, the 2 least dangerous and the average of the rest
function mostDangerousProvinces(crimeRatePerProvince, n=2) {
    if (crimeRatePerProvince.size <= 2*n) { // If there are less than 2*n provinces, return all of them sorted by crime rate
        return Array.from(crimeRatePerProvince, ([province, crimeRate]) => ({ province, crimeRate })).sort((a, b) => b.crimeRate - a.crimeRate);
    }
    // Else, we compute the top n provinces and the bottom n provinces, and average the rest
    var sortedProvinces = Array.from(crimeRatePerProvince, ([province, crimeRate]) => ({ province, crimeRate })).sort((a, b) => b.crimeRate - a.crimeRate);
    var topNProvinces = sortedProvinces.slice(0, n);
    var leastNProvinces = sortedProvinces.slice(-n);
    var otherProvinces = sortedProvinces.slice(n, -n);
    var averageCrimeRate = d3.mean(otherProvinces, d => d.crimeRate);

    all = topNProvinces.concat(leastNProvinces);

    // If there are no other provinces, return all
    if (otherProvinces.length == 0) {
        return all;
    }

    topNProvinces.push({province: "Rest", crimeRate: averageCrimeRate});
    return topNProvinces.concat(leastNProvinces);
}



// Function to handle text wrapping (split text into multiple lines if it exceeds the specified width)
function wrapText(text, width) {
  var lineHeight = 1.1; // ems
  text.each(function() {
      var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          y = text.attr("y"),
          dy = parseFloat(text.attr("dy")),
          tspan = text.text(null).append("tspan").attr("x", -margin.left + 24).attr("y", y).attr("dy", dy + "em");

      while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
              line.pop();
              tspan.text(line.join(" "));
              line = [word];
              tspan = text.append("tspan").attr("x", -margin.left + 24).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
          }
      }

      // Store the number of lines for each text
      text.attr("data-line-count", lineNumber + 1);
  });
}

// Function to draw the legend
function drawLegend(selectedCategories) {
  var maxWidth = margin.left * 0.7;
  var lineHeight = 20;
  var verticalSpacing = 0;

  var legend = svg.selectAll(".legend")
      .data(color.domain())
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => "translate(0," + i * 20 + ")")
      .style("cursor", "pointer") // Add pointer cursor on hover
      .on("click", function(event, d) {
          // Toggle category selection
          const index = selectedCategories.indexOf(d);
          if (index > -1) {
              selectedCategories.splice(index, 1); // Remove from array
          } else {
              selectedCategories.push(d); // Add to array
          }

          // Update checkboxes
          d3.select(`input[value='${d}']`).property("checked", !d3.select(`input[value='${d}']`).property("checked"));

          // Update chart
          updateChart();
      });

  legend.append("rect")
      .attr("x", -margin.left)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", d => selectedCategories.includes(d) ? color(d) : "#ccc"); // Conditional color

  legend.append("text")
        .attr("x", -margin.left + 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .style("font-size", "14px")
        .text(d => categoryTranslations[d])
        .style("fill", d => selectedCategories.includes(d) ? "black" : "#ccc")
        .call(wrapText, maxWidth);

    // Adjust vertical position based on the number of lines
    var cumulativeHeight = 0;
    legend.each(function(d, i) {
        var text = d3.select(this).select("text");
        var lineCount = text.attr("data-line-count");
        d3.select(this).attr("transform", "translate(0," + cumulativeHeight + ")");
        cumulativeHeight += lineHeight * lineCount + verticalSpacing; // Update cumulative height
    });
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

    var colors = ["#7e3a3a", // Worst: red
      "#FF7276", // Bad: soft red
      "#FFFFFF", // Average: white
      "#D9EAD3", // Good: soft green
      "#66CA3B"]; // Best: green

    var yScaleStacked = d3.scaleLinear()
        .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
        .range([height, 0]);

    var xScaleStacked = d3.scaleBand()
        .domain(["crimeRate"]) // Only one bar
        .range([width, width/100*115]) // Adjust the width of the bars
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
        .attr("x", width + margin.right/2.5)
        .attr("y", -margin.top/1.5)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .text("Crime rates summary");

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
    svg.selectAll("text").remove();

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

document.getElementById("emoji-population").addEventListener("change", function() {
  toggleEmojiDisplay();
});

document.getElementById("emoji-universities").addEventListener("change", function() {
  toggleEmojiDisplay();
});

document.getElementById("emoji-gdp").addEventListener("change", function() {
  toggleEmojiDisplay();
});

document.getElementById("emoji-police").addEventListener("change", function() {
  toggleEmojiDisplay();
});

function toggleEmojiDisplay(emoji) {
  var showPopulation = document.getElementById("emoji-population").checked;
  var showUniversities = document.getElementById("emoji-universities").checked;
  var showGDP = document.getElementById("emoji-gdp").checked;
  var showPolice = document.getElementById("emoji-police").checked;

  d3.selectAll("#province-selectors label").text(function() {
      var province = this.innerText.replace(" 🏙️", "").replace(" 📚", "").replace(" 💰", "").replace(" 👮", "");
      return generateProvinceText(province, showPopulation, showUniversities, showGDP, showPolice);
  }
  );
}

})

function add_population(data){
// Read the population data from spain_population_tidy.csv and add it to the variable data,
    // taking into account the year and the place
    d3.csv("./spain_population_tidy.csv", d => {
      return {
          Place: d.Place,
          Year: +d.Year,
          Population: +d.Population,
      }
    }).then(populationData => {
      //populationData.forEach(d => {
      //    d.Year = d3.timeParse("%Y")(d.Year);
      //});
      console.log("Population data:", populationData)
      data.forEach(d => {
        const populationRecord = populationData.find(populationEntry => populationEntry.Place == d.Place && populationEntry.Year == d.Year);
        if (populationRecord) {
            d.Population = populationRecord.Population;
        } else {
            // Handle the case where no matching population data is found
            // You might want to set Population to a default value or log a warning
            console.warn(`No population data found for Place: ${d.Place}, Year: ${d.Year}`);
            d.Population = null; // or some default value
        }
    });
  });
  return data;
}

d3.csv("./spain_tidy_subcategories.csv", d => {
    return {
        Place: d.Place,
        Category: d.Category,
        SubCategory: d.SubCategory,
        Year: +d.Year,
        Amount: +d.Amount,
        Population: 0,
        date: parseTime(d.Year)
    }
  }).then(data => {

      // Drop rows with Place in [Abroad, Desconocida]
      data = data.filter(d => d.Place != "Abroad" && d.Place != "Desconocida");   

      console.log(data);
      //data.forEach(d => console.log(typeof d));
  
      /* Data Manipulation in D3 
        Ref: https://observablehq.com/@d3/d3-extent?collection=@d3/d3-array */
  
      // Get the minimum and maximum of the percent pay gap
      // console.log(d3.min(data, d => d.value));
      // console.log(d3.max(data, d => d.value));
      // console.log(d3.extent(data, d => d.value));

      //console.log("Data prev:", data[0]);
      data = add_population(data)
      console.log("Data aft:", data[0]);
  
      // Filter the data from the year 2020
      let newData = data.filter(d => d.Year === 2020);
      console.log(newData);

      console.log("Data:", data[0]);
      // Print fields of the first element
      console.log("Fields of the first element:", Object.keys(data[0]));
      console.log("Values of the first element:", Object.values(data[0]));
  
      //Data for the bar chart
      // Calculate the total crimes and total population by place and year
      const totalCrimesByPlaceAndYear = d3.rollup(data, v => d3.sum(v, d => d.Amount), d => d.Place, d => d.Year);
      const totalPopulationByPlaceAndYear = d3.rollup(data, v => d3.mean(v, d => d.Population), d => d.Place, d => d.Year);

      console.log("Total Crimes by Place and Year:", totalCrimesByPlaceAndYear);
      console.log("Total Population by Place and Year:", totalPopulationByPlaceAndYear);

      // Calculate the average crime rate per place
      const avgCrimeRatePerPlace = Array.from(totalCrimesByPlaceAndYear, ([place, years]) => {
          return {
              Place: place,
              AvgCrimeRate: Array.from(years).reduce((acc, [year, totalCrimes]) => {
                  const totalPopulation = totalPopulationByPlaceAndYear.get(place).get(year) || 0;
                  return acc + (totalPopulation ? (totalCrimes / totalPopulation) * 1000000 : 0);
              }, 0) / years.size
          };
      });

      // Sort the places by the average crime rate in descending order
      avgCrimeRatePerPlace.sort((a, b) => b.AvgCrimeRate - a.AvgCrimeRate);

      console.log("Average Crime Rate per Place:", avgCrimeRatePerPlace);
  
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
      createBarChart(avgCrimeRatePerPlace);

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
        } else if (randomValue >= 0.4 && randomValue < 0.7) {
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
    const imageUrl = "assets/images/map.png";
  
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