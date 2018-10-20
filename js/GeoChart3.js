function upper(word) {
    return word.substr(0, 1).toUpperCase() + word.substr(1);
}
String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
};
function titleCaps(input) {
    var r = '', i = 0, splitInput = input.split(' ');
    for (i = 0; i < splitInput.length; i++) {
        r += (splitInput[i] === 'the' || splitInput[i] === 'of' || splitInput[i] === 'and' || splitInput[i][1] === "'" ? splitInput[i] : upper(splitInput[i])) + ' ';
    }
    return r.replace(/\s$/, "");
}

var Histogram = {}, GeoChart = {};
Histogram = {
    currentHistograms: 0,
    drawAxisLabels: function (xAxisSpace, yAxisSpace, xLabel, yLabel) {
        xAxisSpace
            .append("text")
            .attr("x", GeoChart.divSize.width)
            .attr("y", -15)
            .attr("text-anchor", "end")
            .attr("fill", "#777")
            .text(xLabel);
        yAxisSpace
            .append("text")
            .attr("x", -5)
            .attr("y", 12)
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("fill", "#777")
            .text(yLabel);
    },
    getHistObject: function (histogram, normalize) {
        var histObject = [];
        histogram.split(';').forEach(function (d) {
            var e = d.split(':');
            histObject.push({ label: e[0], count: e[1] });
        });
        if (normalize) {
            histObject = Histogram.normalizeHistogram(histObject);
        }
        return histObject;
    },
    drawXAxisMarker: function (xAxisSpace, scale, val, label, height) {
        xAxisSpace
                .append('line')
                .attr("x1", scale(val)).attr("x2", scale(val))
                .attr("y1", 0).attr("y2", 20)
                .style("stroke", "red")
                .attr("class", "tick");
        xAxisSpace.append('text')
                .attr("x", scale(val))
                .attr("y", 29)
                .style("text-anchor", "middle")
                .attr("fill", "red")
                .text(label);
    },
    normalizeHistogram: function (input) {
        var output = [];
        var total = d3.sum(input, function (d) { return d.count; });
        input.forEach(function (d) {
            output.push({ label: d.label, count: +d.count / total });
        });
        return output;
    },
    createNormalizeButton: function (targetDiv) {
        var normalizeDiv = d3.select(targetDiv).append("div").attr("class", "normalizeDiv").style("border", "1px solid black");
        normalizeDiv
            .style("background", "#ddd")
            .style("cursor", "pointer")
            .on("mouseover", function () {
                d3.select(this).style("background", "#999");
            })
            .on("mouseout", function () {
                d3.select(this).style("background", "#ddd");
            });
        normalizeDiv.append("p").text(GeoChart.drawNormalized ? "View raw counts" : "View percentages");
        normalizeDiv
            .on("click", function () {
                d3.select(this)
                .style("background", GeoChart.drawNormalized ? "#ddd" : "#999");
                GeoChart.drawNormalized = !GeoChart.drawNormalized;
                Histogram.drawHistogram(GeoChart.histogramParamsList, '#histogram', GeoChart.drawNormalized);
            });
    },
    drawHistogram: function (histogramParamList, targetDiv, normalize) {
        d3.selectAll(targetDiv + ' *').remove();
        if (histogramParamList.length > 0) {
            var title = 'Page load times for \n' + histogramParamList[0].name;
            var histObjects = [];
            title += (histogramParamList.length > 1) ? (' and ' + histogramParamList[1].name) : '';
            Histogram.createNormalizeButton(targetDiv);
            var availableWidth = parseInt(d3.select("#histogram").style("width"));          // not sure this is the best way to get width; only works because parseInt() ignores the "px" at the end
            GeoChart.divSize.width = availableWidth;
            GeoChart.histogramSize.width = GeoChart.divSize.width - GeoChart.padding.left;
            var chartSpace = GeoChart.drawChartSpace(targetDiv, GeoChart.histogramSize);            
            histogramParamList.forEach(function (d) {
                histObjects.push(Histogram.getHistObject(d.histogram, normalize));
            });
            var histObject = d3.merge(histObjects);

            var verticalScale = d3.scale.linear()
                    .domain([0, d3.max(histObject, function (d) { return parseFloat(d.count); })])
                    .range([GeoChart.histogramSize.height, 0]);
            var horizontalScale = d3.scale.linear()
                    .domain([d3.min(histObject, function (d) { return parseFloat(d.label.split('-')[0]); }), d3.max(histObject, function (d) { return parseFloat(d.label.split('-')[1]); })])
                    .range([GeoChart.padding.left, GeoChart.divSize.width]);
            var xAxis = d3.svg.axis()
                    .scale(horizontalScale)
                    .orient("bottom");
            var yAxis = d3.svg.axis()
                    .scale(verticalScale)
                    .orient("left")
                    .tickFormat(normalize ? d3.format("%") : null);
            var xAxisSpace = chartSpace
                    .append("g")
                    .attr("class", "axis")
                    .attr("transform", "translate(" + "0," + (GeoChart.histogramSize.height + 3) + ")")
                    .call(xAxis);
            var yAxisSpace = chartSpace
                    .append("g")
                    .attr("class", "axis")
                    .attr("transform", "translate(" + (GeoChart.padding.left - 3) + ",0)")
                    .call(yAxis);
            Histogram.drawAxisLabels(xAxisSpace, yAxisSpace, "Milliseconds", normalize ? "Percent" : "Count");
            //Histogram.drawXAxisMarker(xAxisSpace, horizontalScale, histogramParams.average, "Avg", -200);
            //Histogram.drawXAxisMarker(xAxisSpace, horizontalScale, histogramParams.P90, "90th", -200);
            //Histogram.drawXAxisMarker(xAxisSpace, horizontalScale, histogramParams.P95, "95th", -200);
            chartSpace
                    .append("text")
                    .attr("class", "subtitle")
                    .attr("y", 20)
                    .attr("x", GeoChart.divSize.width / 2)
                    .style("font-family", '"Gill Sans", "Trebuchet MS", Calibri, sans-serif')
                    .text(title);
            chartSpace
                    .append("text")
                    .attr("class", "histogramBarLegend")
                    .attr("y", 40)
                    .attr("x", GeoChart.divSize.width / 2)
                    .text("");
            Histogram.renderHistogram(histObjects[0], 'blue', horizontalScale, verticalScale, chartSpace);
            if (histObjects.length === 2) {
                Histogram.renderHistogram(histObjects[1], 'red', horizontalScale, verticalScale, chartSpace);
            }
        }
    },
    renderHistogram: function (histObject, color, horizontalScale, verticalScale, histogramSpace) {
        var histogramBars = histogramSpace
                .selectAll('rect')
                .data(histObject, function (d) { return d; })
                .enter()
                .append('rect')
                .attr('x', function (d) { return horizontalScale(d.label.split('-')[0]); })
                .attr('y', function (d) { return verticalScale(d.count); })
                .attr('height', function (d) { return GeoChart.histogramSize.height - verticalScale(d.count); })
                .attr('fill', color)
                .attr('fill-opacity', '0.5')
                .attr('stroke', 'black')
                .attr('stroke-opacity', '1.0')
                .attr('width', function (d) { var r = d.label.split('-'); return horizontalScale(r[1]) - horizontalScale(r[0]); });
        //var barTransition = histogramBars
        //    .transition()
        //    .attr('height', function (d) { return GeoChart.histogramSize.height - verticalScale(d.count); });

        histogramBars
        .on("mouseover", function (d) {
            d3.select(this).attr('fill-opacity', '1.0');
            d3.select(".histogramBarLegend").text(Histogram.formatBarLabel(d.label) + ": " + (GeoChart.drawNormalized ? d3.format(".3%")(d.count) : d.count));
        })
        .on("mouseout", function () {
            d3.select(".histogramBarLegend").text("");
            d3.select(this).attr('fill-opacity', '0.5');
        });
    },
    formatBarLabel: function (label) {
        return parseInt(label.split('-')[0]) + ' ms - ' + parseInt(label.split('-')[1]) + ' ms';
    }
};

var DataTable = {
    currRows: 0,
    rowHeaders: ['Average (ms)', 'Minimum (ms)', 'Maximum (ms)', '90th percentile (ms)', '95th percentile (ms)', 'Total requests'],
    propertyList: ['average', 'min', 'max', 'P90', 'P95', 'count'],
    removeColumn: function (country) {
        if (DataTable.currRows > 1) {
            d3.selectAll("[column='" + country + "']").remove();
            DataTable.currRows--;
        }
    },
    removeTable: function () {
        d3.select("div#data table").remove();
        DataTable.currRows = 0;
    },
    addColumn: function (stats) {
        var dataDiv = d3.select("div#data");
        var dataTable = d3.select("div#data table");
        if (dataTable.empty()) {
            dataTable = dataDiv.append("table").attr("class", "dataTable");
            var header = dataTable.append("tr");
            header.append("th").text("").attr("class", "dataTableHeader");
            header.append("th").text(stats.name).attr("column", stats.name).attr("class", "dataTableColumn");
            var i = 0;
            for (i = 0; i < DataTable.rowHeaders.length; i++) {
                var currRow = dataTable.append("tr");
                currRow.append("td").text(DataTable.rowHeaders[i]).attr("class", "dataTableHeader");
                currRow.append("td").text(stats[DataTable.propertyList[i]]).attr("column", stats.name).attr("class", "dataTableColumn");
            }
            DataTable.currRows = 2;
        }
        else if (DataTable.currRows === 2) {
            d3.selectAll("table.dataTable tr")[0].forEach(function (d, i) {
                var newCell = document.createElement(i === 0 ? "th" : "td");
                newCell.textContent = i === 0 ? stats.name : stats[DataTable.propertyList[i - 1]];
                newCell.setAttribute('column', stats.name);
                newCell.setAttribute('class', 'dataTableColumn');
                d.appendChild(newCell);
            });
            DataTable.currRows++;
        }
    }
};

GeoChart = {
    MIN_THRESHOLD: 2000,
    MAX_THRESHOLD: 6000,
    MIN_GRADIENT_COLOR: 'green',    // lower bound threshold color.
    MAX_GRADIENT_COLOR: 'darkred',  // upper bound threshold color.
    COLUMN_TO_CHART: 'Average',
    divSize: { width: 0, height: 314 },
    padding: { left: 50, bottom: 50, right: 10, top: 10 },
    anchor1: null,
    anchor2: null,
    drawNormalized: false,
    parsedData: '',
    histogramParamsList: [],
    chartData: {},
    init: function () {
        GeoChart.histogramSize = { width: 0, height: GeoChart.divSize.height - GeoChart.padding.bottom };
        GeoChart.initLegend();
    },
    initLegend: function () {
        d3.select('#legend_row1').text('<= ' + GeoChart.MIN_THRESHOLD + ' msec');
        d3.select('#legend_row2').text('> ' + GeoChart.MIN_THRESHOLD + ' msec, <= ' + GeoChart.MAX_THRESHOLD + ' msec');
        d3.select('#legend_row3').text('> ' + GeoChart.MAX_THRESHOLD + ' msec');
        d3.select('#legend_row4').text('Not enough samples');
    },
    drawChartSpace: function (div, svgSize) {
        var chartSpace = d3.select(div);
        if (!d3.select('div #svgChart')[0][0]) {
            chartSpace = chartSpace
                .append("svg")
                .attr("id", "svgChart")
                .attr("height", GeoChart.divSize.height)
                .attr("width", GeoChart.divSize.width);
        }
        return chartSpace;
    },
    layoutPage: function () {
        var histogramDataFile = getUrlVars()['f'] || 'PageLoadTimeHistograms';
        var path = window.location.pathname;
        var pathName = path.substring(0, path.lastIndexOf('/') + 1);
        histogramDataFile = pathName + 'data/PageLoadTimeHistograms_V1.txt';
        d3.text(histogramDataFile + '?' + Math.floor(Math.random() * 1000), function (contents) {
            GeoChart.parsedData = d3.tsv.parse(contents);
            var timeRange = null;
            GeoChart.parsedData.forEach(function (d) {
                if (!timeRange) {
                    timeRange = d['TimeRange'];
                }
                GeoChart.chartData[d.Country] = { Count: +d['Count'], Average: +d['Average'], Histogram: d['Histogram'], P90: d['P90'], P95: d['P95'] };
            });
            d3.select("#LoadingIndicator").text(timeRange);
            var colorScale = d3.scale.linear()
            .domain([GeoChart.MIN_THRESHOLD, GeoChart.MAX_THRESHOLD])
            .range([GeoChart.MIN_GRADIENT_COLOR, GeoChart.MAX_GRADIENT_COLOR]);
            d3.selectAll("path")
                .attr("name", function () {
                    return titleCaps(this.id);
                });
                    d3.selectAll("g>g>path")
                .attr("name", function () {
                    return titleCaps(this.parentNode.id);
                });
            d3.selectAll("path")
            .style("fill", function () {
                return GeoChart.chartData[this.attributes["name"].value] == null ? "" : colorScale(GeoChart.chartData[this.attributes["name"].value][GeoChart.COLUMN_TO_CHART]);
            })
            .on("mouseover", function () {
                d3.select("div#dataDiv p.title").remove();
                var thisCountry = this.attributes["name"].value;
                if (GeoChart.chartData.hasOwnProperty(thisCountry)) {
                    var thisCountryData = GeoChart.chartData[thisCountry];
                    var histogram = thisCountryData["Histogram"];
                    var histObject = Histogram.getHistObject(histogram, false);
                    var stats = {
                        name: thisCountry,
                        average: d3.round(thisCountryData['Average'], 0),
                        min: d3.min(histObject, function (d) { return parseFloat(d.label.split('-')[0]); }),
                        max: d3.max(histObject, function (d) { return parseFloat(d.label.split('-')[1]); }),
                        P90: thisCountryData['P90'],
                        P95: thisCountryData['P95'],
                        count: thisCountryData['Count']
                    };
                    d3.select("div#data").style("visibility", "visible");
                    if (!GeoChart.anchor1 && !GeoChart.anchor2) {               // no countries selected
                        DataTable.addColumn(stats);
                        d3.selectAll('[name="' + thisCountry + '"]').style("stroke", "black").style("stroke-width", "2");
                        GeoChart.histogramParamsList = [{ histogram: thisCountryData["Histogram"], average: thisCountryData['Average'], P90: thisCountryData['P90'], P95: thisCountryData['P95'], name: thisCountry }];
                        Histogram.drawHistogram(GeoChart.histogramParamsList, '#histogram', GeoChart.drawNormalized);
                    }
                    else if (GeoChart.anchor1 && !GeoChart.anchor2) {           // first country already selected; this becomes second
                        if (GeoChart.anchor1 != thisCountry) {                  // if we're hovering over a country that's already anchor1, do nothing
                            DataTable.addColumn(stats);
                            d3.selectAll('[name="' + thisCountry + '"]').style("stroke", "black").style("stroke-width", "2");
                            GeoChart.histogramParamsList.push({ histogram: thisCountryData["Histogram"], average: thisCountryData['Average'], P90: thisCountryData['P90'], P95: thisCountryData['P95'], name: thisCountry });
                            Histogram.drawHistogram(GeoChart.histogramParamsList, '#histogram', GeoChart.drawNormalized);
                        }
                    }
                    else if (GeoChart.anchor2 && !GeoChart.anchor1) {
                        if (GeoChart.anchor2 != thisCountry) {
                            DataTable.addColumn(stats);
                            d3.selectAll('[name="' + thisCountry + '"]').style("stroke", "black").style("stroke-width", "2");
                            GeoChart.histogramParamsList.unshift({ histogram: thisCountryData["Histogram"], average: thisCountryData['Average'], P90: thisCountryData['P90'], P95: thisCountryData['P95'], name: thisCountry });
                            Histogram.drawHistogram(GeoChart.histogramParamsList, '#histogram', GeoChart.drawNormalized);
                        }
                    }
                    else if (GeoChart.anchor1 && GeoChart.anchor2) { }          // if both countries are already selected, do nothing
                }
            })
            .on("mouseout", function () {
                var thisCountry = this.attributes["name"].value;
                if (!(thisCountry == GeoChart.anchor1 || thisCountry == GeoChart.anchor2)) {      // if what we moused out of isn't anchored, remove the highlight
                    d3.selectAll('[name="' + thisCountry + '"]').style("stroke-width", "0");
                }
                if (GeoChart.chartData.hasOwnProperty(thisCountry)) {
                    if (!GeoChart.anchor1 && !GeoChart.anchor2) {
                        DataTable.removeTable();
                        Histogram.drawHistogram([], '#histogram', GeoChart.drawNormalized);
                    }
                    else if (GeoChart.anchor1 && !GeoChart.anchor2) {
                        if (thisCountry != GeoChart.anchor1) {
                            DataTable.removeColumn(thisCountry);
                        }
                        if (GeoChart.histogramParamsList.length == 2) {
                            GeoChart.histogramParamsList = GeoChart.histogramParamsList.filter(function (i) { return i.name != thisCountry; });
                            Histogram.drawHistogram(GeoChart.histogramParamsList, '#histogram', GeoChart.drawNormalized);
                        }
                    }
                    else if (GeoChart.anchor2 && !GeoChart.anchor1) {
                        DataTable.removeColumn(thisCountry);
                        if (GeoChart.histogramParamsList.length == 2) {
                            GeoChart.histogramParamsList = GeoChart.histogramParamsList.filter(function (i) { return i.name != thisCountry; });
                            Histogram.drawHistogram(GeoChart.histogramParamsList, '#histogram', GeoChart.drawNormalized);
                        }
                    }
                }
            })
            .on("click", function () {
                var thisCountry = this.attributes["name"].value;
                if (GeoChart.anchor1 == thisCountry || GeoChart.anchor2 == thisCountry) {       // we're unselecting
                    d3.selectAll('[name="' + thisCountry + '"]').style("stroke-width", "0");
                    if (thisCountry == GeoChart.anchor1) {
                        GeoChart.anchor1 = null;
                    }
                    else if (thisCountry == GeoChart.anchor2) {
                        GeoChart.anchor2 = null;
                    }
                }
                else {                                                                          // we're selecting
                    d3.selectAll('[name="' + thisCountry + '"]')
                        .style("stroke-width", "2")
                        .style("stroke", !GeoChart.anchor1 ? "blue" : "red");
                    if (!GeoChart.anchor1) {
                        GeoChart.anchor1 = thisCountry;
                    }
                    else if (!GeoChart.anchor2) {
                        GeoChart.anchor2 = thisCountry;
                    }
                }
            })
        });
    }
};

window.onload = function () {
    GeoChart.init();
    GeoChart.layoutPage();
}
// TODO?: http://bl.ocks.org/mbostock/3750941
