async function generateMindmap() {
  const text = document.getElementById("inputText").value;

  const response = await fetch("http://127.0.0.1:5000/mindmap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  const data = await response.json();
  renderGraph(data);
}

function renderGraph(data) {
  const svg = d3.select("#graph");
  svg.selectAll("*").remove(); // Clear previous graph

  const width = +svg.attr("width");
  const height = +svg.attr("height");

  // Create a group for zoomable content
  const g = svg.append("g");

  // Zoom and pan
  svg.call(d3.zoom()
    .scaleExtent([0.5, 3])  // Zoom limits
    .on("zoom", (event) => g.attr("transform", event.transform))
  );

  const simulation = d3.forceSimulation(data.nodes)
    .force("link", d3.forceLink(data.edges).id(d => d.id).distance(150))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2));

  const link = g.append("g")
    .attr("stroke", "#aaa")
    .selectAll("line")
    .data(data.edges)
    .join("line")
    .attr("stroke-width", 2);

  const edgeLabels = g.append("g")
    .selectAll("text")
    .data(data.edges)
    .join("text")
    .text(d => d.label)
    .attr("font-size", 10)
    .attr("fill", "#444");

  const node = g.append("g")
    .selectAll("circle")
    .data(data.nodes)
    .join("circle")
    .attr("r", 20)
    .attr("fill", "#0074D9")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .call(drag(simulation));

  const label = g.append("g")
    .selectAll("text")
    .data(data.nodes)
    .join("text")
    .text(d => d.id)
    .attr("font-size", 12)
    .attr("fill", "#fff")
    .attr("text-anchor", "middle")
    .attr("dy", 4);

  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);

    label
      .attr("x", d => d.x)
      .attr("y", d => d.y);

    edgeLabels
      .attr("x", d => (d.source.x + d.target.x) / 2)
      .attr("y", d => (d.source.y + d.target.y) / 2);
  });
}

function drag(simulation) {
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  return d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
}
